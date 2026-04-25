import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import InventoryIcon from '@mui/icons-material/Inventory';
import HelpIcon from '@mui/icons-material/Help';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import HistoryIcon from '@mui/icons-material/History';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import BalanceIcon from '@mui/icons-material/Balance';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import RuleIcon from '@mui/icons-material/Rule';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import HomeWorkIcon from '@mui/icons-material/HomeWorkOutlined';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TuneIcon from '@mui/icons-material/Tune';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SchoolIcon from '@mui/icons-material/SchoolOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import EditIcon from '@mui/icons-material/Edit';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';

export interface TutorialStep {
  /** Selector CSS del elemento a resaltar */
  target?: string;
  /** Posición preferida del diálogo respecto al elemento */
  placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'center';
  /** Evitar que el diálogo se mueva de su posición preferida */
  disableFlip?: boolean;
  /** Icono para el diálogo */
  icon: React.ReactNode;
  /** Título conciso */
  title: string;
  /** Descripción clara y útil (UX Writing) */
  description: string;
}

export interface TutorialConfigItem {
  steps?: TutorialStep[];
  roles?: Record<string, TutorialStep[]>;
}

export const tutorialConfig: Record<string, TutorialConfigItem> = {
  '/': {
    steps: [
      {
        target: '#dashboard-welcome',
        placement: 'bottom',
        icon: <DashboardIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: '¡Bienvenido a Smart Economat!',
        description:
          'Este es tu panel central. Desde aquí tendrás una visión global de todo lo que ocurre en el economato en tiempo real.',
      },
      {
        target: '#sidebar-nav',
        placement: 'right',
        icon: <MenuIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: 'Menú de Navegación',
        description:
          'Utiliza la barra lateral para moverte entre las diferentes áreas del sistema. El menú se adapta según tu dispositivo.',
      },
      {
        target: '#dashboard-stats',
        placement: 'center',
        icon: <TrendingUpIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Estado del Economato',
        description:
          'Vigila tus KPIs más importantes: stock bajo mínimo, pedidos pendientes e incidencias activas de un vistazo.',
      },
      {
        target: '#dashboard-quick-actions',
        placement: 'center',
        icon: <TouchAppIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: 'Acciones Rápidas',
        description:
          '¿Necesitas crear un pedido o añadir un producto? Accede a las funciones más frecuentes sin navegar por los menús.',
      },
      {
        target: '#btn-notifications',
        placement: 'bottom',
        icon: <NotificationsIcon sx={{ fontSize: 60, color: 'error.main' }} />,
        title: 'Centro de Notificaciones',
        description:
          'Vigila las alertas críticas del sistema: roturas de stock, nuevos usuarios pendientes o discrepancias urgentes.',
      },
      {
        target: '#dashboard-activity',
        placement: 'left',
        icon: <HistoryIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
        title: 'Actividad Reciente',
        description:
          'Mantente al día con el historial de movimientos de stock y operaciones realizadas recientemente.',
      },
      {
        target: '#user-menu-button',
        placement: 'bottom',
        icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Tu Perfil y Preferencias',
        description:
          'Gestiona tus datos personales y notificaciones. Aquí también podrás encontrar esta ayuda cuando la necesites.',
      },
    ],
  },
  '/productos': {
    steps: [
      {
        target: '#search-productos',
        placement: 'bottom',
        icon: <SearchIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Búsqueda Inteligente',
        description:
          'Escribe el nombre, marca o código de barras para localizar productos. ¡Incluso puedes usar el escáner!',
      },
      {
        target: '#filter-productos',
        placement: 'bottom',
        icon: <FilterListIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Filtros Avanzados',
        description:
          'Refina tu búsqueda seleccionando categorías específicas para encontrar exactamente lo que necesitas.',
      },
      {
        target: '#table-header-sort',
        placement: 'bottom',
        icon: <SortByAlphaIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Ordenado de Datos',
        description:
          'Pulsa sobre las cabeceras de las columnas para ordenar la lista de forma ascendente o descendente.',
      },
      {
        target: '#btn-nuevo-producto',
        placement: 'bottom',
        icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Alta de Productos',
        description:
          'Añade nuevos artículos al catálogo. El sistema intentará autocompletar datos si usas el escáner.',
      },
      {
        target: '#btn-exportar-productos-pdf',
        placement: 'bottom',
        icon: (
          <PictureAsPdfOutlinedIcon
            sx={{ fontSize: 60, color: 'error.main' }}
          />
        ),
        title: 'Exportación a PDF',
        description:
          'Genera documentos listos para imprimir con el listado actual y sus precios.',
      },
      {
        target: '#btn-exportar-productos-excel',
        placement: 'bottom',
        icon: (
          <FileDownloadOutlinedIcon
            sx={{ fontSize: 60, color: 'success.main' }}
          />
        ),
        title: 'Reportes Excel',
        description:
          'Descarga toda la información técnica para trabajarla de forma externa.',
      },
      {
        target: '#table-row-actions',
        placement: 'left',
        icon: <TouchAppIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: 'Acciones Rápidas',
        description:
          'Desde aquí puedes editar, eliminar o restaurar productos de forma individual.',
      },
      {
        target: '#help-tutorial-button',
        placement: 'right',
        icon: <HelpOutlineIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Tutorial de Página',
        description:
          '¿Necesitas ayuda? Haz clic aquí en cualquier momento para iniciar un tutorial interactivo que te explicará paso a paso cómo usar la página actual.',
      },
    ],
  },
  '/proveedores': {
    steps: [
      {
        target: '#search-proveedores',
        placement: 'bottom',
        icon: <SearchIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Buscador de Proveedores',
        description:
          'Encuentra cualquier proveedor por su nombre, NIF, persona de contacto o email.',
      },
      {
        target: '#table-header-sort',
        placement: 'bottom',
        icon: <SortByAlphaIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Ordenado Inteligente',
        description:
          'Organiza la lista alfabéticamente por razón social o por cualquier otro campo de contacto.',
      },
      {
        target: '#btn-nuevo-proveedor',
        placement: 'bottom',
        icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Registro de Proveedor',
        description:
          'Añade nuevos proveedores a tu catálogo para poder gestionar sus pedidos y productos.',
      },
      {
        target: '#btn-export-pdf',
        placement: 'bottom',
        icon: (
          <PictureAsPdfOutlinedIcon
            sx={{ fontSize: 60, color: 'error.main' }}
          />
        ),
        title: 'Exportación PDF',
        description:
          'Genera un documento PDF con el listado completo de tus proveedores y sus datos de contacto.',
      },
      {
        target: '#btn-export-excel',
        placement: 'bottom',
        icon: (
          <FileDownloadOutlinedIcon
            sx={{ fontSize: 60, color: 'success.main' }}
          />
        ),
        title: 'Reporte Excel',
        description:
          'Descarga la base de datos de proveedores para análisis externos o gestión administrativa.',
      },
      {
        target: '#table-row-actions',
        placement: 'left',
        icon: <TouchAppIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: 'Gestión Individual',
        description:
          'Consulta fichas detalladas, edita información o elimina proveedores directamente desde la fila.',
      },
    ],
  },
  '/recetas': {
    steps: [
      {
        target: '#recipe-carousel-container',
        placement: 'bottom',
        icon: (
          <MenuBookOutlinedIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        ),
        title: 'Inspiración Culinaria',
        description:
          'Explora nuestras sugerencias destacadas y platos de temporada en este carrusel visual.',
      },
      {
        target: '#search-recetas',
        placement: 'bottom',
        icon: <SearchIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Buscador de Recetas',
        description:
          'Encuentra cualquier plato por su nombre, ingredientes o incluso por pasos de su elaboración.',
      },
      {
        target: '#table-header-sort',
        placement: 'bottom',
        icon: <SortByAlphaIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Ordenado Ágil',
        description:
          'Organiza tu recetario por dificultad, tiempo de preparación o nombre según necesites.',
      },
      {
        target: '#btn-nueva-receta',
        placement: 'bottom',
        icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Creación de Recetas',
        description:
          'Registra nuevas elaboraciones detallando ingredientes, pasos y costes estimados.',
      },
      {
        target: '#table-row-actions',
        placement: 'left',
        icon: <RestaurantIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: '¡A Cocinar!',
        description:
          'Usa el botón de preparación para lanzar producciones al instante. También puedes ver fichas técnicas completas.',
      },
    ],
  },
  '/pedidos': {
    steps: [
      {
        target: '#pedidos-tabs',
        placement: 'bottom',
        icon: (
          <AssignmentTurnedInOutlinedIcon
            sx={{ fontSize: 60, color: 'primary.main' }}
          />
        ),
        title: 'Centro de Pedidos',
        description:
          'Alterna entre tus pedidos personales, el listado global del centro o la gestión de compras a proveedores.',
      },
      {
        target: '#btn-nuevo-pedido',
        placement: 'bottom',
        icon: (
          <AddShoppingCartIcon sx={{ fontSize: 60, color: 'success.main' }} />
        ),
        title: 'Nuevo Pedido',
        description:
          'Inicia una solicitud de artículos. El sistema te permite buscar y añadir productos de forma ágil.',
      },
      {
        target: '#btn-continuar-pedido',
        placement: 'bottom',
        icon: <HistoryIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
        title: 'Recuperar Borradores',
        description:
          'Si dejas un pedido a medias, podrás continuarlo aquí sin perder los productos que ya habías añadido.',
      },
      {
        target: '#pedidos-content-area',
        placement: 'top',
        icon: <ShoppingCartIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: 'Seguimiento del Flujo',
        description:
          'Aquí verás el estado de cada pedido (Pendiente, En Proceso, Recibido) y podrás gestionar sus detalles.',
      },
      {
        target: '#btn-reporte-pedidos-pdf',
        placement: 'bottom',
        icon: (
          <PictureAsPdfOutlinedIcon
            sx={{ fontSize: 60, color: 'error.main' }}
          />
        ),
        title: 'Control por PDF',
        description:
          'Genera listados consolidados para revisar las necesidades de compra del periodo.',
      },
      {
        target: '#btn-exportar-pedidos-excel',
        placement: 'bottom',
        icon: (
          <FileDownloadOutlinedIcon
            sx={{ fontSize: 60, color: 'success.main' }}
          />
        ),
        title: 'Exportación Excel',
        description:
          'Descarga toda la información detallada para trabajarla en hojas de cálculo externas.',
      },
    ],
  },
  '/recepciones': {
    steps: [
      {
        target: '#recepcion-stepper',
        placement: 'bottom',
        icon: <RuleIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Asistente de Recepción',
        description:
          'Sigue estos 4 pasos guiados para registrar la entrada de mercancía de forma precisa y organizada.',
      },
      {
        target: '#recepcion-sync-status',
        placement: 'bottom',
        icon: <CloudSyncIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Borrador Seguro',
        description:
          'Tu progreso se sincroniza automáticamente en la nube. Puedes empezar en un PC y terminar en una Tablet sin perder datos.',
      },
      {
        target: '#search-recepcion-productos',
        placement: 'bottom',
        icon: (
          <QrCodeScannerIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        ),
        title: 'Recepción Inteligente',
        description:
          'Escanea el código de barras o busca por nombre para identificar los productos que estás recibiendo.',
      },
      {
        target: '#scale-options-container',
        placement: 'bottom',
        icon: <BalanceIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Conectividad con Báscula',
        description:
          'Si tienes una báscula compatible, conéctala vía USB para capturar pesos automáticamente en tiempo real.',
      },
      {
        target: '#btn-next-step',
        placement: 'top',
        icon: <TouchAppIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Pasos del Proceso',
        description:
          'Usa los botones de navegación para avanzar entre la selección de pedidos, el conteo y la revisión final.',
      },
    ],
  },
  '/distribucion': {
    steps: [
      {
        target: '#distribucion-tabs',
        placement: 'bottom',
        icon: (
          <LocalShippingIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        ),
        title: 'Gestión de Entregas',
        description:
          'Alterna entre los pedidos listos para ser entregados y el historial de distribuciones realizadas.',
      },
      {
        target: '#search-distribucion',
        placement: 'bottom',
        icon: <SearchIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: 'Búsqueda Rápida',
        description:
          'Localiza entregas específicas buscando por número de pedido, nombre de usuario o aula de destino.',
      },
      {
        target: '#distribucion-content-area',
        placement: 'top',
        icon: <InventoryIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
        title: 'Listado de Pendientes',
        description:
          'Aquí verás todos los productos que ya han sido recepcionados en el almacén y están esperando a ser llevados a su destino final.',
      },
      {
        target: '#btn-distribuir-stock',
        placement: 'left',
        icon: <CallSplitIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Iniciar Entrega',
        description:
          'Haz clic aquí para abrir el asistente de entrega, donde podrás elegir la ubicación destino y las cantidades a traspasar.',
      },
      {
        target: '#btn-confirmar-entrega',
        placement: 'left',
        icon: <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Confirmación de Recepción',
        description:
          'Una vez entregada la mercancía, el destinatario debe confirmar la recepción desde el historial para formalizar el movimiento de stock.',
      },
    ],
  },
  '/preparaciones': {
    steps: [
      {
        target: '#preparaciones-summary',
        placement: 'bottom',
        icon: <RestaurantIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Bolsa de Preparaciones',
        description:
          'Aquí gestionas todo lo que sale de cocina. Controla el stock de platos elaborados listos para servir o distribuir.',
      },
      {
        target: '#preparaciones-tabs',
        placement: 'bottom',
        icon: <HistoryIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: 'Estado de Producción',
        description:
          'Cambia entre las preparaciones disponibles en este momento y el historial de aquellas que ya se han agotado.',
      },
      {
        target: '#btn-consumir-preparacion',
        placement: 'left',
        icon: <LocalDiningIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Registro de Consumo',
        description:
          'Usa este botón cuando envíes raciones al comedor o realices una entrega. El sistema descontará automáticamente el stock del lote.',
      },
      {
        target: '#btn-merma-preparacion',
        placement: 'left',
        icon: (
          <ReportProblemIcon sx={{ fontSize: 60, color: 'warning.main' }} />
        ),
        title: 'Gestión de Mermas',
        description:
          'Si se estropea una ración o hay un error en el servicio, regístralo aquí para mantener el inventario cuadrado.',
      },
      {
        target: '#btn-ver-detalle-preparacion',
        placement: 'left',
        icon: <VisibilityIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: 'Control Detallado',
        description:
          'Consulta la ficha técnica de la preparación, incluyendo costes reales y fechas de caducidad.',
      },
    ],
  },
  '/albaranes': {
    steps: [
      {
        target: '#albaranes-toolbar',
        placement: 'bottom',
        icon: (
          <AssignmentOutlinedIcon
            sx={{ fontSize: 60, color: 'primary.main' }}
          />
        ),
        title: 'Gestión de Albaranes',
        description:
          'En esta sección puedes digitalizar y administrar los albaranes de entrega de tus proveedores.',
      },
      {
        target: '#btn-nuevo-albaran',
        placement: 'bottom',
        icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Registro Manual',
        description:
          '¿No tienes el albarán digitalizado? Créalo manualmente aquí para vincularlo después a tus recepciones.',
      },
      {
        target: '#btn-albaran-upload',
        placement: 'left',
        icon: <AttachFileIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: 'Almacenamiento Digital',
        description:
          'Sube una foto o PDF del albarán físico para tener siempre el respaldo documental a un clic.',
      },
      {
        target: '#albaranes-table',
        placement: 'top',
        icon: (
          <CheckCircleOutlineIcon
            sx={{ fontSize: 60, color: 'success.main' }}
          />
        ),
        title: 'Control de Concordancia',
        description:
          'Verifica de un vistazo si la mercancía recibida coincide con lo indicado en el papel del proveedor.',
      },
      {
        target: '#btn-albaran-view',
        placement: 'left',
        icon: <VisibilityIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Historial y Consulta',
        description:
          'Accede al detalle completo para ver qué productos específicos venían en este envío.',
      },
    ],
  },
  '/inventario': {
    steps: [
      {
        target: '#inventario-toolbar',
        placement: 'bottom',
        icon: <InventoryIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Gestión de Inventario',
        description:
          'Aquí puedes ver y administrar todo el stock disponible en el economato de forma centralizada.',
      },
      {
        target: '#btn-add-inventario',
        placement: 'bottom',
        icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Entrada de Stock',
        description:
          'Utiliza este botón para añadir productos al inventario manualmente si no vienen de un pedido previo.',
      },
      {
        target: '#btn-manage-locations',
        placement: 'bottom',
        icon: <SettingsIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: 'Configuración de Almacén',
        description:
          'Define y gestiona las estanterías, cámaras y zonas de almacenamiento de tu centro.',
      },
      {
        target: '#search-inventario',
        placement: 'bottom',
        icon: (
          <QrCodeScannerIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        ),
        title: 'Búsqueda e IA',
        description:
          'Busca productos por nombre o usa el escáner de códigos de barras para una gestión mucho más ágil.',
      },
      {
        target: '#inventario-filters',
        placement: 'bottom',
        icon: <FilterListIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: 'Filtros Inteligentes',
        description:
          'Refina la lista por categorías de producto o por ubicaciones específicas para encontrar lo que necesitas.',
      },
      {
        target: '#inventario-tabs',
        placement: 'bottom',
        icon: <HomeWorkIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
        title: 'Ubicaciones y Slots',
        description:
          'Cambia entre la vista global y tus zonas asignadas para ver solo lo que te pertenece.',
      },
      {
        target: '#inventario-table',
        placement: 'top',
        icon: <SyncAltIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: 'Acciones de Control',
        description:
          'Desde la tabla podrás ajustar el stock por mermas o auditar los lotes y fechas de caducidad de cada producto.',
      },
    ],
  },
  '/movimientos': {
    steps: [
      {
        target: '#movimientos-toolbar',
        placement: 'bottom',
        disableFlip: true,
        icon: <HistoryIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Historial de Movimientos',
        description:
          'Aquí queda registrado cada cambio en el stock: entradas, salidas, mermas y ajustes manuales.',
      },
      {
        target: '#movimientos-filters',
        placement: 'bottom',
        icon: <FilterListIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: 'Filtrado por Tipo',
        description:
          'Busca movimientos específicos filtrando por fecha o por el tipo de operación (ej. solo mermas o solo entradas).',
      },
      {
        target: '#movimientos-table',
        placement: 'center',
        icon: <SearchIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Trazabilidad',
        description:
          'Revisa de un vistazo qué usuario realizó la acción, qué producto se vio afectado y la cantidad exacta.',
      },
      {
        target: '#btn-ver-detalle-movimiento',
        placement: 'left',
        icon: <VisibilityIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Detalles de Auditoría',
        description:
          'Accede al detalle completo para ver el lote afectado y, si el movimiento viene de un pedido o distribución, ir directo a su origen.',
      },
    ],
  },
  '/mermas': {
    steps: [
      {
        target: '#mermas-toolbar',
        placement: 'bottom',
        icon: (
          <BrokenImageOutlinedIcon
            sx={{ fontSize: 60, color: 'primary.main' }}
          />
        ),
        title: 'Gestión de Mermas',
        description:
          'Desde aquí controlarás todas las pérdidas de stock no planificadas en el inventario.',
      },
      {
        target: '#btn-reportar-merma',
        placement: 'bottom',
        icon: <AddIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Reportar Merma',
        description:
          'Registra mermas por rotura, caducidad o robo. Recuerda que esta acción descuenta stock de forma permanente.',
      },
      {
        target: '#merma-stats',
        placement: 'bottom',
        icon: <AssessmentIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: 'Estadísticas de Impacto',
        description:
          'Consulta de un vistazo el volumen total de pérdidas y los motivos más frecuentes para tomar medidas.',
      },
      {
        target: '#mermas-table-container',
        placement: 'center',
        icon: <HistoryIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: 'Historial de Mermas',
        description:
          'Toda merma queda auditada. Revisa el historial para ver quién reportó la pérdida y el motivo detallado.',
      },
    ],
  },
  '/incidencias': {
    steps: [
      {
        target: '#incidencias-toolbar',
        placement: 'bottom',
        icon: (
          <ReportProblemIcon sx={{ fontSize: 60, color: 'primary.main' }} />
        ),
        title: 'Centro de Incidencias',
        description:
          'Aquí se centralizan todas las discrepancias detectadas durante la recepción de mercancía.',
      },
      {
        target: '#btn-reporte-incidencias-pdf',
        placement: 'bottom',
        icon: <PictureAsPdfIcon sx={{ fontSize: 60, color: 'error.main' }} />,
        title: 'Reportes y Exportación',
        description:
          'Genera listados oficiales en PDF o Excel para reclamaciones a proveedores o auditorías internas.',
      },
      {
        target: '#incidencias-tabs',
        placement: 'bottom',
        icon: <PendingActionsIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: 'Filtrado por Estado',
        description:
          'Organiza tu trabajo separando lo que está pendiente de revisión de aquello que ya ha sido resuelto.',
      },
      {
        target: '#incidencias-table',
        placement: 'center',
        icon: <SearchIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: 'Trazabilidad de Problemas',
        description:
          'Consulta el detalle de qué faltó o qué llegó de más en cada pedido para tomar la decisión correcta.',
      },
      {
        target: '#btn-ajustar-incidencia',
        placement: 'left',
        icon: <TuneIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
        title: 'Ajuste de Discrepancias',
        description:
          'Corrige las cantidades reales recibidas si hubo un error en la toma de datos inicial.',
      },
      {
        target: '#btn-resolver-incidencia',
        placement: 'left',
        icon: <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Resolución Final',
        description:
          'Al resolver, el sistema ajustará automáticamente el inventario y cerrará el ciclo de la discrepancia.',
      },
    ],
  },
  '/administracion': {
    steps: [
      {
        target: '#admin-header',
        placement: 'bottom',
        icon: <SettingsIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Administración Académica',
        description:
          'Desde este centro de control gestionarás la estructura organizativa del economato y los accesos al sistema.',
      },
      {
        target: '#admin-tabs',
        placement: 'bottom',
        icon: <SchoolIcon sx={{ fontSize: 60, color: 'info.main' }} />,
        title: 'Módulos de Gestión',
        description:
          'Navega entre la gestión de aulas, el listado de alumnos vinculados, la administración de usuarios y las plantillas de roles.',
      },
      {
        target: '#admin-tab-usuarios',
        placement: 'bottom',
        icon: <PeopleIcon sx={{ fontSize: 60, color: 'success.main' }} />,
        title: 'Control de Usuarios',
        description:
          'Administra cuentas, restablece contraseñas y asigna roles específicos a cada miembro del equipo.',
      },
      {
        target: '#btn-gestionar-slots',
        placement: 'top',
        icon: <EditIcon sx={{ fontSize: 60, color: 'secondary.main' }} />,
        title: 'Modo Gestión',
        description:
          'Activa este modo para editar nombres de aulas, capacidades o asignar profesores a clases específicas.',
      },
    ],
  },
  '/perfil': {
    roles: {
      PROFESOR: [
        {
          icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          title: 'Perfil de usuario',
          description:
            'Desde esta tarjeta puedes revisar y editar tus datos personales básicos.',
        },
        {
          icon: <LockIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
          title: 'Seguridad y contraseña',
          description:
            'Puedes cambiar tu nombre de usuario y contraseña. El cambio de email requiere autorización de un rol superior.',
        },
        // ... otros pasos del rol
      ],
      ALUMNO: [
        {
          icon: <PersonIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
          title: 'Perfil de usuario',
          description: 'Aquí puedes consultar tu información personal.',
        },
      ],
    },
  },
  default: {
    steps: [
      {
        target: '#sidebar-nav',
        placement: 'right',
        icon: <HelpIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
        title: 'Navegación',
        description:
          'Usa el menú lateral para moverte entre las diferentes secciones asignadas a tu rol.',
      },
      {
        target: '#user-menu-button', // ID a añadir en MainLayout
        placement: 'bottom',
        icon: <SettingsIcon sx={{ fontSize: 60, color: 'action.active' }} />,
        title: 'Tu Cuenta',
        description:
          'Gestiona tu perfil, preferencias de tema y cierra sesión desde el menú superior.',
      },
    ],
  },
};
