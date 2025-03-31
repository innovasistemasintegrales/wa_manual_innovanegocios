# UPDATES semana 7 17 - 18 - 19 Marzo

### Implementado

- **Reportes**

  - Funcionalidad para generar y descargar Reportes para los roles de soporte, técnico y administrador. Se usó jsPDF y html2canvas para la generación de pdf's y chartjs para los gráficos.

- **Inicio**

  - Desarrollo e implementación de la vista de inicio (Dashboard) en todos los roles con gráficos utilizando chartjs.

- **Incidentes**

  - Implementación de la paginación en el listado de incidentes para todos los roles.

### Corregido

- Modificar el backend para pasar la variable hayMasIncidentes correctamente en diferentes estados de incidentes en todos los roles.
- Implementar un sistema de configuración en todos los roles de usuario para poder configurar preferencias como:
  - Activar o desactivar notificaciones
  - Mostrar u ocultar columnas en las tablas de incidentes, usuarios y reportes
  - Establecer un tema de colores predeterminado
  - Establecer un tamaño de letra predeterminado
  - Establecer un tiempo de vida para las notificaciones
- Implementar un sistema de búsqueda avanzada con filtros para los incidentes.

