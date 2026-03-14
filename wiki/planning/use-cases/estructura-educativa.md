# Caso de Uso: Gestión de Estructura Educativa (Cursos y Clases)

Este documento describe la lógica funcional y técnica de cómo se organiza el personal académico y los alumnos en SmartEconomat.

## Propósito
Permitir a los profesores organizar a sus alumnos en una estructura jerárquica clara, facilitando el control de asistencia, la asignación de permisos y la gestión de capacidad.

## Actores
- **Profesor**: Define y gestiona la estructura.
- **Alumno**: Se vincula a la estructura mediante un código.

---

## Estructura de Datos (Nomenclatura)

| Término | Concepto Técnico | Descripción |
| :--- | :--- | :--- |
| **Curso / Grupo** | Aula (`aula`) | El identificador del nivel o espacio físico (ej: *2º Grado Medio*, *A01*). |
| **Clase** | Slot (`numero_clase`) | La sesión específica o subgrupo dentro del curso (ej: *Lunes Mañana*, *Grupo 1*). |
| **Código de Clase** | `codigo_slot` | Clave alfanumérica única vinculada al profesor para el registro de alumnos. |
| **Cupo** | `capacidad` | Límite máximo de alumnos permitidos en esa clase específica. |

---

## Flujo de Trabajo (Workflow)

### 1. Definición por el Profesor
1. El profesor accede a su **Ficha de Perfil**.
2. En la sección **Gestión de Clases**, crea una nueva entrada definiendo:
   - El nombre del **Curso/Grupo**.
   - El **Número de Clase**.
   - La **Capacidad** máxima.
3. El sistema genera automáticamente un **Código de Clase** único para esa combinación.

### 2. Vinculación del Alumno (Registro)
1. El alumno accede al formulario de **Registro**.
2. Introduce el **Código de Clase** proporcionado por el profesor.
3. El sistema valida:
   - Que el código exista y sea válido.
   - Que la clase tenga **Cupo** disponible (alumnos inscritos < capacidad).
4. El sistema vincula al alumno con el profesor y el curso correspondientes.

### 3. Gestión y Supervisión
1. El profesor visualiza en su ficha a los alumnos agrupados mediante **Acordeones por Curso**.
2. Puede activar/desactivar el acceso de los alumnos según la clase que les corresponda en ese momento.

---

## Reglas de Negocio
- **Unicidad**: No pueden existir dos "Clases" con el mismo número para el mismo "Curso" bajo el mismo "Profesor".
- **Privacidad**: Un profesor solo ve y gestiona a los alumnos inscritos en sus propias clases.
- **Control de Acceso**: Si el cupo de una clase está completo, el sistema bloquea nuevos registros de alumnos para ese código.
