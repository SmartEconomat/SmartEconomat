/**
 * Genera src/i18n/locales/tutorial.{es,en}.json desde una única fuente.
 * Ejecutar: node scripts/gen-tutorial-i18n.mjs
 */
/* eslint-env node */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../src/i18n/locales');
mkdirSync(outDir, { recursive: true });

/** @type {{ es: Record<string, unknown>; en: Record<string, unknown> }} */
const T = {
  es: {},
  en: {},
};

function step(esTitle, esDesc, enTitle, enDesc, pathEs, pathEn) {
  const pe = pathEs.split('.');
  const pn = pathEn.split('.');
  let o = T.es;
  for (let i = 0; i < pe.length - 1; i++) {
    o[pe[i]] = o[pe[i]] || {};
    o = o[pe[i]];
  }
  o[pe[pe.length - 1]] = { title: esTitle, description: esDesc };
  let o2 = T.en;
  for (let i = 0; i < pn.length - 1; i++) {
    o2[pn[i]] = o2[pn[i]] || {};
    o2 = o2[pn[i]];
  }
  o2[pn[pn.length - 1]] = { title: enTitle, description: enDesc };
}

const commonHelp = [
  'Tutorial de Página',
  '¿Necesitas ayuda? Haz clic aquí en cualquier momento para iniciar un tutorial interactivo que te explicará paso a paso cómo usar la página actual.',
  'Page tutorial',
  'Need help? Click here anytime to start an interactive walkthrough of the current page.',
  'common.help',
  'common.help',
];
step(...commonHelp);

