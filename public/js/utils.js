/**
 * utils.js - Funciones de utilidad para la aplicación
 * 
 * Este archivo contiene funciones de utilidad reutilizables en toda la aplicación,
 * relacionadas con la manipulación del DOM, formateo de fechas y visualización de multimedia.
 */

/**
 * Funciones reutilizables en utils.js:
 * 
 * - socketConnect: Crea y gestiona conexiones de socket.io con manejo de errores y renovación de token
 * - inicializarSidebar: Configura la interactividad del menú de navegación lateral
 * 
 * El archivo contiene utilidades para:
 * - Manipulación del DOM
 * - Formateo de fechas
 * - Visualización de multimedia
 * - Gestión de conexiones de socket
 * - Manejo de autenticación
 */



/**
 * Crea una conexión al socket para un namespace específico
 * @param {string} namespace - El namespace al que conectar (ej. '/soporte', '/tecnico', '/administrador', '/cliente')
 * @returns {Socket} Instancia del socket conectado
 */
export function socketConnect(namespace) {
    // Crear la conexión al namespace especificado
    const socket = io(namespace, {
        withCredentials: true, // Enviar cookies automáticamente
    });

    // Escuchar errores de conexión
    socket.on('connect_error', async (err) => {
        console.error(`Error de conexión con el socket ${namespace}:`, err.message);
        if (err.message === 'Token inválido o expirado.') {
            console.log('Intentando renovar el token...');

            // Renovar el token de acceso
            try {
                const response = await fetch('/refresh-token', {
                    method: 'POST',
                    credentials: 'include', // Incluye cookies automáticamente
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({}), // No necesitamos enviar nada si el refresh token está en una cookie
                });

                if (response.ok) {
                    console.log('Token renovado correctamente.');

                    // Intentar reconectar al socket
                    socket.connect(); // Reconectar con el socket después de renovar el token
                } else {
                    const errorData = await response.json();
                    console.error('No se pudo renovar el token:', errorData.message);

                    // Si ambos tokens han expirado, redirigir al login
                    if (errorData.message && errorData.message.includes('jwt expired')) {
                        console.error('Tu sesión ha expirado completamente. Por favor, inicia sesión nuevamente.');
                        // Esperar un momento antes de redirigir para que el usuario pueda ver el mensaje en la consola
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 500);
                    } else {
                        window.location.href = '/login';
                        console.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    }
                }
            } catch (error) {
                console.error('Error al intentar renovar el token:', error);
                console.error('Ocurrió un error al renovar la sesión. Inicia sesión nuevamente.');

                // Esperar un momento antes de redirigir para que el usuario pueda ver el mensaje en la consola
                setTimeout(() => {
                    window.location.href = '/login';
                }, 500);
            }
        }
    });

    // Escuchar evento de conexión exitosa
    socket.on('connect', () => {
        console.log(`Conectado al namespace ${namespace}`);
    });

    return socket; // Devolver el socket
}

/**
 * Inicializa el visor de imágenes en el modal de incidente.
 *
 * @param {HTMLElement} modalElement - El elemento DOM del modal
 * @param {Object} incidente - Datos del incidente con imágenes
 *
 * Verifica si hay imágenes para mostrar en el incidente y, si es así,
 * inicializa el visor de imágenes en el contenedor con el ID
 * "contenedorMultimedia" dentro del modal. El visor permite hacer zoom,
 * rotar y mover las imágenes.
 */
export function inicializarVisorImagenes(modalElement, incidente) {
    // Verificar si hay imágenes para mostrar
    if (incidente.imagenes?.length > 0) {
        // Obtener una referencia al contenedor de multimedia
        const contenedorMultimediaActual = modalElement.querySelector('#contenedorMultimedia');
        if (contenedorMultimediaActual) {
            // Pequeño retraso para asegurar que el DOM esté completamente listo
            setTimeout(() => {
                new Viewer(contenedorMultimediaActual, {
                    toolbar: true,       // Muestra herramientas como zoom y rotación
                    navbar: false,       // Oculta la barra de miniaturas
                    title: false,        // Oculta el título de la imagen
                    movable: true,       // Permite arrastrar la imagen
                    zoomable: true,      // Permite hacer zoom con el scroll
                    rotatable: true,     // Permite rotar la imagen
                    scalable: true,      // Permite escalar la imagen
                    fullscreen: false,   // Activa el modo pantalla completa
                });
            }, 100);
        }
    }
}

/**
 * Crea elementos multimedia y los agrega al contenedor
 * 
 * @param {Object} incidente - Datos del incidente con archivos multimedia
 * @param {HTMLElement} contenedor - Contenedor donde mostrar los archivos multimedia
 */
export function mostrarArchivosMultimedia(incidente, contenedor) {
    // Limpiar el contenedor antes de agregar nuevos archivos
    contenedor.innerHTML = "";

    // Crear un fragmento para mejorar el rendimiento
    const fragment = document.createDocumentFragment();

    // Mostrar imágenes si existen
    if (incidente.imagenes?.length > 0) {
        incidente.imagenes.forEach(imagen => {
            fragment.appendChild(crearElementoImagen(imagen));
        });
    }

    // Mostrar videos si existen
    if (incidente.videos?.length > 0) {
        incidente.videos.forEach(video => {
            fragment.appendChild(crearElementoVideo(video));
        });
    }

    // Mostrar PDFs si existen
    if (incidente.pdfs?.length > 0) {
        incidente.pdfs.forEach(pdf => {
            fragment.appendChild(crearElementoPDF(pdf));
        });
    }

    // Agregar todos los elementos al contenedor de una sola vez
    contenedor.appendChild(fragment);
}

/**
 * Crea un elemento de imagen para mostrar en el contenedor multimedia
 * 
 * @param {string} urlImagen - URL de la imagen
 * @returns {HTMLElement} Elemento de imagen configurado
 */
export function crearElementoImagen(urlImagen) {
    const imgElement = document.createElement("img");
    imgElement.src = urlImagen;
    imgElement.classList.add("img-fluid", "m-2", "border", "rounded", "cursor-pointer");
    imgElement.style.width = "auto";
    imgElement.style.maxWidth = "200px";
    imgElement.style.height = "auto";
    imgElement.style.objectFit = "cover";
    imgElement.style.objectPosition = "center";
    return imgElement;
}

/**
 * Crea un elemento de video para mostrar en el contenedor multimedia
 * 
 * @param {string} urlVideo - URL del video
 * @returns {HTMLElement} Elemento de video configurado
 */
export function crearElementoVideo(urlVideo) {
    const videoElement = document.createElement("video");
    videoElement.src = urlVideo;
    videoElement.controls = true;
    videoElement.classList.add("m-2", "border", "rounded");
    videoElement.style.width = "200px";
    videoElement.style.height = "120px";
    return videoElement;
}

/**
 * Crea un elemento de enlace para mostrar PDFs en el contenedor multimedia
 * 
 * @param {string} urlPDF - URL del PDF
 * @returns {HTMLElement} Elemento de enlace configurado
 */
export function crearElementoPDF(urlPDF) {
    const pdfElement = document.createElement("a");
    pdfElement.href = urlPDF;
    pdfElement.target = "_blank";
    pdfElement.textContent = "Ver Documento";
    pdfElement.classList.add("btn", "btn-outline-dark", "m-2");
    return pdfElement;
}

/**
 * Formatea una fecha en formato ISO a una fecha y hora legibles
 * para el usuario.
 *
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {object} - Un objeto con la fecha y hora formateadas
 * @prop {string} fecha - Fecha en formato dd/mm/aaaa
 * @prop {string} hora - Hora en formato hh:mm am/pm
 */
export function formatearFechaHora(fechaISO) {
    if (!fechaISO) return { fecha: 'No disponible', hora: 'No disponible' };

    const fechaFormateada = new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(fechaISO));

    const horaFormateada = new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(new Date(fechaISO));

    return { fecha: fechaFormateada, hora: horaFormateada };
}

/**
 * Muestra una notificación toast en la interfaz de usuario
 * 
 * @param {string} titulo - Título de la notificación
 * @param {string} mensaje - Mensaje de la notificación
 * @param {string} tipo - Tipo de notificación (success, error, warning, info, danger)
 * @param {number} duracion - Duración en milisegundos
 */
