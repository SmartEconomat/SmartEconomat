/**
 * @fileoverview Componente modal reutilizable para escanear códigos de barras
 * mediante la cámara del dispositivo usando @zxing/browser.
 *
 * Soporta EAN-13 y UPC-A. Permite selección de cámara trasera en móviles,
 * gestiona errores de permiso y dispositivos sin cámara.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Dialog,
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FlashOffIcon from '@mui/icons-material/FlashOff';
import BarcodeIcon from './BarcodeIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import {
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
} from '@zxing/library';

export interface BarcodeScannerProps {
  /** Controla la visibilidad del modal */
  open: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Callback que se llama con el código escaneado. Si devuelve true, el modal se cierra. */
  onScan: (code: string) => void | Promise<void>;
  /** Título opcional del modal */
  title?: string;
  /** Si es true, permite escaneos múltiples secuenciales sin cerrar el modal */
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
      exposureModes.includes('continuous');
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

/** Emite un beep corto usando la Web Audio API */
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
  const actualTitle = title || t('common.barcodeScanner.title');
  const actualCancelLabel = t('common.cancel');
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
        const reader = readerRef.current!;
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: buildVideoConstraints(deviceId),
          },
          videoRef.current,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (result: any, error: any) => {
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
          }
        );

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

        const errorMsg = err instanceof Error ? err.message : String(err);
        if (
          errorMsg.toLowerCase().includes('permission') ||
          errorMsg.toLowerCase().includes('denied') ||
          errorMsg.toLowerCase().includes('notallowed')
        ) {
          setScannerState('error_permission');
        } else if (
          errorMsg.toLowerCase().includes('notfound') ||
          errorMsg.toLowerCase().includes('no camera') ||
          errorMsg.toLowerCase().includes('devices not found')
        ) {
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
              `${t('common.barcodeScanner.camera')} ${d.deviceId.substring(0, 6)}`,
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
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (
          errorMsg.toLowerCase().includes('permission') ||
          errorMsg.toLowerCase().includes('denied')
        ) {
          setScannerState('error_permission');
        } else {
          setScannerState('error_no_camera');
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
              {t('common.barcodeScanner.errors.permissionTitle')}
            </Typography>
            <Typography variant="body2">
              {t('common.barcodeScanner.errors.permissionBody')}
            </Typography>
          </Alert>
        );

      case 'error_no_camera':
        return (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('common.barcodeScanner.errors.noCameraTitle')}
            </Typography>
            <Typography variant="body2">
              {t('common.barcodeScanner.errors.noCameraBody')}
            </Typography>
          </Alert>
        );

      case 'error_generic':
        return (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('common.barcodeScanner.errors.genericTitle')}
            </Typography>
            <Typography variant="body2">
              {t('common.barcodeScanner.errors.genericBody')}
            </Typography>
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => void startScanner(selectedCamera)}
            >
              {t('common.retry')}
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
              {t('common.barcodeScanner.requesting')}
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  const isScanning = scannerState === 'scanning';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pr: 6,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <BarcodeIcon color="primary" />
        {actualTitle}
        <IconButton
          aria-label={t('common.barcodeScanner.closeAria')}
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {/* Viewfinder de la cámara */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4/3',
            bgcolor: '#000',
            borderRadius: 2,
            overflow: 'hidden',
            mt: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

          {/* Línea de escaneo animada */}
          {isScanning && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: '10%',
                width: '80%',
                height: '2px',
                bgcolor: 'primary.main',
                boxShadow: '0 0 8px 2px rgba(25, 118, 210, 0.7)',
                animation: 'scanLine 2s linear infinite',
                '@keyframes scanLine': {
                  '0%': { top: '10%' },
                  '50%': { top: '85%' },
                  '100%': { top: '10%' },
                },
              }}
            />
          )}

          {/* Marco del visor */}
          {isScanning && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70%',
                height: '60%',
                border: '2px solid rgba(255,255,255,0.6)',
                borderRadius: 1,
                pointerEvents: 'none',
              }}
            />
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
            <InputLabel>{t('common.barcodeScanner.camera')}</InputLabel>
            <Select
              value={selectedCamera}
              label={t('common.barcodeScanner.camera')}
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
        {continuous && lastCode && (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2 }}>
            {t('common.barcodeScanner.lastScanned')}:{' '}
            <strong>{lastCode}</strong>
          </Alert>
        )}

        {isScanning && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}
          >
            {t('common.barcodeScanner.instructions')}
          </Typography>
        )}

        {isScanning && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ mt: 2 }}
          >
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => void startScanner(selectedCamera)}
            >
              {t('common.barcodeScanner.restart')}
            </Button>
            {torchAvailable && (
              <Button
                fullWidth
                variant={torchEnabled ? 'contained' : 'outlined'}
                size="small"
                onClick={() => void handleToggleTorch()}
                disabled={torchBusy}
                startIcon={torchEnabled ? <FlashOffIcon /> : <FlashOnIcon />}
              >
                {torchEnabled
                  ? t('common.barcodeScanner.torchOff')
                  : t('common.barcodeScanner.torchOn')}
              </Button>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button variant="outlined" onClick={handleClose}>
          {actualCancelLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BarcodeScanner;
