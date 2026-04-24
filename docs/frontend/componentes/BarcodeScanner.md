# Componente: BarcodeScanner

Componente modal avanzado para la lectura de códigos de barras (EAN-13, UPC-A) mediante la cámara del dispositivo, optimizado para rendimiento y experiencia de usuario premium.

## Propósito

Ofrecer una interfaz unificada de escaneo que funcione en cualquier dispositivo con cámara, proporcionando feedback visual instantáneo y eliminando la sensación de latencia durante el inicio del hardware.

## Características Técnicas

- **Animaciones GPU ✅**: La línea de escaneo utiliza `transform: translateY` en lugar de propiedades de layout (`top`), garantizando 60fps de fluidez constante.
- **Feedback Instantáneo ✅**: El visor y el marco de escaneo se muestran desde el estado de solicitud (`requesting`), evitando la pantalla en negro mientras el usuario aprueba los permisos o la cámara se inicia.
- **Adaptabilidad Vertical ✅**: Responsividad basada en Flexbox que ajusta el tamaño del visor dinámicamente según el alto de la pantalla, evitando el scroll vertical en el modal.
- **ZXing Integration**: Utiliza `@zxing/browser` para una decodificación robusta y multiformato.

## Props (`BarcodeScannerProps`)

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `open` | `boolean` | Controla la visibilidad del modal. |
| `onClose` | `() => void` | Callback para cerrar el escáner. |
| `onScan` | `(code: string) => void` | Función que recibe el código detectado. |
| `title` | `string` | (Opcional) Título del modal. |
| `continuous` | `boolean` | (Opcional) Si es `true`, permite escaneos múltiples sin cerrar. |

## Ejemplo de Uso

```tsx
import BarcodeScanner from '@/components/ui/BarcodeScanner';

const [isScannerOpen, setIsScannerOpen] = useState(false);

<BarcodeScanner
    open={isScannerOpen}
    onClose={() => setIsScannerOpen(false)}
    onScan={(code) => {
        handleSearchByBarcode(code);
        return true; // cierra el modal al encontrar
    }}
/>
```

## Accesibilidad (WAVE Ready) ✅

- **Etiquetado de Controles**: Todos los botones de acción (linterna, reset, cerrar) cuentan con `aria-label` descriptivos.
- **Feedback de Estado**: Mensajes claros mediante `Alert` para errores de permisos o dispositivos no compatibles.
- **Contraste**: Colores de interfaz optimizados para ser visibles sobre cualquier stream de video.