export function mostrarNotificacion(titulo, mensaje, tipo = 'info', duracion = 5000) {

    /**
     * Mapeo de tipos de notificación a sus correspondientes clases de icono y color.
     * Cada propiedad en el mapa representa un tipo específico de notificación o alerta
     * que puede mostrarse en la interfaz de usuario.
     *
     * - danger: Representa una situación crítica o peligrosa.
     * - primary: Representa una acción o información relacionada con los usuarios
     * - warning: Representa una advertencia o precaución que requiere atención.
     * - success: Representa una acción exitosa o completada.
     * - info: Representa contenido o mensajes informativos.
     *
     * - notificar_problema: Representa una notificación de un problema crítico.
     * - notificar_usuario: Representa una notificación relacionada con el usuario.
     * - notificar_pregunta_frecuente: Representa una notificación de pregunta frecuente.
     * - notificar_exito: Representa una notificación de éxito.
     * - notificar_informacion: Representa una notificación informativa.
     */
    const iconMap = {

        danger: { icon: 'bi-exclamation-triangle-fill', color: 'text-danger' },
        primary: { icon: 'bi-person-fill', color: 'text-primary' },
        warning: { icon: 'bi-question-circle-fill', color: 'text-warning' },
        success: { icon: 'bi-check-circle-fill', color: 'text-success' },
        info: { icon: 'bi-info-circle-fill', color: 'text-info' },

        notificar_problema: { icon: 'bi-exclamation-triangle-fill', color: 'text-danger' },
        notificar_usuario: { icon: 'bi-person-fill', color: 'text-primary' },
        notificar_pregunta_frecuente: { icon: 'bi-question-circle-fill', color: 'text-warning' },
        notificar_manual: { icon: 'bi-file-earmark-text-fill', color: 'text-info' },
        notificar_exito: { icon: 'bi-check-circle-fill', color: 'text-success' },
        notificar_informacion: { icon: 'bi-info-circle-fill', color: 'text-info' },

    };

    const { icon, color } = iconMap[tipo];

    // Crear un nuevo Toast
    const toastContainer = document.getElementById('toastContainer');
    // Si no existe, crearlo
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    const toastElement = document.createElement('div');
    toastElement.className = 'toast text-white bg-dark border-0 mb-2';
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');

    // Contenido del Toast
    toastElement.innerHTML = `
        <div class="toast-header bg-dark text-light">
            <i class="bi ${icon} fs-4 me-2 ${color}"></i>
            <strong class="me-auto">${titulo}</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${mensaje}
        </div>
    `;

    // Agregar el Toast al contenedor
    toastContainer.appendChild(toastElement);

    // Inicializar el Toast
    const toast = new bootstrap.Toast(toastElement);
    toast.show();

    // Eliminar el Toast automáticamente después de la duración especificada
    setTimeout(() => {
        toast.hide();
        toastElement.remove();
    }, duracion);
}

/**
 * Inicializa la interactividad del sidebar (menú de navegación)
 * Esta función debe llamarse después de que el DOM esté completamente cargado
 */
