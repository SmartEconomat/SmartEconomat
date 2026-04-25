# 15. Guía Visual y Capturas

Dado que SmartEconomat Installer es una aplicación de escritorio nativa, para generar las capturas oficiales se recomienda seguir el siguiente recorrido manual en un entorno de Windows con Docker instalado.

## Directorio de Salida Sugerido
`/documentation/screenshots/`

## Capturas Recomendadas

| Nombre de Archivo | Sección | Descripción |
|-------------------|---------|-------------|
| `01-welcome.png` | Bienvenida | Pantalla inicial con el logo y selección de modo (Nueva/Reinstalación). |
| `02-preflight-ok.png`| Preflight | Estado de salud del sistema con todos los checks en verde. |
| `03-preflight-repair.png`| Preflight | Interfaz mostrando un puerto ocupado y el botón de auto-reparación. |
| `04-config-general.png`| Configuración | Formulario de rutas de instalación, passwords de BD y credenciales admin. |
| `05-config-smtp.png` | SMTP | Formulario de configuración de correo electrónico con botón de test. |
| `06-deploying.png` | Despliegue | Vista de logs en tiempo real mientras se descargan/crean contenedores. |
| `07-finish.png` | Finalización | Pantalla de éxito con el enlace al panel de control. |
| `08-control-panel.png`| Panel de Control | Dashboard con los indicadores de salud de DB, Backend y Frontend. |
| `09-backup-panel.png` | Backups | Sección de gestión de copias de seguridad y restauración. |
| `10-debug-console.png`| Debug | La ventana secundaria de consola técnica para desarrolladores. |

## Guía para la Toma de Capturas
1. Iniciar la aplicación en modo desarrollo: `npm run dev`.
2. Utilizar una herramienta de captura (como Recortes de Windows) manteniendo un tamaño de ventana consistente (ej. 1200x800).
3. Asegurarse de que no haya datos sensibles reales en los campos de formulario (usar datos de ejemplo).
4. Guardar los archivos en formato PNG para mantener la nitidez de la tipografía Manrope.
