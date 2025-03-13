/**
 * utils.js - Funciones de utilidad para la aplicación
 * 
 * Este archivo contiene funciones de utilidad reutilizables en toda la aplicación,
 * relacionadas con la manipulación del DOM, formateo de fechas y visualización de multimedia.
 */

/**
 * Inicializa el visor de imágenes en el modal de incidente.
 *
 * @param {HTMLElement} modalElement - El elemento DOM del modal
 * @param {Object} incidente - Datos del incidente con imágenes
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
                    console.error('No se pudo renovar el token.');
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Error al intentar renovar el token:', error);
                alert('Ocurrió un error al renovar la sesión. Inicia sesión nuevamente.');
                window.location.href = '/login';
            }
        }
    });

    // Escuchar evento de conexión exitosa
    socket.on('connect', () => {
        console.log(`Conectado al namespace ${namespace}`);
    });

    return socket; // Devolver el socket
}

// También exportamos todas las funciones como un objeto para mantener compatibilidad
export default {
    inicializarVisorImagenes,
    mostrarArchivosMultimedia,
    crearElementoImagen,
    crearElementoVideo,
    crearElementoPDF,
    formatearFechaHora,
    socketConnect
};
