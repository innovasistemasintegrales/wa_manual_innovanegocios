// invitado.js
import * as Utils from '/js/utils.js';


const socketConnect = () => {
    // Crear la conexión del socket
    const socket = io('/invitado', {
        withCredentials: true, 
    });

    // Escuchar errores de conexión
    socket.on('connect_error', async (err) => {
        console.error('Error de conexión con el soket:', err.message);

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
        console.log('Conectado al namespace /invitado');
    });

    return socket; // Devolver el socket en caso de que quieras usarlo en otros lugares
};

// Iniciar la conexión del socket
const socket = socketConnect();

const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

//TODO ========================= TEMPLATES ========================
//? Template para las diferentes secciones
const templateInicio = document.querySelector('#cardReactivo').content;
const templatePreguntasFrecuentes = document.querySelector('#templatePreguntasFrecuentes').content;
const templateManuales = document.querySelector('#templateManuales').content;

//? Template de los item para los diferentes listados
const templateItemPreguntaFrecuente = templatePreguntasFrecuentes.querySelector('#templateItemPreguntaFrecuente').content;
const templateItemTituloManual = templateManuales.querySelector('#templateItemTituloManual').content;
const templateItemSubtituloManual = templateItemTituloManual.querySelector('#templateItemSubtituloManual').content;
const templateItemContenidoManual = templateManuales.querySelector('#templateItemContenidoManual').content;

//? Template para modales

//TODO ======================= BOTONES - INPUTS - CONTENEDORES ========================

// Botonoes para cambiar de sección
let btnMenuManuales = document.querySelector('#btnMenuManuales');
let btnMenuInicio = document.querySelector('#btnMenuInicio');
let btnMenuCerrar = document.querySelector('#btnMenuCerrar');

let contenedorPreguntasFrecuentes;
let contenedorTitulosManuales;
let contenedorContenidoManuales;

//TODO ======================== VARIABLES GLOBALES ========================
let listadoPreguntasFrecuentes = {};
let listadoMenusManuales = [];
let ultimaSeccion = localStorage.getItem('ultimaSeccion') || 'Inicio';
let seccionActual = 'Inicio';
let subtituloActual;

// ? SINCRONIZACIÓN PREGUNTAS FRECUENTES

//TODO ======================== LANZAMIENTO DE VISTAS ========================

btnMenuManuales.addEventListener('click', function () {
    localStorage.setItem('ultimaSeccion', 'Manuales');
    seccionActual = 'Manuales';
    cardReactivo.innerHTML = "";
    const clone = templateManuales.cloneNode(true);
    cardReactivo.appendChild(clone);

    contenedorTitulosManuales = document.querySelector('#contenedorTitulosManuales');

    consultarManuales()
        .then(() => listarTitulosManuales())
        .catch((error) => console.log(error));
});

// Inicio
btnMenuInicio.addEventListener('click', function () {
    localStorage.setItem('ultimaSeccion', 'Inicio');
    seccionActual = 'Inicio';
    cardReactivo.innerHTML = "";
    const clone = templatePreguntasFrecuentes.cloneNode(true);
    cardReactivo.appendChild(clone);

    contenedorPreguntasFrecuentes = document.querySelector('#contenedorPreguntasFrecuentes');

    consultarPreguntasFrecuentes()
        .then(() => listarPreguntasFrecuentes())
        .catch((error) => console.log(error));
})

btnMenuCerrar.addEventListener('click', function () {
    Swal.fire({
        title: "CERRAR SESIÓN",
        text: "¿Estás seguro de cerrar tu sesion?",
        icon: "warning",
        showDenyButton: true,
        confirmButtonText: "Sí, cerrar",
        denyButtonText: "Cancelar",
    }).then(async (resultado) => {
        if (resultado.isConfirmed) {
            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    credentials: 'include', // Incluye cookies HTTP-only
                });

                if (response.ok) {
                    // Redirigir al usuario al login después de cerrar sesión
                    window.location.href = '/login';
                } else {
                    console.error('Error al cerrar sesión.');
                    Swal.fire('Error', 'No se pudo cerrar sesión. Intenta nuevamente.', 'error');
                }
            } catch (error) {
                console.error('Error al intentar cerrar sesión:', error);
                Swal.fire('Error', 'Ocurrió un error al cerrar sesión.', 'error');
            }
        }
    });
})

