import type { ReactNode } from "react";
import { Box, Button, Tooltip } from "@mui/material";

interface WizardFooterNavProps {
  onBack: () => void;
  onContinue: () => void;
  backLabel?: string;
  continueLabel?: string;
  backDisabled?: boolean;
  continueDisabled?: boolean;
  centerContent?: ReactNode;
  continueTooltip?: string;
}

const wizardButtonSx = {
  width: 196,
  minWidth: 196,
  maxWidth: 196,
  height: 42,
  px: 2.5,
  py: 1,
  fontWeight: 700,
  letterSpacing: 0.2,
  textTransform: "none",
};

/**
 * Expone la operación "WizardFooterNav" del instalador SmartEconomat.
 * @returns {WizardFooterNavProps} {
 *   onBack,
 *   onContinue,
 *   backLabel = "Atrás",
 *   continueLabel = "Continuar",
 *   backDisabled = false,
 *   continueDisabled = false,
 *   centerContent = null,
 *   continueTooltip,
 * } - Entrada esperada por la función.
 * @returns {import("/home/psych/projects/SmartEconomat/ElectronInstaller/node_modules/@types/react/jsx-runtime").JSX.Element} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function WizardFooterNav({
  onBack,
  onContinue,
  backLabel = "Atrás",
  continueLabel = "Continuar",
  backDisabled = false,
  continueDisabled = false,
  centerContent = null,
  continueTooltip,
}: WizardFooterNavProps) {
  const continueButton = (
    <Button
      variant="contained"
      disabled={continueDisabled}
      onClick={onContinue}
      sx={wizardButtonSx}
    >
      {continueLabel}
    </Button>
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "196px minmax(0, 1fr) 196px",
        alignItems: "center",
        gap: 1.5,
        mt: 2.25,
        width: "100%",
        minWidth: 0,
      }}
    >
      <Box sx={{ justifySelf: "start", minWidth: 0 }}>
        <Button
          variant="outlined"
          disabled={backDisabled}
          onClick={onBack}
          sx={wizardButtonSx}
        >
          {backLabel}
        </Button>
      </Box>

      <Box
        sx={{
          minHeight: { xs: "auto", sm: 42 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "nowrap",
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          "& > *": {
            minWidth: 0,
            maxWidth: "100%",
          },
        }}
      >
        {centerContent}
      </Box>

      <Box sx={{ justifySelf: "end", minWidth: 0 }}>
        {continueTooltip ? (
          <Tooltip
            title={continueTooltip}
            arrow
            disableHoverListener={!continueDisabled}
            disableFocusListener={!continueDisabled}
            disableTouchListener={!continueDisabled}
          >
            <span>{continueButton}</span>
          </Tooltip>
        ) : (
          continueButton
        )}
      </Box>
    </Box>
  );
}