export function inicializarSidebar() {
    const btnColapsar = document.getElementById('toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const btnsNavegacion = document.querySelectorAll('#sidebar > ul > li:nth-child(n+3):not(#btnMenuCerrar)'); // Desde el 3er <li> en adelante
    const btnsSubmenu = document.querySelectorAll('#sidebar .sub-menu li'); // Botones de todos los submenús

    // Función para verificar si es vista móvil
    const esVistaMovil = () => window.matchMedia("(max-width: 800px)").matches;

    // Función para cerrar todos los submenús
    const closeAllSubMenus = () => {
        Array.from(sidebar.getElementsByClassName('show')).forEach(ul => {
            ul.classList.remove('show');
            ul.previousElementSibling.classList.remove('rotate');
        });
    };

    // Agregar eventos a los botones de navegación
    btnsNavegacion.forEach(btn => {
        btn.addEventListener('click', () => {
            // Cerrar submenús si no es un btn de submenú
            if (!btn.classList.contains('btn-sub-menu') && esVistaMovil()) {
                closeAllSubMenus();
            }

            // Agregar clase active al botón y quitar de todos los otros si es un botón de submenú
            if (!btn.classList.contains('btn-sub-menu')) {
                btnsSubmenu.forEach(btn => btn.classList.remove('activeSubBtn'));
                btnsNavegacion.forEach(btn => btn.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });

    // Cerrar el submenú si se hace clic fuera de él en la vista móvil
    document.addEventListener('click', (e) => {
        if (esVistaMovil()) {
            // Verificar si el clic fue fuera del sidebar y no en un btnSubmenu
            if (!sidebar.contains(e.target) && !e.target.closest('.dropdown-btn')) {
                closeAllSubMenus();
            }
        }
    });

    // Agregar eventos a los botones de submenú
    btnsSubmenu.forEach(btnSub => {
        btnSub.addEventListener('click', (e) => {
            // Eliminar clase active de todos los botones y submenús
            btnsNavegacion.forEach(btn => btn.classList.remove('active'));
            btnsSubmenu.forEach(btn => btn.classList.remove('activeSubBtn'));

            // Agregar clase active al botón actual
            btnSub.classList.add('activeSubBtn');

            // Buscar el botón del submenú dentro del li más cercano
            const btnSubMenu = btnSub.closest('li.btn-sub-menu');
            if (btnSubMenu) {
                btnSubMenu.classList.add('active');
            }

            e.stopPropagation();  // Evitar propagación del clic
        });
    });

    // Función para alternar el submenú
    window.toggleSubMenu = (button) => {
        if (!button.nextElementSibling.classList.contains('show') && !esVistaMovil()) {
            closeAllSubMenus();
        }

        button.nextElementSibling.classList.toggle('show');
        button.classList.toggle('rotate');

        if (sidebar.classList.contains('close')) {
            sidebar.classList.toggle('close');
            btnColapsar.classList.toggle('rotate');
        }
    };

    // Función para alternar el sidebar
    window.toggleSidebar = function () {
        sidebar.classList.toggle('close');
        btnColapsar.classList.toggle('rotate');
        closeAllSubMenus();
    };

    // Devolver funciones útiles para uso externo
    return {
        // esVistaMovil,
        // closeAllSubMenus
    };
}

/**
 * Cierra la sesión del usuario actual.
 *
 * Esta función realiza los siguientes pasos:
 * 1. Limpia el almacenamiento local del navegador.
 * 2. Envía una solicitud POST al servidor para cerrar la sesión del usuario.
 * 3. Si la respuesta del servidor indica éxito, redirige al usuario a la página de inicio de sesión.
 * 4. Si la respuesta no es exitosa, muestra un mensaje de error al usuario.
 * 5. Maneja errores de red o de servidor mostrando un mensaje de error al usuario.
 */
export function cerrarSesion() {

    // Eliminar localStorage
    localStorage.clear();

    fetch('/logout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.ok) {
            window.location.href = '/login';
        } else {
            console.error('Error al cerrar sesión:', response.statusText);
            Swal.fire('Error', 'No se pudo cerrar sesión. Intenta nuevamente.', 'error');
        }
    }).catch(error => {
        console.error('Error al intentar cerrar sesión:', error);
        Swal.fire('Error', 'Ocurrió un error al cerrar sesión.', 'error');
    });
}




//? FUNCIONES PARA LA SECCIÓN "REPORTES"
/**
 * Genera un PDF a partir de un elemento HTML con opciones mejoradas
 * @param {HTMLElement} elementoHTML - El elemento HTML que se convertirá en PDF
 * @param {string} nombreArchivo - Nombre del archivo PDF a generar
 * @returns {Promise<void>} - Promesa que se resuelve cuando el PDF se ha generado
 */
export async function generarPDFMejorado(elementoHTML, nombreArchivo, tipo) {
    try {
        if (!elementoHTML) {
            throw new Error('Elemento HTML no válido');
        }

        // Mostrar mensaje de generación
        Swal.fire({
            title: 'Generando PDF',
            text: 'Esto puede tomar un momento',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        // Preparar el elemento para la captura
        const estiloOriginal = elementoHTML.style.cssText;
        elementoHTML.style.display = 'block';
        elementoHTML.style.width = '1200px'; // Ancho fijo para mejor renderizado

        // Ajustar el ancho de las tablas para mejor visualización
        const tablas = elementoHTML.querySelectorAll('table');
        tablas.forEach(tabla => {
            tabla.style.width = '100%';
            tabla.style.tableLayout = 'fixed';
            tabla.style.borderCollapse = 'collapse';

            // Optimizar celdas para ocupar menos espacio
            const celdas = tabla.querySelectorAll('td, th');
            celdas.forEach(celda => {
                celda.style.padding = '6px';
                celda.style.fontSize = '12px';
                celda.style.overflow = 'hidden';
                celda.style.textOverflow = 'ellipsis';
                celda.style.whiteSpace = 'nowrap';
            });

            if (tipo === 'incidentes') {
                // Ajustar el ancho de las columnas para que quepan en la página
                const columnas = tabla.querySelectorAll('th');
                if (columnas.length > 0) {
                    // Configuración específica para cada columna
                    if (columnas[0]) columnas[0].style.width = '5%';  // ID
                    if (columnas[1]) columnas[1].style.width = '20%'; // Título
                    if (columnas[2]) columnas[2].style.width = '10%'; // Empresa/RUC
                    if (columnas[3]) columnas[3].style.width = '8%';  // Estado
                    if (columnas[4]) columnas[4].style.width = '12%'; // Fecha
                    if (columnas[5]) columnas[5].style.width = '15%'; // Tiempo Respuesta
                    if (columnas[6]) columnas[6].style.width = '15%'; // Técnico
                }

                // Limitar la longitud del texto en celdas específicas
                const filas = tabla.querySelectorAll('tbody tr');
                filas.forEach(fila => {
                    const celdaTitulo = fila.querySelectorAll('td')[1];
                    if (celdaTitulo && celdaTitulo.textContent.length > 30) {
                        celdaTitulo.title = celdaTitulo.textContent; // Guardar texto completo como título
                        celdaTitulo.textContent = celdaTitulo.textContent.substring(0, 27) + '...';
                    }
                });
            }
        });

        // Esperar a que las imágenes y estilos se carguen completamente
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Opciones para html2canvas
        const options = {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1200,
            windowHeight: elementoHTML.scrollHeight
        };

        // Capturar el HTML como imagen
        const canvas = await html2canvas(elementoHTML, options);

        // Crear el PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: "portrait", // vertical
            unit: "mm",
            format: "a4"
        });

        // Convertir canvas a imagen
        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        // Ajustar la imagen al tamaño del PDF
        const imgWidth = 190; // Ancho del contenido en A4
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pageHeight = 277; // Altura efectiva de una página A4 (297mm - 20mm de margen)

        // Agregar la imagen a la primera página
        pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight);

        // Si la imagen es más grande que una página A4, agregar más páginas
        if (imgHeight > pageHeight) {
            let heightLeft = imgHeight - pageHeight;
            let position = -(pageHeight); // Posición inicial para la segunda página

            while (heightLeft > 0) {
                // Agregar nueva página
                pdf.addPage();
                // Agregar la misma imagen pero con un offset diferente
                pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
                // Reducir la altura restante
                heightLeft -= pageHeight;
                // Ajustar posición para la siguiente página
                position -= pageHeight;
            }
        }

        // Generar el nombre del PDF con la fecha actual
        const fecha = new Date().toLocaleDateString("es-ES").replace(/\//g, '-');
        const nombreCompleto = `${nombreArchivo}_${fecha}.pdf`;

        // Descargar el PDF
        pdf.save(nombreCompleto);

        // Mostrar mensaje de éxito
        Swal.fire({
            title: 'Reporte generado',
            text: `Se ha generado un PDF`,
            icon: 'success',
            confirmButtonColor: '#0A1E2E'
        });

        // Restaurar el estilo original del elemento
        elementoHTML.style.cssText = estiloOriginal;

        // Restaurar estilos de las tablas
        tablas.forEach(tabla => {
            tabla.style.width = '';
            tabla.style.tableLayout = '';
            tabla.style.borderCollapse = '';

            const celdas = tabla.querySelectorAll('td, th');
            celdas.forEach(celda => {
                celda.style.padding = '';
                celda.style.fontSize = '';
                celda.style.overflow = '';
                celda.style.textOverflow = '';
                celda.style.whiteSpace = '';
            });

            const columnas = tabla.querySelectorAll('th');
            columnas.forEach(col => {
                col.style.width = '';
            });
        });

        return true;
    } catch (error) {
        console.error("Error al generar el PDF:", error);
        alert("Ocurrió un error al generar el PDF. Por favor, intente nuevamente.");
        return false;
    }
}
/**
 * Genera un reporte de incidentes o desempeño según los filtros seleccionados por el usuario.
 * El reporte se guarda en localStorage y se muestra en la sección "Reportes Generados".
 * Si no se encuentran incidentes que coincidan con los filtros, se muestra una notificación
 * informativa.
 */
export function generarReporte(listadoGeneralIncidentes) {
    // Obtener los valores de los filtros
    const fechaInicio = document.querySelector('#fechaInicio').value;
    const fechaFin = document.querySelector('#fechaFin').value;
    const estado = document.querySelector('#estadoReporte').value;
    const empresa = document.querySelector('#empresaReporte').value.trim().toLowerCase();
    const tipoReporte = document.querySelector('input[name="tipoReporte"]:checked').value;
    const formatoReporte = document.querySelector('input[name="formatoReporte"]:checked').value;

    // Validar fechas
    if (!fechaInicio || !fechaFin) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, seleccione un rango de fechas válido',
            icon: 'error',
            confirmButtonColor: '#0A1E2E'
        });
        return;
    }

    // Convertir fechas a objetos Date para comparación
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);

    // Validar que la fecha de inicio sea anterior a la fecha fin
    if (fechaInicioObj > fechaFinObj) {
        Swal.fire({
            title: 'Error',
            text: 'La fecha de inicio debe ser anterior a la fecha fin',
            icon: 'error',
            confirmButtonColor: '#0A1E2E'
        });
        return;
    }

    // Filtrar incidentes según los criterios
    const incidentesFiltrados = listadoGeneralIncidentes.filter(incidente => {
        const fechaIncidente = new Date(incidente.fecha_creacion);
        const cumpleFecha = fechaIncidente >= fechaInicioObj && fechaIncidente <= fechaFinObj;
        const cumpleEstado = !estado || incidente.estado === estado;
        const cumpleEmpresa = !empresa || incidente.ruc_empresa.toLowerCase().includes(empresa);

        return cumpleFecha && cumpleEstado && cumpleEmpresa;
    });

    // Verificar si hay resultados
    if (incidentesFiltrados.length === 0) {
        Swal.fire({
            title: 'Sin resultados',
            text: 'No se encontraron incidentes que coincidan con los criterios de búsqueda',
            icon: 'info',
            confirmButtonColor: '#0A1E2E'
        });
        return;
    }

    console.log("Total incidentes:", listadoGeneralIncidentes.length);
    console.log("Incidentes filtrados:", incidentesFiltrados.length);

    // Generar el reporte según el tipo seleccionado
    let reporteData;
    if (tipoReporte === 'incidentes') {
        reporteData = generarReporteIncidentes(incidentesFiltrados);
    } else {
        reporteData = generarReporteDesempenio(incidentesFiltrados);
    }

    // Guardar el reporte en localStorage
    const reporteId = 'reporte_' + Date.now();
    const reporteInfo = {
        id: reporteId,
        fecha: new Date().toISOString(),
        tipo: tipoReporte,
        formato: formatoReporte,
        filtros: {
            fechaInicio,
            fechaFin,
            estado,
            empresa
        },
        data: reporteData
    };

    // Guardar en localStorage
    const reportesGuardados = JSON.parse(localStorage.getItem('reportes_soporte') || '[]');
    reportesGuardados.push(reporteInfo);
    localStorage.setItem('reportes_soporte', JSON.stringify(reportesGuardados));

    // Mostrar el nuevo reporte
    const contenedor = document.querySelector('#contenedorReportesGenerados');
    mostrarReporte(reporteInfo, contenedor, true); // Agregar true para indicar que es un reporte nuevo

    // Mostrar notificación de éxito
    mostrarNotificacion(
        'Reporte Generado',
        `Se ha generado el reporte con ${incidentesFiltrados.length} incidentes.`,
        'notificar_exito',
        2000
    );
}
/**
 * Genera un reporte de incidentes en formato de objeto.
 * El reporte contiene la siguiente información:
 * - Título del reporte
 * - Fecha de generación del reporte
 * - Número total de incidentes
 * - Número de incidentes pendientes
 * - Número de incidentes resueltos
 * - Un arreglo de objetos, cada uno representando un incidente:
 *   - ID del incidente
 *   - Título del incidente
 *   - Descripción del incidente
 *   - RUC de la empresa del incidente
 *   - Estado del incidente
 *   - Fecha de creación del incidente
 *   - Tiempo de respuesta del incidente (en formato de string, 'X días, Y horas')
 *   - Técnico asignado al incidente (en formato de string, 'Nombres Apellidos')
 * @param {array} incidentes - Arreglo de objetos con los incidentes a reportar
 * @returns {object} - Reporte de incidentes en formato de objeto
 */
