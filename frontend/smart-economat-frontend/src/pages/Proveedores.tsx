import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Alert,
  Button,
  Tooltip,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, {
  DynamicField,
} from '../components/ui/DynamicFormModal';
import DetailModal from '../components/ui/DetailModal';
import { Proveedor } from '../services/proveedor.types';
import {
  fetchProveedores,
  createProveedor,
  updateProveedor,
} from '../services/proveedor.service';
import type { CreateProveedorPayload } from '../services/proveedor.service';
import { deleteResource } from '../services/api.service';
import { useToast } from '../store/toast.hooks';
import { usePermission } from '../store/auth.hooks';
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';

import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { DownloadService } from '../services/download.service';

const getProveedorSchema = (t: (key: string) => string): DynamicField[] => [
  {
    name: 'nif',
    label: t('proveedores.form.nif'),
    required: true,
    width: 4,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9]+$',
    patternMessage: t('proveedores.form.nifPatternError'),
  },
  {
    name: 'nombre',
    label: t('proveedores.form.nombre'),
    required: true,
    width: 8,
    maxLength: 100,
  },
  {
    name: 'contacto',
    label: t('proveedores.form.contacto'),
    maxLength: 100,
  },
  {
    name: 'telefono',
    label: t('proveedores.form.telefono'),
    width: 6,
    maxLength: 50,
    pattern: '^[+]?[0-9\\s]*$',
    patternMessage: t('proveedores.form.telefonoPatternError'),
  },
  {
    name: 'email',
    label: t('proveedores.form.email'),
    type: 'email',
    width: 6,
    maxLength: 255,
  },
  { name: 'direccion', label: t('proveedores.form.direccion') },
];