//TODO ======================== FUNCIONES ========================

//? PREGUNTAS FRECUENTES

function consultarPreguntasFrecuentes() {
    return new Promise((resolve, reject) => {
        if (Object.keys(listadoPreguntasFrecuentes).length > 0) {
            console.log("No se consultaron las preguntas frecuentes porque ya se consultaron y no hay nuevas actualizaciones en la base de datos.");
            resolve();
        } else {
            socket.emit("/invitado/listadoPreguntasFrecuentes", (respuesta) => {
                if (respuesta.success) {
                    console.log("Se consultaron las preguntas frecuentes: ", respuesta.data);
                    listadoPreguntasFrecuentes = respuesta.data;
                    resolve();
                } else {
                    reject(respuesta.error);
                }
            });
        }
    });
}
function listarPreguntasFrecuentes() {
    contenedorPreguntasFrecuentes.innerHTML = "";

    if (listadoPreguntasFrecuentes.length === 0) {
        contenedorPreguntasFrecuentes.innerHTML =
            `
            <div class="d-flex justify-content-center align-items-center my-5">
                <p class="text-center text-white">Sin preguntas frecuentes...</p>
            </div>
            `;
        return;
    }

    // Generar preguntas frecuentes en la interfaz
    listadoPreguntasFrecuentes.forEach(frecuente => {
        templateItemPreguntaFrecuente.querySelector('.accordion-item').dataset.id = frecuente.id_pfrecuente;
        templateItemPreguntaFrecuente.querySelector('.accordion-button').setAttribute('data-bs-target', `#collapse${frecuente.id_pfrecuente}`);
        templateItemPreguntaFrecuente.querySelector('.accordion-collapse').id = `collapse${frecuente.id_pfrecuente}`;
        templateItemPreguntaFrecuente.querySelector("#pregunta").textContent = frecuente.pregunta;
        templateItemPreguntaFrecuente.querySelector("#respuesta").textContent = frecuente.respuesta;

        const clone = templateItemPreguntaFrecuente.cloneNode(true);
        fragmento.appendChild(clone);
    });

    // Agregar elementos generados al contenedor
    contenedorPreguntasFrecuentes.appendChild(fragmento);
}

//? MANUALES

