// cliente.js

const socketConnect = () => {
    // Crear la conexión del socket
    const socket = io('/cliente', {
        withCredentials: true, // Enviar cookies automáticamente
    });

    // Escuchar errores de conexión
    socket.on('connect_error', async (err) => {
        console.error('Error de conexión con el soket:', err.message);

        if (err.message === 'Token inválido o expirado.') {
            console.log('Intentando renovar el token...');

            // Renovar el token de acceso
            // try {
            //     const response = await fetch('/refresh-token', {
            //         method: 'POST',
            //         credentials: 'include', // Incluye cookies automáticamente
            //         headers: {
            //             'Content-Type': 'application/json',
            //         },
            //         body: JSON.stringify({}), // No necesitamos enviar nada si el refresh token está en una cookie
            //     });

            //     if (response.ok) {
            //         console.log('Token renovado correctamente.');

            //         // Intentar reconectar al socket
            //         socket.connect(); // Reconectar con el socket después de renovar el token
            //     } else {
            //         console.error('No se pudo renovar el token.');
            //         alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            //         window.location.href = '/login';
            //     }
            // } catch (error) {
            //     console.error('Error al intentar renovar el token:', error);
            //     alert('Ocurrió un error al renovar la sesión. Inicia sesión nuevamente.');
            //     window.location.href = '/login';
            // }
        }

    });

    // Escuchar evento de conexión exitosa
    socket.on('connect', () => {
        console.log('Conectado al namespace /cliente');
    });

    return socket; // Devolver el socket en caso de que quieras usarlo en otros lugares
};

// Iniciar la conexión del socket
const socket = socketConnect();

const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

//TODO ======= TEMPLATES ================
//? Template para las diferentes secciones
const templateInicio = document.querySelector('#cardReactivo').content;
const templateAsesoria = document.querySelector('#templateAsesoria').content;
const templateCalificacion = document.querySelector('#templateCalificacion').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;

//? Template de los item para los diferentes listados
const templateItemIncidente = templateIncidentes.querySelector('#templateItemIncidente').content;


//? Template para modales
const templateModalIncidente = document.querySelector('#templateModalIncidente').content;
const templateModalNuevoIncidente = document.querySelector('#templateModalNuevoIncidente').content;

//TODO ======================= BOTONES - INPUTS - CONTENEDORES ========================

// Botonoes para cambiar de sección
let btnMenuAsesoria = document.querySelector('#btnMenuAsesoria');
let btnMenuIncidentes = document.querySelector('#btnMenuIncidentes');
let btnMenuCalificacion = document.querySelector('#btnMenuCalificacion');
let btnMenuInicio = document.querySelector('#btnMenuInicio');
let btnMenuCerrar = document.querySelector('#btnMenuCerrar');

// Otros inputs y labels 
let btnSelectEstadosUsuario;
let btnsEstadosUsuario;
let btnSelectRolUsuario;
let btnsRolesUsuario;
let buscadorUsuario;

// Opciones
let opcionEstadoIncidente;
let opcionesTipoIncidente;

let seleccionEstadoIncidente = localStorage.getItem('seleccionEstadoIncidente') || 'Todos';
let switchIncidentesReasignados;
let btnAbrirNuevoIncidente;

// Modales
const modalIncidente = new bootstrap.Modal(document.getElementById('modalIncidente'));
const modalNuevoIncidente = new bootstrap.Modal(document.getElementById('modalNuevoIncidente'));

// Formularios
const formNuevoIncidente = document.getElementById('modalNuevoIncidente');

// Otros botones
const botonesCancelarIncidente = document.querySelectorAll('#btnCerrarIncidente');
const btnEnviarRespuestaIncidente = document.querySelector('#modalIncidente #btnEnviarRespuestaIncidente');
const btnCrearNuevoIncidente = document.querySelector('#modalNuevoIncidente #btnCrearNuevoIncidente');
const botonesCancelarNuevoIncidente = document.querySelectorAll('#btnCancelarNuevoIncidente');


