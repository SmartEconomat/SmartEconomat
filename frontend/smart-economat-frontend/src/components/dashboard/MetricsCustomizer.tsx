import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';

export interface MetricDefinition {
  id: string;
  label: string;
}

interface MetricsCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  availableMetrics: MetricDefinition[];
  visibleMetrics: string[];
  onUpdate: (newVisibleMetrics: string[]) => void;
}

const MetricsCustomizer: React.FC<MetricsCustomizerProps> = ({
  isOpen,
  onClose,
  availableMetrics,
  visibleMetrics,
  onUpdate,
}) => {
  const handleToggle = (id: string) => {
    if (visibleMetrics.includes(id)) {
      // Don't allow removing all metrics
      if (visibleMetrics.length === 1) return;
      onUpdate(visibleMetrics.filter((m) => m !== id));
    } else {
      onUpdate([...visibleMetrics, id]);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>
          Personalizar Panel
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'text.secondary',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Selecciona las tarjetas de métricas que deseas ver en tu Dashboard. Al
          menos una debe estar activa.
        </Typography>
        <FormGroup>
          {availableMetrics.map((metric) => (
            <FormControlLabel
              key={metric.id}
              control={
                <Checkbox
                  checked={visibleMetrics.includes(metric.id)}
                  onChange={() => handleToggle(metric.id)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" fontWeight={500}>
                  {metric.label}
                </Typography>
              }
            />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          disableElevation
        >
          Guardar cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MetricsCustomizer;
