# UPDATES

## Por hacer - 22 de Marzo

- **HECHOOO** Arreglar la seccíon Reportes y adecuarlos como lo está en el rol de soporte (falta técnico) 

- Gráficos en los reportes con ChartJS
- Gráficos en el inicio (Dashboard) con ChartJS

- Incluir mensajes e información más detallada en los modales y vistas de todos los roles. (Al crear incidente, eliminar un usuario (en administrador), etc.)

- Gestionar la visibilidad de los archivos multimedia de video y pdf que suben los clientes al crear un incidente en su modal.
- Añadir una previsualización de los archivos multimedia de imagen, video y pdf que suben los clientes al crear un incidente en su modal.

## Implementado y Corregido en la semana 17 - 18 - 19 Marzo

### Implementado

- **Globales**

  - Incluir mensajes e información más detallada en los modales y vistas de todos los roles. (Al crear incidente, usuarios, etc.)

- **Reportes**

  - Funcionalidad para generar y descargar Reportes para los roles de soporte, técnico y administrador. Se usó jsPDF y html2canvas para la generación de pdf's y chartjs para los gráficos.

- **Inicio**

  - Desarrollo e implementación de la vista de inicio (Dashboard) en todos los roles con gráficos utilizando chartjs.

- **Incidentes**

  - Implementación de la paginación en el listado de incidentes para todos los roles.
  - Gestionar la visibilidad de los archivos multimedia de video y pdf que suben los clientes al crear un incidente en su modal.
  - Añadir una previsualización de los archivos multimedia de imagen, video y pdf que suben los clientes al crear un incidente en su modal.
  - Implementar un sistema de búsqueda avanzada con filtros para los incidentes.

### Corregido

- **VERIFICAR QUE TODOS LOS CAMBIOS EN LA DB SE SINCRONICEN EN TIEMPOR REAL INCLUSO SI ES QUE SE PIERDE LA CONEXIÓN POR UNOS MINUTOS Y SE PERDEN LOS CAMBIOS** FALTA
- **REFACTORIZAR EL CÓDIGO DE TODOS LOS ELEMENTOS DE LA UI EN COMPONENTES REUTILIZABLES** FALTA

  - Mejorar la tabla de incidentes y usuarios para tener un scroll dentro de la tabla y no del contenedor principal.

- Modificar el backend para pasar la variable hayMasIncidentes correctamente en diferentes estados de incidentes en todos los roles.
- Implementar búsqueda de empresas en el input de generación de reportes.
- Optimizar la carga de archivos multimedia mediante compresión y almacenamiento eficiente.

### Para implementar la siguiente semana

- **DOCUMENTAR TODO EL SISTEMA DEL MANUAL INNOVANEGOCIOS**
- **Agregar una etiqueta o indicador a los nuevos incidentes que tienen un tiempo de creación reciente**
- **QUITAR LA RECARGA DE LA PÁGINA AL IR AL INICIO**
- Implementar un sistema de seguimiento de tiempo para medir la eficiencia en la resolución de incidentes.
- Desarrollar un sistema de plantillas para respuestas comunes a incidentes frecuentes.
- Implementar un sistema de configuración en todos los roles de usuario para poder configurar preferencias como:
  - Activar o desactivar notificaciones
  - Mostrar u ocultar columnas en las tablas de incidentes, usuarios y reportes
  - Establecer un tema de colores predeterminado
  - Establecer un tamaño de letra predeterminado
  - Establecer un tiempo de vida para las notificaciones
- Implementar un sistema de búsqueda avanzada con filtros para los incidentes.
