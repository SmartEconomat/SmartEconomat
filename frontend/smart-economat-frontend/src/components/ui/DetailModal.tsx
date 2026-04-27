/**
 * Documentación en español.
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Tooltip,
  Divider,
  DialogTitle,
  DialogActions,
} from '@mui/material';
import { extractA11yText } from '../../utils/a11y-format';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import DynamicFormModal, {
  DynamicField,
  DynamicFormModalProps,
} from './DynamicFormModal';
import { ModalSize } from './Modal';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────────────────
//  Public types
// ─────────────────────────────────────────────────────────

/**
 * Documentación en español.
 */
export interface DetailField {
  /**
   * Documentación en español.
   */
  label: string;
  /**
   * Documentación en español.
   */
  value: React.ReactNode;
  /**
   * Documentación en español.
   */
  fullWidth?: boolean;
  /**
   * Documentación en español.
   */
  colSpan?: number;
}

export interface DetailSection {
  title?: string;
  columns?: number;
  fields?: DetailField[];
  content?: React.ReactNode;
}

export interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  headerMedia?: React.ReactNode;
  sections: DetailSection[];
  size?: ModalSize;
  onEdit?: () => void;
  editConfig?: {
    title?: string;
    fields: DynamicField[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData: Record<string, any>;
    onSubmit: DynamicFormModalProps['onSubmit'];
    submitLabel?: string;
    isSubmitting?: boolean;
    requireConfirmation?: boolean;
    confirmationMessage?: React.ReactNode;
    size?: ModalSize;
  };
  editLabel?: string;
  actions?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────

const SIZE_MAP: Record<ModalSize, string> = {
  sm: '400px',
  md: '600px',
  lg: '900px',
  xl: '1200px',
  full: '100vw',
};

// ─────────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────────

const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  headerMedia,
  sections,
  size = 'md',
  onEdit,
  editConfig,
  editLabel = 'Editar',
  actions,
}) => {
  const { t } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);

  const handleOpenEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      onClose();
      setEditOpen(true);
    }
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
  };

  return (
    <>
      {/* ─── DETAIL SHEET ─── */}
      <Dialog
        open={isOpen}
        onClose={onClose}
        scroll="paper"
        fullScreen={size === 'full'}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: SIZE_MAP[size],
            maxHeight: size === 'full' ? '100vh' : '90vh',
            m: size === 'full' ? 0 : 2,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          component="div"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: 'divider',
            minHeight: 56,
            gap: 1,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              component="h2"
              sx={{ fontWeight: 600, lineHeight: 1.2 }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.25 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          <Tooltip title={t('comun.cerrar')}>
            <IconButton
              aria-label={t('comun.cerrar')}
              onClick={onClose}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        {/* Media */}
        {headerMedia && (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
              py: 4,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            {headerMedia}
          </Box>
        )}

        {/* Sections */}
        <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
          {sections.map((section, sIdx) => (
            <Box
              key={sIdx}
              sx={{
                px: 3,
                pt: sIdx === 0 ? 3 : 2,
                pb: sIdx === sections.length - 1 ? 3 : 0,
              }}
            >
              {section.title && (
                <>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontWeight: 700, letterSpacing: 1 }}
                  >
                    {section.title}
                  </Typography>
                  <Divider sx={{ mb: 2, mt: 0.5 }} />
                </>
              )}

              {section.fields && section.fields.length > 0 && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: section.columns
                      ? `repeat(${section.columns}, 1fr)`
                      : { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: { xs: 1, sm: 2 },
                  }}
                >
                  {section.fields.map((field, fIdx) => (
                    <Box
                      key={fIdx}
                      sx={{
                        gridColumn: field.fullWidth
                          ? '1 / -1'
                          : section.columns
                            ? `span ${field.colSpan || 1}`
                            : {
                                xs: '1 / -1',
                                sm: `span ${field.colSpan || 1}`,
                              },
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          display: 'block',
                          mb: 0.25,
                        }}
                      >
                        {field.label}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          minHeight: 28,
                        }}
                      >
                        {field.value != null && field.value !== '' ? (
                          typeof field.value === 'string' ||
                          typeof field.value === 'number' ? (
                            <Typography
                              variant="body2"
                              aria-label={`${field.label}: ${extractA11yText(field.value)}`}
                            >
                              {field.value}
                            </Typography>
                          ) : (
                            field.value
                          )
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {section.content && (
                <Box sx={{ mt: section.fields?.length ? 2 : 0 }}>
                  {section.content}
                </Box>
              )}

              {sIdx < sections.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </DialogContent>

        {/* Footer */}
        {(editConfig || onEdit || actions) && (
          <DialogActions
            sx={{
              px: 3,
              py: 2,
              borderTop: 1,
              borderColor: 'divider',
              justifyContent: 'flex-end',
              gap: 1.5,
            }}
          >
            {actions}
            {(editConfig || onEdit) && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={handleOpenEdit}
                disableElevation
              >
                {editLabel}
              </Button>
            )}
          </DialogActions>
        )}
      </Dialog>

      {/* ─── EDIT MODAL ─── */}
      {editConfig && (
        <DynamicFormModal
          isOpen={editOpen}
          onClose={handleCloseEdit}
          title={editConfig.title ?? t('comun.editarItem', { item: title })}
          size={editConfig.size ?? 'lg'}
          fields={editConfig.fields}
          initialData={editConfig.initialData}
          onSubmit={async (data) => {
            await editConfig.onSubmit(data);
            handleCloseEdit();
          }}
          onCancel={handleCloseEdit}
          submitLabel={editConfig.submitLabel}
          isSubmitting={editConfig.isSubmitting}
          requireConfirmation={editConfig.requireConfirmation}
          confirmationMessage={editConfig.confirmationMessage}
        />
      )}
    </>
  );
};

export default DetailModal;
