export const getTooltipContent = (
  sidebarOpen: boolean,
  isLearningMode: boolean,
  title: string,
  description: string
): string => {
  if (sidebarOpen) {
    if (isLearningMode) {
      return description;
    }
    return '';
  }

  if (isLearningMode) {
    return `${title}: ${description}`;
  }

  return title;
};