// Contenedores
let contenedorUsuarios;
let contenedorModalUsuario;
let contenedorIncidentes;
let contenedorModalIncidente;
let contenedorModalNuevoIncidente;
let contenedorPreguntasFrecuentes;
let contenedorTitulosManuales;
let contenedorGestorManuales;
let contenedorContenidoManuales;

let incidenteSeleccionado;

//TODO ======================== VARIABLES GLOBALES ========================
let listadoGeneralTitulos;
let listadoGeneralUsuarios = {};
let listadoPreguntasFrecuentes = {};
let listadoMenusManuales = [];
let listadoGeneralValoraciones = {};
// let listadoGeneralReportes = {};
let listadoGeneralIncidentes = {};
let perfilUsuario;
let limiteIncidentes = localStorage.getItem('limiteIncidentes') || 1000;
let paginaActualIncidentes = 1; // Página inicial
let hayMasIncidentes = true; // Indicador para saber si hay más incidentes

let confirmAction = null; // Variable para almacenar la función de confirmación actual en el modal de confirmación

let ultimaSeccion = localStorage.getItem('ultimaSeccion') || 'Inicio';
let seccionActual = 'Inicio';
let seccionAsesoria = localStorage.getItem('seccionAsesoria') || 'FAQ';
let subtituloActual;

// Variables para la eliminación de PDFs y nuevo PDF
let eliminarPDF = false;


//TODO == ESCUCHA DE EVENTOS PARA SINCRONIZACIÓN DE DATOS EN TIEMPO REAL ==

// ? SINCRONIZACIÓN PREGUNTAS FRECUENTES


// ? SINCRONIZACIÓN MANUALES


// ? SINCRONIZACIÒN INCIDENTES

/* SOCKET DE ESCUCHA */
/* Titulo */
socket.on('/cliente/listarTitulo', (data) => {
    listadoGeneralTitulos = data;
})

//TODO ======================== LANZAMIENTO DE VISTAS ========================
/* Evento del boton Inicio */
btnMenuInicio.addEventListener('click', function () {
    location.reload();
})

/* Evento del boton Asesoria */
btnMenuAsesoria.addEventListener('click', function () {
    cardReactivo.innerHTML = "";
    console.log(listadoGeneralTitulos);
    /* templateAsesoria.querySelector(".titulo-asesoria").textContent = persona.nombre; */

    const clone = templateAsesoria.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
});

