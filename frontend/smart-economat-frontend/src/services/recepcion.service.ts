import { CreateRecepcionDto, RecepcionResultado } from './recepcion.types';
import dayjs from 'dayjs';
import {
  baseFetch,
  ApiResponse,
  downloadFile,
  unwrapList,
  openPdfInNewTab,
} from './api.service';

export interface ReportePedidosPdfParams {
  startDate: string;
  endDate: string;
  proveedorId?: string;
  incluirCancelados?: boolean;
  paginaPorProveedor?: boolean;
}

export interface ReporteIncidenciasPdfParams {
  startDate: string;
  endDate: string;
  proveedorId?: string;
  soloNoResueltas?: boolean;
}

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
 * Obtiene todas las recepciones registradas en el sistema.
 * El endpoint subyacente devolverá las entidades Recepcion con sus relaciones principales.
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
 * Procesa un lote (Wizard) de recepción contra uno o varios Pedidos.
 * Endpoint atómico. Genera inventario, actualiza pedido y crea incidencias automáticamente.
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
 * Elimina una nota de entrega / recepción.
 * OJO: El backend actual probablemente impida esto si afecta inventario cerrado.
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
