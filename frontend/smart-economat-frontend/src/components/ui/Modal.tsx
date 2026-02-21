import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Backdrop,
    Fade,
    useTheme,
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    if (!isOpen) return null;

    return createPortal(
        <Backdrop
            sx={{
                zIndex: theme.zIndex.modal,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(3px)',
            }}
            open={isOpen}
            onClick={onClose}
        >
            <Fade in={isOpen}>
                <Paper
                    elevation={24}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        width: size === 'full' ? '100vw' : '100%',
                        height: size === 'full' ? '100vh' : 'auto',
                        maxWidth: sizeMaxWidths[size],
                        maxHeight: size === 'full' ? '100vh' : '90vh',
                        m: size === 'full' ? 0 : 2,
                        borderRadius: size === 'full' ? 0 : 2,
                        bgcolor: 'background.paper',
                        overflow: 'hidden',
                        outline: 'none',
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? 'modal-title' : undefined}
                >

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
        </Backdrop>,
        document.body
    );
};

export default Modal;