/* Evento del boton Incidente */
btnMenuIncidentes.addEventListener('click', function () {
    localStorage.setItem('ultimaSeccion', 'Incidentes');
    seccionActual = 'Incidentes';

    cardReactivo.innerHTML = "";
    const clone = templateIncidentes.cloneNode(true);
    fragmento.appendChild(clone);
    cardReactivo.appendChild(fragmento);

    // filtrar incidentes reasignados
    contenedorIncidentes = document.querySelector(`#contenedorIncidentes`);
    opcionesTipoIncidente = document.querySelectorAll('.opcion-estado-incidente');
    btnAbrirNuevoIncidente = document.querySelector('#btnAbrirNuevoIncidente');

    // Seleccionar el estado de un incidente ('Todos' de forma predeterminada)
    opcionEstadoIncidente = document.querySelector(`.op-incidentes-${seleccionEstadoIncidente}`);
    opcionEstadoIncidente.checked = true;
    opcionEstadoIncidente.click();

    // Consultar los incidentes si no existen y listarlos
    if (Object.keys(listadoGeneralIncidentes).length > 0) {
        listarIncidentes(paginaActualIncidentes, limiteIncidentes);
    } else {

        consultarIncidentes()
            .then(() => { listarIncidentes(paginaActualIncidentes, limiteIncidentes) })
            .catch((error) => {
                console.log(error)
            })
    }

    opcionesTipoIncidente.forEach(opcion => {

        opcion.addEventListener('click', function () {
            if (opcion.classList.contains("op-incidentes-Todos")) {
                seleccionEstadoIncidente = "Todos";
                localStorage.setItem('seleccionEstadoIncidente', seleccionEstadoIncidente)
            } else if (opcion.classList.contains("op-incidentes-Pendiente")) {
                seleccionEstadoIncidente = "Pendiente";
                localStorage.setItem('seleccionEstadoIncidente', seleccionEstadoIncidente)
            } else if (opcion.classList.contains("op-incidentes-Resuelto")) {
                seleccionEstadoIncidente = "Resuelto";
                localStorage.setItem('seleccionEstadoIncidente', seleccionEstadoIncidente)
            }
            listarIncidentes(paginaActualIncidentes, limiteIncidentes);

        });
    });

    // Crear botón "Cargar más" si no existe
    // let btnCargarMas = document.querySelector('#btnCargarMas');
    // if (!btnCargarMas) {
    //     btnCargarMas = document.createElement('button');
    //     btnCargarMas.id = 'btnCargarMas';
    //     btnCargarMas.textContent = 'Cargar más';
    //     btnCargarMas.className = 'btn btn-primary my-3';
    //     btnCargarMas.style.display = 'none'; // Ocultar inicialmente
    //     contenedorIncidentes.parentElement.appendChild(btnCargarMas);

    //     // Evento para cargar más incidentes
    //     btnCargarMas.addEventListener('click', () => {
    //         paginaActualIncidentes++;
    //         socket.emit("/cliente/listadoIncidentes", { pagina: paginaActualIncidentes, limite: limiteIncidentes, estado: seleccionEstadoIncidente }, (respuesta) => {
    //             if (respuesta.success) {
    //                 console.log("Incidentes cargados: ", respuesta.data);
    //                 listadoGeneralIncidentes.push(...respuesta.data);

    //                 if (respuesta.hayMasIncidentes && respuesta.estado === 'Todos') {
    //                     hayMasIncidentesTodos = respuesta.hayMasIncidentes;
    //                 } else if (respuesta.hayMasIncidentes && respuesta.estado === 'Pendiente') {
    //                     hayMasIncidentesPendientes = respuesta.hayMasIncidentes;
    //                 } else if (respuesta.hayMasIncidentes && respuesta.estado === 'Resuelto') {
    //                     hayMasIncidentesResueltos = respuesta.hayMasIncidentes;
    //                 }

    //                 listarIncidentes(paginaActualIncidentes, limiteIncidentes);
    //             } else {
    //                 console.log(respuesta.error);
    //                 hayMasIncidentes = false;
    //             }
    //         });
    //     });
    // }

    btnAbrirNuevoIncidente.addEventListener('click', function () {
        abrirModalNuevoIncidente();
    });

    contenedorIncidentes.addEventListener('click', e => {
        abrirIncidente(e)
    }
    )

});

