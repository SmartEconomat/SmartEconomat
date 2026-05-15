import {
  fetchAlertasStock,
  fetchAllInventarioForExport,
} from './inventario.service';
import { usuarioService } from './usuarioService';
import type { AlertaStock, InventarioItem } from './inventario.types';
import type { Usuario } from '../types/usuario';
import { formatLocalizedDate } from '../utils/intlFormat';
import i18n from '../i18n';

/** Alias público (NotificationPriority) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type NotificationPriority = 'urgent' | 'pending';

/** Contrato de tipos público (AppNotification). Contexto: smart-economat-frontend (SPA). */
export interface AppNotification {
  id: string;
  title: string;
  description: string;
  priority: NotificationPriority;
  count: number;
  actionLabel: string;
  actionPath: string;
  details?: string[];
}

interface FetchNotificationsOptions {
  includePendingUsers: boolean;
  includeInventoryAlerts: boolean;
  forceRefresh?: boolean;
}

const EXPIRING_SOON_DAYS = 7;
const NOTIFICATIONS_CACHE_TTL_MS = 60_000;

const notificationsCache = new Map<
  string,
  { data: AppNotification[]; expiresAt: number }
>();
const inFlightRequests = new Map<string, Promise<AppNotification[]>>();

const buildProductPreview = (names: string[]): string => {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) {
    return String(
      i18n.t('notificaciones.tarjetas.previewDos', {
        a: names[0],
        b: names[1],
      })
    );
  }
  const prefix = `${names[0]}, ${names[1]}`;
  return String(
    i18n.t('notificaciones.tarjetas.previewMas', {
      prefix,
      count: names.length - 2,
    })
  );
};

const normalizeDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeUniqueNames = (names: string[]): string[] =>
  Array.from(
    new Set(names.map((name) => name.trim()).filter((name) => name.length > 0))
  );

const getLowStockNamesFromAlertas = (alertas: AlertaStock[]): string[] =>
  normalizeUniqueNames(alertas.map((alerta) => alerta.nombreProducto));

const getLowStockNamesFromInventario = (items: InventarioItem[]): string[] => {
  const lowStockProducts = new Map<string, string>();

  items.forEach((item) => {
    const product = item.productoProveedor?.producto;
    if (!product?.id || !product.nombre) {
      return;
    }

    const cantidadActual = Number(item.cantidadActual) || 0;
    const cantidadMinima = Number(item.cantidadMinima) || 0;

    if (cantidadActual < cantidadMinima) {
      lowStockProducts.set(product.id, product.nombre);
    }
  });

  return Array.from(lowStockProducts.values());
};

async function getPendingUsersNotification(): Promise<AppNotification | null> {
  const response = await usuarioService.getUsuarios({
    page: 1,
    limit: 3,
    sortBy: 'createdAt',
    order: 'DESC',
    status: 'Inactivo',
  });

  const pendingUsers = response.total;
  const latestPendingUsers = response.data.map(buildPendingUserPreview);

  if (pendingUsers === 0) {
    return null;
  }

  return {
    id: 'pending-users',
    title: String(i18n.t('notificaciones.tarjetas.pendientesUsuarios.titulo')),
    description: String(
      i18n.t('notificaciones.tarjetas.pendientesUsuarios.descripcion', {
        count: pendingUsers,
      })
    ),
    priority: 'urgent',
    count: pendingUsers,
    actionLabel: String(
      i18n.t('notificaciones.tarjetas.pendientesUsuarios.accion')
    ),
    actionPath:
      '/administracion?tab=usuarios&estado=Inactivo&focus=pending-activation',
    details: latestPendingUsers,
  };
}

const buildPendingUserPreview = (user: Usuario): string => {
  const displayName =
    user.username ||
    user.nombre ||
    user.email ||
    String(i18n.t('notificaciones.tarjetas.usuarioSinNombre'));
  const roleLabel = user.rol ? ` · ${user.rol}` : '';
  const registrationDate = normalizeDate(user.fecha_registro ?? undefined);
  const registrationLabel = registrationDate
    ? ` · ${formatLocalizedDate(registrationDate)}`
    : '';

  return `${displayName}${roleLabel}${registrationLabel}`;
};

