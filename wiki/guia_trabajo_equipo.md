# 🧩 Guía de Trabajo en Equipo — Proyecto Backend (NestJS + Git/GitHub + Docker)

## 📘 Objetivo General
Este documento establece las **normas y procedimientos de trabajo colaborativo** para el desarrollo del backend del proyecto, garantizando coherencia en la estructura, control de versiones y flujo de integración continua.  

---

## ⚙️ Arquitectura del Proyecto (NestJS)

El proyecto sigue una **arquitectura en capas** basada en el patrón `controller → service → repository`.  
Este enfoque permite mantener una **separación de responsabilidades**, mejor legibilidad y escalabilidad del código.

### Estructura de carpetas

```bash
src/
├── main.ts
├── app.module.ts
├── config/
│   └── database.config.ts
├── common/
│   ├── dtos/
│   ├── exceptions/
│   ├── interceptors/
│   ├── filters/
│   └── guards/
├── database/
│   ├── database.module.ts
│   └── database.providers.ts
├── modules/
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── users.module.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── interfaces/
│   │       └── user.interface.ts
│   └── auth/
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       ├── auth.repository.ts
│       ├── auth.module.ts
│       └── dto/
│           └── login.dto.ts
└── shared/
    └── utils/
        └── helpers.ts
```

📄 **Visualización de la arquitectura general:**  
![Arquitectura del Backend](https://raw.githubusercontent.com/SmartEconomat/SmartEconomat/develop/wiki/images/arquitectura.jpeg)

---

### 🗂️ Explicación de carpetas y archivos

| Carpeta / Archivo | Descripción |
|--------------------|-------------|
| **main.ts** | Punto de entrada principal de la aplicación. Inicia el servidor NestJS y configura el entorno de ejecución. |
| **app.module.ts** | Módulo raíz del proyecto, donde se importan y registran los demás módulos. |
| **config/** | Contiene la configuración general de la aplicación, como la conexión a la base de datos, variables de entorno, etc. |
| **common/** | Carpeta destinada a elementos reutilizables en todo el proyecto: |
| ├── **dtos/** | Data Transfer Objects usados para validar y transferir datos entre capas. |
| ├── **exceptions/** | Excepciones personalizadas del proyecto. |
| ├── **interceptors/** | Interceptores para modificar o gestionar el flujo de peticiones/respuestas. |
| ├── **filters/** | Filtros globales para manejo de errores (Exception Filters). |
| └── **guards/** | Guards para control de acceso, autenticación y roles. |
| **database/** | Contiene la configuración e inicialización del acceso a la base de datos (módulos, proveedores, etc.). |
| **modules/** | Directorio principal que agrupa los módulos funcionales del sistema (por ejemplo: `users`, `auth`, `products`, etc.). Cada módulo tiene su propio `controller`, `service`, `repository`, y subcarpetas específicas. |
| ├── **controller.ts** | Gestiona las rutas y peticiones HTTP. Recibe solicitudes del cliente y delega en el servicio. |
| ├── **service.ts** | Contiene la lógica de negocio. Procesa datos y se comunica con el repositorio. |
| ├── **repository.ts** | Gestiona la comunicación directa con la base de datos (ORM o consultas SQL). |
| ├── **dto/** | Define los objetos de transferencia de datos específicos del módulo. |
| ├── **entities/** | Contiene las clases o esquemas que representan las tablas o modelos del sistema. |
| └── **interfaces/** | Define las interfaces que establecen la forma de los objetos y estructuras de datos del módulo. |
| **shared/** | Contiene utilidades globales del proyecto (helpers, funciones comunes, etc.). |
| └── **utils/** | Código auxiliar como validaciones, formateadores o transformadores de datos. |

---

## 🧱 Flujo de Trabajo con Git y GitHub

Para mantener un control de versiones limpio y ordenado, se aplicará una **estrategia basada en ramas**, siguiendo una estructura centralizada en `develop` y `main`.

### Estructura de ramas

- `main` → Rama **estable**, contiene el código de producción.  
- `develop` → Rama principal de **desarrollo**.  
- A partir de `develop` se crean las ramas secundarias:

  - `feature/<nombre>` → Nuevas funcionalidades.  
  - `bugfix/<número o descripción>` → Corrección de errores.  
  - `docs/<nombre>` → Documentación.

📊 **Esquema visual del flujo de ramas:**  
![Flujo de ramas](https://raw.githubusercontent.com/SmartEconomat/SmartEconomat/develop/wiki/images/integracion.jpeg)

---

## 🔄 Reglas de Integración y Pull Requests

- Solo la rama **develop** puede fusionarse con **main**.  
- Todas las ramas deben crearse **a partir de develop**.  
- Cada cambio debe realizarse mediante **Pull Request (PR)**.  
- Un PR **no se considera finalizado** hasta que haya sido **revisado y aprobado**.  
- **[Responsable de integraciones]**: Darel Martínez Caballero será el encargado de unir los cambios a `develop` y `main`.

---

## 🐳 Entorno de Ejecución con Docker

Todo el entorno se ejecutará mediante **Docker**, garantizando la portabilidad y homogeneidad entre entornos de desarrollo.

### Comandos básicos

```bash
# Construir y levantar los contenedores
docker-compose up --build

# Detener los contenedores
docker-compose down

# Ver logs del backend
docker logs -f <nombre_contenedor_backend>
```

---

## 🧭 Buenas Prácticas de Equipo

- Mantener la estructura de carpetas establecida.  
- Nombrar las ramas siguiendo el formato:  
  `feature/nombre`, `bugfix/ID_descriptivo`, `docs/nombre`.  
- Escribir mensajes de commit **claros y concisos**.  
- Revisar los PR de los compañeros antes de aprobarlos.  
- Mantener sincronizado el repositorio local con `develop` antes de comenzar una nueva tarea.  

### Formato de Mensajes de Commit
Para mantener un histórico de commits legible y semántico, seguiremos el formato de **Conventional Commits**. Este enfoque utiliza prefijos para categorizar los cambios, facilita la generación automática de changelogs y ayuda en la gestión de versiones.

#### Estructura General
- **Título (primera línea)**: `<tipo>[ámbito opcional]: <descripción breve>`.
  - Limita a 50 caracteres.
  - Usa verbo en imperativo (ej. "Add", "Fix", no "Added" o "Fixed").
  - No uses punto final ni puntos suspensivos.
- **Cuerpo (opcional)**: Después de una línea en blanco, añade contexto detallado si es necesario. Usa puntuación normal aquí.
- **Pie (opcional)**: Para referencias como issues (ej. "Closes #123").

#### Tipos Comunes
- `feat`: Nueva funcionalidad para el usuario.
- `fix`: Corrección de un bug.
- `docs`: Cambios en la documentación.
- `style`: Cambios de formato (espacios, indentación) sin alterar el código.
- `refactor`: Refactorización de código sin cambiar funcionalidad.
- `perf`: Mejoras de rendimiento.
- `test`: Añadir o modificar tests.
- `build`: Cambios en el sistema de build o dependencias.
- `ci`: Cambios en la integración continua.
- `chore`: Tareas menores que no afectan al código principal.

#### Ejemplos
- `feat: add user authentication endpoint`
- `fix(users): resolve null pointer in repository`
- `docs: update README with new installation steps`
- `refactor: rename variables for better readability`

Usa `git commit` (sin `-m`) para editar el mensaje con un editor que permita múltiples líneas. Esto asegura commits atómicos y un histórico profesional.

---

📅 **Versión del documento:** 1.1  
✍️ **Responsable:** Darel Martínez Caballero