export function generarReporteIncidentes(incidentes) {
    // Ordenar incidentes por fecha (más reciente primero)
    const incidentesOrdenados = [...incidentes].sort((a, b) =>
        new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
    );

    // Crear estructura de datos para el reporte
    return {
        titulo: 'Reporte de Incidentes',
        fecha: new Date().toLocaleDateString("es-ES"),
        totalIncidentes: incidentes.length,
        incidentesPendientes: incidentes.filter(inc => inc.estado === 'Pendiente').length,
        incidentesResueltos: incidentes.filter(inc => inc.estado === 'Resuelto').length,
        incidentes: incidentesOrdenados.map(inc => {
            // Determinar si el incidente tiene técnico asignado
            let tecnico_asignado = 'No asignado';

            if (inc.tecnico_asignado.length > 0) {
                // Obtener el técnico asignado
                const tecnico = inc.tecnico_asignado[0]; // Siempre es el primer técnico, ya que no hay reasignación
                tecnico_asignado = `${tecnico.nombres || ''} ${tecnico.apellidos || ''}`.trim();
            }

            return {
                id_incidente: inc.id_incidente,
                titulo: inc.titulo,
                descripcion_incidente: inc.descripcion_incidente,
                ruc_empresa: inc.ruc_empresa,
                estado: inc.estado,
                fecha_creacion: formatearFechaHora(inc.fecha_creacion).fecha + ' ' + formatearFechaHora(inc.fecha_creacion).hora,
                tiempoRespuesta: inc.fecha_cierre ? calcularTiempoRespuesta(inc.fecha_creacion, inc.fecha_cierre) : 'Sin respuesta',
                tecnico_asignado: tecnico_asignado
            };
        })
    };
}
/**
 * Genera un reporte de desempeño de incidentes.
 * El reporte contiene la siguiente información:
 * - Título del reporte
 * - Fecha de generación del reporte
 * - Total de incidentes
 * - Porcentaje de incidentes resueltos
 * - Tiempo promedio de respuesta
 * - Un arreglo de objetos, cada uno representando un técnico:
 *   - Nombre del técnico
 *   - Total de incidentes asignados
 *   - Porcentaje de incidentes resueltos
 *   - Tiempo promedio de respuesta
 * @param {array} incidentes - Arreglo de objetos con los incidentes a reportar
 * @returns {object} - Reporte de desempeño en formato de objeto
 */
export function generarReporteDesempenio(incidentes) {
    // Calcular métricas de desempeño
    const totalIncidentes = incidentes.length;
    const incidentesResueltos = incidentes.filter(inc => inc.estado === 'Resuelto');
    const porcentajeResueltos = totalIncidentes > 0 ? (incidentesResueltos.length / totalIncidentes * 100).toFixed(2) : 0;

    // Calcular tiempo promedio de respuesta (solo para incidentes resueltos con respuesta)
    let tiemposTotales = 0;
    let incidentesConRespuesta = 0;

    incidentesResueltos.forEach(inc => {
        if (inc.fecha_cierre) {
            const tiempoRespuesta = new Date(inc.fecha_cierre) - new Date(inc.fecha_creacion);
            tiemposTotales += tiempoRespuesta;
            incidentesConRespuesta++;
        }
    });

    const tiempoPromedioMs = incidentesConRespuesta > 0 ? tiemposTotales / incidentesConRespuesta : 0;
    const tiempoPromedioDias = (tiempoPromedioMs / (1000 * 60 * 60 * 24)).toFixed(2);
    const tiempoPromedioHoras = (tiempoPromedioMs / (1000 * 60 * 60)).toFixed(2);

    // Agrupar por empresa para análisis
    const incidentesPorEmpresa = {};
    incidentes.forEach(inc => {
        if (!incidentesPorEmpresa[inc.ruc_empresa]) {
            incidentesPorEmpresa[inc.ruc_empresa] = [];
        }
        incidentesPorEmpresa[inc.ruc_empresa].push(inc);
    });

    const empresasAnalisis = Object.keys(incidentesPorEmpresa).map(empresa => {
        const incidentesEmpresa = incidentesPorEmpresa[empresa];
        const resueltosEmpresa = incidentesEmpresa.filter(inc => inc.estado === 'Resuelto').length;
        const porcentajeResueltosEmpresa = (resueltosEmpresa / incidentesEmpresa.length * 100).toFixed(2);

        return {
            nombre: empresa,
            totalIncidentes: incidentesEmpresa.length,
            incidentesResueltos: resueltosEmpresa,
            porcentajeResueltos: porcentajeResueltosEmpresa
        };
    });


    return {
        titulo: 'Reporte de Desempeño',
        fecha: new Date().toLocaleDateString("es-ES"),
        totalIncidentes,
        incidentesResueltos: incidentesResueltos.length,
        porcentajeResueltos,
        tiempoPromedioRespuestaDias: Math.abs(tiempoPromedioDias),
        tiempoPromedioRespuestaHoras: Math.abs(tiempoPromedioHoras),
        analisisPorEmpresa: empresasAnalisis
    };
}
/**
 * Muestra un reporte guardado en el contenedor indicado.
 * 
 * Verifica si el reporte ya existe en el DOM para evitar duplicados.
 * Si no existe, crea un elemento para mostrar el reporte y lo agrega
 * al contenedor.
 * 
 * @param {object} reporteInfo Información del reporte a mostrar.
 * @param {HTMLElement} contenedor Contenedor donde se mostrará el reporte.
 * @param {boolean} esNuevo Indica si el reporte es nuevo para aplicar efectos visuales
 */
