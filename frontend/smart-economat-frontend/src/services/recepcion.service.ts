import { CreateRecepcionDto, RecepcionResultado } from './recepcion.types';
import dayjs from 'dayjs';
import {
  baseFetch,
  ApiResponse,
  downloadFile,
  unwrapList,
  openPdfInNewTab,
} from './api.service';

/** Contrato de tipos público (ReportePedidosPdfParams). Contexto: smart-economat-frontend (SPA). */
export interface ReportePedidosPdfParams {
  startDate: string;
  endDate: string;
  proveedorId?: string;
  incluirCancelados?: boolean;
  paginaPorProveedor?: boolean;
}

/** Contrato de tipos público (ReporteIncidenciasPdfParams). Contexto: smart-economat-frontend (SPA). */
export interface ReporteIncidenciasPdfParams {
  startDate: string;
  endDate: string;
  proveedorId?: string;
  soloNoResueltas?: boolean;
}

/** Contrato de tipos público (ReporteIncidenciasExcelParams). Contexto: smart-economat-frontend (SPA). */
export interface ReporteIncidenciasExcelParams {
  startDate: string;
  endDate: string;
  proveedorId?: string;
  soloNoResueltas?: boolean;
}

const toLocalStartOfDayIso = (date: string): string =>
  dayjs(date).startOf('day').toISOString();

const toLocalEndOfDayIso = (date: string): string =>
  dayjs(date).endOf('day').toISOString();

/**
 * Expone "downloadReportePedidosPdf" en smart-economat-frontend (SPA).
 * @undefined {ReportePedidosPdfParams} params - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function downloadReportePedidosPdf(
  params: ReportePedidosPdfParams
): Promise<void> {
  const query = new URLSearchParams({ tipo: 'pedido' });
  query.set('startDate', params.startDate);
  query.set('endDate', params.endDate);
  if (params.proveedorId) query.set('proveedorId', params.proveedorId);
  if (params.incluirCancelados) query.set('incluirCancelados', 'true');
  if (params.paginaPorProveedor) query.set('paginaPorProveedor', 'true');
  await openPdfInNewTab(`/recepciones/reporte-pdf?${query.toString()}`);
}

/** Contrato de tipos público (ReportePedidosExcelParams). Contexto: smart-economat-frontend (SPA). */
export interface ReportePedidosExcelParams {
  startDate: string;
  endDate: string;
  proveedorId?: string;
  incluirCancelados?: boolean;
}

/**
 * Expone "downloadReportePedidosExcel" en smart-economat-frontend (SPA).
 * @undefined {ReportePedidosExcelParams} params - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function downloadReportePedidosExcel(
  params: ReportePedidosExcelParams
): Promise<void> {
  const query = new URLSearchParams();
  query.set('fechaDesde', toLocalStartOfDayIso(params.startDate));
  query.set('fechaHasta', toLocalEndOfDayIso(params.endDate));
  await downloadFile(
    `/export/pedidos/xlsx?${query.toString()}`,
    'pedidos.xlsx'
  );
}

/**
 * Expone "downloadReporteIncidenciasPdf" en smart-economat-frontend (SPA).
 * @undefined {ReporteIncidenciasPdfParams} params - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function downloadReporteIncidenciasPdf(
  params: ReporteIncidenciasPdfParams
): Promise<void> {
  const query = new URLSearchParams();
  query.set('startDate', toLocalStartOfDayIso(params.startDate));
  query.set('endDate', toLocalEndOfDayIso(params.endDate));
  if (params.proveedorId) query.set('proveedorId', params.proveedorId);
  if (params.soloNoResueltas) {
    query.set('soloNoResueltas', 'true');
    query.set('resuelta', 'false');
  }
  await openPdfInNewTab(`/export/incidencias/pdf?${query.toString()}`);
}

/**
 * Expone "downloadReporteIncidenciasExcel" en smart-economat-frontend (SPA).
 * @undefined {ReporteIncidenciasExcelParams} params - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function downloadReporteIncidenciasExcel(
  params: ReporteIncidenciasExcelParams
): Promise<void> {
  const query = new URLSearchParams();
  query.set('startDate', toLocalStartOfDayIso(params.startDate));
  query.set('endDate', toLocalEndOfDayIso(params.endDate));
  if (params.proveedorId) query.set('proveedorId', params.proveedorId);
  if (params.soloNoResueltas) {
    query.set('soloNoResueltas', 'true');
    query.set('resuelta', 'false');
  }
  await downloadFile(
    `/export/incidencias/xlsx?${query.toString()}`,
    'incidencias.xlsx'
  );
}

/**
 * Recupera el histórico de las últimas 50 recepciones registradas.
 */
/**
 * Expone "fetchRecepciones" en smart-economat-frontend (SPA).
 * @undefined {Promise<unknown[]>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchRecepciones(): Promise<unknown[]> {
  const response = await baseFetch('/recepciones?limit=50');
  if (!response.ok) {
    throw new Error(
      `Error al obtener recepciones: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<unknown>;
  return unwrapList<unknown>(body.data);
}

/**
 * Registra una nueva recepción de mercancía en el sistema, procesando stock e incidencias.
 * @param payload Datos del borrador finalizado y consolidado.
 * @returns Resumen de las acciones realizadas (stock creado, mermas, etc.).
 */
export async function createRecepcion(
  payload: CreateRecepcionDto
): Promise<RecepcionResultado> {
  const response = await baseFetch('/recepciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = `Error al registrar recepción: ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody.message)
        errorMsg =
          typeof errorBody.message === 'string'
            ? errorBody.message
            : errorBody.message.join(', ');
    } catch {
      // Fallback to text
    }
    throw new Error(errorMsg);
  }

  const body = (await response.json()) as ApiResponse<RecepcionResultado>;
  return body.data;
}

/**
 * Elimina un registro de recepción por su ID.
 */
/**
 * Elimina o marca entidades siguendo las políticas configuradas.
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function deleteRecepcion(id: string): Promise<void> {
  const response = await baseFetch(`/recepciones/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    let errorMsg = `Error al eliminar recepción: ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody.message) errorMsg = errorBody.message;
    } catch {
      // Ignore
    }
    throw new Error(errorMsg);
  }
}
