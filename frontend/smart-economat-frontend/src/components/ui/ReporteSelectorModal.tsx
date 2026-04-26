import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import dayjs from 'dayjs';
import Modal from './Modal';
import DatePicker from './DatePicker';
import {
  downloadReportePedidosPdf,
  downloadReporteIncidenciasPdf,
  downloadReporteIncidenciasExcel,
} from '../../services/recepcion.service';
import { fetchProveedoresConPedidos } from '../../services/proveedor.service';
import { Proveedor } from '../../services/proveedor.types';
import { useToast } from '../../store/toast.hooks';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

export type TipoReportePdf = 'pedido' | 'incidencias';
export type ReporteFormato = 'pdf' | 'excel';

interface ReporteSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: TipoReportePdf;
  formato?: ReporteFormato;
}

const TITLES: Record<TipoReportePdf, Record<ReporteFormato, string>> = {
  pedido: {
    pdf: 'Reporte de Pedidos (PDF)',
    excel: 'Reporte de Pedidos (PDF)',
  },
  incidencias: {
    pdf: 'Reporte de Incidencias (PDF)',
    excel: 'Reporte de Incidencias (Excel)',
  },
};

/**
 * Documentación en español.
 */
const ReporteSelectorModal: React.FC<ReporteSelectorModalProps> = ({
  isOpen,
  onClose,
  tipo,
  formato = 'pdf',
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [incluirCancelados, setIncluirCancelados] = useState(false);
  const [paginaPorProveedor, setPaginaPorProveedor] = useState(false);
  const [soloNoResueltas, setSoloNoResueltas] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingProveedores, setIsLoadingProveedores] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isExcelMode = tipo === 'incidencias' && formato === 'excel';

  useEffect(() => {
    if (!isOpen) {
      setStartDate('');
      setEndDate('');
      setProveedorId('');
      setIncluirCancelados(false);
      setPaginaPorProveedor(false);
      setSoloNoResueltas(false);
      setFieldErrors({});
      return;
    }
    setIsLoadingProveedores(true);
    fetchProveedoresConPedidos()
      .then((res: Proveedor[]) => {
        console.log(
          'ReporteSelectorModal - fetched providers with orders:',
          res
        );
        setProveedores(res || []);
      })
      .catch((err: Error) => {
        console.error('Error fetching proveedores for report:', err);
        toast.error(t('reporte.errorCargarProveedores'));
      })
      .finally(() => {
        setIsLoadingProveedores(false);
      });
  }, [isOpen, toast]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!startDate) errs.startDate = t('reporte.fechaInicioObligatoria');
    if (!endDate) errs.endDate = t('reporte.fechaFinObligatoria');
    if (startDate && endDate && dayjs(startDate).isAfter(dayjs(endDate))) {
      errs.endDate = t('reporte.fechaFinInvalida');
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGenerate = async () => {
    if (!validate()) return;
    setIsDownloading(true);
    try {
      if (tipo === 'pedido') {
        await downloadReportePedidosPdf({
          startDate,
          endDate,
          proveedorId: proveedorId || undefined,
          incluirCancelados,
          paginaPorProveedor,
        });
      } else if (isExcelMode) {
        await downloadReporteIncidenciasExcel({
          startDate,
          endDate,
          proveedorId: proveedorId || undefined,
          soloNoResueltas,
        });
      } else {
        await downloadReporteIncidenciasPdf({
          startDate,
          endDate,
          proveedorId: proveedorId || undefined,
          soloNoResueltas,
        });
      }
      toast.success(
        isExcelMode ? t('reporte.excelGenerado') : t('reporte.reporteGenerado')
      );
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : isExcelMode
            ? t('reporte.errorExcel')
            : t('reporte.errorReporte');
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    if (!isDownloading) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={TITLES[tipo][formato]}
      size="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <DatePicker
          label={t('reporte.fechaInicio')}
          name="startDate"
          value={startDate}
          onChange={(_, val) => {
            setStartDate(val);
            setFieldErrors((e) => ({ ...e, startDate: '' }));
          }}
          required
        />
        {fieldErrors.startDate && (
          <Typography variant="caption" color="error" sx={{ mt: -1, ml: 1.5 }}>
            {fieldErrors.startDate}
          </Typography>
        )}

        <DatePicker
          label={t('reporte.fechaFin')}
          name="endDate"
          value={endDate}
          onChange={(_, val) => {
            setEndDate(val);
            setFieldErrors((e) => ({ ...e, endDate: '' }));
          }}
          required
        />
        {fieldErrors.endDate && (
          <Typography variant="caption" color="error" sx={{ mt: -1, ml: 1.5 }}>
            {fieldErrors.endDate}
          </Typography>
        )}

        <FormControl fullWidth sx={{ mt: 1.5, mb: 0.5 }}>
          <InputLabel>{t('reporte.proveedorOpcional')}</InputLabel>
          <Select
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value as string)}
            label={t('reporte.proveedorOpcional')}
            disabled={isLoadingProveedores}
          >
            <MenuItem value="">{t('reporte.todosProveedores')}</MenuItem>
            {isLoadingProveedores && (
              <MenuItem disabled value="_loading">
                <CircularProgress size={16} sx={{ mr: 1 }} />
                {t('comun.cargando')}
              </MenuItem>
            )}
            {!isLoadingProveedores && proveedores.length === 0 && (
              <MenuItem disabled value="_empty">
                {t('reporte.sinProveedores')}
              </MenuItem>
            )}
            {proveedores.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {tipo === 'pedido' && (
          <Box sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={incluirCancelados}
                  onChange={(e) => setIncluirCancelados(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  {t('reporte.incluirCancelados')}
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={paginaPorProveedor}
                  onChange={(e) => setPaginaPorProveedor(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  {t('reporte.paginaPorProveedor')}
                </Typography>
              }
            />
          </Box>
        )}

        {tipo === 'incidencias' && (
          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Checkbox
                checked={soloNoResueltas}
                onChange={(e) => setSoloNoResueltas(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2">
                {t('reporte.soloNoResueltas')}
              </Typography>
            }
          />
        )}

        <Box
          sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}
        >
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={isDownloading}
          >
            {t('comun.cancelar')}
          </Button>
          <Button
            variant={isExcelMode ? 'outlined' : 'contained'}
            color={isExcelMode ? 'success' : 'error'}
            startIcon={
              isDownloading ? (
                <CircularProgress size={18} color="inherit" />
              ) : isExcelMode ? (
                <FileDownloadOutlinedIcon />
              ) : (
                <PictureAsPdfIcon />
              )
            }
            onClick={() => void handleGenerate()}
            disabled={isDownloading}
          >
            {isDownloading
              ? t('reporte.generando')
              : isExcelMode
                ? t('reporte.generarExcel')
                : t('reporte.generarPdf')}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ReporteSelectorModal;