function consultarManuales() {
    return new Promise((resolve, reject) => {
        if (Object.keys(listadoMenusManuales).length > 0) {
            console.log(`- No se han consultado los manuales porque ya se han consultado antes`);
            resolve();
        } else {
            socket.emit("/invitado/listadoManuales", (respuesta) => {
                if (respuesta.success) {

                    console.log("- Se consultaron los manuales: ", respuesta.data);
                    listadoMenusManuales = respuesta.data;

                    resolve();
                } else if (respuesta.error) {
                    reject(respuesta.error);
                }
            });
        }
    });
}
function listarTitulosManuales() {
    contenedorTitulosManuales.innerHTML = "";

    if (!listadoMenusManuales || listadoMenusManuales.length === 0) {
        contenedorTitulosManuales.innerHTML =
            `<div class="d-flex justify-content-center align-items-center py-5 bg-light rounded-12px">
                <p class="text-center text-dark">Sin manuales...</p>
            </div>`;
        return;
    }

    listadoMenusManuales.forEach(manual => {
        const cloneTitulo = templateItemTituloManual.cloneNode(true);
        const accordionItem = cloneTitulo.querySelector('.accordion-item');
        accordionItem.dataset.id = manual.id_menu;
        cloneTitulo.querySelector('.accordion-button').setAttribute('data-bs-target', `#collapse${manual.id_menu}`);
        cloneTitulo.querySelector('.accordion-collapse').id = `collapse${manual.id_menu}`;
        cloneTitulo.querySelector("#tituloManual").textContent = manual.titulo;

        // Agregar manuales (subtitulos)
        const contenedorSubtitulos = cloneTitulo.querySelector('#contenedorSubtitulos');
        if (manual.manuales && manual.manuales.length > 0) {
            manual.manuales.forEach(contenido => {
                const cloneSubtitulo = templateItemSubtituloManual.cloneNode(true);
                cloneSubtitulo.querySelector('.btn-group').dataset.id = contenido.id_manual;
                cloneSubtitulo.querySelector('label').textContent = contenido.subtitulo;
                cloneSubtitulo.querySelector('label').classList.add('mostrar-contenido-subtitulo-btn');
                cloneSubtitulo.querySelector('input').id = `contenido${contenido.id_manual}`;
                cloneSubtitulo.querySelector('label').setAttribute('for', `contenido${contenido.id_manual}`);
                contenedorSubtitulos.appendChild(cloneSubtitulo);
            });
        }

        contenedorTitulosManuales.appendChild(cloneTitulo);
    });
}
function buscarContenidoManual(idSubtitulo) {
    for (const titulo of listadoMenusManuales) {
        if (titulo.manuales) {
            const contenidoManual = titulo.manuales.find(c => c.id_manual == idSubtitulo);
            if (contenidoManual) return contenidoManual;
        }
    }
    return null; // Retorna null si no encuentra el contenido
}
function mostrarContenidoSubtitulo(idSubtitulo) {
    subtituloActual = idSubtitulo;
    contenedorContenidoManuales = document.getElementById('contenedorContenidoManuales');
    contenedorContenidoManuales.innerHTML = "";

    // Buscamos el contenido del subtitulo en el listado de manuales
    let contenidoSubtitulo = buscarContenidoManual(idSubtitulo);

    // Si hay contenido en el manual, mostrarlo
    if (contenidoSubtitulo) {
        const clone = templateItemContenidoManual.cloneNode(true);

        clone.querySelector('.subtitulo-manual').value = contenidoSubtitulo.subtitulo || 'Sin subtitulo';
        clone.querySelector('.introduccion-manual').value = contenidoSubtitulo.introduccion || '';

        // Video embebido
        const iframeVideo = clone.querySelector('#video-manual');
        if (iframeVideo && contenidoSubtitulo.link_video) {
            iframeVideo.src = contenidoSubtitulo.link_video; // Asegúrate que sea un enlace embebido válido
        }

        // PDF embebido
        const embedPDF = clone.querySelector('#embed-pdf-manual');
        const pdfLink = clone.querySelector('.pdf-link');
        
        if (contenidoSubtitulo.link_pdf && contenidoSubtitulo.link_pdf !== 'null') {
            if (embedPDF) {
                embedPDF.src = contenidoSubtitulo.link_pdf;
                embedPDF.classList.remove('d-none'); // Mostrar el PDF
            }
            if (pdfLink) {
                pdfLink.href = contenidoSubtitulo.link_pdf;
                pdfLink.classList.remove('d-none'); // Mostrar el enlace si es necesario
            }
        }

        clone.querySelector('.acciones-contenido-manual').dataset.id = contenidoSubtitulo.id_manual;

        // Añadir el clon al contenedor principal
        contenedorContenidoManuales.appendChild(clone);
    } else {
        contenedorContenidoManuales.innerHTML = '<p class="text-dark">No hay contenido disponible para este subtítulo.</p>';
    }
}
async function subirPDF(pdfInput, link_pdf_anterior) {
    return new Promise((resolve, reject) => {
        if (pdfInput && pdfInput.files && pdfInput.files[0]) {
            const formData = new FormData();
            formData.append('file', pdfInput.files[0]);

            if (link_pdf_anterior) {
                formData.append('link_pdf_anterior', link_pdf_anterior);
            }

            // Subir el PDF al servidor y obtener la URL del PDF subido
            fetch('/upload', { method: 'POST', body: formData })
                .then(response => resolve(response.json()))
                .catch(error => reject(error));
        }
    });
}

