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
  Chip,
  Tabs,
  Tab,
  alpha,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { useTranslation } from 'react-i18next';
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
  restoreProveedor,
} from '../services/proveedor.service';
import type { CreateProveedorPayload } from '../services/proveedor.service';
import { deleteResource } from '../services/api.service';
import { useToast } from '../store/toast.hooks';
import { usePermission } from '../store/auth.hooks';
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';

import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { DownloadService } from '../services/download.service';
import { useDataTable } from '../hooks/useDataTable';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const Proveedores: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();

  const [data, setData] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Proveedor | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Record<string, unknown> | null>(
    null
  );
  const [itemToView, setItemToView] = useState<Proveedor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [itemToRestore, setItemToRestore] = useState<Proveedor | null>(null);

  const {
    searchTerm,
    onPageChange,
    onSort,
    onFilter,
    onSearchChange,
    queryParams,
    sortConfig,
    paginationProps,
    totalItems,
    syncPaginationFromResponse,
  } = useDataTable({
    sortBy: 'nombre',
    order: 'asc',
  });

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const proveedoresData = await fetchProveedores(
        queryParams.page,
        queryParams.limit,
        queryParams.searchTerm,
        queryParams.sortBy,
        queryParams.order,
        activeTab === 'deleted'
      );
      setData(proveedoresData.data);
      syncPaginationFromResponse(proveedoresData);
    } catch (err: unknown) {
      syncPaginationFromResponse({ total: 0, data: [] });
      const message =
        err instanceof Error
          ? err.message
          : t('proveedores.errors.errorCargar');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams, activeTab, syncPaginationFromResponse, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Gestiona delete confirm y aplica la lógica correspondiente.
   */
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResource(`/proveedor/${itemToDelete.id}`);
      // Si no estamos viendo eliminados, lo quitamos de la lista
      if (activeTab === 'active') {
        setData((prev) => prev.filter((p) => p.id !== itemToDelete.id));
      } else {
        // Si estamos viendo eliminados, refrescamos para ver el cambio de estado
        await loadData();
      }
      toast.success(
        t('proveedores.toast.eliminado', { nombre: itemToDelete.nombre })
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('proveedores.errors.errorEliminar');
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  /**
   * Gestiona restore confirm y aplica la lógica correspondiente.
   */
  const handleRestoreConfirm = async () => {
    if (!itemToRestore) return;
    setIsRestoring(true);
    try {
      await restoreProveedor(itemToRestore.id);
      await loadData();
      toast.success(
        t('proveedores.toast.restaurado', { nombre: itemToRestore.nombre })
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('proveedores.errors.errorRestaurar') || 'Error al restaurar';
      toast.error(message);
    } finally {
      setIsRestoring(false);
      setItemToRestore(null);
    }
  };

  /**
   * Gestiona save y aplica la lógica correspondiente.
   *
   * @param formData Parámetro de entrada para la operación.
   */
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
          : t('proveedores.errors.errorGuardar');
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Gestiona edit click y aplica la lógica correspondiente.
   *
   * @param row Parámetro de entrada para la operación.
   */
  const handleEditClick = (row: Proveedor) => {
    setItemToEdit({ ...row } as unknown as Record<string, unknown>);
  };

  /**
   * Gestiona view click y aplica la lógica correspondiente.
   *
   * @param row Parámetro de entrada para la operación.
   */
  const handleViewClick = (row: Proveedor) => {
    setItemToView(row);
  };

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */

  /**
   * Gestiona export pdf y aplica la lógica correspondiente.
   */
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

  /**
   * Gestiona export excel y aplica la lógica correspondiente.
   */
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

  /**
   * Gestiona export individual pdf y aplica la lógica correspondiente.
   *
   * @param proveedor Parámetro de entrada para la operación.
   */
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
  const proveedorSchema: DynamicField[] = useMemo(
    () => [
      {
        name: 'nif',
        label: t('proveedores.form.nifCuit'),
        required: true,
        width: 4,
        maxLength: 20,
        pattern: '^[a-zA-Z0-9]+$',
        patternMessage: t('proveedores.form.nifPattern'),
      },
      {
        name: 'nombre',
        label: t('proveedores.form.razonSocial'),
        required: true,
        width: 8,
        maxLength: 100,
      },
      {
        name: 'contacto',
        label: t('proveedores.form.personaContacto'),
        maxLength: 100,
      },
      {
        name: 'telefono',
        label: t('proveedores.form.telefono'),
        width: 6,
        maxLength: 50,
        pattern: '^[+]?[0-9\\s]*$',
        patternMessage: t('proveedores.form.telefonoPattern'),
      },
      {
        name: 'email',
        label: t('proveedores.form.email'),
        type: 'email',
        width: 6,
        maxLength: 255,
      },
      { name: 'direccion', label: t('proveedores.form.direccion') },
    ],
    [t]
  );

  const columns: Column<Proveedor>[] = useMemo(() => {
    const cols: Column<Proveedor>[] = [
      {
        id: 'nombre',
        label: t('proveedores.columns.nombre'),
        sortable: true,
        sortType: 'string',
        render: (row) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              opacity: row.deletedAt ? 0.6 : 1,
            }}
          >
            {row.nombre}
            {row.deletedAt && (
              <Chip
                label={t('proveedores.status.eliminado')}
                size="small"
                color="error"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            )}
          </Box>
        ),
      },
      {
        id: 'nif',
        label: t('proveedores.columns.nif'),
        render: (row) => (
          <Typography variant="body2" sx={{ opacity: row.deletedAt ? 0.6 : 1 }}>
            {row.nif ?? '—'}
          </Typography>
        ),
        sortable: true,
        sortType: 'string',
        responsiveDisplay: { xs: 'none', md: 'table-cell' },
      },
      {
        id: 'contacto',
        label: t('proveedores.columns.contacto'),
        render: (row) => (
          <Typography variant="body2" sx={{ opacity: row.deletedAt ? 0.6 : 1 }}>
            {row.contacto ?? '—'}
          </Typography>
        ),
        responsiveDisplay: { xs: 'none', md: 'table-cell' },
        sortable: true,
        sortType: 'string',
      },
      {
        id: 'telefono',
        label: t('proveedores.columns.telefono'),
        render: (row) => (
          <Typography variant="body2" sx={{ opacity: row.deletedAt ? 0.6 : 1 }}>
            {row.telefono ?? '—'}
          </Typography>
        ),
        sortable: true,
        sortType: 'string',
        responsiveDisplay: { xs: 'none', sm: 'table-cell' },
      },
      {
        id: 'email',
        label: t('proveedores.columns.email'),
        render: (row) => (
          <Typography variant="body2" sx={{ opacity: row.deletedAt ? 0.6 : 1 }}>
            {row.email ?? '—'}
          </Typography>
        ),
        sortable: true,
        sortType: 'string',
        responsiveDisplay: { xs: 'none', lg: 'table-cell' },
      },
    ];
    return cols;
  }, [t]);

  /**
   * Ejecuta la lógica de render actions dentro del flujo de la aplicación.
   *
   * @param row Parámetro de entrada para la operación.
   */
  const renderActions = (row: Proveedor) => (
    <Stack direction="row" spacing={1} justifyContent="center">
      {activeTab === 'active' && canEdit && (
        <Tooltip title={t('comun.editar')}>
          <IconButton
            color="secondary"
            onClick={(event) => {
              event.stopPropagation();
              handleEditClick(row);
            }}
            size="small"
            aria-label={t('comun.editar')}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {activeTab === 'active' && canDelete && (
        <Tooltip title={t('comun.eliminar')}>
          <IconButton
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              setItemToDelete(row);
            }}
            size="small"
            aria-label={t('comun.eliminar')}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {activeTab === 'deleted' && (
        <Tooltip title={t('comun.restaurar')}>
          <IconButton
            color="success"
            onClick={(event) => {
              event.stopPropagation();
              setItemToRestore(row);
            }}
            size="small"
            aria-label={t('comun.restaurar')}
          >
            <RestoreFromTrashIcon fontSize="small" />
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
        onSearchChange={onSearchChange}
        searchPlaceholder={t('proveedores.searchPlaceholder')}
        searchId="search-proveedores"
        totalItems={totalItems}
        totalItemsLabel={t('proveedores.totalItemsLabel')}
        primaryAction={
          canCreate
            ? {
                label: t('proveedores.acciones.nuevo'),
                onClick: () => setItemToEdit({}),
                id: 'btn-nuevo-proveedor',
              }
            : undefined
        }
        onViewModeChange={undefined}
      />

      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(
              _e: React.SyntheticEvent,
              newValue: 'active' | 'deleted'
            ) => {
              setActiveTab(newValue);
              onPageChange(null, 1);
            }}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            aria-label={t('proveedores.titulo')}
          >
            <Tab
              icon={<StorefrontOutlinedIcon />}
              label={t('comun.activos')}
              value="active"
            />
            <Tab
              icon={<DeleteSweepOutlinedIcon />}
              label={t('comun.eliminados')}
              value="deleted"
            />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 4 } }}>
          {!isLoading && error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            hideTopBar={true}
            exportHandlers={{
              onExportPdf: handleExportPdf,
              onExportExcel: handleExportExcel,
              exportLabel: t('proveedores.exportLabel'),
            }}
            onSort={onSort}
            sortConfig={sortConfig}
            onFilter={onFilter}
            pagination={paginationProps}
            defaultViewMode="list"
            onRowClick={handleViewClick}
            getRowAriaLabel={(row: Proveedor) =>
              t('proveedores.actions.ariaVerDetalle', { nombre: row.nombre })
            }
            emptyStateMessage={
              <Box
                sx={{
                  py: { xs: 6, md: 10 },
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  maxWidth: 450,
                  mx: 'auto',
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                    mb: 3,
                    boxShadow: (theme) =>
                      `0 8px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  {activeTab === 'deleted' ? (
                    <DeleteSweepOutlinedIcon sx={{ fontSize: 40 }} />
                  ) : (
                    <StorefrontOutlinedIcon sx={{ fontSize: 40 }} />
                  )}
                </Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}
                >
                  {searchTerm.trim()
                    ? t('proveedores.empty.sinResultados')
                    : activeTab === 'deleted'
                      ? t('proveedores.empty.sinEliminados')
                      : t('proveedores.empty.sinProveedores')}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  {searchTerm.trim()
                    ? t('proveedores.empty.prueba')
                    : activeTab === 'deleted'
                      ? t('proveedores.empty.sinEliminadosHint')
                      : t('proveedores.empty.empieza')}
                </Typography>
                {!searchTerm.trim() && canCreate && activeTab === 'active' && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setItemToEdit({})}
                  >
                    {t('proveedores.acciones.anadir')}
                  </Button>
                )}
              </Box>
            }
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
                })}
              </>
            }
            confirmText={t('proveedores.confirm.eliminarConfirm')}
            cancelText={t('comun.cancelar')}
            isLoading={isDeleting}
          />

          <ConfirmDialog
            isOpen={!!itemToRestore}
            onClose={() => !isRestoring && setItemToRestore(null)}
            onConfirm={() => void handleRestoreConfirm()}
            title={t('proveedores.confirm.restaurarTitulo')}
            message={
              <>
                {t('proveedores.confirm.restaurarMensaje', {
                  nombre: itemToRestore?.nombre,
                })}
              </>
            }
            confirmText={t('proveedores.confirm.restaurarConfirm')}
            cancelText={t('comun.cancelar')}
            isLoading={isRestoring}
            confirmColor="success"
          />

          <DynamicFormModal
            isOpen={!!itemToEdit}
            onClose={() => setItemToEdit(null)}
            title={
              itemToEdit?.id
                ? t('proveedores.modal.tituloEditar', {
                    nombre: itemToEdit.nombre || '',
                  })
                : t('proveedores.modal.tituloCrear')
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
                : t('proveedores.confirm.crearNuevo')
            }
          />

          <DetailModal
            isOpen={!!itemToView}
            onClose={() => setItemToView(null)}
            title={itemToView?.nombre || ''}
            subtitle={itemToView?.nif || undefined}
            size="md"
            editLabel={t('proveedores.actions.editarProveedor')}
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
                  {t('proveedores.actions.descargarFicha')}
                </Button>
              )
            }
            sections={[
              {
                title: t('proveedores.detail.infoFiscal'),
                fields: [
                  {
                    label: t('proveedores.detail.razonSocial'),
                    value: itemToView?.nombre,
                  },
                  {
                    label: t('proveedores.detail.nifCuit'),
                    value: itemToView?.nif,
                  },
                ],
              },
              {
                title: t('proveedores.detail.contacto'),
                fields: [
                  {
                    label: t('proveedores.detail.personaContacto'),
                    value: itemToView?.contacto,
                  },
                  {
                    label: t('proveedores.detail.telefono'),
                    value: itemToView?.telefono,
                  },
                  {
                    label: t('proveedores.detail.email'),
                    value: itemToView?.email,
                    fullWidth: true,
                  },
                ],
              },
              {
                title: t('proveedores.detail.ubicacion'),
                fields: [
                  {
                    label: t('proveedores.detail.direccion'),
                    value: itemToView?.direccion,
                    fullWidth: true,
                  },
                ],
              },
            ]}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default Proveedores;
