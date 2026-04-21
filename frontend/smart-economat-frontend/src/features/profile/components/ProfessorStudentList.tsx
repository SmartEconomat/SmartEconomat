import React from 'react';
import {
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Switch,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SecurityIcon from '@mui/icons-material/Security';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ListSkeleton from '../../../components/ui/ListSkeleton';
import { Alumno, AlumnoSlot } from '../../../services/profesor.service';
import { useTranslation } from 'react-i18next';

interface ProfessorStudentListProps {
  students: Alumno[];
  slots: AlumnoSlot[];

  onToggleStatus: (alumnoId: string, currentStatus: string) => void;
  onResetPassword: (alumnoId: string) => void;
  onManagePermissions: (alumno: Alumno) => void;
  onDeleteStudent: (alumnoId: string) => void;
  isSaving: boolean;
  isLoading?: boolean;
}

/**
 * Sección de Gestión de Alumnos para la Ficha de Perfil.
 */
const ProfessorStudentList: React.FC<ProfessorStudentListProps> = ({
  students,
  slots,

  onToggleStatus,
  onResetPassword,
  onManagePermissions,
  onDeleteStudent,
  isSaving,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState<string | false>(false);

  // Agrupar alumnos por aula y clase
  // [FALLBACK] Si no hay slots (backend pendiente), mostramos un grupo general con todos los alumnos
  const groupedStudents = React.useMemo(() => {
    return slots.length > 0
      ? slots.map((slot) => ({
          ...slot,
          students: students.filter(
            (s) => s.aula === slot.aula && s.numeroClase === slot.numeroClase
          ),
        }))
      : students.length > 0
        ? [
            {
              id: 'temp-group',
              aula: t('professorStudents.unknownGroup'),
              numeroClase: 0,
              capacidad: students.length,
              codigoSlot: 'PENDIENTE',
              students: students,
            },
          ]
        : [];
  }, [slots, students]);

  const handleChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  // Efecto para expandir por defecto el primer grupo con alumnos si nada está expandido
  React.useEffect(() => {
    if (!expanded && groupedStudents.length > 0) {
      const firstWithStudents =
        groupedStudents.find((g) => g.students.length > 0) ||
        groupedStudents[0];
      setExpanded(
        firstWithStudents.id ||
          `${firstWithStudents.aula}-${firstWithStudents.numeroClase}`
      );
    }
  }, [expanded, groupedStudents]);

  const handleCopyCode = (e: React.MouseEvent, code?: string) => {
    e.stopPropagation(); // Evitar que el acordeón se cierre al copiar
    if (code) {
      navigator.clipboard.writeText(code);
      // Opcional: toast de éxito
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={{ xs: 2, md: 3 }}>
        <PeopleOutlineIcon
          color="primary"
          sx={{ fontSize: { xs: 28, md: 32 }, mr: 1.5 }}
        />
        <Typography
          variant="h5"
          fontWeight={600}
          sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
        >
          {t('professorStudents.manageTitle')}
        </Typography>
      </Box>
      <Divider sx={{ mb: { xs: 3, md: 4 } }} />

      {isLoading ? (
        <ListSkeleton type="accordion" count={2} />
      ) : slots.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ py: 4, fontStyle: 'italic' }}
        >
          {t('professorStudents.configureFirst')}
        </Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {groupedStudents.map((group) => {
            const panelId = `${group.aula}-${group.numeroClase}`;
            const isPanelExpanded = expanded === panelId;

            return (
              <Accordion
                key={panelId}
                expanded={isPanelExpanded}
                onChange={handleChange(panelId)}
                sx={{
                  borderRadius: '8px !important',
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: isPanelExpanded ? 'primary.main' : 'divider',
                  boxShadow: isPanelExpanded ? 2 : 'none',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: isPanelExpanded ? 'action.hover' : 'inherit',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <MeetingRoomIcon
                      color={isPanelExpanded ? 'primary' : 'action'}
                    />
                    <Box flex={1}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        color={
                          isPanelExpanded ? 'primary.main' : 'text.primary'
                        }
                      >
                        {t('professorSlots.courseLabel', {
                          aula: group.aula,
                          num: group.numeroClase,
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('professorStudents.studentCount', {
                          count: group.students.length,
                          capacity: group.capacidad,
                        })}
                      </Typography>
                    </Box>
                    <Tooltip title={t('professorStudents.clickToCopyCode')}>
                      <Chip
                        label={
                          group.codigoSlot || t('professorStudents.noCode')
                        }
                        size="small"
                        color="primary"
                        variant={group.codigoSlot ? 'filled' : 'outlined'}
                        sx={{
                          fontWeight: 700,
                          borderRadius: 1,
                          cursor: 'copy',
                        }}
                        onClick={(e) => handleCopyCode(e, group.codigoSlot)}
                      />
                    </Tooltip>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, bgcolor: 'background.paper' }}>
                  {group.students.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ py: 3, fontStyle: 'italic' }}
                    >
                      {t('professorStudents.noStudentsInClass')}
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {group.students.map((student, index) => {
                        const isActive =
                          student.status?.toUpperCase() === 'ACTIVE';

                        return (
                          <ListItem
                            key={student.id}
                            divider={index !== group.students.length - 1}
                            sx={{
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'flex-start', sm: 'center' },
                              py: 1.5,
                              px: 3,
                              gap: { xs: 2, sm: 0 },
                              borderLeft: '4px solid',
                              borderLeftColor: isActive
                                ? 'success.main'
                                : 'warning.main',
                            }}
                          >
                            <Box display="flex" alignItems="center" flex={1}>
                              <Avatar
                                sx={{
                                  bgcolor: isActive
                                    ? 'primary.main'
                                    : 'text.disabled',
                                  mr: 2,
                                  width: 32,
                                  height: 32,
                                  fontSize: '0.8rem',
                                }}
                              >
                                {student.username.charAt(0).toUpperCase()}
                              </Avatar>
                              <ListItemText
                                primary={
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                  >
                                    <Typography
                                      fontWeight={600}
                                      variant="body2"
                                    >
                                      {student.username}
                                    </Typography>
                                    <Chip
                                      label={
                                        isActive
                                          ? t('professorStudents.statusActive')
                                          : t('professorStudents.statusPending')
                                      }
                                      size="small"
                                      color={isActive ? 'success' : 'warning'}
                                      variant="filled"
                                      sx={{
                                        fontSize: '0.6rem',
                                        height: 16,
                                        fontWeight: 700,
                                      }}
                                    />
                                  </Box>
                                }
                              />
                            </Box>

                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              width={{ xs: '100%', sm: 'auto' }}
                              justifyContent={{
                                xs: 'space-between',
                                sm: 'flex-end',
                              }}
                            >
                              <Box display="flex" alignItems="center">
                                <Tooltip
                                  title={
                                    isActive
                                      ? t('professorStudents.alreadyActive')
                                      : t('professorStudents.activateStudent')
                                  }
                                >
                                  <Switch
                                    size="small"
                                    checked={isActive}
                                    onChange={() =>
                                      onToggleStatus(student.id, student.status)
                                    }
                                    disabled={isSaving || isActive}
                                    color="success"
                                  />
                                </Tooltip>
                              </Box>

                              {!isActive && (
                                <Typography
                                  variant="caption"
                                  color="warning.main"
                                  sx={{ minWidth: { xs: 'auto', sm: 180 } }}
                                >
                                  {t('professorStudents.pendingActivation')}
                                </Typography>
                              )}

                              <Box display="flex" gap={0.5}>
                                <Tooltip
                                  title={t(
                                    'professorStudents.tooltipPermissions'
                                  )}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() => onManagePermissions(student)}
                                    disabled={!isActive || isSaving}
                                  >
                                    <SecurityIcon
                                      fontSize="small"
                                      color={isActive ? 'primary' : 'disabled'}
                                    />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip
                                  title={t(
                                    'professorStudents.tooltipResetPassword'
                                  )}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() => onResetPassword(student.id)}
                                    disabled={isSaving}
                                  >
                                    <VpnKeyIcon
                                      fontSize="small"
                                      color="secondary"
                                    />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip
                                  title={t(
                                    'professorStudents.tooltipDeleteStudent'
                                  )}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() => onDeleteStudent(student.id)}
                                    color="error"
                                    disabled={isSaving}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          </ListItem>
                        );
                      })}
                    </List>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default React.memo(ProfessorStudentList);