// Función para validar cada campo individual
function validarCampoConfiguracion(input) {
    let esValido = true;
    const feedbackElement = input.nextElementSibling;
    input.classList.remove('is-valid', 'is-invalid');

    // Validaciones específicas por campo
    switch (input.id) {
        case 'correoUsuario':
            esValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
            if (!esValido) mostrarError(input, 'Ingrese un correo electrónico válido');
            break;
        case 'dniUsuario':
            esValido = input.value.length === 8 && /^\d+$/.test(input.value);
            if (!esValido) mostrarError(input, 'El DNI debe tener 8 dígitos numéricos');
            break;
        case 'telefonoUsuario':
            esValido = input.value.length === 9 && /^\d+$/.test(input.value);
            if (!esValido) mostrarError(input, 'El teléfono debe tener 9 dígitos numéricos');
            break;
        default:
            esValido = input.value.trim() !== '';
            if (!esValido) mostrarError(input, 'Este campo es obligatorio');
    }

    if (esValido) input.classList.add('is-valid');
    return esValido;
}
// Mostrar mensaje de error
function mostrarError(input, mensaje) {
    input.classList.remove('is-valid', 'is-invalid');
    input.classList.add('is-invalid');
    const feedbackElement = input.nextElementSibling;
    if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
        feedbackElement.textContent = mensaje;
    }
}

/**
 * Función para mostrar un toast o notificación
 * @param {String} titulo - El título del toast
 * @param {String} mensaje - El mensaje del toast
 * @param {String} tipo - El tipo del toast (info, success, warning, danger)
 * @param {Number} duracion - La duración del toast en milisegundos
 */
function mostrarToast(titulo, mensaje, tipo = 'info', duracion = 5000) {
    // Mapear tipos a íconos y colores específicos
    const iconMap = {
        incidente: { icon: 'bi-exclamation-triangle-fill', color: 'text-danger' },
        usuario: { icon: 'bi-person-fill', color: 'text-primary' },
        faq: { icon: 'bi-question-circle-fill', color: 'text-warning' },
        success: { icon: 'bi-check-circle-fill', color: 'text-success' },
        info: { icon: 'bi-info-circle-fill', color: 'text-info' }
    };

    const { icon, color } = iconMap[tipo] || iconMap['info'];

    // Crear un nuevo Toast
    const toastContainer = document.getElementById('toastContainer');
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

//TODO ======================== LISTENERS ========================

// TODO EVENTS DELEGATION
document.addEventListener('click', e => {

    //TODO Listeners USUARIO

    //? CRUD de los subtítulos
    if (e.target.classList.contains("btn-mostrar-contenido-subtitulo")) {
        let idSubtitulo = e.target.closest('.btn-group').dataset.id;
        mostrarContenidoSubtitulo(idSubtitulo);
    }

});

//TODO =============== INTERACTIVIDAD DEL SIDEBAR (MENÚ DE NAVEGACIÓN) ===============
/** 
 * Inicializa la interactividad del sidebar cuando el DOM esté completamente cargado
 * Esta función se encarga de asignar los eventos de click a los elementos del sidebar
 * y de inicializar el estado de los elementos del sidebar cuando sea necesario.
 */
document.addEventListener('DOMContentLoaded', () => {
    Utils.inicializarSidebar();
});

document.addEventListener('DOMContentLoaded', () => {
    // Borra el contenido por defecto de cardReactivo
    cardReactivo.innerHTML = "";

    // Simula el clic en el botón de Inicio para mostrar las Preguntas Frecuentes
    btnMenuInicio.click();
});