const Proveedores: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string | undefined>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [data, setData] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Proveedor | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Record<string, unknown> | null>(
    null
  );
  const [itemToView, setItemToView] = useState<Proveedor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const proveedorSchema = getProveedorSchema(t);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const proveedoresData = await fetchProveedores(
        page,
        pageSize,
        searchTerm,
        sortBy,
        sortOrder
      );
      setData(proveedoresData.data);
      setTotalPages(proveedoresData.totalPages);
      setTotalItems(proveedoresData.total || proveedoresData.data.length);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('proveedores.toast.errorCargar');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, sortBy, sortOrder, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResource(`/proveedor/${itemToDelete.id}`);
      setData((prev) => prev.filter((p) => p.id !== itemToDelete.id));
      toast.success(
        t('proveedores.toast.eliminado', { nombre: itemToDelete.nombre })
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('proveedores.toast.errorEliminar');
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const payload: CreateProveedorPayload = {
        nombre: formData.nombre as string,
        contacto: formData.contacto as string,
        telefono: formData.telefono as string,
        email: formData.email as string,
        direccion: formData.direccion as string,
        nif: formData.nif as string,
      };

      if (formData.id) {
        await updateProveedor(formData.id as string, payload);
        toast.success(t('proveedores.toast.actualizado'));
      } else {
        await createProveedor(payload);
        toast.success(t('proveedores.toast.creado'));
      }
      await loadData();
      setItemToEdit(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('proveedores.toast.errorGuardar');
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (row: Proveedor) => {
    setItemToEdit({ ...row } as unknown as Record<string, unknown>);
  };

  const handleViewClick = (row: Proveedor) => {
    setItemToView(row);
  };

  const handleSort = (key: string | keyof Proveedor) => {
    const isAsc = sortBy === key && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(key as string);
  };

  const handleExportPdf = async () => {
    try {
      await DownloadService.downloadFile(
        `/export/proveedores/pdf?searchTerm=${searchTerm}`,
        { filename: 'proveedores.pdf', toast }
      );
    } catch {
      // Manejado por el servicio
    }
  };

  const handleExportExcel = async () => {
    try {
      await DownloadService.downloadFile(
        `/export/proveedores/xlsx?searchTerm=${searchTerm}`,
        { filename: 'proveedores.xlsx', toast }
      );
    } catch {
      // Manejado por el servicio
    }
  };

  const handleExportIndividualPdf = async (proveedor: Proveedor) => {
    try {
      // Usamos el searchTerm con el NIF para filtrar solo este proveedor
      // Nota: Si el backend tuviera /proveedor/:id/pdf sería preferible
      await DownloadService.downloadFile(
        `/export/proveedores/pdf?searchTerm=${proveedor.nif || proveedor.nombre}`,
        { filename: `proveedor_${proveedor.nombre}.pdf`, toast }
      );
    } catch {
      // Manejado por el servicio
    }
  };

  const canEdit = usePermission(PERMISSIONS.proveedores.editar);
  const canDelete = usePermission(PERMISSIONS.proveedores.eliminar);
  const canCreate = usePermission(PERMISSIONS.proveedores.crear);
  const columns: Column<Proveedor>[] = useMemo(
    () => [
      { id: 'nombre', label: t('proveedores.columns.nombre'), sortable: true },
      {
        id: 'nif',
        label: t('proveedores.columns.nif'),
        render: (row: Proveedor) => row.nif ?? '—',
        sortable: true,
        responsiveDisplay: { xs: 'none', md: 'table-cell' },
      },
      {
        id: 'contacto',
        label: t('proveedores.columns.contacto'),
        render: (row: Proveedor) => row.contacto ?? '—',
        responsiveDisplay: { xs: 'none', md: 'table-cell' },
        sortable: true,
      },
      {
        id: 'telefono',
        label: t('proveedores.columns.telefono'),
        render: (row: Proveedor) => row.telefono ?? '—',
        sortable: true,
        responsiveDisplay: { xs: 'none', sm: 'table-cell' },
      },
      {
        id: 'email',
        label: t('proveedores.columns.email'),
        render: (row: Proveedor) => row.email ?? '—',
        sortable: true,
        responsiveDisplay: { xs: 'none', lg: 'table-cell' },
      },
    ],
    [t]
  );
  const renderActions = (row: Proveedor) => (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Tooltip title={t('proveedores.verDetalle')}>
        <IconButton
          onClick={() => handleViewClick(row)}
          size="small"
          aria-label={t('proveedores.verDetalle')}
          sx={{ color: 'text.secondary' }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {canEdit && (
        <Tooltip title={t('comun.editar')}>
          <IconButton
            color="secondary"
            onClick={() => handleEditClick(row)}
            size="small"
            aria-label={t('comun.editar')}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canDelete && (
        <Tooltip title={t('comun.eliminar')}>
          <IconButton
            color="error"
            onClick={() => setItemToDelete(row)}
            size="small"
            aria-label={t('comun.eliminar')}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  return (
    <Box>
      <PageToolbar
        title={t('proveedores.titulo')}
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder={t('proveedores.buscarPlaceholder')}
        searchId="search-proveedores"
        totalItems={totalItems}
        totalItemsLabel={t('proveedores.totalItemsLabel')}
        primaryAction={
          canCreate
            ? {
                label: t('proveedores.nuevoProveedor'),
                onClick: () => setItemToEdit({}),
                id: 'btn-nuevo-proveedor',
              }
            : undefined
        }
        onViewModeChange={undefined}
      />

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          hideTopBar={false}
          exportHandlers={{
            onExportPdf: handleExportPdf,
            onExportExcel: handleExportExcel,
            exportLabel: t('proveedores.exportarLabel'),
          }}
          onSort={handleSort}
          sortConfig={{ key: sortBy || '', direction: sortOrder }}
          defaultViewMode="list"
          onRowClick={handleViewClick}
          getRowAriaLabel={(row) =>
            t('proveedores.getRowAriaLabel', {
              nombre: row.nombre,
              defaultValue: `Ver detalle de proveedor ${row.nombre}`,
            })
          }
          emptyStateMessage={
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <StorefrontOutlinedIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm.trim()
                  ? t('proveedores.empty.noResultados')
                  : t('proveedores.empty.noProveedores')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm.trim()
                  ? t('proveedores.empty.limpiarFiltro')
                  : t('proveedores.empty.primerProveedor')}
              </Typography>
              {!searchTerm.trim() && canCreate && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setItemToEdit({})}
                >
                  {t('proveedores.empty.anadirBoton')}
                </Button>
              )}
            </Box>
          }
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            onPageChange: (_, newPage) => setPage(newPage),
            pageSize: pageSize,
            pageSizeOptions: [5, 10, 25, 50],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPageSizeChange: (e: any) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            },
          }}
          renderActions={renderActions}
        />

        <ConfirmDialog
          isOpen={!!itemToDelete}
          onClose={() => !isDeleting && setItemToDelete(null)}
          onConfirm={() => void handleDeleteConfirm()}
          title={t('proveedores.confirm.eliminarTitulo')}
          message={
            <>
              {t('proveedores.confirm.eliminarMensaje', {
                nombre: itemToDelete?.nombre,
                interpolation: { escapeValue: false },
              })}
            </>
          }
          confirmText={t('comun.siEliminar')}
          cancelText={t('comun.cancelar')}
          isLoading={isDeleting}
        />

        <DynamicFormModal
          isOpen={!!itemToEdit}
          onClose={() => setItemToEdit(null)}
          title={
            itemToEdit?.id
              ? t('proveedores.editar', { nombre: itemToEdit.nombre || '' })
              : t('proveedores.crearNuevo')
          }
          size="md"
          fields={proveedorSchema}
          initialData={itemToEdit || {}}
          onSubmit={handleSave}
          isSubmitting={isSaving}
          requireConfirmation={true}
          confirmationMessage={
            itemToEdit?.id
              ? t('proveedores.confirm.guardarCambios')
              : t('proveedores.confirm.anadirNuevo')
          }
        />

        <DetailModal
          isOpen={!!itemToView}
          onClose={() => setItemToView(null)}
          title={itemToView?.nombre || ''}
          subtitle={itemToView?.nif || undefined}
          size="md"
          editLabel={t('comun.editar')}
          onEdit={
            canEdit
              ? () => {
                  if (itemToView) {
                    handleEditClick(itemToView);
                    setItemToView(null);
                  }
                }
              : undefined
          }
          actions={
            itemToView && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<PictureAsPdfOutlinedIcon />}
                onClick={() => handleExportIndividualPdf(itemToView)}
                disableElevation
              >
                {t('proveedores.descargarFicha')}
              </Button>
            )
          }
          sections={[
            {
              title: t('proveedores.sections.infoFiscal'),
              fields: [
                {
                  label: t('proveedores.form.nombre'),
                  value: itemToView?.nombre,
                },
                { label: t('proveedores.form.nif'), value: itemToView?.nif },
              ],
            },
            {
              title: t('proveedores.sections.contacto'),
              fields: [
                {
                  label: t('proveedores.form.contacto'),
                  value: itemToView?.contacto,
                },
                {
                  label: t('proveedores.form.telefono'),
                  value: itemToView?.telefono,
                },
                {
                  label: t('proveedores.form.email'),
                  value: itemToView?.email,
                  fullWidth: true,
                },
              ],
            },
            {
              title: t('proveedores.sections.ubicacion'),
              fields: [
                {
                  label: t('proveedores.form.direccion'),
                  value: itemToView?.direccion,
                  fullWidth: true,
                },
              ],
            },
          ]}
        />
      </Paper>
    </Box>
  );
};

export default Proveedores;
