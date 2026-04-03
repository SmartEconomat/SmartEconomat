import { fetchAlertasStock, fetchInventario } from './inventario.service';
import { usuarioService } from './usuarioService';
import type { AlertaStock, InventarioItem } from './inventario.types';
import type { Usuario } from '../types/usuario';

export type NotificationPriority = 'urgent' | 'pending';

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
  if (names.length <= 2) return names.join(' y ');
  return `${names.slice(0, 2).join(', ')} y ${names.length - 2} más`;
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
  const response = await usuarioService.getUsuarios(
    1,
    3,
    '',
    '',
    'createdAt',
    'desc',
    'Inactivo'
  );

  const pendingUsers = response.total;
  const latestPendingUsers = response.data.map(buildPendingUserPreview);

  if (pendingUsers === 0) {
    return null;
  }

  return {
    id: 'pending-users',
    title: 'Usuarios pendientes de activación',
    description:
      pendingUsers === 1
        ? 'Hay 1 usuario nuevo pendiente de revisión y activación.'
        : `Hay ${pendingUsers} usuarios nuevos pendientes de revisión y activación.`,
    priority: 'urgent',
    count: pendingUsers,
    actionLabel: 'Ir a administración',
    actionPath:
      '/administracion?tab=usuarios&estado=Inactivo&focus=pending-activation',
    details: latestPendingUsers,
  };
}

const buildPendingUserPreview = (user: Usuario): string => {
  const displayName =
    user.username || user.nombre || user.email || 'Usuario sin identificar';
  const roleLabel = user.rol ? ` · ${user.rol}` : '';
  const registrationDate = normalizeDate(user.fecha_registro ?? undefined);
  const registrationLabel = registrationDate
    ? ` · ${registrationDate.toLocaleDateString('es-ES')}`
    : '';

  return `${displayName}${roleLabel}${registrationLabel}`;
};

async function getInventoryNotifications(): Promise<AppNotification[]> {
  const [inventarioResult, alertasStockResult] = await Promise.allSettled([
    fetchInventario(),
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
      title: 'Productos bajo minimo',
      description:
        lowStockNames.length === 1
          ? `Revisa ${buildProductPreview(lowStockNames)}. Hay 1 producto por debajo del stock minimo.`
          : `Revisa ${buildProductPreview(lowStockNames)}. Hay ${lowStockNames.length} productos por debajo del stock minimo.`,
      priority: 'urgent',
      count: lowStockNames.length,
      actionLabel: 'Revisar inventario',
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
      title: 'Productos vencidos',
      description: `Revisa ${buildProductPreview(expiredNames)}. Hay ${expiredNames.length} producto${expiredNames.length !== 1 ? 's' : ''} vencido${expiredNames.length !== 1 ? 's' : ''}.`,
      priority: 'urgent',
      count: expiredNames.length,
      actionLabel: 'Revisar inventario',
      actionPath: '/inventario',
    });
  }

  if (expiringNames.length > 0) {
    notifications.push({
      id: 'expiring-products',
      title: 'Productos próximos a vencer',
      description: `Hay ${expiringNames.length} producto${expiringNames.length !== 1 ? 's' : ''} que caducan en los próximos ${EXPIRING_SOON_DAYS} días.`,
      priority: 'pending',
      count: expiringNames.length,
      actionLabel: 'Ver inventario',
      actionPath: '/inventario',
    });
  }

  return notifications;
}

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