const blocks = {
  root: [
    [
      '¡Bienvenido a Smart Economat!',
      'Este es tu panel central. Desde aquí tendrás una visión global de todo lo que ocurre en el economato en tiempo real.',
      'Welcome to Smart Economat!',
      'This is your central dashboard. From here you get a real-time overview of everything happening in the pantry.',
    ],
    [
      'Menú de Navegación',
      'Utiliza la barra lateral para moverte entre las diferentes áreas del sistema. El menú se adapta según tu dispositivo.',
      'Navigation menu',
      'Use the sidebar to move between areas. The menu adapts to your device.',
    ],
    [
      'Estado del Economato',
      'Vigila tus KPIs más importantes: stock bajo mínimo, pedidos pendientes e incidencias activas de un vistazo.',
      'Pantry status',
      'Watch key KPIs at a glance: low stock, pending orders, and active incidents.',
    ],
    [
      'Acciones Rápidas',
      '¿Necesitas crear un pedido o añadir un producto? Accede a las funciones más frecuentes sin navegar por los menús.',
      'Quick actions',
      'Need to create an order or add a product? Reach frequent actions without digging through menus.',
    ],
    [
      'Centro de Notificaciones',
      'Vigila las alertas críticas del sistema: roturas de stock, nuevos usuarios pendientes o discrepancias urgentes.',
      'Notification center',
      'Monitor critical alerts: stock-outs, pending users, or urgent discrepancies.',
    ],
    [
      'Actividad Reciente',
      'Mantente al día con el historial de movimientos de stock y operaciones realizadas recientemente.',
      'Recent activity',
      'Stay up to date with recent stock movements and operations.',
    ],
    [
      'Tu Perfil y Preferencias',
      'Gestiona tus datos personales y notificaciones. Aquí también podrás encontrar esta ayuda cuando la necesites.',
      'Your profile and preferences',
      'Manage your personal data and notifications. You can also reopen this help when you need it.',
    ],
  ],
  productos: [
    [
      'Búsqueda Inteligente',
      'Escribe el nombre, marca o código de barras para localizar productos. ¡Incluso puedes usar el escáner!',
      'Smart search',
      'Search by name, brand, or barcode—even with the scanner.',
    ],
    [
      'Filtros Avanzados',
      'Refina tu búsqueda seleccionando categorías específicas para encontrar exactamente lo que necesitas.',
      'Advanced filters',
      'Refine results with specific categories.',
    ],
    [
      'Ordenado de Datos',
      'Pulsa sobre las cabeceras de las columnas para ordenar la lista de forma ascendente o descendente.',
      'Sorting',
      'Click column headers to sort ascending or descending.',
    ],
    [
      'Alta de Productos',
      'Añade nuevos artículos al catálogo. El sistema intentará autocompletar datos si usas el escáner.',
      'Add products',
      'Add catalog items; the scanner can autocomplete data.',
    ],
    [
      'Exportación a PDF',
      'Genera documentos listos para imprimir con el listado actual y sus precios.',
      'Export to PDF',
      'Print-ready documents with the current list and prices.',
    ],
    [
      'Reportes Excel',
      'Descarga toda la información técnica para trabajarla de forma externa.',
      'Excel reports',
      'Download technical data for external analysis.',
    ],
    [
      'Acciones Rápidas',
      'Desde aquí puedes editar, eliminar o restaurar productos de forma individual.',
      'Row actions',
      'Edit, delete, or restore products individually.',
    ],
  ],
  proveedores: [
    [
      'Buscador de Proveedores',
      'Encuentra cualquier proveedor por su nombre, NIF, persona de contacto o email.',
      'Supplier search',
      'Find suppliers by name, tax ID, contact, or email.',
    ],
    [
      'Ordenado Inteligente',
      'Organiza la lista alfabéticamente por razón social o por cualquier otro campo de contacto.',
      'Smart sorting',
      'Sort by company name or other contact fields.',
    ],
    [
      'Registro de Proveedor',
      'Añade nuevos proveedores a tu catálogo para poder gestionar sus pedidos y productos.',
      'Register supplier',
      'Add suppliers to manage their orders and products.',
    ],
    [
      'Exportación PDF',
      'Genera un documento PDF con el listado completo de tus proveedores y sus datos de contacto.',
      'PDF export',
      'PDF with the full supplier list and contact data.',
    ],
    [
      'Reporte Excel',
      'Descarga la base de datos de proveedores para análisis externos o gestión administrativa.',
      'Excel report',
      'Download supplier data for analysis or admin work.',
    ],
    [
      'Gestión Individual',
      'Consulta fichas detalladas, edita información o elimina proveedores directamente desde la fila.',
      'Individual management',
      'Open details, edit, or delete from each row.',
    ],
  ],
  recetas: [
    [
      'Inspiración Culinaria',
      'Explora nuestras sugerencias destacadas y platos de temporada en este carrusel visual.',
      'Culinary inspiration',
      'Browse featured suggestions and seasonal dishes in the carousel.',
    ],
    [
      'Buscador de Recetas',
      'Encuentra cualquier plato por su nombre, ingredientes o incluso por pasos de su elaboración.',
      'Recipe search',
      'Find dishes by name, ingredients, or preparation steps.',
    ],
    [
      'Ordenado Ágil',
      'Organiza tu recetario por dificultad, tiempo de preparación o nombre según necesites.',
      'Quick sorting',
      'Sort by difficulty, prep time, or name.',
    ],
    [
      'Creación de Recetas',
      'Registra nuevas elaboraciones detallando ingredientes, pasos y costes estimados.',
      'Create recipes',
      'Record preparations with ingredients, steps, and estimated costs.',
    ],
    [
      '¡A Cocinar!',
      'Usa el botón de preparación para lanzar producciones al instante. También puedes ver fichas técnicas completas.',
      "Let's cook!",
      'Use prepare to start production runs instantly, or open full technical sheets.',
    ],
  ],
  pedidos: [
    [
      'Centro de Pedidos',
      'Alterna entre tus pedidos personales, el listado global del centro o la gestión de compras a proveedores.',
      'Order hub',
      'Switch between personal orders, global lists, and supplier purchasing.',
    ],
    [
      'Nuevo Pedido',
      'Inicia una solicitud de artículos. El sistema te permite buscar y añadir productos de forma ágil.',
      'New order',
      'Start a request and add products quickly.',
    ],
    [
      'Recuperar Borradores',
      'Si dejas un pedido a medias, podrás continuarlo aquí sin perder los productos que ya habías añadido.',
      'Resume drafts',
      'Continue partially saved orders without losing lines.',
    ],
    [
      'Seguimiento del Flujo',
      'Aquí verás el estado de cada pedido (Pendiente, En Proceso, Recibido) y podrás gestionar sus detalles.',
      'Flow tracking',
      'See each order status and manage details.',
    ],
    [
      'Control por PDF',
      'Genera listados consolidados para revisar las necesidades de compra del periodo.',
      'PDF control',
      'Generate consolidated lists for the period.',
    ],
    [
      'Exportación Excel',
      'Descarga toda la información detallada para trabajarla en hojas de cálculo externas.',
      'Excel export',
      'Download detailed data for spreadsheets.',
    ],
  ],
  recepciones: [
    [
      'Asistente de Recepción',
      'Sigue estos 4 pasos guiados para registrar la entrada de mercancía de forma precisa y organizada.',
      'Reception assistant',
      'Follow four guided steps to register incoming goods accurately.',
    ],
    [
      'Borrador Seguro',
      'Tu progreso se sincroniza automáticamente en la nube. Puedes empezar en un PC y terminar en una Tablet sin perder datos.',
      'Safe draft',
      'Progress syncs to the cloud—continue on another device.',
    ],
    [
      'Recepción Inteligente',
      'Escanea el código de barras o busca por nombre para identificar los productos que estás recibiendo.',
      'Smart receiving',
      'Scan barcodes or search by name for items you receive.',
    ],
    [
      'Conectividad con Báscula',
      'Si tienes una báscula compatible, conéctala vía USB para capturar pesos automáticamente en tiempo real.',
      'Scale connectivity',
      'Connect a compatible USB scale to capture weights live.',
    ],
    [
      'Pasos del Proceso',
      'Usa los botones de navegación para avanzar entre la selección de pedidos, el conteo y la revisión final.',
      'Process steps',
      'Navigate between order selection, counting, and final review.',
    ],
  ],
  distribucion: [
    [
      'Gestión de Entregas',
      'Alterna entre los pedidos listos para ser entregados y el historial de distribuciones realizadas.',
      'Delivery management',
      'Switch between ready-to-deliver orders and distribution history.',
    ],
    [
      'Búsqueda Rápida',
      'Localiza entregas específicas buscando por número de pedido, nombre de usuario o aula de destino.',
      'Quick search',
      'Find deliveries by order number, user, or destination classroom.',
    ],
    [
      'Listado de Pendientes',
      'Aquí verás todos los productos que ya han sido recepcionados en el almacén y están esperando a ser llevados a su destino final.',
      'Pending list',
      'Items received in the warehouse waiting for final delivery.',
    ],
    [
      'Iniciar Entrega',
      'Haz clic aquí para abrir el asistente de entrega, donde podrás elegir la ubicación destino y las cantidades a traspasar.',
      'Start delivery',
      'Open the delivery assistant to pick destination and quantities.',
    ],
    [
      'Confirmación de Recepción',
      'Una vez entregada la mercancía, el destinatario debe confirmar la recepción desde el historial para formalizar el movimiento de stock.',
      'Receipt confirmation',
      'Recipients confirm from history to finalize stock movement.',
    ],
  ],
  preparaciones: [
    [
      'Bolsa de Preparaciones',
      'Aquí gestionas todo lo que sale de cocina. Controla el stock de platos elaborados listos para servir o distribuir.',
      'Preparations bag',
      'Manage kitchen output and ready-to-serve prepared stock.',
    ],
    [
      'Estado de Producción',
      'Cambia entre las preparaciones disponibles en este momento y el historial de aquellas que ya se han agotado.',
      'Production status',
      'Toggle between current preparations and depleted history.',
    ],
    [
      'Registro de Consumo',
      'Usa este botón cuando envíes raciones al comedor o realices una entrega. El sistema descontará automáticamente el stock del lote.',
      'Consumption log',
      'When servings go to dining or delivery, stock is deducted from the batch.',
    ],
    [
      'Gestión de Mermas',
      'Si se estropea una ración o hay un error en el servicio, regístralo aquí para mantener el inventario cuadrado.',
      'Waste handling',
      'Register spoiled servings or service errors to keep inventory accurate.',
    ],
    [
      'Control Detallado',
      'Consulta la ficha técnica de la preparación, incluyendo costes reales y fechas de caducidad.',
      'Detailed control',
      'View technical sheet, real costs, and expiry dates.',
    ],
  ],
  albaranes: [
    [
      'Gestión de Albaranes',
      'En esta sección puedes digitalizar y administrar los albaranes de entrega de tus proveedores.',
      'Delivery notes',
      'Digitize and manage supplier delivery notes.',
    ],
    [
      'Registro Manual',
      '¿No tienes el albarán digitalizado? Créalo manualmente aquí para vincularlo después a tus recepciones.',
      'Manual entry',
      'Create a note manually if you do not have a digital copy yet.',
    ],
    [
      'Almacenamiento Digital',
      'Sube una foto o PDF del albarán físico para tener siempre el respaldo documental a un clic.',
      'Digital storage',
      'Upload a photo or PDF of the paper note for one-click backup.',
    ],
    [
      'Control de Concordancia',
      'Verifica de un vistazo si la mercancía recibida coincide con lo indicado en el papel del proveedor.',
      'Match control',
      'Check at a glance if received goods match the supplier paperwork.',
    ],
    [
      'Historial y Consulta',
      'Accede al detalle completo para ver qué productos específicos venían en este envío.',
      'History and lookup',
      'Open full detail of products in each shipment.',
    ],
  ],
  inventario: [
    [
      'Gestión de Inventario',
      'Aquí puedes ver y administrar todo el stock disponible en el economato de forma centralizada.',
      'Inventory management',
      'View and manage all pantry stock centrally.',
    ],
    [
      'Entrada de Stock',
      'Utiliza este botón para añadir productos al inventario manualmente si no vienen de un pedido previo.',
      'Stock intake',
      'Add inventory manually when not coming from a prior order.',
    ],
    [
      'Configuración de Almacén',
      'Define y gestiona las estanterías, cámaras y zonas de almacenamiento de tu centro.',
      'Warehouse setup',
      'Define shelves, cold rooms, and storage zones.',
    ],
    [
      'Búsqueda e IA',
      'Busca productos por nombre o usa el escáner de códigos de barras para una gestión mucho más ágil.',
      'Search and scanner',
      'Search by name or use the barcode scanner for faster work.',
    ],
    [
      'Filtros Inteligentes',
      'Refina la lista por categorías de producto o por ubicaciones específicas para encontrar lo que necesitas.',
      'Smart filters',
      'Filter by product category or specific locations.',
    ],
    [
      'Ubicaciones y Slots',
      'Cambia entre la vista global y tus zonas asignadas para ver solo lo que te pertenece.',
      'Locations and slots',
      'Switch between global view and your assigned zones.',
    ],
    [
      'Acciones de Control',
      'Desde la tabla podrás ajustar el stock por mermas o auditar los lotes y fechas de caducidad de cada producto.',
      'Control actions',
      'Adjust stock for waste or audit lots and expiry from the table.',
    ],
  ],
  movimientos: [
    [
      'Historial de Movimientos',
      'Aquí queda registrado cada cambio en el stock: entradas, salidas, mermas y ajustes manuales.',
      'Movement history',
      'Every stock change is logged: in, out, waste, and adjustments.',
    ],
    [
      'Filtrado por Tipo',
      'Busca movimientos específicos filtrando por fecha o por el tipo de operación (ej. solo mermas o solo entradas).',
      'Filter by type',
      'Filter by date or operation type (e.g. only waste or only entries).',
    ],
    [
      'Trazabilidad',
      'Revisa de un vistazo qué usuario realizó la acción, qué producto se vio afectado y la cantidad exacta.',
      'Traceability',
      'See who acted, which product, and exact quantity.',
    ],
    [
      'Detalles de Auditoría',
      'Accede al detalle completo para ver el lote afectado y, si el movimiento viene de un pedido o distribución, ir directo a su origen.',
      'Audit details',
      'Full detail including lot and drill-back to order or distribution.',
    ],
  ],
  mermas: [
    [
      'Gestión de Mermas',
      'Desde aquí controlarás todas las pérdidas de stock no planificadas en el inventario.',
      'Waste management',
      'Track unplanned inventory losses.',
    ],
    [
      'Reportar Merma',
      'Registra mermas por rotura, caducidad o robo. Recuerda que esta acción descuenta stock de forma permanente.',
      'Report waste',
      'Log breakage, expiry, or theft—this permanently reduces stock.',
    ],
    [
      'Estadísticas de Impacto',
      'Consulta de un vistazo el volumen total de pérdidas y los motivos más frecuentes para tomar medidas.',
      'Impact statistics',
      'See total loss volume and top reasons to act.',
    ],
    [
      'Historial de Mermas',
      'Toda merma queda auditada. Revisa el historial para ver quién reportó la pérdida y el motivo detallado.',
      'Waste history',
      'Every loss is audited with reporter and reason.',
    ],
  ],
  incidencias: [
    [
      'Centro de Incidencias',
      'Aquí se centralizan todas las discrepancias detectadas durante la recepción de mercancía.',
      'Incidents hub',
      'Centralize discrepancies found during goods receipt.',
    ],
    [
      'Reportes y Exportación',
      'Genera listados oficiales en PDF o Excel para reclamaciones a proveedores o auditorías internas.',
      'Reports and export',
      'Official PDF/Excel lists for supplier claims or audits.',
    ],
    [
      'Filtrado por Estado',
      'Organiza tu trabajo separando lo que está pendiente de revisión de aquello que ya ha sido resuelto.',
      'Status filtering',
      'Separate pending review from resolved work.',
    ],
    [
      'Trazabilidad de Problemas',
      'Consulta el detalle de qué faltó o qué llegó de más en cada pedido para tomar la decisión correcta.',
      'Problem traceability',
      'See shortages or overages per order to decide correctly.',
    ],
    [
      'Ajuste de Discrepancias',
      'Corrige las cantidades reales recibidas si hubo un error en la toma de datos inicial.',
      'Discrepancy adjustment',
      'Correct received quantities if initial capture was wrong.',
    ],
    [
      'Resolución Final',
      'Al resolver, el sistema ajustará automáticamente el inventario y cerrará el ciclo de la discrepancia.',
      'Final resolution',
      'Resolving adjusts inventory and closes the discrepancy cycle.',
    ],
  ],
  administracion: [
    [
      'Administración Académica',
      'Desde este centro de control gestionarás la estructura organizativa del economato y los accesos al sistema.',
      'Academic administration',
      'Manage organizational structure and system access.',
    ],
    [
      'Módulos de Gestión',
      'Navega entre la gestión de aulas, el listado de alumnos vinculados, la administración de usuarios y las plantillas de roles.',
      'Management modules',
      'Rooms, linked students, users, and role templates.',
    ],
    [
      'Control de Usuarios',
      'Administra cuentas, restablece contraseñas y asigna roles específicos a cada miembro del equipo.',
      'User control',
      'Manage accounts, reset passwords, and assign roles.',
    ],
    [
      'Modo Gestión',
      'Activa este modo para editar nombres de aulas, capacidades o asignar profesores a clases específicas.',
      'Management mode',
      'Edit room names, capacities, or assign teachers to classes.',
    ],
  ],
  perfilProfesor: [
    [
      'Perfil de usuario',
      'Desde esta tarjeta puedes revisar y editar tus datos personales básicos.',
      'User profile',
      'Review and edit your basic personal data.',
    ],
    [
      'Seguridad y contraseña',
      'Puedes cambiar tu nombre de usuario y contraseña. El cambio de email requiere autorización de un rol superior.',
      'Security and password',
      'Change username and password; email changes need higher-role approval.',
    ],
  ],
  perfilAlumno: [
    [
      'Perfil de usuario',
      'Aquí puedes consultar tu información personal.',
      'User profile',
      'View your personal information.',
    ],
  ],
  default: [
    [
      'Navegación',
      'Usa el menú lateral para moverte entre las diferentes secciones asignadas a tu rol.',
      'Navigation',
      'Use the sidebar to move between sections for your role.',
    ],
    [
      'Tu Cuenta',
      'Gestiona tu perfil, preferencias de tema y cierra sesión desde el menú superior.',
      'Your account',
      'Manage profile, theme preferences, and sign out from the top menu.',
    ],
  ],
};

