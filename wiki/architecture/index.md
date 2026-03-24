# Arquitectura de SmartEconomat

Bienvenido a la documentación de arquitectura del proyecto **SmartEconomat**. Esta documentación está estructurada siguiendo el **Framework Diátaxis**, orientada a facilitar la consulta según tus necesidades:

## 📖 Referencia (Reference)
*Descripciones técnicas detalladas de la "maquinaria". Orientado a la información.*

- [**Backend (NestJS + TypeORM)**](./reference/backend.md): Estructura en capas, módulos, ciclo de vida de peticiones y configuración de la API.
- [**Frontend (React + Vite)**](./reference/frontend.md): Arquitectura de la interfaz de usuario, gestión de estado y convenciones del cliente.
- [**Modelo de Datos**](./reference/data-model.md): Listado exhaustivo de todas las entidades de base de datos, relaciones y campos.

## 🧠 Explicación (Explanation)
*Aclaración profunda sobre temas concretos. Orientado a la comprensión.*

- [**Decisiones Arquitectónicas y Patrones**](./explanation/decisiones-arquitectonicas.md): Por qué estructuramos el código así, qué trade-offs asumimos y patrones clave (Repository, DI).
- [**Implementación de UUID v7**](./explanation/uuid-v7.md): Análisis detallado sobre la generación y ventajas de usar IDs ordenables temporalmente.
- [**Soft Delete Global**](./explanation/soft-delete.md): Cómo funciona la retención de registros borrados lógicamente en todo el sistema.

---
*Para modificar esta documentación, mantén la separación entre el "Qué es" (Referencia) y el "Por qué es así" (Explicación).*
