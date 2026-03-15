import EggIcon from '@mui/icons-material/Egg';
import SetMealIcon from '@mui/icons-material/SetMeal';
import GrassIcon from '@mui/icons-material/Grass';
import BugReportIcon from '@mui/icons-material/BugReport';
import GrainIcon from '@mui/icons-material/Grain';
import NatureIcon from '@mui/icons-material/Nature';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import SpaIcon from '@mui/icons-material/Spa';
import YardIcon from '@mui/icons-material/Yard';
import ColorizeIcon from '@mui/icons-material/Colorize';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import ScienceIcon from '@mui/icons-material/Science';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import WaterIcon from '@mui/icons-material/Water';
import React from 'react';

export interface Allergen {
  id: string;
  label: string;
  icon: React.ReactElement;
}

export const EU_ALLERGENS: Allergen[] = [
  { id: 'GLUTEN', label: 'Gluten', icon: React.createElement(GrassIcon) },
  {
    id: 'CRUSTACEOS',
    label: 'Crustáceos',
    icon: React.createElement(BugReportIcon),
  },
  { id: 'HUEVOS', label: 'Huevos', icon: React.createElement(EggIcon) },
  { id: 'PESCADO', label: 'Pescado', icon: React.createElement(SetMealIcon) },
  {
    id: 'CACAHUETES',
    label: 'Cacahuetes',
    icon: React.createElement(GrainIcon),
  },
  { id: 'SOJA', label: 'Soja', icon: React.createElement(NatureIcon) },
  {
    id: 'LACTEOS',
    label: 'Lácteos',
    icon: React.createElement(LocalDrinkIcon),
  },
  {
    id: 'FRUTOS_CON_CASCARA',
    label: 'Frutos de cáscara',
    icon: React.createElement(SpaIcon),
  },
  { id: 'APIO', label: 'Apio', icon: React.createElement(YardIcon) },
  { id: 'MOSTAZA', label: 'Mostaza', icon: React.createElement(ColorizeIcon) },
  { id: 'SESAMO', label: 'Sésamo', icon: React.createElement(ScatterPlotIcon) },
  { id: 'SULFITO', label: 'Sulfitos', icon: React.createElement(ScienceIcon) },
  {
    id: 'ALTRAMUCES',
    label: 'Altramuces',
    icon: React.createElement(LocalFloristIcon),
  },
  { id: 'MOLUSCOS', label: 'Moluscos', icon: React.createElement(WaterIcon) },
];
