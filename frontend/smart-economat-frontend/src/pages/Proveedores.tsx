import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

const Proveedores: React.FC = () => {
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
  const { t } = useTranslation();
  const toast = useToast();

  const proveedorSchema: DynamicField[] = [
    { name: 'nif', label: t('proveedores.form.nif'), required: true, width: 4 },
    {
      name: 'nombre',
      label: t('proveedores.form.nombre'),
      required: true,
      width: 8,
    },
    { name: 'contacto', label: t('proveedores.form.contacto') },
    { name: 'telefono', label: t('proveedores.form.telefono'), width: 6 },
    {
      name: 'email',
      label: t('proveedores.form.email'),
      type: 'text',
      width: 6,
    },
    { name: 'direccion', label: t('proveedores.form.direccion') },
  ];

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
        err instanceof Error ? err.message : t('proveedores.loadError');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, sortBy, sortOrder]);

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
        t('proveedores.toast.deleted', { name: itemToDelete.nombre })
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('proveedores.toast.deleteError');
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
        toast.success(t('proveedores.toast.updated'));
      } else {
        await createProveedor(payload);
        toast.success(t('proveedores.toast.created'));
      }
      await loadData();
      setItemToEdit(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('proveedores.toast.saveError');
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

  const columns: Column<Proveedor>[] = [
    { id: 'nombre', label: t('proveedores.columns.nombre'), sortable: true },
    {
      id: 'nif',
      label: t('proveedores.columns.nif'),
      render: (row) => row.nif ?? '—',
      sortable: true,
      responsiveDisplay: { xs: 'none', md: 'table-cell' },
    },
    {
      id: 'contacto',
      label: t('proveedores.columns.contacto'),
      render: (row) => row.contacto ?? '—',
      responsiveDisplay: { xs: 'none', md: 'table-cell' },
      sortable: true,
    },
    {
      id: 'telefono',
      label: t('proveedores.columns.telefono'),
      render: (row) => row.telefono ?? '—',
      sortable: true,
      responsiveDisplay: { xs: 'none', sm: 'table-cell' },
    },
    {
      id: 'email',
      label: t('proveedores.columns.email'),
      render: (row) => row.email ?? '—',
      sortable: true,
      responsiveDisplay: { xs: 'none', lg: 'table-cell' },
    },
  ];

  const renderActions = (row: Proveedor) => (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Tooltip title={t('proveedores.actions.viewDetail')}>
        <IconButton
          onClick={() => handleViewClick(row)}
          size="small"
          aria-label={t('proveedores.actions.viewDetail')}
          sx={{ color: 'text.secondary' }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {canEdit && (
        <Tooltip title={t('proveedores.actions.edit')}>
          <IconButton
            color="secondary"
            onClick={() => handleEditClick(row)}
            size="small"
            aria-label={t('proveedores.actions.edit')}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canDelete && (
        <Tooltip title={t('proveedores.actions.delete')}>
          <IconButton
            color="error"
            onClick={() => setItemToDelete(row)}
            size="small"
            aria-label={t('proveedores.actions.delete')}
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
        title={t('proveedores.pageTitle')}
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder={t('proveedores.searchPlaceholder')}
        searchId="search-proveedores"
        totalItems={totalItems}
        totalItemsLabel={t('proveedores.totalItemsLabel')}
        primaryAction={
          canCreate
            ? {
                label: t('proveedores.newProvider'),
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
            exportLabel: t('proveedores.exportLabel'),
          }}
          onSort={handleSort}
          sortConfig={{ key: sortBy || '', direction: sortOrder }}
          defaultViewMode="list"
          emptyStateMessage={
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <StorefrontOutlinedIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm.trim()
                  ? t('proveedores.empty.noMatch')
                  : t('proveedores.empty.noProviders')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm.trim()
                  ? t('proveedores.empty.tryOther')
                  : t('proveedores.empty.addFirst')}
              </Typography>
              {!searchTerm.trim() && canCreate && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setItemToEdit({})}
                >
                  {t('proveedores.empty.addButton')}
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
          title={t('proveedores.deleteDialog.title')}
          message={t('proveedores.deleteMessage', {
            name: itemToDelete?.nombre,
          })}
          confirmText={t('proveedores.deleteDialog.confirm')}
          cancelText={t('proveedores.deleteDialog.cancel')}
          isLoading={isDeleting}
        />

        <DynamicFormModal
          isOpen={!!itemToEdit}
          onClose={() => setItemToEdit(null)}
          title={
            itemToEdit?.id
              ? `${t('proveedores.editTitle')} ${itemToEdit.nombre || ''}`
              : t('proveedores.createTitle')
          }
          size="md"
          fields={proveedorSchema}
          initialData={itemToEdit || {}}
          onSubmit={handleSave}
          isSubmitting={isSaving}
          requireConfirmation={true}
          confirmationMessage={
            itemToEdit?.id
              ? t('proveedores.confirmEdit')
              : t('proveedores.confirmCreate')
          }
        />

        <DetailModal
          isOpen={!!itemToView}
          onClose={() => setItemToView(null)}
          title={itemToView?.nombre || ''}
          subtitle={itemToView?.nif || undefined}
          size="md"
          editLabel={t('proveedores.detail.editLabel')}
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
                {t('proveedores.detail.downloadSheet')}
              </Button>
            )
          }
          sections={[
            {
              title: t('proveedores.detail.fiscalInfo'),
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
              title: t('proveedores.detail.contactInfo'),
              fields: [
                {
                  label: t('proveedores.detail.contactPerson'),
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
              title: t('proveedores.detail.location'),
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
      </Paper>
    </Box>
  );
};

export default Proveedores;
