import { DataSource } from 'typeorm';
import { Permiso } from '../modules/permisos/permiso.entity/permiso.entity';
import { PlantillaRol } from '../modules/plantillas-roles/plantilla-rol.entity/plantilla-rol.entity';
import { rolUsuario } from '../modules/usuario/enums/usuario.enums';

/**
 * Definición completa de 60+ permisos base del sistema
 */
const PERMISOS_BASE = [
  {
    codigo: 'usuarios:listar',
    nombre: 'Listar usuarios',
    modulo: 'usuarios',
    accion: 'listar',
    descripcion: 'Ver listado de usuarios del sistema',
  },
  {
    codigo: 'usuarios:ver',
    nombre: 'Ver usuario',
    modulo: 'usuarios',
    accion: 'ver',
    descripcion: 'Ver detalles de un usuario',
  },
  {
    codigo: 'usuarios:crear',
    nombre: 'Crear usuario',
    modulo: 'usuarios',
    accion: 'crear',
    descripcion: 'Crear nuevos usuarios',
  },
  {
    codigo: 'usuarios:editar',
    nombre: 'Editar usuario',
    modulo: 'usuarios',
    accion: 'editar',
    descripcion: 'Modificar datos de usuarios',
  },
  {
    codigo: 'usuarios:eliminar',
    nombre: 'Eliminar usuario',
    modulo: 'usuarios',
    accion: 'eliminar',
    descripcion: 'Eliminar usuarios del sistema',
  },
  {
    codigo: 'usuarios:cambiar_rol',
    nombre: 'Cambiar rol',
    modulo: 'usuarios',
    accion: 'cambiar_rol',
    descripcion: 'Modificar roles de usuarios',
  },
  {
    codigo: 'usuarios:resetear_password',
    nombre: 'Resetear contraseña',
    modulo: 'usuarios',
    accion: 'resetear_password',
    descripcion: 'Resetear contraseñas de usuarios',
  },
  {
    codigo: 'usuarios:activar_desactivar',
    nombre: 'Activar/Desactivar',
    modulo: 'usuarios',
    accion: 'activar_desactivar',
    descripcion: 'Activar o desactivar usuarios',
  },

  {
    codigo: 'productos:listar',
    nombre: 'Listar productos',
    modulo: 'productos',
    accion: 'listar',
    descripcion: 'Ver listado de productos',
  },
  {
    codigo: 'productos:ver',
    nombre: 'Ver producto',
    modulo: 'productos',
    accion: 'ver',
    descripcion: 'Ver detalles de un producto',
  },
  {
    codigo: 'productos:crear',
    nombre: 'Crear producto',
    modulo: 'productos',
    accion: 'crear',
    descripcion: 'Añadir nuevos productos',
  },
  {
    codigo: 'productos:editar',
    nombre: 'Editar producto',
    modulo: 'productos',
    accion: 'editar',
    descripcion: 'Modificar productos existentes',
  },
  {
    codigo: 'productos:eliminar',
    nombre: 'Eliminar producto',
    modulo: 'productos',
    accion: 'eliminar',
    descripcion: 'Eliminar productos',
  },
  {
    codigo: 'productos:generar_ean13',
    nombre: 'Generar EAN-13',
    modulo: 'productos',
    accion: 'generar_ean13',
    descripcion: 'Generar códigos de barras EAN-13',
  },
  {
    codigo: 'productos:gestionar_alergenos',
    nombre: 'Gestionar alérgenos',
    modulo: 'productos',
    accion: 'gestionar_alergenos',
    descripcion: 'Añadir/modificar alérgenos de productos',
  },
  {
    codigo: 'productos:gestionar_proveedores',
    nombre: 'Gestionar proveedores',
    modulo: 'productos',
    accion: 'gestionar_proveedores',
    descripcion: 'Vincular productos con proveedores',
  },

  {
    codigo: 'pedidos:listar',
    nombre: 'Listar pedidos',
    modulo: 'pedidos',
    accion: 'listar',
    descripcion: 'Ver listado de pedidos',
  },
  {
    codigo: 'pedidos:ver',
    nombre: 'Ver pedido',
    modulo: 'pedidos',
    accion: 'ver',
    descripcion: 'Ver detalles de un pedido',
  },
  {
    codigo: 'pedidos:crear',
    nombre: 'Crear pedido',
    modulo: 'pedidos',
    accion: 'crear',
    descripcion: 'Crear nuevos pedidos',
  },
  {
    codigo: 'pedidos:editar',
    nombre: 'Editar pedido',
    modulo: 'pedidos',
    accion: 'editar',
    descripcion: 'Modificar pedidos existentes',
  },
  {
    codigo: 'pedidos:eliminar',
    nombre: 'Eliminar pedido',
    modulo: 'pedidos',
    accion: 'eliminar',
    descripcion: 'Eliminar pedidos',
  },
  {
    codigo: 'pedidos:cancelar',
    nombre: 'Cancelar pedido',
    modulo: 'pedidos',
    accion: 'cancelar',
    descripcion: 'Cancelar pedidos realizados',
  },
  {
    codigo: 'pedidos:actualizar_fecha_entrega',
    nombre: 'Actualizar fecha entrega',
    modulo: 'pedidos',
    accion: 'actualizar_fecha_entrega',
    descripcion: 'Modificar fechas de entrega',
  },

  {
    codigo: 'inventario:listar',
    nombre: 'Listar inventario',
    modulo: 'inventario',
    accion: 'listar',
    descripcion: 'Ver inventario completo',
  },
  {
    codigo: 'inventario:ver',
    nombre: 'Ver detalle inventario',
    modulo: 'inventario',
    accion: 'ver',
    descripcion: 'Ver detalles de inventario',
  },
  {
    codigo: 'inventario:ajustar_stock',
    nombre: 'Ajustar stock',
    modulo: 'inventario',
    accion: 'ajustar_stock',
    descripcion: 'Realizar ajustes de stock',
  },
  {
    codigo: 'inventario:ver_alertas',
    nombre: 'Ver alertas',
    modulo: 'inventario',
    accion: 'ver_alertas',
    descripcion: 'Ver alertas de stock bajo',
  },
  {
    codigo: 'inventario:gestionar_ubicaciones',
    nombre: 'Gestionar ubicaciones',
    modulo: 'inventario',
    accion: 'gestionar_ubicaciones',
    descripcion: 'Gestionar ubicaciones de almacén',
  },
  {
    codigo: 'inventario:crear',
    nombre: 'Crear item inventario',
    modulo: 'inventario',
    accion: 'crear',
    descripcion: 'Añadir items al inventario',
  },
  {
    codigo: 'inventario:editar',
    nombre: 'Editar item inventario',
    modulo: 'inventario',
    accion: 'editar',
    descripcion: 'Modificar items del inventario',
  },
  {
    codigo: 'inventario:eliminar',
    nombre: 'Eliminar item inventario',
    modulo: 'inventario',
    accion: 'eliminar',
    descripcion: 'Eliminar items del inventario',
  },

  {
    codigo: 'movimientos:listar',
    nombre: 'Listar movimientos',
    modulo: 'movimientos',
    accion: 'listar',
    descripcion: 'Ver historial de movimientos',
  },
  {
    codigo: 'movimientos:ver',
    nombre: 'Ver movimiento',
    modulo: 'movimientos',
    accion: 'ver',
    descripcion: 'Ver detalles de un movimiento',
  },
  {
    codigo: 'movimientos:crear',
    nombre: 'Crear movimiento',
    modulo: 'movimientos',
    accion: 'crear',
    descripcion: 'Registrar movimientos de stock',
  },
  {
    codigo: 'movimientos:editar',
    nombre: 'Editar movimiento',
    modulo: 'movimientos',
    accion: 'editar',
    descripcion: 'Ajustar movimientos registrados',
  },
  {
    codigo: 'movimientos:eliminar',
    nombre: 'Eliminar movimiento',
    modulo: 'movimientos',
    accion: 'eliminar',
    descripcion: 'Eliminar movimientos',
  },

  {
    codigo: 'recepciones:listar',
    nombre: 'Listar recepciones',
    modulo: 'recepciones',
    accion: 'listar',
    descripcion: 'Ver recepciones realizadas',
  },
  {
    codigo: 'recepciones:ver',
    nombre: 'Ver recepción',
    modulo: 'recepciones',
    accion: 'ver',
    descripcion: 'Ver detalles de una recepción',
  },
  {
    codigo: 'recepciones:crear',
    nombre: 'Crear recepción',
    modulo: 'recepciones',
    accion: 'crear',
    descripcion: 'Registrar nuevas recepciones',
  },
  {
    codigo: 'recepciones:editar',
    nombre: 'Editar recepción',
    modulo: 'recepciones',
    accion: 'editar',
    descripcion: 'Modificar recepciones',
  },
  {
    codigo: 'recepciones:confirmar',
    nombre: 'Confirmar recepción',
    modulo: 'recepciones',
    accion: 'confirmar',
    descripcion: 'Confirmar recepciones de pedidos',
  },
  {
    codigo: 'recepciones:eliminar',
    nombre: 'Eliminar recepción',
    modulo: 'recepciones',
    accion: 'eliminar',
    descripcion: 'Eliminar recepciones',
  },

  {
    codigo: 'proveedores:listar',
    nombre: 'Listar proveedores',
    modulo: 'proveedores',
    accion: 'listar',
    descripcion: 'Ver listado de proveedores',
  },
  {
    codigo: 'proveedores:ver',
    nombre: 'Ver proveedor',
    modulo: 'proveedores',
    accion: 'ver',
    descripcion: 'Ver detalles de un proveedor',
  },
  {
    codigo: 'proveedores:crear',
    nombre: 'Crear proveedor',
    modulo: 'proveedores',
    accion: 'crear',
    descripcion: 'Añadir nuevos proveedores',
  },
  {
    codigo: 'proveedores:editar',
    nombre: 'Editar proveedor',
    modulo: 'proveedores',
    accion: 'editar',
    descripcion: 'Modificar datos de proveedores',
  },
  {
    codigo: 'proveedores:eliminar',
    nombre: 'Eliminar proveedor',
    modulo: 'proveedores',
    accion: 'eliminar',
    descripcion: 'Eliminar proveedores',
  },

  {
    codigo: 'incidencias:listar',
    nombre: 'Listar incidencias',
    modulo: 'incidencias',
    accion: 'listar',
    descripcion: 'Ver listado de incidencias',
  },
  {
    codigo: 'incidencias:ver',
    nombre: 'Ver incidencia',
    modulo: 'incidencias',
    accion: 'ver',
    descripcion: 'Ver detalles de una incidencia',
  },
  {
    codigo: 'incidencias:crear',
    nombre: 'Crear incidencia',
    modulo: 'incidencias',
    accion: 'crear',
    descripcion: 'Registrar nuevas incidencias',
  },
  {
    codigo: 'incidencias:resolver',
    nombre: 'Resolver incidencia',
    modulo: 'incidencias',
    accion: 'resolver',
    descripcion: 'Marcar incidencias como resueltas',
  },
  {
    codigo: 'incidencias:eliminar',
    nombre: 'Eliminar incidencia',
    modulo: 'incidencias',
    accion: 'eliminar',
    descripcion: 'Eliminar incidencias',
  },
  {
    codigo: 'incidencias:editar',
    nombre: 'Editar incidencia',
    modulo: 'incidencias',
    accion: 'editar',
    descripcion: 'Modificar datos de una incidencia',
  },

  {
    codigo: 'recetas:listar',
    nombre: 'Listar recetas',
    modulo: 'recetas',
    accion: 'listar',
    descripcion: 'Ver recetas disponibles',
  },
  {
    codigo: 'recetas:ver',
    nombre: 'Ver receta',
    modulo: 'recetas',
    accion: 'ver',
    descripcion: 'Ver detalles de una receta',
  },
  {
    codigo: 'recetas:crear',
    nombre: 'Crear receta',
    modulo: 'recetas',
    accion: 'crear',
    descripcion: 'Crear nuevas recetas',
  },
  {
    codigo: 'recetas:editar',
    nombre: 'Editar receta',
    modulo: 'recetas',
    accion: 'editar',
    descripcion: 'Modificar recetas existentes',
  },
  {
    codigo: 'recetas:eliminar',
    nombre: 'Eliminar receta',
    modulo: 'recetas',
    accion: 'eliminar',
    descripcion: 'Eliminar recetas',
  },
  {
    codigo: 'recetas:producir',
    nombre: 'Producir receta',
    modulo: 'recetas',
    accion: 'producir',
    descripcion: 'Ejecutar producción de recetas',
  },

  {
    codigo: 'albaranes:listar',
    nombre: 'Listar albaranes',
    modulo: 'albaranes',
    accion: 'listar',
    descripcion: 'Ver listado de albaranes',
  },
  {
    codigo: 'albaranes:ver',
    nombre: 'Ver albarán',
    modulo: 'albaranes',
    accion: 'ver',
    descripcion: 'Ver detalles de un albarán',
  },
  {
    codigo: 'albaranes:crear',
    nombre: 'Crear albarán',
    modulo: 'albaranes',
    accion: 'crear',
    descripcion: 'Crear nuevos albaranes',
  },
  {
    codigo: 'albaranes:eliminar',
    nombre: 'Eliminar albarán',
    modulo: 'albaranes',
    accion: 'eliminar',
    descripcion: 'Eliminar albaranes',
  },
  {
    codigo: 'albaranes:editar',
    nombre: 'Editar albarán',
    modulo: 'albaranes',
    accion: 'editar',
    descripcion: 'Modificar datos de albaranes',
  },

  {
    codigo: 'archivos:subir',
    nombre: 'Subir archivos',
    modulo: 'archivos',
    accion: 'subir',
    descripcion: 'Subir archivos al sistema',
  },
  {
    codigo: 'archivos:listar',
    nombre: 'Listar archivos',
    modulo: 'archivos',
    accion: 'listar',
    descripcion: 'Ver archivos subidos',
  },
  {
    codigo: 'archivos:descargar',
    nombre: 'Descargar archivos',
    modulo: 'archivos',
    accion: 'descargar',
    descripcion: 'Descargar archivos del sistema',
  },
  {
    codigo: 'archivos:eliminar',
    nombre: 'Eliminar archivos',
    modulo: 'archivos',
    accion: 'eliminar',
    descripcion: 'Eliminar archivos',
  },

  {
    codigo: 'dashboard:ver_estadisticas',
    nombre: 'Ver estadísticas',
    modulo: 'dashboard',
    accion: 'ver_estadisticas',
    descripcion: 'Acceder al dashboard de estadísticas',
  },
  {
    codigo: 'dashboard:exportar_reportes',
    nombre: 'Exportar reportes',
    modulo: 'dashboard',
    accion: 'exportar_reportes',
    descripcion: 'Exportar reportes y estadísticas',
  },

  {
    codigo: 'roles:listar',
    nombre: 'Listar roles',
    modulo: 'roles',
    accion: 'listar',
    descripcion: 'Ver roles del sistema',
  },
  {
    codigo: 'roles:ver',
    nombre: 'Ver rol',
    modulo: 'roles',
    accion: 'ver',
    descripcion: 'Ver detalles de un rol',
  },
  {
    codigo: 'roles:crear',
    nombre: 'Crear rol',
    modulo: 'roles',
    accion: 'crear',
    descripcion: 'Crear nuevos roles',
  },
  {
    codigo: 'roles:editar',
    nombre: 'Editar rol',
    modulo: 'roles',
    accion: 'editar',
    descripcion: 'Modificar roles existentes',
  },
  {
    codigo: 'roles:eliminar',
    nombre: 'Eliminar rol',
    modulo: 'roles',
    accion: 'eliminar',
    descripcion: 'Eliminar roles',
  },
  {
    codigo: 'roles:asignar',
    nombre: 'Asignar roles',
    modulo: 'roles',
    accion: 'asignar',
    descripcion: 'Asignar roles a usuarios',
  },
  {
    codigo: 'permisos:listar',
    nombre: 'Listar permisos',
    modulo: 'permisos',
    accion: 'listar',
    descripcion: 'Ver permisos disponibles',
  },
  {
    codigo: 'permisos:ver',
    nombre: 'Ver permiso',
    modulo: 'permisos',
    accion: 'ver',
    descripcion: 'Ver detalles de permisos',
  },
  {
    codigo: 'permisos:gestionar',
    nombre: 'Gestionar permisos',
    modulo: 'permisos',
    accion: 'gestionar',
    descripcion: 'Crear/editar permisos del sistema',
  },
  {
    codigo: 'profesor:gestionar_slots',
    nombre: 'Gestionar slots',
    modulo: 'profesor',
    accion: 'gestionar_slots',
    descripcion: 'Crear y gestionar slots de alumnos',
  },
  {
    codigo: 'profesor:gestionar_alumnos',
    nombre: 'Gestionar alumnos',
    modulo: 'profesor',
    accion: 'gestionar_alumnos',
    descripcion: 'Activar alumnos y resetear contraseñas',
  },
  {
    codigo: 'profesor:ver_alumnos',
    nombre: 'Ver alumnos',
    modulo: 'profesor',
    accion: 'ver_alumnos',
    descripcion: 'Ver listado de alumnos asignados',
  },
  {
    codigo: 'recetas:duplicar',
    nombre: 'Duplicar receta',
    modulo: 'recetas',
    accion: 'duplicar',
    descripcion: 'Duplicar una receta existente',
  },
  {
    codigo: 'recetas:cocinar',
    nombre: 'Cocinar receta',
    modulo: 'recetas',
    accion: 'cocinar',
    descripcion: 'Registrar la producción/cocinado de una receta',
  },
  {
    codigo: 'incidencias:resolver',
    nombre: 'Resolver incidencia',
    modulo: 'incidencias',
    accion: 'resolver',
    descripcion: 'Marcar una incidencia como resuelta',
  },
  {
    codigo: 'movimientos:historial',
    nombre: 'Ver historial de movimientos',
    modulo: 'movimientos',
    accion: 'historial',
    descripcion: 'Ver trazabilidad detallada de movimientos',
  },
  {
    codigo: 'archivos:subir',
    nombre: 'Subir archivo',
    modulo: 'archivos',
    accion: 'subir',
    descripcion: 'Subir nuevos archivos al sistema',
  },
  {
    codigo: 'archivos:listar',
    nombre: 'Listar archivos',
    modulo: 'archivos',
    accion: 'listar',
    descripcion: 'Ver listado de archivos subidos',
  },
  {
    codigo: 'archivos:ver',
    nombre: 'Ver archivo',
    modulo: 'archivos',
    accion: 'ver',
    descripcion: 'Ver detalle o descargar contenido de un archivo',
  },
  {
    codigo: 'archivos:eliminar',
    nombre: 'Eliminar archivo',
    modulo: 'archivos',
    accion: 'eliminar',
    descripcion: 'Eliminar archivos del sistema',
  },
  {
    codigo: 'ubicaciones:listar',
    nombre: 'Listar ubicaciones',
    modulo: 'ubicaciones',
    accion: 'listar',
    descripcion: 'Ver listado de ubicaciones',
  },
  {
    codigo: 'ubicaciones:ver',
    nombre: 'Ver ubicación',
    modulo: 'ubicaciones',
    accion: 'ver',
    descripcion: 'Ver detalles de una ubicación',
  },
  {
    codigo: 'ubicaciones:crear',
    nombre: 'Crear ubicación',
    modulo: 'ubicaciones',
    accion: 'crear',
    descripcion: 'Añadir nuevas ubicaciones',
  },
  {
    codigo: 'ubicaciones:editar',
    nombre: 'Editar ubicación',
    modulo: 'ubicaciones',
    accion: 'editar',
    descripcion: 'Modificar ubicaciones existentes',
  },
  {
    codigo: 'ubicaciones:eliminar',
    nombre: 'Eliminar ubicación',
    modulo: 'ubicaciones',
    accion: 'eliminar',
    descripcion: 'Eliminar ubicaciones (soft delete)',
  },
  {
    codigo: 'ubicaciones:restaurar',
    nombre: 'Restaurar ubicación',
    modulo: 'ubicaciones',
    accion: 'restaurar',
    descripcion: 'Restaurar ubicaciones eliminadas',
  },
  {
    codigo: 'alumno:cambiar_profesor',
    nombre: 'Cambiar profesor',
    modulo: 'alumno',
    accion: 'cambiar_profesor',
    descripcion: 'Cambiar el profesor asignado al alumno',
  },
];

