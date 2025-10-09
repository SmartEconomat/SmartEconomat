DOCUMENTO DE REQUISITOS TÉCNICOS
Aplicación: SmartEconomat
Autor: Equipo de Desarrollo
Fecha: 09 de octubre de 2025

# 1. Introducción
Este documento describe los requisitos técnicos del sistema SmartEconomat, diseñado para la gestión integral de inventarios en entornos educativos. Su objetivo es establecer la base técnica para el desarrollo, despliegue y mantenimiento de la aplicación, asegurando trazabilidad y calidad del software.
# 2. Objetivos del Sistema
•  Automatizar el registro, control y seguimiento de inventarios perecederos y no perecederos.   
• Facilitar la elaboración de pedidos a proveedores.   
• Reducir errores humanos en la gestión de insumos.   
• Generar reportes automáticos en formato PDF.   
• Mejorar la trazabilidad y control de caducidades mediante FIFO y LIFO. 
# 3. Alcance
El sistema cubrirá la gestión completa del inventario escolar, desde la recepción de productos hasta su uso en clases. Incluye módulos de usuarios, proveedores, pedidos, inventario y reportes. No contempla funciones de facturación, nómina ni gestión contable.
# 4. Definiciones y Referencias
•  **FIFO (First In, First Out):**  método que prioriza el uso de los productos más antiguos.   
•  **LIFO (Last In, First Out):**  método que prioriza los productos más nuevos.   
•  **SmartEconomat:**  aplicación web/móvil desarrollada por el equipo de desarrollo académico.   
•  **Referencias** : IEEE 830-1998, ISO/IEC/IEEE 29148:2018. 
# 5. Requisitos Funcionales
•  RF01 - El sistema deberá permitir el registro de usuarios por parte del administrador.   
• RF02 - El sistema deberá gestionar productos perecederos y no perecederos.   
• RF03 - El sistema deberá permitir registrar pedidos a proveedores y sus fechas.   
• RF04 - El sistema deberá generar reportes de inventario, pedidos y caducidades.   
• RF05 - El sistema deberá permitir la exportación de reportes en PDF. 
# 6. Requisitos No Funcionales
•  RNF01 - La interfaz deberá ser intuitiva y accesible desde navegadores modernos.   
• RNF02 - La aplicación deberá mantener disponibilidad del 99% en horario escolar.   
• RNF03 - Los datos deberán almacenarse de forma segura con respaldo diario.   
• RNF04 - El sistema deberá responder en menos de 2 segundos por consulta.   
• RNF05 - Cumplimiento de estándares de seguridad OWASP. 
# 7. Arquitectura Técnica
La arquitectura del sistema se basará en un modelo cliente-servidor con una API RESTful central. El backend se desarrollará con Node.js y Express, mientras que el frontend usará React. La base de datos será MongoDB, con integración a servicios en la nube para despliegue.
# 8. Tecnologías y Dependencias
•  Frontend: React, HTML5, CSS3,  TypeScript .   
• Backend:  NestJS .   
• Base de datos:  PostgreSQL .   
• Control de versiones: Git y GitHub.   
• Despliegue: Docker.   
• Otras dependencias:  JWT . 
# 9. Entorno de Desarrollo y Despliegue
•  Sistema operativo: Windows.   
• Editor recomendado: VS Code.   
• Entorno de ejecución: Node.js 20+.   
• Control de dependencias: npm o yarn.   
• Despliegue en entorno de prueba mediante contenedores Docker y CI/CD en GitHub Actions. 
# 10. Seguridad
El sistema deberá implementar autenticación JWT y cifrado de contraseñas mediante bcrypt. El acceso a datos sensibles se limitará por roles de usuario. Se aplicarán políticas CORS y validaciones de entrada para prevenir ataques comunes como XSS o inyección SQL.
# 11. Escalabilidad y Mantenimiento
El diseño modular del sistema permitirá la escalabilidad horizontal mediante contenedores Docker. Se mantendrán logs de actividad, versiones semánticas y documentación continua en GitHub Wiki.
# 12. Anexos Técnicos
Diagramas de arquitectura, casos de uso, flujos de datos y esquemas de base de datos se incluirán como anexos gráficos o archivos complementarios.
SmartEconomat – Documento de Requisitos Técnicos © 2025
