import React from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Backdrop,
    Fade,
    useTheme,
    Modal as MuiModal,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string | React.ReactNode;
    size?: ModalSize;
    children: React.ReactNode;
}

const sizeMaxWidths: Record<ModalSize, string> = {
    sm: '400px',
    md: '600px',
    lg: '900px',
    xl: '1200px',
    full: '100vw',
};

const Modal = ({
    isOpen,
    onClose,
    title,
    size = 'md',
    children,
}: ModalProps) => {
    const theme = useTheme();

    return (
        <MuiModal
            open={isOpen}
            onClose={onClose}
            closeAfterTransition
            slots={{ backdrop: Backdrop }}
            slotProps={{
                backdrop: {
                    timeout: 500,
                    sx: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(3px)',
                    }
                }
            }}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Fade in={isOpen}>
                <Paper
                    elevation={24}
                    sx={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        width: size === 'full' ? '100vw' : 'calc(100% - 32px)',
                        height: size === 'full' ? '100vh' : 'auto',
                        maxWidth: sizeMaxWidths[size],
                        maxHeight: size === 'full' ? '100vh' : '90vh',
                        borderRadius: size === 'full' ? 0 : 2,
                        bgcolor: 'background.paper',
                        overflow: 'hidden',
                        outline: 'none',
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? 'modal-title' : undefined}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 3,
                            py: 2,
                            borderBottom: 1,
                            borderColor: 'divider',
                        }}
                    >
                        {title && (
                            <Typography variant="h6" id="modal-title" component="h2" sx={{ fontWeight: 600 }}>
                                {title}
                            </Typography>
                        )}
                        <IconButton
                            aria-label="Cerrar modal"
                            onClick={onClose}
                            size="small"
                            sx={{
                                ml: 'auto',
                                color: 'text.secondary',
                                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {/* Content */}
                    <Box
                        sx={{
                            p: 3,
                            overflowY: 'auto',
                            flex: 1,
                        }}
                    >
                        {children}
                    </Box>
                </Paper>
            </Fade>
        </MuiModal>
    );
};

export default Modal;