export function mostrarReporte(reporteInfo, contenedor, esNuevo = false) {

    // Crear elemento para el reporte
    const reporteElement = document.createElement('div');
    reporteElement.className = 'card shadow-sm border-0 p-3 mb-3';
    reporteElement.dataset.reporteId = reporteInfo.id;

    // Determinar el tipo de reporte para mostrar
    const tipoReporteTexto = reporteInfo.tipo === 'incidentes' ? 'Reporte de Incidentes' : 'Reporte de Desempeño';
    const iconoTipo = reporteInfo.tipo === 'incidentes' ? 'bi-list-check' : 'bi-graph-up';
    const colorTipo = reporteInfo.tipo === 'incidentes' ? 'text-primary' : 'text-success';
    const bgTipo = reporteInfo.tipo === 'incidentes' ? 'reporte-incidentes' : 'reporte-desempenio';

    // Determinar el formato
    const formatoIcono = reporteInfo.formato === 'pdf' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-text';
    const bgTipoFormato = reporteInfo.formato === 'pdf' ? 'bg-danger' : 'bg-primary';

    // Agregar clase según el tipo de reporte
    reporteElement.classList.add(bgTipo);

    // Agregar clase para identificar el encabezado del reporte
    reporteElement.classList.add("reporte-header");

    // Aplicar clase de destello si es un reporte nuevo
    if (esNuevo) {
        // Primero agregamos la clase bg-light para que luego sea reemplazada por la animación
        reporteElement.classList.add('reporte-nuevo');
    }

    // Formatear fecha
    const fechaReporte = new Date(reporteInfo.fecha);
    const fechaFormateada = fechaReporte.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Crear contenido del reporte
    reporteElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="mb-0">
                <i class="bi fw-bolder ${iconoTipo} ${colorTipo} me-2 "></i>${tipoReporteTexto}
            </h5>
            <span class="badge ${bgTipoFormato}">
                <i class="bi ${formatoIcono} me-1"></i>${reporteInfo.formato.toUpperCase()}
            </span>
        </div>
        <div class="mb-1 small text-muted">
            <i class="bi bi-calendar-date me-1"></i>Generado: ${fechaFormateada}
        </div>
        <div class="mb-1 small">
            <strong>Filtros:</strong> 
            ${reporteInfo.filtros.fechaInicio} - ${reporteInfo.filtros.fechaFin}
            ${reporteInfo.filtros.estado ? ', Estado: ' + reporteInfo.filtros.estado : ''}
            ${reporteInfo.filtros.empresa ? ', Empresa: ' + reporteInfo.filtros.empresa : ''}
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <span class="badge bg-dark me-1">${reporteInfo.data.totalIncidentes} incidentes / ${reporteInfo.data.incidentesResueltos} resueltos</span>
            </div>
            <div>
                <button class="btn btn-sm btn-success btn-descargar-reporte" data-reporte-id="${reporteInfo.id}">
                    <i class="bi bi-download me-1"></i>Descargar
                </button>
                <button class="btn btn-sm btn-outline-danger btn-eliminar-reporte" data-reporte-id="${reporteInfo.id}">
                    <i class="bi bi-trash me-1"></i>Eliminar
                </button>
            </div>
        </div>
    `;

    // Agregar al principio del contenedor
    contenedor.insertBefore(reporteElement, contenedor.firstChild);
}
/**
 * Muestra un reporte guardado en el contenedor indicado.
 * 
 * Verifica si el reporte ya existe en el DOM para evitar duplicados.
 * Si no existe, crea un elemento para mostrar el reporte y lo agrega
 * al contenedor.
 * 
 * @param {object} reporteInfo Información del reporte a mostrar.
 * @param {HTMLElement} contenedor Contenedor donde se mostrará el reporte.
 */
export function eliminarReporte(reporteId) {
    // Obtener reportes del localStorage
    const reportesGuardados = JSON.parse(localStorage.getItem('reportes_soporte') || '[]');

    // Filtrar para eliminar el reporte seleccionado
    const reportesActualizados = reportesGuardados.filter(reporte => reporte.id !== reporteId);

    // Guardar en localStorage
    localStorage.setItem('reportes_soporte', JSON.stringify(reportesActualizados));

    // Eliminar del DOM
    const reporteElement = document.querySelector(`[data-reporte-id="${reporteId}"]`);
    if (reporteElement) {
        reporteElement.remove();
    }

}
/**
 * Restablece los valores de los filtros de búsqueda en la sección de Reportes.
 * 
 * El rango de fechas se establece en el mes actual y el mes anterior.
 * Los demás filtros se establecen en vacíos.
 * 
 * Se muestra una notificación para informar al usuario sobre el restablecimiento de los filtros.
 */
export function limpiarFiltrosReporte() {
    // Restablecer los valores de los filtros
    const fechaActual = new Date();
    // Formatear la fecha para datetime-local
    const fechaFinFormateada = fechaActual.toISOString().slice(0, 16);
    document.querySelector('#fechaFin').value = fechaFinFormateada;

    const fechaUnMesAtras = new Date();
    fechaUnMesAtras.setMonth(fechaUnMesAtras.getMonth() - 1);
    // Formatear la fecha para datetime-local
    const fechaInicioFormateada = fechaUnMesAtras.toISOString().slice(0, 16);
    document.querySelector('#fechaInicio').value = fechaInicioFormateada;

    document.querySelector('#estadoReporte').value = '';
    document.querySelector('#empresaReporte').value = '';

    // Mostrar notificación
    mostrarNotificacion(
        'Filtros Restablecidos',
        'Se han restablecidos todos los filtros de búsqueda.',
        'notificar_informacion',
        2000
    );
}
/**
 * Carga y muestra los reportes guardados en el contenedor proporcionado.
 * 
 * Obtiene los reportes previamente guardados en el localStorage bajo la clave 'reportes_soporte'.
 * Si hay reportes disponibles, cada uno se muestra utilizando la función mostrarReporte.
 * 
 * @param {HTMLElement} contenedor - El contenedor donde se mostrarán los reportes guardados.
 */
export function cargarReportesGuardados(contenedor) {

    const reportesGuardados = JSON.parse(localStorage.getItem('reportes_soporte') || '[]');

    if (reportesGuardados.length > 0) {

        // Mostrar cada reporte guardado
        reportesGuardados.forEach(reporte => {
            mostrarReporte(reporte, contenedor);
        });
    }
}
/**
 * Calcula el tiempo de respuesta para un incidente.
 * 
 * @param {string} fechaCreacion - Fecha de creación del incidente.
 * @param {string} fechaRespuesta - Fecha de respuesta al incidente.
 * @returns {string} - Tiempo de respuesta en formato "X días, Y horas, Z minutos".
 * 
 * Si no hay fecha de respuesta, retorna 'Sin respuesta'.
 */
export function calcularTiempoRespuesta(fechaCreacion, fechaRespuesta) {
    if (!fechaRespuesta) return 'Sin respuesta';

    const inicio = new Date(fechaCreacion);
    const fin = new Date(fechaRespuesta);
    const diferencia = fin - inicio;

    // Convertir a días, horas y minutos
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

    let resultado = '';
    if (dias > 0) resultado += `${dias} día${dias !== 1 ? 's' : ''} `;
    if (horas > 0) resultado += `${horas} hora${horas !== 1 ? 's' : ''} `;
    if (minutos > 0) resultado += `${minutos} minuto${minutos !== 1 ? 's' : ''}`;

    return resultado.trim() || 'Menos de un minuto';
}




/**
 * Descarga un reporte en formato PDF o CSV según sea seleccionado.
 * @param {{ tipo: string, formato: 'pdf'|'csv', data: any }} reporteInfo - Información del reporte a descargar.
 * @returns {void}
 */
export function descargarReporte(reporteInfo) {
    const { tipo, formato, data } = reporteInfo;

    // Generar el contenido según el formato seleccionado
    let contenido;
    let nombreArchivo;
    let tipoMime;

    if (formato === 'pdf') {
        nombreArchivo = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`;
        tipoMime = 'application/pdf';
        llenarGenerarPDF(data, tipo);
        return;
    } else if (formato === 'csv') {
        nombreArchivo = `reporte_${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
        tipoMime = 'text/csv';
        contenido = generarContenidoCSV(data, tipo);

        // Crear y descargar el archivo
        const blob = new Blob([contenido], { type: tipoMime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
/**
 * Genera el contenido CSV para un reporte de incidentes.
 * 
 * @param {Object} data - Datos del reporte de incidentes.
 * @param {string} tipo - Tipo de reporte (incidentes).
 * @returns {string} - Cadena de texto con el contenido CSV.
 */
export function generarContenidoCSV(data, tipo) {
    let csv = '';

    if (tipo === 'incidentes') {
        // Encabezados
        csv = 'ID,Título,Descripción,Empresa,Estado,Fecha Creación,Tiempo Respuesta,Técnico Asignado\n';

        // Datos
        data.incidentes.forEach(inc => {
            csv += `"${inc.id_incidente}","${inc.titulo.replace(/"/g, '""')}","${inc.descripcion_incidente.replace(/"/g, '""')}","${inc.ruc_empresa}","${inc.estado}","${inc.fecha_creacion}","${inc.tiempoRespuesta}","${inc.tecnico_asignado.replace(/"/g, '""')}"\n`;
        });
    } else {
        // Reporte de desempeño
        csv = 'Métrica,Valor\n';
        csv += `"Total de Incidentes","${data.totalIncidentes}"\n`;
        csv += `"Incidentes Resueltos","${data.incidentesResueltos}"\n`;
        csv += `"Porcentaje Resueltos","${data.porcentajeResueltos}%"\n`;
        csv += `"Tiempo Promedio de Respuesta (Días)","${data.tiempoPromedioRespuestaDias}"\n`;
        csv += `"Tiempo Promedio de Respuesta (Horas)","${data.tiempoPromedioRespuestaHoras}"\n\n`;

        // Análisis por empresa
        csv += 'Empresa,Total Incidentes,Incidentes Resueltos,Porcentaje Resueltos\n';
        data.analisisPorEmpresa.forEach(emp => {
            csv += `"${emp.nombre}","${emp.totalIncidentes}","${emp.incidentesResueltos}","${emp.porcentajeResueltos}%"\n`;
        });
    }

    return csv;
}
/**
 * Llena el reporte de incidentes o desempeño en el contenedor proporcionado.
 * 
 * @param {Object} data - Datos del reporte de incidentes o desempeño.
 * @param {string} tipo - Tipo de reporte ("incidentes" o "desempeño").
 * 
 * @returns {void}
 */
export async function llenarGenerarPDF(data, tipo) {
    try {
        // Establecer la fecha actual en el HTML
        const fechaActual = new Date().toLocaleDateString("es-ES")

        if (tipo === 'incidentes') {
            // Si hay muchos incidentes, usar la función de paginación
            if (data.incidentes.length > 50) {
                await generarReporteIncidentesPaginado(data);
                return;
            }

        } else {
            await llenarReporteDesempenio(data);
            const elemento = document.getElementById("reportePDFDesempenio");
            // Establecer la fecha en el reporte de desempeño
            elemento.querySelector("#fechaGeneracion").textContent = fechaActual;
            let nombrePDF = 'Reporte_Desempeño';

            // Usar la función de utilidad para generar el PDF
            await generarPDFMejorado(elemento, nombrePDF, tipo);
        }


    } catch (error) {
        console.error("Error al generar el PDF:", error);
        alert("Ocurrió un error al generar el PDF. Por favor, intente nuevamente.");
    }
}
/**
 * Genera un reporte de incidentes paginado cuando hay demasiados incidentes
 * para un solo PDF. Divide los incidentes en grupos más pequeños y genera
 * un solo PDF con múltiples páginas.
 * @param {Object} data - Datos del reporte de incidentes
 */
