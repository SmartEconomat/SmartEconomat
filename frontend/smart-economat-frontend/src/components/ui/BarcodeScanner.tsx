/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  CircularProgress,
  Fade,
  Stack,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatDigitsForSR } from '../../utils/a11y-format';
import CloseIcon from '@mui/icons-material/Close';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import BarcodeIcon from './BarcodeIcon';
import AccessibleDialog from './AccessibleDialog';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import {
  BarcodeFormat,
  DecodeHintType,
  Exception,
  NotFoundException,
  Result,
} from '@zxing/library';

/** Contrato de tipos público (BarcodeScannerProps). Contexto: smart-economat-frontend (SPA). */
export interface BarcodeScannerProps {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  open: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  onClose: () => void;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  onScan: (code: string) => void | Promise<void>;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  title?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  continuous?: boolean;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

type ScannerState =
  | 'idle'
  | 'requesting'
  | 'scanning'
  | 'success'
  | 'error_permission'
  | 'error_no_camera'
  | 'error_generic';

const SCANNER_HINTS = new Map<DecodeHintType, unknown>([
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.CODABAR,
    ],
  ],
  [DecodeHintType.TRY_HARDER, true],
]);

const READER_OPTIONS = {
  delayBetweenScanAttempts: 120,
  delayBetweenScanSuccess: 600,
  tryPlayVideoTimeout: 4000,
};

const buildVideoConstraints = (deviceId: string): MediaTrackConstraints => ({
  ...(deviceId
    ? { deviceId: { exact: deviceId } }
    : { facingMode: { ideal: 'environment' } }),
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  aspectRatio: { ideal: 1.7777777778 },
});

const buildVideoConstraintAttempts = (
  deviceId: string
): Array<MediaStreamConstraints['video']> => {
  const normalizedDeviceId = deviceId.trim();

  const attempts: Array<MediaStreamConstraints['video']> = [];

  if (normalizedDeviceId) {
    attempts.push(buildVideoConstraints(normalizedDeviceId));
    attempts.push({
      deviceId: { ideal: normalizedDeviceId },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    });
  }

  attempts.push({
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  });
  attempts.push(true);

  return attempts;
};

const getActiveVideoTrack = (
  videoElement: HTMLVideoElement | null
): MediaStreamTrack | undefined => {
  const stream = videoElement?.srcObject;
  return stream instanceof MediaStream ? stream.getVideoTracks()[0] : undefined;
};

const applyPreferredTrackSettings = async (
  track: MediaStreamTrack | undefined
): Promise<{ torchAvailable: boolean }> => {
  if (!track || typeof track.getCapabilities !== 'function') {
    return { torchAvailable: false };
  }

  try {
    const capabilities = track.getCapabilities() as Record<string, unknown>;
    const advanced: Record<string, unknown> = {};

    const focusModes = Array.isArray(capabilities.focusMode)
      ? capabilities.focusMode.filter(
          (mode): mode is string => typeof mode === 'string'
        )
      : [];
    if (focusModes.includes('continuous')) {
      advanced.focusMode = 'continuous';
    } else if (focusModes.includes('single-shot')) {
      advanced.focusMode = 'single-shot';
    }

    const exposureModes = Array.isArray(capabilities.exposureMode)
      ? capabilities.exposureMode.filter(
          (mode): mode is string => typeof mode === 'string'
        )
      : [];
    if (exposureModes.includes('continuous')) {
      advanced.exposureMode = 'continuous';
    }

    if (Object.keys(advanced).length > 0) {
      await track.applyConstraints({
        advanced: [advanced] as MediaTrackConstraintSet[],
      });
    }

    return { torchAvailable: Boolean(capabilities.torch) };
  } catch {
    return { torchAvailable: false };
  }
};

const requestCameraAccess = async () => {
  const attempts: MediaStreamConstraints[] = [
    { audio: false, video: { facingMode: { ideal: 'environment' } } },
    { audio: false, video: true },
  ];

  let lastError: unknown = null;

  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((track) => track.stop());
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const isExpectedVideoAbortError = (error: unknown): boolean => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  const errorMsg = error instanceof Error ? error.message : String(error);
  const normalizedErrorMsg = errorMsg.toLowerCase();

  return (
    normalizedErrorMsg.includes('aborted by the user agent') ||
    normalizedErrorMsg.includes(
      'the fetching process for the media resource was aborted'
    ) ||
    normalizedErrorMsg.includes('play() request was interrupted') ||
    normalizedErrorMsg.includes('it was not possible to play the video')
  );
};

