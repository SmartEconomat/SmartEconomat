import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import { useTranslation } from 'react-i18next';
import PageToolbar from '../components/ui/PageToolbar';
import { MermasTable, MermaStats } from '../features/mermas';
import {
  fetchMermas,
  fetchMermaStats,
  createMerma,
} from '../services/merma.service';
import {
  Merma,
  MermaStats as IMermaStats,
  MermasQueryParams,
  MotivoMerma,
} from '../services/merma.types';
import DynamicFormModal from '../components/ui/DynamicFormModal';
import { getMermaSchema } from '../utils/schemas';
import { useToast } from '../store/toast.hooks';
import { fetchAllProductos } from '../services/producto.service';

const formatProductoMedidaLabel = (
  contenido?: number,
  unidad?: string
): string | null => {
  if (!contenido || !Number.isFinite(contenido) || !unidad) {
    return null;
  }

  return `${contenido} ${unidad}`;
};

const MermasPage: React.FC = () => {
  const { t } = useTranslation();
  const [mermas, setMermas] = useState<Merma[]>([]);
  const [stats, setStats] = useState<IMermaStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    motivo: '',
    startDate: '',
    endDate: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [productos, setProductos] = useState<
    { value: string | number; label: string }[]
  >([]);

  const toast = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: MermasQueryParams = {
        page,
        limit: pageSize,
        motivo: filters.motivo ? (filters.motivo as MotivoMerma) : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        sortBy: 'createdAt',
        order: 'DESC',
      };
      const [mermasData, statsData] = await Promise.all([
        fetchMermas(params),
        fetchMermaStats(),
      ]);
      setMermas(mermasData.data);
      setTotal(mermasData.total);
      setStats(statsData);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('mermas.feedback.loadError');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, filters, toast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Cargar productos para el select del form
    fetchAllProductos().then((productosResponse) => {
      setProductos(
        productosResponse.map((p) => ({
          value: p.id as string,
          label: formatProductoMedidaLabel(p.contenido, p.unidad)
            ? `${p.nombre} · ${formatProductoMedidaLabel(p.contenido, p.unidad)} por unidad`
            : p.nombre,
        }))
      );
    });
  }, []);

  const handleCreateMerma = async (
    formData: Record<string, string | number>
  ) => {
    setIsSaving(true);
    try {
      await createMerma({
        productoId: String(formData.productoId),
        cantidad: Number(formData.cantidad),
        motivo: formData.motivo as MotivoMerma,
        notas: formData.notas as string | undefined,
      });
      toast.success(t('mermas.feedback.saveSuccess'));
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('mermas.feedback.saveError');
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const dynamicSchema = useMemo(() => {
    return getMermaSchema(t).map((field) => {
      if (field.name === 'productoId') {
        return { ...field, options: productos };
      }
      return field;
    });
  }, [t, productos]);

  return (
    <Box>
      <PageToolbar
        title={t('mermas.title')}
        icon={<BrokenImageOutlinedIcon />}
        totalItems={total}
        totalItemsLabel="registros"
        primaryAction={{
          label: t('mermas.actions.report'),
          icon: <AddIcon />,
          onClick: () => setIsModalOpen(true),
        }}
      />

      <Box display="flex" flexDirection="column" gap={4}>
        <MermaStats stats={stats} isLoading={isLoading} />

        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={600} mb={3}>
            {t('mermas.fields.history')}
          </Typography>
          <MermasTable
            data={mermas}
            total={total}
            page={page}
            pageSize={pageSize}
            isLoading={isLoading}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </Paper>
      </Box>

      <DynamicFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('mermas.dialogs.createTitle')}
        fields={dynamicSchema}
        onSubmit={handleCreateMerma}
        isSubmitting={isSaving}
        requireConfirmation={true}
        confirmationMessage={t('mermas.dialogs.confirmMessage')}
      />
    </Box>
  );
};

export default MermasPage;
