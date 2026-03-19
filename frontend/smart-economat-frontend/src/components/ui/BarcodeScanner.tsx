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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BarcodeIcon from './BarcodeIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';

export interface BarcodeScannerProps {
  /** Controla la visibilidad del modal */
  open: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Callback que se llama con el código escaneado. Si devuelve true, el modal se cierra. */
  onScan: (code: string) => void;
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
  title = 'Escanear Código de Barras',
  continuous = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [lastCode, setLastCode] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const stopScanner = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      // ignorar
    }
    controlsRef.current = null;
  }, []);

  const startScanner = useCallback(
    async (deviceId: string) => {
      if (!videoRef.current) return;
      setScannerState('scanning');
      stopScanner();

      try {
        const reader = readerRef.current!;
        const controls = await reader.decodeFromVideoDevice(
          deviceId || undefined,
          videoRef.current,
          (result, error) => {
            if (result) {
              const code = result.getText();
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
        controlsRef.current = controls;
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : String(err);
        if (
          errorMsg.toLowerCase().includes('permission') ||
          errorMsg.toLowerCase().includes('denied') ||
          errorMsg.toLowerCase().includes('notallowed')
        ) {
          setScannerState('error_permission');
        } else if (
          errorMsg.toLowerCase().includes('notfound') ||
          errorMsg.toLowerCase().includes('no camera')
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

    setLastCode('');
    setShowSuccess(false);
    setScannerState('requesting');
    readerRef.current = new BrowserMultiFormatReader();

    const init = async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!devices || devices.length === 0) {
          setScannerState('error_no_camera');
          return;
        }

        const cameraList: CameraDevice[] = devices.map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Cámara ${d.deviceId.substring(0, 6)}`,
        }));
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
        const errorMsg =
          err instanceof Error ? err.message : String(err);
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
  }, [open, startScanner, stopScanner]);

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

  const renderContent = () => {
    switch (scannerState) {
      case 'error_permission':
        return (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Permiso de cámara denegado
            </Typography>
            <Typography variant="body2">
              Para usar el escáner, permite el acceso a la cámara en la
              configuración de tu navegador y recarga la página.
            </Typography>
          </Alert>
        );

      case 'error_no_camera':
        return (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              No se detectó ninguna cámara
            </Typography>
            <Typography variant="body2">
              Este dispositivo no tiene cámara disponible o no es accesible.
              Introduce el código de barras manualmente.
            </Typography>
          </Alert>
        );

      case 'error_generic':
        return (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Error al iniciar la cámara
            </Typography>
            <Typography variant="body2">
              No se pudo iniciar el escáner. Verifica que no haya otra
              aplicación usando la cámara e inténtalo de nuevo.
            </Typography>
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => void startScanner(selectedCamera)}
            >
              Reintentar
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
              Solicitando acceso a la cámara…
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
        {title}
        <IconButton
          aria-label="Cerrar escáner"
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
                sx={{ fontSize: 72, color: '#fff', filter: 'drop-shadow(0 0 8px #4CAF50)' }}
              />
            </Box>
          </Fade>
        </Box>

        {/* Contenido de error / loading */}
        {renderContent()}

        {/* Selector de cámara */}
        {cameras.length > 1 && (
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>Cámara</InputLabel>
            <Select
              value={selectedCamera}
              label="Cámara"
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
            Último código leído: <strong>{lastCode}</strong>
          </Alert>
        )}

        {isScanning && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}
          >
            Apunta la cámara al código de barras EAN-13 o UPC-A
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button variant="outlined" onClick={handleClose}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BarcodeScanner;
