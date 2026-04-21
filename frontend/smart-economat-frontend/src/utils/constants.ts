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
  {
    id: 'GLUTEN',
    label: 'allergens.GLUTEN',
    icon: React.createElement(GrassIcon),
  },
  {
    id: 'CRUSTACEOS',
    label: 'allergens.CRUSTACEOS',
    icon: React.createElement(BugReportIcon),
  },
  {
    id: 'HUEVOS',
    label: 'allergens.HUEVOS',
    icon: React.createElement(EggIcon),
  },
  {
    id: 'PESCADO',
    label: 'allergens.PESCADO',
    icon: React.createElement(SetMealIcon),
  },
  {
    id: 'CACAHUETES',
    label: 'allergens.CACAHUETES',
    icon: React.createElement(GrainIcon),
  },
  {
    id: 'SOJA',
    label: 'allergens.SOJA',
    icon: React.createElement(NatureIcon),
  },
  {
    id: 'LACTEOS',
    label: 'allergens.LACTEOS',
    icon: React.createElement(LocalDrinkIcon),
  },
  {
    id: 'FRUTOS_CON_CASCARA',
    label: 'allergens.FRUTOS_CON_CASCARA',
    icon: React.createElement(SpaIcon),
  },
  { id: 'APIO', label: 'allergens.APIO', icon: React.createElement(YardIcon) },
  {
    id: 'MOSTAZA',
    label: 'allergens.MOSTAZA',
    icon: React.createElement(ColorizeIcon),
  },
  {
    id: 'SESAMO',
    label: 'allergens.SESAMO',
    icon: React.createElement(ScatterPlotIcon),
  },
  {
    id: 'SULFITO',
    label: 'allergens.SULFITO',
    icon: React.createElement(ScienceIcon),
  },
  {
    id: 'ALTRAMUCES',
    label: 'allergens.ALTRAMUCES',
    icon: React.createElement(LocalFloristIcon),
  },
  {
    id: 'MOLUSCOS',
    label: 'allergens.MOLUSCOS',
    icon: React.createElement(WaterIcon),
  },
];
