import React, { useState } from 'react';
import {
    Box,
    Button,
    Divider,
    IconButton,
    Tooltip,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import DynamicFormModal, { DynamicField, DynamicFormModalProps } from './DynamicFormModal';
import { ModalSize } from './Modal';

// ─────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────

/** Una fila de datos para mostrar en el modal de detalle. */
export interface DetailField {
    /** Etiqueta que se muestra al usuario. */
    label: string;
    /** Valor a renderizar. Puede ser texto, número, un ReactNode (chip, icono…). */
    value: React.ReactNode;
    /** Si true, ocupa todo el ancho disponible (por defecto false → mitad de columna). */
    fullWidth?: boolean;
}

/** Sección para agrupar campos bajo un título. */
export interface DetailSection {
    title?: string;
    fields: DetailField[];
}

export interface DetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: React.ReactNode;
    headerMedia?: React.ReactNode;
    sections: DetailSection[];
    size?: ModalSize;
    editConfig?: {
        title?: string;
        fields: DynamicField[];
        initialData: Record<string, any>;
        onSubmit: DynamicFormModalProps['onSubmit'];
        submitLabel?: string;
        isSubmitting?: boolean;
        requireConfirmation?: boolean;
        confirmationMessage?: React.ReactNode;
        size?: ModalSize;
    };
}

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────

const sizeToPaperMaxWidth: Record<ModalSize, string> = {
    sm: '400px',
    md: '600px',
    lg: '900px',
    xl: '1200px',
    full: '100vw',
};

// ─────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────

const DetailModal: React.FC<DetailModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    headerMedia,
    sections,
    size = 'md',
    editConfig,
}) => {
    const [editOpen, setEditOpen] = useState(false);

    const handleOpenEdit = () => {
        onClose();
        setEditOpen(true);
    };

    const handleCloseEdit = () => {
        setEditOpen(false);
    };

    return (
        <>
            {/* ── Modal de DETALLE ── */}
            <Dialog
                open={isOpen}
                onClose={onClose}
                scroll="paper"
                fullScreen={size === 'full'}
                PaperProps={{
                    sx: {
                        width: '100%',
                        maxWidth: sizeToPaperMaxWidth[size],
                        maxHeight: size === 'full' ? '100vh' : '90vh',
                        m: size === 'full' ? 0 : 2,
                        bgcolor: 'background.paper',
                        backgroundImage: 'none',
                    },
                }}
                transitionDuration={225}
            >
                {/* ── Header ── */}
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
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>

                    <Tooltip title="Cerrar">
                        <IconButton
                            aria-label="Cerrar"
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

                {/* ── Media de cabecera ── */}
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

                {/* ── Secciones de datos ── */}
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

                            {/* Grid 2 col */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 2,
                                }}
                            >
                                {section.fields.map((field, fIdx) => (
                                    <Box
                                        key={fIdx}
                                        sx={{ gridColumn: field.fullWidth ? 'span 2' : 'span 1' }}
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
                                                typeof field.value === 'string' || typeof field.value === 'number' ? (
                                                    <Typography variant="body2">{field.value}</Typography>
                                                ) : (
                                                    field.value
                                                )
                                            ) : (
                                                <Typography variant="body2" color="text.disabled">—</Typography>
                                            )}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>

                            {sIdx < sections.length - 1 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                    ))}
                </DialogContent>

                {/* ── Footer con botón Editar ── */}
                {editConfig && (
                    <DialogActions
                        sx={{
                            px: 3,
                            py: 2,
                            borderTop: 1,
                            borderColor: 'divider',
                            justifyContent: 'flex-end',
                        }}
                    >
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<EditIcon />}
                            onClick={handleOpenEdit}
                            disableElevation
                        >
                            Editar producto
                        </Button>
                    </DialogActions>
                )}
            </Dialog>

            {/* ── Modal de EDICIÓN ── */}
            {editConfig && (
                <DynamicFormModal
                    isOpen={editOpen}
                    onClose={handleCloseEdit}
                    title={editConfig.title ?? `Editar ${title}`}
                    size={editConfig.size ?? size}
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
