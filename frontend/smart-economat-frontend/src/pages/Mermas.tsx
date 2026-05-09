import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Box, Typography, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
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
import { mermaSchema } from '../utils/schemas';
import { useToast } from '../store/toast.hooks';
import { fetchProductosPaginated } from '../services/producto.service';
import { useTranslation } from 'react-i18next';
import { useDataTable } from '../hooks/useDataTable';

const MERMA_PRODUCT_SEARCH_LIMIT = 20;

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
  const [isLoading, setIsLoading] = useState(true);

  const {
    filters: tableFilters,
    onSort,
    onFilter,
    queryParams,
    sortConfig,
    paginationProps,
    syncPaginationFromResponse,
  } = useDataTable({
    sortBy: 'createdAt',
    order: 'desc',
    filters: {
      motivo: '',
      startDate: '',
      endDate: '',
    },
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingProductos, setIsSearchingProductos] = useState(false);
  const [productosBusqueda, setProductosBusqueda] = useState<
    { value: string | number; label: string }[]
  >([]);
  const productosSearchRequestIdRef = useRef(0);

  const toast = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: MermasQueryParams = {
        page: queryParams.page,
        limit: queryParams.limit,
        motivo: tableFilters.motivo
          ? (tableFilters.motivo as MotivoMerma)
          : undefined,
        startDate: (tableFilters.startDate as string) || undefined,
        endDate: (tableFilters.endDate as string) || undefined,
        sortBy: queryParams.sortBy as string,
        order: queryParams.order.toUpperCase() as 'ASC' | 'DESC',
      };
      const [mermasData, statsData] = await Promise.all([
        fetchMermas(params),
        fetchMermaStats(),
      ]);
      setMermas(mermasData.data);
      setTotal(mermasData.total);
      syncPaginationFromResponse(mermasData);
      setStats(statsData);
    } catch (err: unknown) {
      syncPaginationFromResponse({ total: 0, data: [] });
      const message =
        err instanceof Error ? err.message : t('mermas.toast.errorCargar');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams, tableFilters, syncPaginationFromResponse, toast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fetchMermaProductOptions = useCallback(
    async (query: string) => {
      const normalizedQuery = query.trim();
      const requestId = ++productosSearchRequestIdRef.current;

      setIsSearchingProductos(true);
      try {
        const response = await fetchProductosPaginated({
          page: 1,
          limit: MERMA_PRODUCT_SEARCH_LIMIT,
          searchTerm: normalizedQuery || undefined,
          sortBy: 'nombre',
          order: 'ASC',
        });

        if (requestId !== productosSearchRequestIdRef.current) {
          return;
        }

        setProductosBusqueda(
          response.data.map((p) => ({
            value: p.id as string,
            label: formatProductoMedidaLabel(p.contenido, p.unidad)
              ? `${p.nombre} · ${formatProductoMedidaLabel(p.contenido, p.unidad)} ${t('comun.porUnidad')}`
              : p.nombre,
          }))
        );
      } catch (err) {
        console.error('Error buscando productos:', err);
      } finally {
        if (requestId === productosSearchRequestIdRef.current) {
          setIsSearchingProductos(false);
        }
      }
    },
    [t]
  );

  const handleProductSearch = useCallback(
    (query: string) => {
      void fetchMermaProductOptions(query);
    },
    [fetchMermaProductOptions]
  );

  const dynamicSchema = useMemo(() => {
    return mermaSchema.map((field) => {
      if (field.name === 'productoId') {
        return {
          ...field,
          type: 'autocomplete' as const,
          options: productosBusqueda,
          onSearch: handleProductSearch,
          loading: isSearchingProductos,
        };
      }
      return field;
    });
  }, [productosBusqueda, handleProductSearch, isSearchingProductos]);

  const handleCreateMerma = async (formData: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      await createMerma({
        productoId: String(formData.productoId),
        cantidad: Number(formData.cantidad),
        motivo: formData.motivo as MotivoMerma,
        notas: formData.notas as string | undefined,
      });
      toast.success(t('mermas.toast.registrada'));
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('mermas.toast.errorRegistrar');
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <PageToolbar
        id="mermas-toolbar"
        title={t('mermas.titulo')}
        icon={<BrokenImageOutlinedIcon />}
        totalItems={total}
        totalItemsLabel={t('mermas.totalItemsLabel')}
        primaryAction={{
          label: t('mermas.acciones.registrar'),
          id: 'btn-reportar-merma',
          icon: <AddIcon />,
          onClick: () => {
            setProductosBusqueda([]); // Limpiar para forzar nueva búsqueda
            setIsModalOpen(true);
            void fetchMermaProductOptions('');
          },
        }}
      />

      <Box display="flex" flexDirection="column" gap={4}>
        <Box id="merma-stats">
          <MermaStats stats={stats} isLoading={isLoading} />
        </Box>

        <Paper
          elevation={0}
          id="mermas-table-container"
          sx={{ p: 3, borderRadius: 2 }}
        >
          <Typography variant="h6" fontWeight={600} mb={3}>
            {t('mermas.historial')}
          </Typography>
          <MermasTable
            data={mermas}
            isLoading={isLoading}
            pagination={paginationProps}
            sortConfig={sortConfig}
            onSort={onSort}
            filters={{
              motivo: (tableFilters.motivo as string) || '',
              startDate: (tableFilters.startDate as string) || '',
              endDate: (tableFilters.endDate as string) || '',
            }}
            onFiltersChange={(newFilters) => {
              onFilter('motivo', newFilters.motivo);
              onFilter('startDate', newFilters.startDate);
              onFilter('endDate', newFilters.endDate);
            }}
            tableFilters={tableFilters}
            onFilter={onFilter}
          />
        </Paper>
      </Box>

      <DynamicFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('mermas.modal.titulo')}
        fields={dynamicSchema}
        onSubmit={handleCreateMerma}
        isSubmitting={isSaving}
        requireConfirmation={true}
        confirmationMessage={t('mermas.modal.confirmacion')}
      />
    </Box>
  );
};

export default MermasPage;