/**
 * Seeder para crear permisos base y plantillas de roles
 */
export async function seedRolesPermisos(dataSource: DataSource): Promise<void> {
  const permisoRepo = dataSource.getRepository(Permiso);
  const plantillaRepo = dataSource.getRepository(PlantillaRol);

  console.log('🚀 Iniciando seeder de permisos y plantillas...');

  console.log('📝 Creando permisos base...');
  const permisosCreados: Permiso[] = [];

  for (const permisoData of PERMISOS_BASE) {
    let permiso = await permisoRepo.findOne({
      where: { codigo: permisoData.codigo },
    });

    if (!permiso) {
      permiso = permisoRepo.create({ ...permisoData, activo: true });
      await permisoRepo.save(permiso);
      permisosCreados.push(permiso);
    }
  }

  console.log(
    `✅ ${permisosCreados.length} permisos creados (${PERMISOS_BASE.length} totales en BD)`
  );

  console.log('🎨 Creando plantillas de roles...');

  const todosPermisos = await permisoRepo.find({ where: { activo: true } });

  let superAdmin = await plantillaRepo.findOne({
    where: { nombre: 'SUPER_ADMIN' },
  });
  if (!superAdmin) {
    superAdmin = plantillaRepo.create({
      nombre: 'SUPER_ADMIN',
      descripcion: 'Acceso total al sistema sin restricciones',
      esEditable: false,
      activo: true,
    });
    superAdmin = await plantillaRepo.save(superAdmin);
    superAdmin.permisos = todosPermisos;
    await plantillaRepo.save(superAdmin);
    console.log(
      `✅ Plantilla SUPER_ADMIN creada (${todosPermisos.length} permisos)`
    );
  }

  let administrador = await plantillaRepo.findOne({
    where: { nombre: rolUsuario.ADMINISTRADOR },
  });
  if (!administrador) {
    const permisosAdmin = todosPermisos.filter(
      (p) =>
        (!p.codigo.startsWith('roles:') && !p.codigo.startsWith('permisos:')) ||
        p.codigo === 'permisos:gestionar'
    );
    administrador = plantillaRepo.create({
      nombre: rolUsuario.ADMINISTRADOR,
      descripcion:
        'Administrador completo del economato (incluye gestión de permisos de usuario)',
      esEditable: true,
      activo: true,
    });
    administrador = await plantillaRepo.save(administrador);
    administrador.permisos = permisosAdmin;
    await plantillaRepo.save(administrador);
    console.log(
      `✅ Plantilla ADMINISTRADOR ('${rolUsuario.ADMINISTRADOR}') creada (${permisosAdmin.length} permisos)`
    );
  }

  let gestor = await plantillaRepo.findOne({
    where: { nombre: rolUsuario.PROFESOR },
  });
  if (!gestor) {
    const permisosGestor = todosPermisos.filter(
      (p) =>
        [
          'productos',
          'pedidos',
          'recepciones',
          'inventario',
          'movimientos',
          'incidencias',
          'recetas',
          'dashboard',
          'profesor',
          'albaranes',
          'ubicaciones',
        ].includes(p.modulo) && !p.accion.includes('eliminar')
    );
    gestor = plantillaRepo.create({
      nombre: rolUsuario.PROFESOR,
      descripcion: 'Gestión operativa del economato (perfil profesor)',
      esEditable: true,
      activo: true,
    });
    gestor = await plantillaRepo.save(gestor);
    gestor.permisos = permisosGestor;
    await plantillaRepo.save(gestor);
    console.log(
      `✅ Plantilla PROFESOR creada (${permisosGestor.length} permisos)`
    );
  }

  let usuarioBasico = await plantillaRepo.findOne({
    where: { nombre: rolUsuario.ALUMNO },
  });
  if (!usuarioBasico) {
    const permisosBasico = todosPermisos.filter(
      (p) =>
        [
          'productos',
          'inventario',
          'dashboard',
          'albaranes',
          'ubicaciones',
          'alumno',
        ].includes(p.modulo) &&
        ['listar', 'ver', 'ver_estadisticas', 'cambiar_profesor'].includes(
          p.accion
        )
    );
    usuarioBasico = plantillaRepo.create({
      nombre: rolUsuario.ALUMNO,
      descripcion: 'Usuario con permisos de solo lectura (perfil alumno)',
      esEditable: true,
      activo: true,
    });
    usuarioBasico = await plantillaRepo.save(usuarioBasico);
    usuarioBasico.permisos = permisosBasico;
    await plantillaRepo.save(usuarioBasico);
    console.log(
      `✅ Plantilla ALUMNO creada (${permisosBasico.length} permisos)`
    );
  }

  console.log('🎉 Seeder de roles y permisos completado exitosamente');
}

export async function runSeeder(dataSource: DataSource): Promise<void> {
  await seedRolesPermisos(dataSource);
}
