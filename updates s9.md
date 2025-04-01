# UPDATES semana 9  31 - 1 - 2  de Abril

## POR HACER

- Gráficos en el inicio (Dashboard) con ChartJS         (No empezado)
- **VERIFICAR QUE TODOS LOS CAMBIOS EN LA DB SE SINCRONICEN EN TIEMPOR REAL INCLUSO SI ES QUE SE PIERDE LA CONEXIÓN POR UNOS MINUTOS Y SE PERDEN LOS CAMBIOS**         (No empezado)
- Optimizar la carga de archivos multimedia mediante compresión y almacenamiento eficiente.      (No empezado)
- **DOCUMENTAR TODO EL SISTEMA DEL MANUAL INNOVANEGOCIOS**         (No empezado)
- **QUITAR LA RECARGA DE LA PÁGINA AL IR AL INICIO**     (A medias)
 


- Implementación del sistema de calificaciones en CLIENTE (califica) → administrador (gestiona calificaciones)

- Consultar en que eventos se podrìa lanzar la modal para la calificaciòn del asesor.
- Consultar si es que el invitado se guarde o no una sesión con el token de autenticación (cookies)

- Mejorar la tabla de incidentes y usuarios para tener un scroll dentro de la tabla y no del contenedor principal.      (No empezado)
- Corregir y aplicar una validación a /invitado para el acceso solo si se ingresó con el formulario de acceso rápido a invitado (dni, nombres, telefono)         (No empezado)
- Corregir la visualización de la etiqueta de Multimedia en los modales de los incidentes.     (No empezado)
- Corregir la visualización del texto de "Sin incidentes" en todas las tablas de incidentes.     (No empezado)
- Corregir: implementar la visualización de las etiquetas de Reasignado y respuesta recibida en el listado de incidentes del Administrador     (No empezado)
- Corregir: Quitar o implementar el botón de "Editar" en la sección de Ajustes en todos los roles     (No empezado)

### Implementado

- Paginación en el listado de incidentes en el rol de cliente (Completado)

### Corregido

### OPCIONALES

- **Agregar una etiqueta o indicador a los nuevos incidentes que tienen un tiempo de creación reciente**
- Incluir mensajes e información más detallada en los modales y vistas de todos los roles. (Al crear incidente, eliminar un usuario (en administrador), etc.)
- Gestionar la visibilidad de los archivos multimedia de video y pdf que suben los clientes al crear un incidente en su modal.
- Añadir una previsualización de los archivos multimedia de imagen, video y pdf que suben los clientes al crear un incidente en su modal.
- Implementar búsqueda de empresas en el input de generación de reportes.
- Implementar un sistema de seguimiento de tiempo para medir la eficiencia en la resolución de incidentes.
- Desarrollar un sistema de plantillas para respuestas comunes a incidentes frecuentes.
- Implementar un sistema de configuración en todos los roles de usuario para poder configurar preferencias como:
  - Activar o desactivar notificaciones
  - Mostrar u ocultar columnas en las tablas de incidentes, usuarios y reportes
  - Establecer un tema de colores predeterminado
  - Establecer un tamaño de letra predeterminado
  - Establecer un tiempo de vida para las notificaciones
- Implementar un sistema de búsqueda avanzada con filtros para los incidentes.