export async function generarReporteIncidentesPaginado(data) {
    try {
        // Número máximo de incidentes por página
        const maxIncidentesPorPagina = 30;

        // Calcular número total de páginas necesarias
        const totalIncidentes = data.incidentes.length;
        const totalPaginas = Math.ceil(totalIncidentes / maxIncidentesPorPagina);

        // Mostrar mensaje al usuario
        Swal.fire({
            title: 'Generando reporte',
            text: `Se generará un PDF con ${totalPaginas} páginas debido a la cantidad de incidentes (${totalIncidentes}), esto puede tomar un tiempo.`,
            confirmButtonColor: '#0A1E2E',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        // Fecha actual para el nombre de archivo
        const fechaActual = new Date().toLocaleDateString("es-ES").replace(/\//g, '-');
        const nombrePDF = `Reporte_Incidentes_${fechaActual}`;

        // Crear el PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: "portrait", // vertical
            unit: "mm",
            format: "a4"
        });

        // Generar cada página del PDF
        for (let pagina = 0; pagina < totalPaginas; pagina++) {
            // Calcular el rango de incidentes para esta página
            const inicio = pagina * maxIncidentesPorPagina;
            const fin = Math.min(inicio + maxIncidentesPorPagina, totalIncidentes);

            // Crear una copia de los datos con solo los incidentes de esta página
            const dataPagina = {
                ...data,
                incidentes: data.incidentes.slice(inicio, fin)
            };

            // Llenar el reporte con los incidentes de esta página
            // Solo mostrar el encabezado completo en la primera página
            await llenarReporteIncidentes(dataPagina.incidentes, pagina === 0);

            // Obtener el elemento HTML del reporte
            const elemento = document.getElementById("reportePDFIncidentes");

            // Establecer la fecha en el reporte
            elemento.querySelector("#fechaGeneracion").textContent = new Date().toLocaleDateString("es-ES");

            // En la primera página, mostrar el total de incidentes global (no solo de esta página)
            if (pagina === 0) {
                elemento.querySelector("#totalIncidentes").textContent = totalIncidentes;
                elemento.querySelector("#incidentesPendientes").textContent = data.incidentes.filter(inc => inc.estado === 'Pendiente').length;
                elemento.querySelector("#incidentesResueltos").textContent = data.incidentes.filter(inc => inc.estado === 'Resuelto').length;
            }

            // Agregar información de paginación
            const infoElement = elemento.querySelector(".tabla-incidentes");
            if (infoElement) {
                const paginacionInfo = document.createElement("p");
                paginacionInfo.className = "text-muted mt-2 mb-3";
                paginacionInfo.textContent = `Página ${pagina + 1} de ${totalPaginas} (Incidentes ${inicio + 1} - ${fin} de ${totalIncidentes})`;
                infoElement.insertBefore(paginacionInfo, infoElement.firstChild);
            }

            // Preparar el elemento para la captura
            const estiloOriginal = elemento.style.cssText;
            elemento.style.display = 'block';
            elemento.style.width = '1200px'; // Ancho fijo para mejor renderizado

            // Ajustar tablas para mejor visualización
            const tablas = elemento.querySelectorAll('table');
            tablas.forEach(tabla => {
                tabla.style.width = '100%';
                tabla.style.tableLayout = 'fixed';
                tabla.style.borderCollapse = 'collapse';

                // Optimizar celdas para ocupar menos espacio
                const celdas = tabla.querySelectorAll('td, th');
                celdas.forEach(celda => {
                    celda.style.padding = '6px';
                    celda.style.fontSize = '12px';
                    celda.style.overflow = 'hidden';
                    celda.style.textOverflow = 'ellipsis';
                    celda.style.whiteSpace = 'nowrap';
                });

                // Ajustar el ancho de las columnas para que quepan en la página
                const columnas = tabla.querySelectorAll('th');
                if (columnas.length > 0) {
                    // Configuración específica para cada columna
                    if (columnas[0]) columnas[0].style.width = '5%';  // ID
                    if (columnas[1]) columnas[1].style.width = '20%'; // Título
                    if (columnas[2]) columnas[2].style.width = '10%'; // Empresa/RUC
                    if (columnas[3]) columnas[3].style.width = '8%';  // Estado
                    if (columnas[4]) columnas[4].style.width = '12%'; // Fecha
                    if (columnas[5]) columnas[5].style.width = '15%'; // Tiempo Respuesta
                    if (columnas[6]) columnas[6].style.width = '15%'; // Técnico
                }

                // Limitar la longitud del texto en celdas específicas
                const filas = tabla.querySelectorAll('tbody tr');
                filas.forEach(fila => {
                    const celdaTitulo = fila.querySelectorAll('td')[1];
                    if (celdaTitulo && celdaTitulo.textContent.length > 30) {
                        celdaTitulo.title = celdaTitulo.textContent; // Guardar texto completo como título
                        celdaTitulo.textContent = celdaTitulo.textContent.substring(0, 27) + '...';
                    }
                });
            });

            // Esperar a que las imágenes y estilos se carguen completamente
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Opciones para html2canvas
            const options = {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 1200,
                windowHeight: elemento.scrollHeight
            };

            // Capturar el HTML como imagen
            const canvas = await html2canvas(elemento, options);

            // Convertir canvas a imagen
            const imgData = canvas.toDataURL('image/jpeg', 1.0);

            // Ajustar la imagen al tamaño del PDF
            const imgWidth = 190; // Ancho del contenido en A4
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const pageHeight = 277; // Altura efectiva de una página A4 (297mm - 20mm de margen)

            // Si no es la primera página, agregar una nueva página al PDF
            if (pagina > 0) {
                pdf.addPage();
            }

            // Agregar la imagen a la página actual
            pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight);

            // Restaurar el estilo original del elemento
            elemento.style.cssText = estiloOriginal;

            // Restaurar estilos de las tablas
            tablas.forEach(tabla => {
                tabla.style.width = '';
                tabla.style.tableLayout = '';
                tabla.style.borderCollapse = '';

                const celdas = tabla.querySelectorAll('td, th');
                celdas.forEach(celda => {
                    celda.style.padding = '';
                    celda.style.fontSize = '';
                    celda.style.overflow = '';
                    celda.style.textOverflow = '';
                    celda.style.whiteSpace = '';
                });

                const columnas = tabla.querySelectorAll('th');
                columnas.forEach(col => {
                    col.style.width = '';
                });
            });

            // Eliminar la información de paginación para la siguiente iteración
            if (infoElement && infoElement.firstChild && infoElement.firstChild.className && infoElement.firstChild.className.includes('text-muted')) {
                infoElement.removeChild(infoElement.firstChild);
            }

            // Pequeña pausa para evitar problemas de rendimiento
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Guardar el PDF completo
        pdf.save(`${nombrePDF}.pdf`);

        // Mostrar mensaje de éxito
        Swal.fire({
            title: 'Reporte generado',
            text: `Se ha generado un PDF con ${totalPaginas} páginas`,
            icon: 'success',
            confirmButtonColor: '#0A1E2E'
        });

    } catch (error) {
        console.error("Error al generar reporte paginado:", error);
        Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al generar el reporte paginado',
            icon: 'error',
            confirmButtonColor: '#0A1E2E'
        });
    }
}
/**
 * Llena el reporte de incidentes con los datos proporcionados.
 * 
 * @param {Object[]} incidentes - Arreglo de objetos con los datos de los incidentes
 * @param {boolean} [mostrarEncabezadoCompleto=true] - Indica si se debe mostrar el encabezado completo
 *                                                  con los datos de los filtros y métricas. Si se omite,
 *                                                  se mostrará el encabezado simplificado sin los datos
 *                                                  de los filtros y métricas.
 */