async function getInventoryNotifications(): Promise<AppNotification[]> {
  const [inventarioResult, alertasStockResult] = await Promise.allSettled([
    fetchAllInventarioForExport(),
    fetchAlertasStock(),
  ]);

  const items =
    inventarioResult.status === 'fulfilled' ? inventarioResult.value : [];
  if (inventarioResult.status === 'rejected') {
    console.error(
      'Error loading inventory notifications from /inventario',
      inventarioResult.reason
    );
  }

  let lowStockNames: string[];
  if (alertasStockResult.status === 'fulfilled') {
    lowStockNames = getLowStockNamesFromAlertas(alertasStockResult.value);
  } else {
    console.error(
      'Error loading low-stock notifications from /alertas/stock',
      alertasStockResult.reason
    );
    lowStockNames = getLowStockNamesFromInventario(items);
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + EXPIRING_SOON_DAYS);

  const expiredProducts = new Map<string, string>();
  const expiringProducts = new Map<string, string>();

  items.forEach((item) => {
    const expirationDate = normalizeDate(item.fechaCaducidad);
    const product = item.productoProveedor?.producto;

    if (!expirationDate || !product?.id || !product.nombre) {
      return;
    }

    if (expirationDate < now) {
      expiredProducts.set(product.id, product.nombre);
      return;
    }

    if (expirationDate <= endDate) {
      expiringProducts.set(product.id, product.nombre);
    }
  });

  const notifications: AppNotification[] = [];
  if (lowStockNames.length > 0) {
    notifications.push({
      id: 'low-stock-products',
      title: String(i18n.t('notificaciones.tarjetas.stockBajo.titulo')),
      description: String(
        i18n.t('notificaciones.tarjetas.stockBajo.descripcion', {
          count: lowStockNames.length,
          nombres: buildProductPreview(lowStockNames),
        })
      ),
      priority: 'urgent',
      count: lowStockNames.length,
      actionLabel: String(i18n.t('notificaciones.tarjetas.stockBajo.accion')),
      actionPath: '/inventario',
      details: lowStockNames.slice(0, 5),
    });
  }

  const expiredNames = Array.from(expiredProducts.values());
  const expiringNames = Array.from(expiringProducts.values()).filter(
    (name) => !expiredNames.includes(name)
  );

  if (expiredNames.length > 0) {
    notifications.push({
      id: 'expired-products',
      title: String(i18n.t('notificaciones.tarjetas.vencidos.titulo')),
      description: String(
        i18n.t('notificaciones.tarjetas.vencidos.descripcion', {
          count: expiredNames.length,
          nombres: buildProductPreview(expiredNames),
        })
      ),
      priority: 'urgent',
      count: expiredNames.length,
      actionLabel: String(i18n.t('notificaciones.tarjetas.vencidos.accion')),
      actionPath: '/inventario',
    });
  }

  if (expiringNames.length > 0) {
    notifications.push({
      id: 'expiring-products',
      title: String(i18n.t('notificaciones.tarjetas.proximosVencer.titulo')),
      description: String(
        i18n.t('notificaciones.tarjetas.proximosVencer.descripcion', {
          count: expiringNames.length,
          days: EXPIRING_SOON_DAYS,
        })
      ),
      priority: 'pending',
      count: expiringNames.length,
      actionLabel: String(
        i18n.t('notificaciones.tarjetas.proximosVencer.accion')
      ),
      actionPath: '/inventario',
    });
  }

  return notifications;
}

/**
 * Agrega y devuelve las notificaciones globales de la aplicación:
 * usuarios pendientes de activación, alertas de stock bajo, productos vencidos y próximos a vencer.
 * Implementa caché TTL y deduplicación de peticiones en vuelo.
 */
/**
 * Expone "fetchAppNotifications" en smart-economat-frontend (SPA).
 * @undefined {FetchNotificationsOptions} options - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<AppNotification[]>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchAppNotifications(
  options: FetchNotificationsOptions
): Promise<AppNotification[]> {
  const cacheKey = JSON.stringify({
    includePendingUsers: options.includePendingUsers,
    includeInventoryAlerts: options.includeInventoryAlerts,
  });

  if (!options.forceRefresh) {
    const cached = notificationsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const inFlightRequest = inFlightRequests.get(cacheKey);
    if (inFlightRequest) {
      return inFlightRequest;
    }
  }

  const tasks: Array<Promise<AppNotification | AppNotification[] | null>> = [];

  if (options.includePendingUsers) {
    tasks.push(getPendingUsersNotification());
  }

  if (options.includeInventoryAlerts) {
    tasks.push(getInventoryNotifications());
  }

  const request = Promise.allSettled(tasks)
    .then((results) => {
      const notifications = results.flatMap((result) => {
        if (result.status !== 'fulfilled' || !result.value) {
          return [];
        }
        return Array.isArray(result.value) ? result.value : [result.value];
      });

      const sortedNotifications = notifications.sort((left, right) => {
        if (left.priority === right.priority) {
          return right.count - left.count;
        }
        return left.priority === 'urgent' ? -1 : 1;
      });

      notificationsCache.set(cacheKey, {
        data: sortedNotifications,
        expiresAt: Date.now() + NOTIFICATIONS_CACHE_TTL_MS,
      });

      return sortedNotifications;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, request);

  return request;
}
