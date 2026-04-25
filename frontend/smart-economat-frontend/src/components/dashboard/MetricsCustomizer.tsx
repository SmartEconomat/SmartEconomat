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
import { useTranslation } from 'react-i18next';

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

/**
 * Dialog that lets the user choose which metric cards are visible on the
 * Dashboard. At least one metric must remain active at all times.
 *
 * @param props.isOpen - Whether the dialog is open.
 * @param props.onClose - Callback to close the dialog (also used as the "Save" action).
 * @param props.availableMetrics - Full list of metrics the user can toggle.
 * @param props.visibleMetrics - IDs of the metrics currently displayed.
 * @param props.onUpdate - Callback invoked with the updated list of visible metric IDs.
 */
const MetricsCustomizer: React.FC<MetricsCustomizerProps> = ({
  isOpen,
  onClose,
  availableMetrics,
  visibleMetrics,
  onUpdate,
}) => {
  const { t } = useTranslation();

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
      <DialogTitle
        component="div"
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <SettingsIcon color="primary" />
        <Typography variant="h6" component="h2" fontWeight={700}>
          {t('dashboard.customizer.titulo')}
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
          {t('dashboard.customizer.descripcion')}
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
          {t('comun.guardar')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MetricsCustomizer;