export async function llenarReporteIncidentes(incidentes, mostrarEncabezadoCompleto = true) {
    const contenedor = document.getElementById("contenedorReporteIncidentes");
    contenedor.innerHTML = ""; // Limpiar la tabla antes de llenarla
    // Template
    const template = document.getElementById("templateReporteIncidentes").content;
    const fragmento = document.createDocumentFragment();

    // Clonar el template
    const clon = template.cloneNode(true);

    // Llenar los datos del encabezado y métricas
    if (mostrarEncabezadoCompleto) {
        clon.querySelector("#totalIncidentes").textContent = incidentes.length;
        clon.querySelector("#incidentesPendientes").textContent = incidentes.filter(inc => inc.estado === 'Pendiente').length;
        clon.querySelector("#incidentesResueltos").textContent = incidentes.filter(inc => inc.estado === 'Resuelto').length;

        // Obtener datos de los filtros del formulario y llenar
        const fechaInicio = document.getElementById("fechaInicio").value;
        const fechaFin = document.getElementById("fechaFin").value;
        const estado = document.getElementById("estadoReporte").value;
        const empresa = document.getElementById("empresaReporte").value;

        clon.querySelector("#periodoReporte").textContent = `${fechaInicio} - ${fechaFin}`;
        clon.querySelector("#estadoReporte").textContent = estado || "Todos";
        clon.querySelector("#empresaReporte").textContent = empresa || "Todas";
    } else {
        // Ocultar elementos del encabezado en páginas que no son la primera
        const headerElement = clon.querySelector(".header-reporte");
        if (headerElement) headerElement.style.display = 'none';

        const infoResumen = clon.querySelector(".info-resumen");
        if (infoResumen) infoResumen.style.display = 'none';

        const filtrosAplicados = clon.querySelector(".filtros-aplicados");
        if (filtrosAplicados) filtrosAplicados.style.display = 'none';
    }

    // Agregar clase para identificar el encabezado del reporte
    const headerElement = clon.querySelector(".card");
    if (headerElement) {
        headerElement.classList.add("reporte-header");
    }

    // Llenar la tabla de incidentes
    const tablaDetalleIncidentes = clon.querySelector("#tablaDetalleIncidentes");

    // Ordenar incidentes por fecha (más reciente primero)
    const incidentesOrdenados = [...incidentes].sort((a, b) =>
        new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
    );

    // Poblar la tabla con los datos de incidentes
    incidentesOrdenados.forEach(inc => {
        const fila = document.createElement("tr");

        // Acortar el título si es muy largo para mejorar visualización en PDF
        let titulo = inc.titulo || 'Sin título';
        if (titulo.length > 40) {
            titulo = titulo.substring(0, 37) + '...';
        }

        // Crear la fila con los datos del incidente
        fila.innerHTML = `
            <td>${inc.id_incidente || 'N/A'}</td>
            <td title="${inc.titulo || ''}">${titulo}</td>
            <td>${inc.ruc_empresa || 'N/A'}</td>
            <td><span class="badge ${inc.estado === 'Pendiente' ? 'bg-danger' : 'bg-success'}">${inc.estado || 'N/A'}</span></td>
            <td>${inc.fecha_creacion ? inc.fecha_creacion: 'Fecha no disponible'}</td>
            <td>${inc.tiempoRespuesta}</td>
            <td>${inc.tecnico_asignado}</td>
        `;

        tablaDetalleIncidentes.appendChild(fila);
    });

    // Agregar el clon al fragmento
    fragmento.appendChild(clon);

    // Añadir el fragmento al contenedor
    contenedor.appendChild(fragmento);
}
/**
 * Llena el reporte de desempeño con los datos proporcionados.
 * @param {object} data - Datos del reporte de desempeño
 */
export async function llenarReporteDesempenio(data) {
    const contenedor = document.getElementById("contenedorReporteDesempenio");
    contenedor.innerHTML = ""; // Limpiar la tabla antes de llenarla
    // Template
    const template = document.getElementById("templateReporteDesempenio").content;
    const fragmento = document.createDocumentFragment();

    // Clonar el template
    const clon = template.cloneNode(true);

    // Llenar los datos del encabezado y métricas
    clon.querySelector("#totalIncidentesDesempenio").textContent = data.totalIncidentes;
    clon.querySelector("#incidentesResueltosDesempenio").textContent = data.incidentesResueltos;
    clon.querySelector("#porcentajeResueltos").textContent = `${data.porcentajeResueltos}%`;


    // Determinar qué tiempo mostrar (horas o días)
    const tiempoPromedio = parseFloat(data.tiempoPromedioRespuestaHoras) < 24
        ? `${data.tiempoPromedioRespuestaHoras} h`
        : `${data.tiempoPromedioRespuestaDias} d`;

    clon.querySelector("#tiempoPromedioRespuesta").textContent = tiempoPromedio;

    // Obtener datos de los filtros del formulario y llenar
    const fechaInicio = document.getElementById("fechaInicio").value;
    const fechaFin = document.getElementById("fechaFin").value;
    const estado = document.getElementById("estadoReporte").value;
    const empresa = document.getElementById("empresaReporte").value;

    clon.querySelector("#periodoReporteDesempenio").textContent = `${fechaInicio} - ${fechaFin}`;
    clon.querySelector("#estadoReporteDesempenio").textContent = estado || "Todos";
    clon.querySelector("#empresaReporteDesempenio").textContent = empresa || "Todas";

    // Llenar la tabla de desempeño por empresa
    const tablaDesempenioEmpresas = clon.querySelector("#tablaDesempenioEmpresas");

    // Ordenar empresas por porcentaje de resolución (mayor primero)
    const empresasOrdenadas = [...data.analisisPorEmpresa].sort((a, b) =>
        parseFloat(b.porcentajeResueltos) - parseFloat(a.porcentajeResueltos)
    );

    // Poblar la tabla con los datos de empresas
    empresasOrdenadas.forEach(empresa => {
        const fila = document.createElement("tr");

        // Crear la fila con los datos de la empresa
        fila.innerHTML = `
            <td>${empresa.nombre}</td>
            <td>${empresa.totalIncidentes}</td>
            <td>${empresa.incidentesResueltos}</td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="progress flex-grow-1 me-2" style="height: 8px;">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${empresa.porcentajeResueltos}%"></div>
                    </div>
                    <span>${empresa.porcentajeResueltos}%</span>
                </div>
            </td>
        `;

        tablaDesempenioEmpresas.appendChild(fila);
    });

    // Agregar el clon al fragmento
    fragmento.appendChild(clon);

    // Añadir el fragmento al contenedor
    contenedor.appendChild(fragmento);

    // Generar gráficos con Chart.js
    setTimeout(() => {
        generarGraficosDesempenio(data);
    }, 100);
}
/**
 * Genera los gráficos para el reporte de desempeño utilizando Chart.js
 * @param {object} data - Datos del reporte de desempeño
 */
