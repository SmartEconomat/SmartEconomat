const fs = require('fs');

const esPath = '/Users/alexisruiz/SmartEconomat/frontend/smart-economat-frontend/src/i18n/es.json';
const enPath = '/Users/alexisruiz/SmartEconomat/frontend/smart-economat-frontend/src/i18n/en.json';

const es = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Notifications
const notificationsEs = {
  loadError: "No se pudieron cargar las notificaciones.",
  title: "Notificaciones",
  subtitle: "Centro de alertas y pendientes",
  refresh: "Actualizar notificaciones",
  loading: "Cargando...",
  errorTitle: "Error",
  allClear: "Todo al día",
  allClearDesc: "No tienes notificaciones pendientes.",
  priority: {
    urgent: "Urgente",
    pending: "Pendiente"
  },
  totalPending: "{{count}} pendientes",
  openCenter: "Abrir centro de notificaciones"
};

const notificationsEn = {
  loadError: "Could not load notifications.",
  title: "Notifications",
  subtitle: "Alerts and pending tasks center",
  refresh: "Refresh notifications",
  loading: "Loading...",
  errorTitle: "Error",
  allClear: "All Clear",
  allClearDesc: "You have no pending notifications.",
  priority: {
    urgent: "Urgent",
    pending: "Pending"
  },
  totalPending: "{{count}} pending",
  openCenter: "Open notifications center"
};

// Modal
const modalEs = {
  summary: {
    incidencias: {
      faltante: "Faltante",
      exceso: "Exceso",
      defectuoso: "Defectuoso",
      pendiente: "Pendiente",
      reclamado: "Reclamado",
      abonado: "Abonado",
      reenviado: "Reenviado",
      resuelta: "Resuelta",
      lineas: "línea(s)",
      ocultarResumen: "Ocultar resumen",
      verResumen: "Ver resumen",
      observacionesRecepcion: "Observaciones de recepción",
      sinObservaciones: "Sin observaciones registradas.",
      detalleIncidencia: "Detalle de la incidencia",
      esperado: "Esperado",
      recibido: "Recibido",
      diferencia: "Diferencia",
      reclamacion: "Reclamación",
      nota: "Nota"
    },
    errorLoading: "No se pudo cargar la información detallada.",
    verTodos: "Ver todos los {{title}}",
    btn: {
      productos: "Ver todos los productos",
      pedidos: "Ver todos los pedidos",
      incidencias: "Ver todas las incidencias",
      stock: "Ver todo el inventario",
      proveedores: "Ver todos los proveedores"
    },
    und: "und",
    nd: "N/D",
    sinCategoria: "Sin categoría",
    pedido: "Pedido",
    proveedor: "Proveedor",
    sinProveedor: "Sin proveedor",
    sinContacto: "Sin contacto",
    productosCount: "producto(s)",
    empty: "No hay elementos para mostrar."
  },
  dynamicForm: {
    errors: {
      required: "{{label}} es obligatorio",
      maxLength: "{{label}} no puede superar los {{maxLength}} caracteres",
      minLength: "{{label}} debe tener al menos {{minLength}} caracteres",
      invalidFormat: "{{label}} no tiene un formato válido",
      invalidEmail: "Formato de correo electrónico no válido"
    },
    tooltips: {
      scanCamera: "Escanear con cámara",
      generateCode: "Generar código EAN-13",
      searchOFF: "Buscar en OpenFoodFacts"
    }
  }
};

const modalEn = {
  summary: {
    incidencias: {
      faltante: "Missing",
      exceso: "Excess",
      defectuoso: "Defective",
      pendiente: "Pending",
      reclamado: "Claimed",
      abonado: "Refunded",
      reenviado: "Resent",
      resuelta: "Resolved",
      lineas: "line(s)",
      ocultarResumen: "Hide summary",
      verResumen: "View summary",
      observacionesRecepcion: "Reception notes",
      sinObservaciones: "No notes registered.",
      detalleIncidencia: "Issue details",
      esperado: "Expected",
      recibido: "Received",
      diferencia: "Difference",
      reclamacion: "Claim",
      nota: "Note"
    },
    errorLoading: "Could not load detailed information.",
    verTodos: "View all {{title}}",
    btn: {
      productos: "View all products",
      pedidos: "View all orders",
      incidencias: "View all issues",
      stock: "View all inventory",
      proveedores: "View all suppliers"
    },
    und: "pcs",
    nd: "N/A",
    sinCategoria: "No category",
    pedido: "Order",
    proveedor: "Supplier",
    sinProveedor: "No supplier",
    sinContacto: "No contact",
    productosCount: "product(s)",
    empty: "No items to display."
  },
  dynamicForm: {
    errors: {
      required: "{{label}} is required",
      maxLength: "{{label}} cannot exceed {{maxLength}} characters",
      minLength: "{{label}} must have at least {{minLength}} characters",
      invalidFormat: "{{label}} has an invalid format",
      invalidEmail: "Invalid email format"
    },
    tooltips: {
      scanCamera: "Scan with camera",
      generateCode: "Generate EAN-13 code",
      searchOFF: "Search on OpenFoodFacts"
    }
  }
};

const pedidosSchemaEs = {
  detalleProductos: "Detalle de Productos",
  observaciones: "Observaciones Generales",
  motivoCancelacion: "Motivo de la Cancelación",
  motivoIncidencia: "Motivo de la Incidencia"
};

const pedidosSchemaEn = {
  detalleProductos: "Product Details",
  observaciones: "General Notes",
  motivoCancelacion: "Cancellation Reason",
  motivoIncidencia: "Issue Reason"
};

es.notifications = { ...es.notifications, ...notificationsEs };
en.notifications = { ...en.notifications, ...notificationsEn };

es.modal = { ...es.modal, ...modalEs };
en.modal = { ...en.modal, ...modalEn };

if (!es.pedidos) es.pedidos = {};
if (!es.pedidos.schema) es.pedidos.schema = {};
es.pedidos.schema = { ...es.pedidos.schema, ...pedidosSchemaEs };

if (!en.pedidos) en.pedidos = {};
if (!en.pedidos.schema) en.pedidos.schema = {};
en.pedidos.schema = { ...en.pedidos.schema, ...pedidosSchemaEn };

fs.writeFileSync(esPath, JSON.stringify(es, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Translations injected successfully!');