/* Evento del boton Calificacion */
btnMenuCalificacion.addEventListener('click', function () {
    cardReactivo.innerHTML = "";

    /* templateValoracion.querySelector('#tituloValoracion').textContent = "Soy modulo valoración"; */
    const clone = templateCalificacion.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
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

//? MANUALES


//? INCIDENTES

function consultarIncidentes() {
    return new Promise((resolve, reject) => {
        if (Object.keys(listadoGeneralIncidentes).length > 0) {
            console.log("No se consultaron los incidentes porque ya se consultaron.");
            resolve();
        } else {
            socket.emit("/cliente/listadoIncidentes", { pagina: 1, limite: limiteIncidentes, estado: 'Todos' }, (respuesta) => {
                if (respuesta.success) {
                    console.log("Se consultaron los incidentes: ", respuesta.data);
                    listadoGeneralIncidentes = respuesta.data;
                    resolve();
                } else {
                    reject(respuesta.error);
                }
            });
        }
    });
}

function listarIncidentes(pagina, limite) {
    console.log(`Función listarIncidentes(${pagina}, ${limite})`);
    contenedorIncidentes.innerHTML = "";

    let incidentesFiltrados = 0;

    let divSinResultados = document.querySelector(`#divSinResultadosIncidentes`);
    divSinResultados.innerHTML = '';

    if (Object.keys(listadoGeneralIncidentes).length === 0) {
        divSinResultados.innerHTML =
            `
            <div class="d-flex justify-content-center align-items-center my-5">
                <p class="text-center">Sin incidentes...</p>
            </div>
        `
        return;
    }

    listadoGeneralIncidentes.forEach(incidente => {

        let agregarPorEstado = incidente.estado === seleccionEstadoIncidente || seleccionEstadoIncidente === 'Todos';

        if (agregarPorEstado) {

            templateItemIncidente.querySelector(".num-incidente .detalles-lista").textContent = incidente.id_incidente;
            templateItemIncidente.querySelector(".nombre-incidente .detalles-lista").innerHTML = incidente.titulo;

            templateItemIncidente.querySelector(".detalles-incidente .detalles-lista").textContent = incidente.descripcion_incidente;
            templateItemIncidente.querySelector(".nombre-empresa .detalles-lista").textContent = incidente.empresa.razon_social;
            // Formatear la fecha de creación con horas y minutos
            let fechaCreacion = new Date(incidente.fecha_creacion);
            let fechaFormateada = new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true, // Para formato AM/PM
            }).format(fechaCreacion);
            templateItemIncidente.querySelector(".fecha-incidente .detalles-lista").textContent = fechaFormateada || 'Sin fecha de creación';
            let itemEstadoIncidente = templateItemIncidente.querySelector(".estado-incidente .detalles-lista");
            itemEstadoIncidente.textContent = incidente.estado;
            itemEstadoIncidente.classList.remove(`estado-incidente-Pendiente`, `estado-incidente-Resuelto`);
            itemEstadoIncidente.classList.add(`estado-incidente-${incidente.estado}`);
            templateItemIncidente.querySelector(".btn-abrir-incidente").dataset.id = incidente.id_incidente;

            const clone = templateItemIncidente.cloneNode(true);
            fragmento.appendChild(clone);

            incidentesFiltrados += 1;
        }
    });

    if (incidentesFiltrados === 0) {
        divSinResultados.innerHTML =
            `
                <div class="d-flex justify-content-center align-items-center my-5">
                    <p class="text-center">Sin incidentes...</p>
                </div>
            `
    } else {
        contenedorIncidentes.appendChild(fragmento);
    }

    // Mostrar u ocultar el botón "Cargar más"
    // const btnCargarMas = document.querySelector('#btnCargarMas');
    // if (!hayMasIncidentes) {
    //     btnCargarMas.style.display = 'none';
    // } else {
    //     btnCargarMas.style.display = 'block';
    // }
}

function abrirIncidente(e) {
    if (e.target.classList.contains('btn-abrir-incidente')) {
        let incidente = listadoGeneralIncidentes.find(incidente => incidente.id_incidente === Number(e.target.dataset.id));
        console.log("Incidente seleccionado: ", incidente);
        incidenteSeleccionado = incidente.id_incidente;

        // Convertir la fecha_creacion en formato legible
        const fechaCreacion = new Date(incidente.fecha_creacion);
        const fechaFormateada = fechaCreacion.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const horaFormateada = fechaCreacion.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true // Formato AM/PM
        });

        // Asignar valores al modal
        templateModalIncidente.querySelector(".numero-incidente").textContent = incidente.id_incidente;
        templateModalIncidente.querySelector(".empresa").textContent = incidente.empresa.razon_social;
        templateModalIncidente.querySelector(".nombre-incidente").innerHTML = `${incidente.titulo} ${incidente.dni_tecnico ? '<span class="badge bg-warning text-dark">Reasignado</span>' : ''}`;
        templateModalIncidente.querySelector(".detalles").textContent = incidente.descripcion_incidente;

        // Asignar fecha y hora al modal
        templateModalIncidente.querySelector("#fechaIncidente").textContent = fechaFormateada;
        templateModalIncidente.querySelector("#horaIncidente").textContent = horaFormateada;

        templateModalIncidente.querySelector(".estado").textContent = incidente.estado;
        templateModalIncidente.querySelector(".estado").classList.remove('estado-incidente-Resuelto', 'estado-incidente-Pendiente');
        templateModalIncidente.querySelector(".estado").classList.add(`estado-incidente-${incidente.estado}`);

        btnEnviarRespuestaIncidente.classList.remove('d-none', 'd-block')
        if (incidente.estado === 'Resuelto') {
            btnEnviarRespuestaIncidente.classList.add('d-none');
        } else if (incidente.estado === 'Pendiente') {
            btnEnviarRespuestaIncidente.classList.add('d-block')
        }

        contenedorModalIncidente = document.querySelector('.contenedorModalIncidente');
        contenedorModalIncidente.innerHTML = "";
        let clone = templateModalIncidente.cloneNode(true);
        contenedorModalIncidente.appendChild(clone);

        modalIncidente.show();
    }
}