for (const [route, arr] of Object.entries(blocks)) {
  arr.forEach((row, i) => {
    step(row[0], row[1], row[2], row[3], `${route}.s${i}`, `${route}.s${i}`);
  });
}

const tutorialEs = {
  tutorial: {
    routes: T.es,
    ui: {
      omitirTourAria: 'Omitir tour',
      finalizar: 'Finalizar',
      siguiente: 'Siguiente',
      atras: 'Atrás',
      saltarTodo: 'Saltar todo el tutorial',
      tooltipTitulo: 'Tutorial',
      tooltipDescList: 'Iniciar tutorial interactivo por este módulo',
      tooltipDescIcon: 'Iniciar tutorial interactivo',
      ariaIniciar: 'Iniciar tutorial',
      listPrimary: 'Tutorial',
    },
  },
};
const tutorialEn = {
  tutorial: {
    routes: T.en,
    ui: {
      omitirTourAria: 'Skip tour',
      finalizar: 'Finish',
      siguiente: 'Next',
      atras: 'Back',
      saltarTodo: 'Skip entire tutorial',
      tooltipTitulo: 'Tutorial',
      tooltipDescList: 'Start interactive tutorial for this module',
      tooltipDescIcon: 'Start interactive tutorial',
      ariaIniciar: 'Start tutorial',
      listPrimary: 'Tutorial',
    },
  },
};

writeFileSync(
  join(outDir, 'tutorial.es.json'),
  JSON.stringify(tutorialEs, null, 2),
  'utf8'
);
writeFileSync(
  join(outDir, 'tutorial.en.json'),
  JSON.stringify(tutorialEn, null, 2),
  'utf8'
);
console.log('Written tutorial.es.json and tutorial.en.json');