const getErrorFingerprint = (error: unknown) => {
  const name = error instanceof DOMException ? error.name : '';
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  return { name, message };
};

const isPermissionError = (error: unknown): boolean => {
  const { name, message } = getErrorFingerprint(error);
  return (
    name === 'NotAllowedError' ||
    name === 'PermissionDeniedError' ||
    name === 'SecurityError' ||
    message.includes('permission') ||
    message.includes('denied') ||
    message.includes('notallowed')
  );
};

const isNoCameraError = (error: unknown): boolean => {
  const { name, message } = getErrorFingerprint(error);
  return (
    name === 'NotFoundError' ||
    name === 'DevicesNotFoundError' ||
    message.includes('notfound') ||
    message.includes('no camera')
  );
};

const isRetriableCameraStartError = (error: unknown): boolean => {
  const { name, message } = getErrorFingerprint(error);

  return (
    name === 'OverconstrainedError' ||
    name === 'ConstraintNotSatisfiedError' ||
    name === 'NotReadableError' ||
    message.includes('constraint') ||
    message.includes('could not start video source') ||
    message.includes('starting video input') ||
    message.includes('notreadable')
  );
};

/**
 * Ejecuta la lógica de play beep dentro del flujo de la aplicación.
 */
const playBeep = () => {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1480, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close(), 500);
  } catch {
    // AudioContext no disponible, ignorar
  }
};

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  open,
  onClose,
  onScan,
  title,
  continuous = false,
}) => {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('escaner.tituloDefault');
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const isOpenRef = useRef(open);
  const startScannerIdRef = useRef(0);
  const lastScannedRef = useRef({ code: '', time: 0 });

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [lastCode, setLastCode] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchBusy, setTorchBusy] = useState(false);

  const theme = useTheme();
  // Detectar si la ventana es muy baja para simplificar UI
  const isShortScreen = useMediaQuery('(max-height: 600px)');
  const isDarkMode = theme.palette.mode === 'dark';

  useEffect(() => {
    isOpenRef.current = open;
  }, [open]);

  const releaseVideoStream = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    const stream = videoElement.srcObject;
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    videoElement.pause();
    videoElement.srcObject = null;
  }, []);

  const stopScanner = useCallback(() => {
    startScannerIdRef.current += 1;
    try {
      controlsRef.current?.stop();
    } catch {
      // ignorar
    }
    controlsRef.current = null;
    releaseVideoStream();
    setTorchAvailable(false);
    setTorchEnabled(false);
    setTorchBusy(false);
  }, [releaseVideoStream]);

  const startScanner = useCallback(
    async (deviceId: string) => {
      if (!videoRef.current) return;
      setScannerState('scanning');
      stopScanner();

      const currentStartId = startScannerIdRef.current;

      try {
        const reader = readerRef.current;
        if (!reader) {
          return;
        }

        const decodeCallback = (
          result: Result | undefined,
          error: Exception | Error | undefined
        ) => {
          if (result) {
            const code = String(result.getText() || '').trim();
            if (!code) return;

            const now = Date.now();
            const duplicateTimeout = continuous ? 2000 : 1500;

            if (
              lastScannedRef.current.code === code &&
              now - lastScannedRef.current.time < duplicateTimeout
            ) {
              return;
            }
            lastScannedRef.current = { code, time: now };

            setLastCode(code);
            setShowSuccess(true);
            playBeep();
            setTimeout(() => setShowSuccess(false), 1000);
            onScan(code);
            if (!continuous) {
              stopScanner();
              onClose();
            }
          }
          if (error && !(error instanceof NotFoundException)) {
            // Errores transitorios de lectura son normales durante el escaneo
          }
        };

        let controls: IScannerControls | null = null;
        let lastStartError: unknown = null;

        for (const constraints of buildVideoConstraintAttempts(deviceId)) {
          try {
            controls = await reader.decodeFromConstraints(
              {
                audio: false,
                video: constraints,
              },
              videoRef.current,
              decodeCallback
            );
            break;
          } catch (startError) {
            lastStartError = startError;
            if (!isRetriableCameraStartError(startError)) {
              throw startError;
            }
          }
        }

        if (!controls) {
          throw lastStartError ?? new Error('No se pudo iniciar la camara.');
        }

        if (currentStartId !== startScannerIdRef.current) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        const { torchAvailable: canUseTorch } =
          await applyPreferredTrackSettings(
            getActiveVideoTrack(videoRef.current)
          );
        setTorchAvailable(Boolean(controls.switchTorch && canUseTorch));
      } catch (err: unknown) {
        if (
          currentStartId !== startScannerIdRef.current ||
          !isOpenRef.current ||
          isExpectedVideoAbortError(err)
        ) {
          return;
        }

        if (isPermissionError(err)) {
          setScannerState('error_permission');
        } else if (isNoCameraError(err)) {
          setScannerState('error_no_camera');
        } else {
          setScannerState('error_generic');
        }
      }
    },
    [stopScanner, onScan, onClose, continuous]
  );

  // Inicializar cuando el modal se abre
  useEffect(() => {
    if (!open) return;

    lastScannedRef.current = { code: '', time: 0 };
    setLastCode('');
    setShowSuccess(false);
    setTorchAvailable(false);
    setTorchEnabled(false);
    setScannerState('requesting');
    readerRef.current = new BrowserMultiFormatReader(
      SCANNER_HINTS,
      READER_OPTIONS
    );

    const init = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setScannerState('error_no_camera');
          return;
        }

        await requestCameraAccess();
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!devices || devices.length === 0) {
          setScannerState('error_no_camera');
          return;
        }

        const cameraList: CameraDevice[] = devices.map(
          (d: MediaDeviceInfo) => ({
            deviceId: d.deviceId,
            label:
              d.label ||
              t('escaner.camaraSinNombre', {
                id: d.deviceId.substring(0, 6),
              }),
          })
        );
        setCameras(cameraList);

        // Preferir cámara trasera en móviles
        const backCamera = cameraList.find(
          (c) =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('trasera') ||
            c.label.toLowerCase().includes('environment')
        );
        const initialCamera = backCamera
          ? backCamera.deviceId
          : cameraList[0].deviceId;
        setSelectedCamera(initialCamera);
        await startScanner(initialCamera);
      } catch (err: unknown) {
        if (isPermissionError(err)) {
          setScannerState('error_permission');
        } else if (isNoCameraError(err)) {
          setScannerState('error_no_camera');
        } else {
          setScannerState('error_generic');
        }
      }
    };

    void init();

    return () => {
      stopScanner();
    };
  }, [open, startScanner, stopScanner, t]);

  // Limpiar al cerrar
  const handleClose = () => {
    stopScanner();
    setScannerState('idle');
    setCameras([]);
    setSelectedCamera('');
    onClose();
  };

  const handleCameraChange = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    await startScanner(deviceId);
  };

  const handleToggleTorch = async () => {
    const switchTorch = controlsRef.current?.switchTorch;
    if (!switchTorch || torchBusy) return;

    setTorchBusy(true);
    try {
      await switchTorch(!torchEnabled);
      setTorchEnabled((prev) => !prev);
    } finally {
      setTorchBusy(false);
    }
  };

  const renderContent = () => {
    switch (scannerState) {
      case 'error_permission':
        return (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('escaner.permisosDenegados')}
            </Typography>
            <Typography variant="body2">
              {t('escaner.permisosDenegadosDesc')}
            </Typography>
          </Alert>
        );

      case 'error_no_camera':
        return (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('escaner.sinCamara')}
            </Typography>
            <Typography variant="body2">
              {t('escaner.sinCamaraDesc')}
            </Typography>
          </Alert>
        );

      case 'error_generic':
        return (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('escaner.errorCamara')}
            </Typography>
            <Typography variant="body2">
              {t('escaner.errorCamaraDesc')}
            </Typography>
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => void startScanner(selectedCamera)}
            >
              {t('escaner.reintentar')}
            </Button>
          </Alert>
        );

      case 'requesting':
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 4,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              {t('escaner.solicitandoAcceso')}
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  const isScanning = scannerState === 'scanning';

  return (
    <AccessibleDialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          // Aplicar Negro Azulado Profundo para máxima cohesión temática
          ...(isDarkMode
            ? {
                bgcolor: '#05070A',
                backgroundImage: 'none',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }
            : {}),
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pr: 6,
        }}
      >
        <BarcodeIcon color="primary" />
        {resolvedTitle}
        <IconButton
          aria-label={t('escaner.cerrar')}
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: isShortScreen ? 1 : 2,
          display: 'flex',
          flexDirection: 'column',
          gap: isShortScreen ? 1 : 2,
          overflow: 'hidden',
        }}
      >
        {/* Viewfinder de la cámara */}
        <Box
          sx={{
            flex: 1,
            minHeight: isShortScreen ? 180 : 300,
            position: 'relative',
            gridColumn: '1 / -1',
            gridRow: '1',
            bgcolor: '#000',
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            aspectRatio: isShortScreen ? '21/9' : { xs: '4/3', sm: '16/9' },
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.9)',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : 'none',
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isScanning ? 'block' : 'none',
            }}
            muted
            playsInline
          />

          {/* Marco del visor - Feedback inmediato para el usuario */}
          {(isScanning || scannerState === 'requesting') && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: isShortScreen ? '50%' : '70%',
                height: isShortScreen ? '70%' : '60%',
                border: '2px solid rgba(255,255,255,0.8)',
                borderRadius: 1,
                pointerEvents: 'none',
                zIndex: 3,
                overflow: 'hidden', // Asegura que la línea no se salga del marco
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  background: (theme) =>
                    `linear-gradient(90deg, 
                    transparent 0%, 
                    ${alpha(theme.palette.primary.main, 0.8)} 50%, 
                    transparent 100%)`,
                  boxShadow: (theme) =>
                    `0 0 12px 1px ${alpha(theme.palette.primary.main, 0.4)}`,
                  animation: 'scanLineInside 2.5s ease-in-out infinite',
                  '@keyframes scanLineInside': {
                    '0%': { top: '0%' },
                    '50%': { top: '99%' },
                    '100%': { top: '0%' },
                  },
                }}
              />
            </Box>
          )}

          {/* Flash de éxito */}
          <Fade in={showSuccess} timeout={200}>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(76, 175, 80, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: 72,
                  color: '#fff',
                  filter: 'drop-shadow(0 0 8px #4CAF50)',
                }}
              />
            </Box>
          </Fade>
        </Box>

        {/* Contenido de error / loading */}
        {renderContent()}

        {/* Selector de cámara */}
        {cameras.length > 1 && (
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>{t('escaner.camara')}</InputLabel>
            <Select
              value={selectedCamera}
              label={t('escaner.camara')}
              onChange={(e) => void handleCameraChange(e.target.value)}
            >
              {cameras.map((cam) => (
                <MenuItem key={cam.deviceId} value={cam.deviceId}>
                  {cam.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Último código leído (modo continuo) */}
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2 }}>
          {t('escaner.ultimoCodigo')}
          <strong aria-label={formatDigitsForSR(lastCode)}>{lastCode}</strong>
        </Alert>

        {isScanning && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 1.5,
              fontSize: '0.75rem',
            }}
          >
            {t('escaner.instruccion')}
          </Typography>
        )}

        {isScanning && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: isShortScreen ? 0.5 : 2 }}
          >
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => void startScanner(selectedCamera)}
              title={t('escaner.reiniciar')}
              aria-label={t('escaner.reiniciar')}
              startIcon={<HistoryOutlinedIcon />}
              sx={{
                minWidth: isShortScreen ? '44px' : 'auto',
                px: isShortScreen ? 1 : 2,
              }}
            >
              {!isShortScreen && t('escaner.reiniciar')}
            </Button>
            {torchAvailable && (
              <Button
                fullWidth
                variant={torchEnabled ? 'contained' : 'outlined'}
                size="small"
                onClick={() => void handleToggleTorch()}
                disabled={torchBusy}
                startIcon={torchEnabled ? <FlashOffIcon /> : <FlashOnIcon />}
                title={
                  torchEnabled
                    ? t('escaner.apagarLuz')
                    : t('escaner.encenderLuz')
                }
                aria-label={
                  torchEnabled
                    ? t('escaner.apagarLuz')
                    : t('escaner.encenderLuz')
                }
                sx={{
                  minWidth: isShortScreen ? '44px' : 'auto',
                  px: isShortScreen ? 1 : 2,
                }}
              >
                {!isShortScreen &&
                  (torchEnabled
                    ? t('escaner.apagarLuz')
                    : t('escaner.encenderLuz'))}
              </Button>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button variant="outlined" onClick={handleClose}>
          {t('escaner.cancelar')}
        </Button>
      </DialogActions>
    </AccessibleDialog>
  );
};

export default BarcodeScanner;