function abrirModalNuevoIncidente() {
    contenedorModalNuevoIncidente = document.querySelector('.contenedorModalNuevoIncidente');
    contenedorModalNuevoIncidente.innerHTML = "";

    // Obtener la fecha estática al abrir la modal
    let fechaHora = new Date();
    let fecha = fechaHora.getDate().toString().padStart(2, '0') + "/" +
        (fechaHora.getMonth() + 1).toString().padStart(2, '0') + "/" +
        fechaHora.getFullYear();

    // Asignar la fecha al elemento correspondiente
    templateModalNuevoIncidente.querySelector("#fechaNuevoIncidente").textContent = fecha;

    // Función para actualizar la hora dinámicamente
    function actualizarHora() {
        let ahora = new Date();

        // Formatear la hora a 12 horas con AM/PM
        let horas = ahora.getHours();
        let minutos = ahora.getMinutes().toString().padStart(2, '0');
        let segundos = ahora.getSeconds().toString().padStart(2, '0');
        let sufijo = horas >= 12 ? "PM" : "AM";
        horas = horas % 12 || 12; // Convierte 0 (medianoche) a 12

        let hora = `${horas}:${minutos}:${segundos} ${sufijo}`;
        let horaElemento = document.querySelector("#horaNuevoIncidente");
        if (horaElemento) {
            horaElemento.textContent = hora;
        }
    }

    // Iniciar la actualización de la hora
    setInterval(actualizarHora, 1000);

    // Asignar valores iniciales a los campos del modal
    templateModalNuevoIncidente.querySelector("#tituloNuevoIncidente").value = "";
    templateModalNuevoIncidente.querySelector("#descripcionNuevoIncidente").value = "";

    let clone = templateModalNuevoIncidente.cloneNode(true);
    contenedorModalNuevoIncidente.appendChild(clone);

    modalNuevoIncidente.show();

    // Ejecutar la función de actualización de la hora de inmediato
    actualizarHora();
}

function crearNuevoIncidente(formNuevoIncidente) {

    let nombreIncidente = formNuevoIncidente.querySelector("#tituloNuevoIncidente").value.trim();
    let descripcionIncidente = formNuevoIncidente.querySelector("#descripcionNuevoIncidente").value.trim();
    // let imagenesIncidente = formNuevoIncidente.querySelector("#filesNuevoIncidente").files;

    if (nombreIncidente === "" || descripcionIncidente === "") {
        Swal.fire({
            title: 'El nombre y la descripción del incidentes son obligatorios.',
            position: "center",
            icon: "warning",
            showConfirmButton: true,
        });
        return;
    }

    let nuevoIncidente = {
        titulo: nombreIncidente,
        descripcion_incidente: descripcionIncidente,
        id_usuario: 72144203,
        id_empresa: 8324,
        id_soporte: 87654321,
    };

    socket.emit("/cliente/crearNuevoIncidente", nuevoIncidente, (respuesta) => {
        if (respuesta.success) {
            Swal.fire({
                title: 'El incidente ha sido enviado exitosamente!',
                position: "center",
                icon: "success",
                showConfirmButton: true,
            });
            modalNuevoIncidente.hide();

        } else {
            console.log(respuesta.error)
            Swal.fire({
                title: 'Hubo un problema al crear el nuevo incidente',
                position: "center",
                icon: "error",
                text: `Inténtalo de nuevo`,
                showConfirmButton: true,
            });
        }
    });
}

//? OTROS
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
btnCrearNuevoIncidente.addEventListener('click', () => crearNuevoIncidente(formNuevoIncidente));

botonesCancelarIncidente.forEach(boton => {
    boton.addEventListener('click', function () {
        modalIncidente.hide();
    });
});

botonesCancelarNuevoIncidente.forEach(boton => {
    boton.addEventListener('click', function () {
        modalNuevoIncidente.hide();
    });
});


