# Requisitos Técnicos

**Aplicación:** SmartEconomat  
**Autores:** Darel Martínez Caballero, Sergio Herrera Rodríguez, Alexis Daniel Ruiz Salazar, Luis Guillermo Colmenares Torres, Maurizio Giovanni Hernández Camisa  
**Fecha:** 09 de octubre de 2025

---

## 1. Introducción

Este documento describe los requisitos técnicos del sistema SmartEconomat, diseñado para la gestión integral de inventarios en entornos educativos. Su objetivo es establecer la base técnica para el desarrollo, despliegue y mantenimiento de la aplicación, asegurando trazabilidad y calidad del software.

## 2. Objetivos del Sistema

- Automatizar el registro, control y seguimiento de inventarios perecederos y no perecederos.
- Facilitar la elaboración de pedidos a proveedores.
- Reducir errores humanos en la gestión de insumos.
- Generar reportes automáticos en formato PDF.
- Mejorar la trazabilidad y control de caducidades mediante FIFO y LIFO.

## 3. Alcance

El sistema cubrirá la gestión completa del inventario escolar, desde la recepción de productos hasta su uso en clases. Incluye módulos de usuarios, proveedores, pedidos, inventario y reportes. No contempla funciones de facturación, nómina ni gestión contable.

## 4. Definiciones y Referencias

| Término | Definición |
|---------|-----------|
| **FIFO** | First In, First Out: método que prioriza el uso de los productos más antiguos |
| **LIFO** | Last In, First Out: método que prioriza los productos más nuevos |
| **SmartEconomat** | Aplicación web desarrollada por el equipo de desarrollo académico |

**Referencias:** IEEE 830-1998, ISO/IEC/IEEE 29148:2018

## 5. Requisitos Funcionales

| ID | Requisito |
|----|-----------|
| RF01 | El sistema deberá permitir el registro de usuarios por parte del administrador |
| RF02 | El sistema deberá gestionar productos perecederos y no perecederos |
| RF03 | El sistema deberá permitir registrar pedidos a proveedores, sus fechas, historial de precios y código de barras; debe permitir un CRUD sobre pedidos |
| RF04 | El sistema deberá generar reportes de inventario, pedidos y caducidades |
| RF05 | El sistema deberá permitir la exportación de reportes en PDF |
| RF06 | El sistema deberá permitir un CRUD sobre los albaranes |
| RF07 | El sistema debe permitir un CRUD de una baja |
| RF08 | El sistema deberá disponer de un conjunto predefinido de unidades de medida seleccionables |
| RF09 | El sistema deberá mostrar los productos próximos a su fecha de caducidad |
| RF10 | El sistema deberá disponer del historial de movimientos que hagan los usuarios en el inventario |
| RF11 | Debe incluir especificaciones de conservación de productos y control del stock siguiendo el método FIFO |
| RF12 | El sistema debe permitir que un profesor pueda reservar un producto |
| RF13 | El sistema debe registrar cómo llega la mercancía, el albarán correspondiente y permitir la revisión y organización de los datos |
| RF14 | El sistema deberá gestionar usuarios y roles |
| RF15 | El sistema debe permitir registrar el peso de los productos y pasar etiquetas para tener un control físico del inventario |
| RF16 | El sistema deberá aplicar impuestos a cada detalle de albarán |
| RF17 | El sistema deberá permitir modificar el estado de los pedidos |
| RF18 | El sistema deberá permitir crear, leer, actualizar y eliminar recetas |
| RF19 | El sistema deberá poder registrar alimentos y sus alérgenos |

## 6. Requisitos No Funcionales

| ID | Requisito |
|----|-----------|
| RNF01 | La interfaz deberá ser intuitiva y accesible desde navegadores modernos |
| RNF02 | La aplicación deberá mantener disponibilidad del 99% en horario escolar |
| RNF03 | Los datos deberán almacenarse de forma segura con respaldo diario |
| RNF04 | El sistema deberá responder en menos de 2 segundos por consulta |
| RNF05 | Solo los usuarios autorizados (maestro o encargado) pueden modificar o llevar productos del economato |
| RNF06 | Debe funcionar en tablets y permitir importar/exportar datos desde Excel |

## 7. Arquitectura Técnica

La arquitectura del sistema se basa en un modelo cliente-servidor con una API RESTful central:

- **Backend:** NestJS 11 con TypeORM
- **Frontend:** React 19 con Vite y Material-UI
- **Base de datos:** PostgreSQL con extensión UUID v7
- **Contenedores:** Docker y Docker Compose

> Para detalles de implementación, consulta [Arquitectura del Backend](../architecture/backend.md) y [Arquitectura del Frontend](../architecture/frontend.md).

## 8. Tecnologías y Dependencias

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 19, TypeScript, Vite, Material-UI 7, React Router 7 |
| **Backend** | NestJS 11, TypeORM, Passport.js, class-validator, nestjs-i18n |
| **Base de datos** | PostgreSQL, extensión UUID v7 personalizada |
| **Infraestructura** | Docker, Docker Compose, Nginx |
| **Seguridad** | JWT, bcrypt |
| **Calidad** | Jest, ESLint, Prettier, Husky |
| **Monitorización** | Sentry |

> Para el listado completo, consulta [Dependencias](dependencias.md).

## 9. Entorno de Desarrollo y Despliegue

- **Sistema operativo:** Windows (compatible con Linux/macOS)
- **Editor recomendado:** VS Code con extensiones ESLint, Prettier, Docker
- **Entorno de ejecución:** Node.js 20+
- **Control de dependencias:** npm
- **Despliegue:** Contenedores Docker con Docker Compose

> Para instrucciones de configuración, consulta la [Guía de Inicio Rápido](inicio-rapido.md).

## 10. Seguridad

- Autenticación JWT con Passport.js
- Cifrado de contraseñas con bcrypt
- RBAC dinámico: roles + permisos granulares por usuario
- Validación de entrada con class-validator y pipes globales
- Filtro global de excepciones con mapeo de errores PostgreSQL
- Monitorización de errores con Sentry

> Para detalles del sistema de permisos, consulta [Sistema de Permisos Dinámicos](../security/permisos-dinamicos.md).

## 11. Escalabilidad y Mantenimiento

El diseño modular del sistema (20 módulos independientes) permite la escalabilidad horizontal mediante contenedores Docker. Se mantienen:
- Logs de actividad y trazabilidad completa (módulo Movimientos)
- Documentación técnica actualizada en la wiki del proyecto
- Tests E2E automatizados para regresiones
- Internacionalización para español e inglés

## 12. Anexos

| Recurso | Ubicación |
|---------|-----------|
| Diagrama ER | [assets/resources/diagram-ER.drawio](../assets/resources/diagram-ER.drawio) |
| Entidades y Relaciones | [backend/entidades_relaciones.md](backend/entidades_relaciones.md) |
| Casos de Uso | [use-cases/use-cases.md](use-cases/use-cases.md) |
| Colección Postman | [reference/postman/SmartEconomat_Postman_Collection.json](../reference/postman/SmartEconomat_Postman_Collection.json) |

---

*SmartEconomat – Documento de Requisitos Técnicos © 2025*

