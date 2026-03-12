import React from "react";
import { Box, Container, Typography, Link, Divider } from "@mui/material";
import Grid from "@mui/material/Grid";
import imgURL from "../../assets/images/SVG/logo-virgen-de-candelaria-blanco.svg";

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#1c1c1c",
        color: "#fff",
        mt: 0.4,
        pt: 2,
        pb: 3,
        width: "100%",
        marginTop: "auto",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6">Creditos </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Agencia desarrolladora:{" "}
              <Link href="" target="_blank" rel="noopener" color="inherit">
                Lammarr
              </Link>
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              <Link
                href="https://www3.gobiernodecanarias.org/medusa/edublog/cifpvirgendecandelaria/"
                target="_blank"
                rel="noopener"
                color="inherit"
              >
                CIFP Virgen de Candelaria
              </Link>
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6">Información legal</Typography>
            <Link href="/aviso-legal" color="inherit" display="block">
              Aviso Legal
            </Link>
            <Link href="/politica-privacidad" color="inherit" display="block">
              Política de Privacidad
            </Link>
            <Link href="/accesibilidad" color="inherit" display="block">
              Accesibilidad
            </Link>
            <Link href="/mapa-web" color="inherit" display="block">
              Mapa Web
            </Link>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="h6">Contacto</Typography>
            <Typography variant="body2">CIFP Virgen de Candelaria</Typography>
            <Typography variant="body2">
              Ctra. del Rosario, 144, 38010 - Santa Cruz de Tenerife.
            </Typography>
            <Typography variant="body2">
              38017573@gobiernodecanarias.org
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <img
              src={imgURL}
              alt="Logo Virgen de Candelaria"
              style={{ height: "auto", maxHeight: 60, width: "auto" }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.2)" }} />

        <Typography variant="body2" align="center">
          © {new Date().getFullYear()} CIEP Virgen de Candelaria · Desarrollado
          por{" "}
          <Link href="" target="_blank" rel="noopener" color="inherit">
            Lammarr
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
