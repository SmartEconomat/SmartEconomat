import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Stack,
  Alert,
  LinearProgress,
  alpha,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useTranslation } from 'react-i18next';

/**
 * Props for the {@link UploadDocumentoModal} component.
 */
interface UploadDocumentoModalProps {
  /** Whether the dialog is open. */
  isOpen: boolean;
  /** Callback to close the dialog. */
  onClose: () => void;
  /**
   * Callback invoked when the user submits a file.
   *
   * @param file - The selected file to upload.
   * @param numeroReferencia - Reference number of the albaran.
   * @param recepcionId - Optional UUID of the reception to link.
   * @param observaciones - Optional notes about the document.
   */
  onUpload: (
    file: File,
    numeroReferencia: string,
    recepcionId?: string,
    observaciones?: string
  ) => Promise<void>;
  /** Whether an upload is in progress. */
  isLoading?: boolean;
  /** Pre-populated albaran reference number. */
  defaultNumeroReferencia?: string;
}

/** MIME types accepted by the file input. */
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/gif,application/pdf';

/** Maximum allowed file size in megabytes. */
const MAX_SIZE_MB = 10;

/**
 * Formats a byte count as a human-readable file-size string.
 *
 * @param bytes - File size in bytes.
 * @returns Formatted string such as "1.2 MB" or "512 KB".
 */
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Modal dialog that lets the user upload a document (image or PDF) and
 * associate it with an albaran via its reference number and optional
 * reception UUID.
 *
 * @param {UploadDocumentoModalProps} props - Component props.
 * @returns JSX rendered upload dialog.
 * @example
 * <UploadDocumentoModal
 *   isOpen={open}
 *   onClose={handleClose}
 *   onUpload={handleUpload}
 * />
 */
const UploadDocumentoModal: React.FC<UploadDocumentoModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isLoading = false,
  defaultNumeroReferencia = '',
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [numeroReferencia, setNumeroReferencia] = useState(
    defaultNumeroReferencia
  );
  const [recepcionId, setRecepcionId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setNumeroReferencia(defaultNumeroReferencia);
      setSelectedFile(null);
      setRecepcionId('');
      setObservaciones('');
      setFileError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen, defaultNumeroReferencia]);

  /**
   * Handles file selection from the hidden file input, validating size.
   *
   * @param e - The input change event carrying the selected files.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(t('albaran.upload.errorTamano', { max: MAX_SIZE_MB }));
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  /**
   * Validates the form and triggers the {@link onUpload} callback.
   */
  const handleSubmit = async () => {
    if (!selectedFile) {
      setFileError(t('albaran.upload.errorSinArchivo'));
      return;
    }
    if (!numeroReferencia.trim()) return;
    await onUpload(
      selectedFile,
      numeroReferencia.trim(),
      recepcionId.trim() || undefined,
      observaciones.trim() || undefined
    );
  };

  return (
    <Dialog
      open={isOpen}
      onClose={!isLoading ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      {isLoading && <LinearProgress />}

      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <AttachFileIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            {t('albaran.upload.titulo')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={isLoading} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {/* Número de referencia */}
          <TextField
            label={t('albaran.upload.numeroReferencia')}
            value={numeroReferencia}
            onChange={(e) => setNumeroReferencia(e.target.value)}
            required
            fullWidth
            size="small"
            disabled={isLoading || !!defaultNumeroReferencia}
            helperText={t('albaran.upload.numeroReferenciaHelper')}
          />

          {/* Selector de archivo */}
          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="albaran-file-input"
            />
            <Button
              variant="outlined"
              component="label"
              htmlFor="albaran-file-input"
              startIcon={<UploadFileIcon />}
              fullWidth
              disabled={isLoading}
              sx={{ borderRadius: 2, py: 1.5, borderStyle: 'dashed' }}
            >
              {selectedFile
                ? t('albaran.upload.cambiarArchivo')
                : t('albaran.upload.seleccionarArchivo')}
            </Button>

            {selectedFile && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                }}
              >
                <Typography variant="body2" fontWeight={600} noWrap>
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedFile.type} · {formatSize(selectedFile.size)}
                </Typography>
              </Box>
            )}

            {fileError && (
              <Alert severity="error" sx={{ mt: 1, borderRadius: 1 }}>
                {fileError}
              </Alert>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: 'block' }}
            >
              {t('albaran.upload.formatosAceptados', { max: MAX_SIZE_MB })}
            </Typography>
          </Box>

          {/* Recepción vinculada (opcional) */}
          <TextField
            label={t('albaran.upload.recepcionId')}
            value={recepcionId}
            onChange={(e) => setRecepcionId(e.target.value)}
            fullWidth
            size="small"
            disabled={isLoading}
            placeholder={t('albaran.upload.recepcionIdPlaceholder')}
            helperText={t('albaran.upload.recepcionIdHelper')}
          />

          {/* Observaciones (opcional) */}
          <TextField
            label={t('albaran.upload.observaciones')}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            fullWidth
            size="small"
            disabled={isLoading}
            multiline
            rows={2}
            placeholder={t('albaran.upload.observacionesPlaceholder')}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={isLoading} color="inherit">
          {t('comun.cancelar')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || !selectedFile || !numeroReferencia.trim()}
          startIcon={<AttachFileIcon />}
        >
          {t('albaran.upload.botonSubir')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDocumentoModal;
