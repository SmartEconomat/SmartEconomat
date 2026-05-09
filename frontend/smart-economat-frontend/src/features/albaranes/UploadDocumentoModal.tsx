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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
interface UploadDocumentoModalProps {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  isOpen: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  onClose: () => void;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  onUpload: (
    file: File,
    numeroReferencia: string,
    recepcionId?: string,
    observaciones?: string
  ) => Promise<void>;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  isLoading?: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  defaultNumeroReferencia?: string;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/gif,application/pdf';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const MAX_SIZE_MB = 10;

/**
 * Formatea size para su presentación.
 *
 * @param bytes Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Gestiona file change y aplica la lógica correspondiente.
   *
   * @param e Parámetro de entrada para la operación.
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
   * Gestiona submit y aplica la lógica correspondiente.
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