export function generarGraficosDesempenio(data) {
    try {
        // Destruir gráficos existentes si los hay
        const chartElements = document.querySelectorAll('canvas.chart-js-instance');
        chartElements.forEach(canvas => {
            if (canvas.chart) {
                canvas.chart.destroy();
            }
        });

        // 1. Gráfico de distribución de incidentes (Pendientes vs Resueltos)
        const ctxDistribucion = document.getElementById('graficoDistribucion');
        if (ctxDistribucion) {
            ctxDistribucion.innerHTML = '';
            const canvasDistribucion = document.createElement('canvas');
            canvasDistribucion.className = 'chart-js-instance';
            canvasDistribucion.height = 200;
            ctxDistribucion.appendChild(canvasDistribucion);

            const pendientes = data.totalIncidentes - data.incidentesResueltos;
            const resueltos = data.incidentesResueltos;

            const chartDistribucion = new Chart(canvasDistribucion, {
                type: 'doughnut',
                data: {
                    labels: ['Pendientes', 'Resueltos'],
                    datasets: [{
                        data: [pendientes, resueltos],
                        backgroundColor: ['#dc3545', '#198754'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const value = context.raw;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${context.label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });

            // Guardar referencia al gráfico para poder destruirlo después
            canvasDistribucion.chart = chartDistribucion;
        }

        // 2. Gráfico de tiempo de respuesta por empresa
        const ctxTiempoRespuesta = document.getElementById('graficoTiempoRespuesta');
        if (ctxTiempoRespuesta) {
            ctxTiempoRespuesta.innerHTML = '';
            const canvasTiempoRespuesta = document.createElement('canvas');
            canvasTiempoRespuesta.className = 'chart-js-instance';
            canvasTiempoRespuesta.height = 200;
            ctxTiempoRespuesta.appendChild(canvasTiempoRespuesta);

            // Preparar datos para el gráfico de barras
            // Limitamos a las 5 empresas con más incidentes para mejor visualización
            const empresasParaGrafico = [...data.analisisPorEmpresa]
                .sort((a, b) => b.totalIncidentes - a.totalIncidentes)
                .slice(0, 5);

            const chartTiempoRespuesta = new Chart(canvasTiempoRespuesta, {
                type: 'bar',
                data: {
                    labels: empresasParaGrafico.map(emp => emp.nombre),
                    datasets: [{
                        label: 'Incidentes Totales',
                        data: empresasParaGrafico.map(emp => emp.totalIncidentes),
                        backgroundColor: '#0d6efd',
                        borderWidth: 1
                    }, {
                        label: 'Incidentes Resueltos',
                        data: empresasParaGrafico.map(emp => emp.incidentesResueltos),
                        backgroundColor: '#198754',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Cantidad de Incidentes'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Empresas'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // Guardar referencia al gráfico para poder destruirlo después
            canvasTiempoRespuesta.chart = chartTiempoRespuesta;
        }

        // 3. Crear un tercer gráfico para mostrar tendencia de resolución
        const graficoTendenciaContainer = document.getElementById('graficoTendencia');
        if (graficoTendenciaContainer) {
            graficoTendenciaContainer.innerHTML = '';
            const canvasTendencia = document.createElement('canvas');
            canvasTendencia.className = 'chart-js-instance';
            canvasTendencia.height = 200;
            graficoTendenciaContainer.appendChild(canvasTendencia);

            // Simulamos datos de tendencia (en una implementación real, estos datos vendrían del backend)
            // Aquí podríamos usar datos reales si estuvieran disponibles
            const chartTendencia = new Chart(canvasTendencia, {
                type: 'line',
                data: {
                    labels: empresasOrdenadas.map(emp => emp.nombre),
                    datasets: [{
                        label: '% de Resolución',
                        data: empresasOrdenadas.map(emp => parseFloat(emp.porcentajeResueltos)),
                        borderColor: '#20c997',
                        backgroundColor: 'rgba(32, 201, 151, 0.2)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Porcentaje de Resolución (%)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // Guardar referencia al gráfico para poder destruirlo después
            canvasTendencia.chart = chartTendencia;
        }

    } catch (error) {
        console.error("Error al generar gráficos:", error);
    }
}
/**
 * Genera los gráficos para el dashboard de soporte
 * @param {object} data - Datos para generar los gráficos
 */
export function generarGraficosDashboard(data) {
    try {
        // Destruir gráficos existentes si los hay
        const chartElements = document.querySelectorAll('canvas.chart-js-dashboard');
        chartElements.forEach(canvas => {
            if (canvas.chart) {
                canvas.chart.destroy();
            }
        });

        // 1. Gráfico de Estado de Incidentes (Doughnut)
        const ctxEstadoIncidentes = document.getElementById('graficoEstadoIncidentes');
        if (ctxEstadoIncidentes) {
            ctxEstadoIncidentes.innerHTML = '';
            const canvasEstadoIncidentes = document.createElement('canvas');
            canvasEstadoIncidentes.className = 'chart-js-dashboard';
            canvasEstadoIncidentes.height = 300;
            ctxEstadoIncidentes.appendChild(canvasEstadoIncidentes);

            const pendientes = data.incidentesPendientes || 0;
            const enCurso = data.incidentesEnCurso || 0;
            const resueltos = data.incidentesResueltos || 0;

            const chartEstadoIncidentes = new Chart(canvasEstadoIncidentes, {
                type: 'doughnut',
                data: {
                    labels: ['Pendientes', 'En Curso', 'Resueltos'],
                    datasets: [{
                        data: [pendientes, enCurso, resueltos],
                        backgroundColor: ['#dc3545', '#fd7e14', '#198754'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const value = context.raw;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${context.label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });

            // Guardar referencia al gráfico para poder destruirlo después
            canvasEstadoIncidentes.chart = chartEstadoIncidentes;
        }

        // 2. Gráfico de Top Empresas con Incidentes (Bar)
        const ctxIncidentesEmpresa = document.getElementById('graficoIncidentesEmpresa');
        if (ctxIncidentesEmpresa) {
            ctxIncidentesEmpresa.innerHTML = '';
            const canvasIncidentesEmpresa = document.createElement('canvas');
            canvasIncidentesEmpresa.className = 'chart-js-dashboard';
            canvasIncidentesEmpresa.height = 300;
            ctxIncidentesEmpresa.appendChild(canvasIncidentesEmpresa);

            // Ordenar empresas por cantidad de incidentes y tomar las 5 principales
            const empresasTop = data.empresas ? 
                [...data.empresas]
                    .sort((a, b) => b.totalIncidentes - a.totalIncidentes)
                    .slice(0, 5) : 
                [];

            const chartIncidentesEmpresa = new Chart(canvasIncidentesEmpresa, {
                type: 'bar',
                data: {
                    labels: empresasTop.map(emp => emp.nombre),
                    datasets: [{
                        label: 'Incidentes Totales',
                        data: empresasTop.map(emp => emp.totalIncidentes),
                        backgroundColor: '#0d6efd',
                        borderWidth: 1
                    }, {
                        label: 'Incidentes Resueltos',
                        data: empresasTop.map(emp => emp.incidentesResueltos),
                        backgroundColor: '#198754',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Cantidad de Incidentes'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Empresas'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // Guardar referencia al gráfico para poder destruirlo después
            canvasIncidentesEmpresa.chart = chartIncidentesEmpresa;
        }

        // 3. Gráfico de Tendencia de Incidentes (Line)
        const ctxTendenciaIncidentes = document.getElementById('graficoTendenciaIncidentes');
        if (ctxTendenciaIncidentes) {
            ctxTendenciaIncidentes.innerHTML = '';
            const canvasTendenciaIncidentes = document.createElement('canvas');
            canvasTendenciaIncidentes.className = 'chart-js-dashboard';
            canvasTendenciaIncidentes.height = 300;
            ctxTendenciaIncidentes.appendChild(canvasTendenciaIncidentes);

            // Datos para el gráfico de tendencia (últimos 6 meses)
            const meses = data.tendencia ? data.tendencia.map(item => item.mes) : 
                ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
            
            const incidentesCreados = data.tendencia ? data.tendencia.map(item => item.creados) : 
                [12, 19, 15, 25, 22, 30];
            
            const incidentesResueltos = data.tendencia ? data.tendencia.map(item => item.resueltos) : 
                [8, 15, 12, 20, 18, 25];

            const chartTendenciaIncidentes = new Chart(canvasTendenciaIncidentes, {
                type: 'line',
                data: {
                    labels: meses,
                    datasets: [{
                        label: 'Incidentes Creados',
                        data: incidentesCreados,
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Incidentes Resueltos',
                        data: incidentesResueltos,
                        borderColor: '#198754',
                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Cantidad de Incidentes'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Mes'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // Guardar referencia al gráfico para poder destruirlo después
            canvasTendenciaIncidentes.chart = chartTendenciaIncidentes;
        }

        // 4. Gráfico de Tiempo Promedio de Respuesta (Bar)
        const ctxTiempoRespuesta = document.getElementById('graficoTiempoRespuesta');
        if (ctxTiempoRespuesta) {
            ctxTiempoRespuesta.innerHTML = '';
            const canvasTiempoRespuesta = document.createElement('canvas');
            canvasTiempoRespuesta.className = 'chart-js-dashboard';
            canvasTiempoRespuesta.height = 300;
            ctxTiempoRespuesta.appendChild(canvasTiempoRespuesta);

            // Datos para el gráfico de tiempo de respuesta
            const tecnicos = data.tiempoRespuesta ? data.tiempoRespuesta.map(item => item.tecnico) : 
                ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Luis Rodríguez'];
            
            const tiemposRespuesta = data.tiempoRespuesta ? data.tiempoRespuesta.map(item => item.tiempoPromedio) : 
                [24, 18, 36, 12, 48];

            const chartTiempoRespuesta = new Chart(canvasTiempoRespuesta, {
                type: 'bar',
                data: {
                    labels: tecnicos,
                    datasets: [{
                        label: 'Tiempo Promedio (horas)',
                        data: tiemposRespuesta,
                        backgroundColor: '#6f42c1',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Tiempo (horas)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Técnicos'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // Guardar referencia al gráfico para poder destruirlo después
            canvasTiempoRespuesta.chart = chartTiempoRespuesta;
        }

    } catch (error) {
        console.error("Error al generar gráficos del dashboard:", error);
    }
}
/**
 * Exporta las funciones útiles para el proyecto.
 * Todas las funciones pueden ser accedidas desde cualquier lugar del proyecto.
 * @type {Object}
 */
export default {
    // Funciones de multimedia
    inicializarVisorImagenes,
    mostrarArchivosMultimedia,
    crearElementoImagen,
    crearElementoVideo,
    crearElementoPDF,

    // Funciones de fecha y hora
    formatearFechaHora,

    // Funciones de socket
    socketConnect,

    // Funciones de notificaciones
    mostrarNotificacion,

    // Funciones de sidebar
    inicializarSidebar,

    // Funciones de sesión
    cerrarSesion,

    // Funciones de reportes
    generarReporte,
    eliminarReporte,
    limpiarFiltrosReporte,
    cargarReportesGuardados,
    descargarReporte,

    // Funciones de gráficos
    generarGraficosDesempenio,
    generarGraficosDashboard
};
