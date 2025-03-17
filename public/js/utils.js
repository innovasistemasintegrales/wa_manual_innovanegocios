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

/**
 * Genera un PDF a partir de un elemento HTML con opciones mejoradas
 * @param {HTMLElement} elemento - El elemento HTML que se convertirá en PDF
 * @param {string} nombreArchivo - Nombre del archivo PDF a generar
 * @returns {Promise<void>} - Promesa que se resuelve cuando el PDF se ha generado
 */
export async function generarPDFMejorado(elemento, nombreArchivo, tipo) {
    try {
        if (!elemento) {
            throw new Error('Elemento HTML no válido');
        }

        // Preparar el elemento para la captura
        const estiloOriginal = elemento.style.cssText;
        elemento.style.display = 'block';
        elemento.style.width = '1200px'; // Ancho fijo para mejor renderizado
        
        // Ajustar el ancho de las tablas para mejor visualización
        const tablas = elemento.querySelectorAll('table');
        tablas.forEach(tabla => {
            tabla.style.width = '100%';
            tabla.style.tableLayout = 'fixed';

            if (tipo === 'incidentes') {
                
            } 
            
            // Ajustar el ancho de las columnas para que quepan en la página
            const columnas = tabla.querySelectorAll('th');
            if (columnas.length > 0) {
                const anchoColumna = `${100 / columnas.length}%`;
                columnas.forEach(col => {
                    col.style.width = anchoColumna;
                });
            }

            // Ajustar el ancho de la columna del ID para que quepa en la página
            const idColumn = tabla.querySelectorAll('th')[0];
            if (idColumn) {
                idColumn.style.width = '5%';
            }

            // Ajustar el ancho de la columna del Titulo para que quepa en la página
            const tituloColumn = tabla.querySelectorAll('th')[1];
            if (tituloColumn) {
                tituloColumn.style.width = '25%';
            }

            // Ajustar el ancho de la columna del Estado para que quepa en la página
            const estadoColumn = tabla.querySelectorAll('th')[3];
            if (estadoColumn) {
                estadoColumn.style.width = '8%';
            }

            // Ajustar el ancho de la columna del Fecha de creación para que quepa en la página
            const fechaColumn = tabla.querySelectorAll('th')[4];
            if (fechaColumn) {
                fechaColumn.style.width = '12%';
            }
            
        });

        // Esperar a que las imágenes y estilos se carguen completamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Opciones para html2canvas
        const options = {
            scale: 2,
            useCORS: true, // Permitir imágenes de diferentes dominios
            allowTaint: true, // Permitir imágenes que pueden "contaminar" el canvas
            logging: false, // Desactivar logs
            backgroundColor: '#ffffff', // Fondo blanco
            windowWidth: 1000, // Ancho de la ventana para renderizar
            windowHeight: elemento.scrollHeight // Altura basada en el contenido
        };
        
        // Capturar el HTML como imagen
        const canvas = await html2canvas(elemento, options);
        
        // Crear el PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: "portrait", // vertical
            unit: "mm",
            format: "a4"
        });

        // Convertir canvas a imagen
        const imgData = canvas.toDataURL('image/jpeg', 1.0); // Usar JPEG en lugar de PNG con calidad máxima
        
        // Ajustar la imagen al tamaño del PDF
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Agregar la imagen al PDF
        pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight);
        
        // Si la imagen es más grande que una página A4, agregar más páginas
        if (imgHeight > 277) { // 297mm (A4) - 20mm de margen
            let posicionY = -277; // Comenzar desde la segunda página
            
            for (let i = 1; i < Math.ceil(imgHeight / 277); i++) {
                pdf.addPage();
                posicionY -= 277;
                pdf.addImage(imgData, "JPEG", 10, posicionY, imgWidth, imgHeight);
            }
        }
        
        // Generar el nombre del PDF con la fecha actual
        const fecha = new Date().toLocaleDateString("es-ES").replace(/\//g, '-');
        const nombreCompleto = `${nombreArchivo}_${fecha}.pdf`;
        
        // Descargar el PDF
        pdf.save(nombreCompleto);
        
        // Restaurar el estilo original del elemento
        elemento.style.cssText = estiloOriginal;
        
        // Restaurar estilos de las tablas
        tablas.forEach(tabla => {
            tabla.style.width = '';
            tabla.style.tableLayout = '';
            
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
 * Exporta las funciones útiles para el proyecto.
 * Todas las funciones pueden ser accedidas desde cualquier lugar del proyecto.
 * @type {Object}
 */
export default {
    inicializarVisorImagenes,
    mostrarArchivosMultimedia,
    crearElementoImagen,
    crearElementoVideo,
    crearElementoPDF,
    formatearFechaHora,
    socketConnect,
    mostrarNotificacion,
    inicializarSidebar,
    cerrarSesion,
    generarPDFMejorado
};
