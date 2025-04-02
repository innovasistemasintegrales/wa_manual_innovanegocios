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
const templateInicio = document.querySelector('#templateInicio').content;
const templateManuales = document.querySelector('#templateManuales').content;

//? Template de los item para los diferentes listados
const templateItemPreguntaFrecuente = templateInicio.querySelector('#templateItemPreguntaFrecuente').content;
const templateItemTituloManual = templateManuales.querySelector('#templateItemTituloManual').content;
const templateItemSubtituloManual = templateItemTituloManual.querySelector('#templateItemSubtituloManual').content;
const templateItemContenidoManual = templateManuales.querySelector('#templateItemContenidoManual').content;


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
let seccionActual = 'Inicio';
let subtituloActual;

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
btnMenuInicio.addEventListener('click', function () {
    localStorage.setItem('ultimaSeccion', 'Inicio');
    seccionActual = 'Inicio';
    cardReactivo.innerHTML = "";
    const clone = templateInicio.cloneNode(true);
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
    }).then((resultado) => {
        if (resultado.isConfirmed) {
            Utils.cerrarSesion();
        }
    });
});

//TODO ======================== LISTENERS ========================

document.addEventListener('click', e => {

    //? CRUD de los subtítulos
    if (e.target.classList.contains("btn-mostrar-contenido-subtitulo")) {
        let idSubtitulo = e.target.closest('.btn-group').dataset.id;
        mostrarContenidoSubtitulo(idSubtitulo);
    }

});

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

//? OTRAS FUNCIONES
/**
 * Carga la última sección visitada al recargar la página
 * 
 * Esta función se encarga de:
 * - Obtener la última sección visitada del localStorage
 * - Simular un clic en el botón correspondiente para mostrar la sección
 */
function cargarUltimaSeccion() {
    const ultimaSeccion = localStorage.getItem('ultimaSeccion') || 'Inicio';
    const btnMenu = document.querySelector(`#btnMenu${ultimaSeccion}`);
    if (btnMenu) btnMenu.click();
}

//TODO ======================== EVENTOS AL PRINCIPIO DE LA CARGA DE LA PÁGINA =========================

/**
 * Inicializa la aplicación cuando el DOM está completamente cargado
 * 
 * Esta función se encarga de:
 * - Inicializar la interactividad del sidebar mediante Utils.inicializarSidebar()
 * - Limpiar el contenido predeterminado del elemento cardReactivo
 * - Simular un clic en el botón de inicio para mostrar las Preguntas Frecuentes
 * como vista predeterminada al cargar la página
 */
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar la interactividad del sidebar
    Utils.inicializarSidebar();
    // Cargar la última sección visitada al recargar la página
    cargarUltimaSeccion();
});