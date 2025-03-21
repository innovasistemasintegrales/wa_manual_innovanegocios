# ACTUALIZACIONES

## Implementado esta semana

- **Globales**

  - Incluir mensajes e información más detallada en los modales y vistas de todos los roles. (Al crear incidente, usuarios, etc.)

- **Reportes**

  - Funcionalidad en la vista de reportes para los roles de soporte, técnico y administrador. Se usó jsPDF y html2canvas para la generación de pdf's y chartjs para los gráficos.

- **Inicio**

  - Desarrollo e implementación de la vista de inicio (Dashboard) en todos los roles con gráficos utilizando chartjs. **FALTA**

- **Incidentes**

  - Implementación de la paginación en el listado de incidentes para todos los roles. **FALTA**
  - Gestionar la visibilidad de los archivos multimedia de video y pdf que suben los clientes al crear un incidente en su modal. **FALTA**
  - Añadir una previsualización de los archivos multimedia de imagen, video y pdf que suben los clientes al crear un incidente en su modal. **FALTA**
  - Implementar un sistema de búsqueda avanzada con filtros para los incidentes. **FALTA**

## Para corregir

- **VERIFICAR QUE TODOS LOS CAMBIOS EN LA DB SE SINCRONICEN EN TIEMPOR REAL INCLUSO SI ES QUE SE PIERDE LA CONEXIÓN POR UNOS MINUTOS Y SE PERDEN LOS CAMBIOS**
- **REFACTORIZAR EL CÓDIGO DE TODOS LOS ELEMENTOS DE LA UI EN COMPONENTES REUTILIZABLES**

  - Mejorar la tabla de incidentes y usuarios para tener un scroll dentro de la tabla y no del contenedor principal.

- Modificar el backend para pasar la variable hayMasIncidentes correctamente en diferentes estados de incidentes en todos los roles.
- Implementar búsqueda de empresas en el input de generación de reportes.
- Optimizar la carga de archivos multimedia mediante compresión y almacenamiento eficiente.

## Para implementar

- **Agregar una etiqueta o indicador a los nuevos incidentes que tienen un tiempo de creación reciente**
- **QUITAR LA RECARGA DE LA PÁGINA AL IR AL INICIO**
- Implementar un sistema de seguimiento de tiempo para medir la eficiencia en la resolución de incidentes.
- Desarrollar un sistema de plantillas para respuestas comunes a incidentes frecuentes.
