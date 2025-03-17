// cliente.js
import * as Utils from '/js/utils.js';

// Crear la conexión al socket de cliente
let socketCliente = null;
const conectarSocket = () => {
    if (!socketCliente) {
        socketCliente = Utils.socketConnect('/cliente');
    }
    return socketCliente;
};

// Iniciar la conexión del socket
const socket = conectarSocket();

// Creación de fragmento para optimizar manipulaciones del DOM
const fragmento = document.createDocumentFragment()

// Capturar referencia al contenedor principal de renderizado
let cardReactivo = document.querySelector('#cardReactivo');

//TODO ================== Referencia a TEMPLATES ==================
//? Capturamos los template de las SECCIONES
const templateInicio = document.querySelector('#cardReactivo').content;
const templateAsesoria = document.querySelector('#templateAsesoria').content;
const templateCalificacion = document.querySelector('#templateCalificacion').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;
const templateModalIncidentePendiente_cliente = document.querySelector('#templateModalIncidentePendiente_cliente').content;
const templateModalIncidenteResuelto_cliente = document.querySelector('#templateModalIncidenteResuelto_cliente').content;
const templateModalNuevoIncidente_cliente = document.querySelector('#templateModalNuevoIncidente_cliente').content;

//? Capturamos los templates para los LISTADOS
const templateItemIncidente = templateIncidentes.querySelector('#templateItemIncidente').content;

//TODO ================== Referencia a ELEMENTOS ==================
let btnMenuManuales = document.querySelector('#btnMenuManuales');
let btnMenuIncidentes = document.querySelector('#btnMenuIncidentes');
let btnMenuCalificacion = document.querySelector('#btnMenuCalificacion');
let btnMenuInicio = document.querySelector('#btnMenuInicio');
let btnMenuCerrar = document.querySelector('#btnMenuCerrar');

// Capturamos y creamos los modales para su manipulación 
const modalIncidentePendiente = new bootstrap.Modal(document.getElementById('modalIncidentePendiente'));
const modalIncidenteResuelto = new bootstrap.Modal(document.getElementById('modalIncidenteResuelto'));
const modalNuevoIncidente = new bootstrap.Modal(document.getElementById('modalNuevoIncidente'));

// Capturamos los Formularios
const formNuevoIncidente = document.getElementById('modalNuevoIncidente');


//TODO ======================== VARIABLES GLOBALES ========================
let IncidenteSeleccionado; // Objeto para guardar el incidente seleccionado
let listadoGeneralTitulos;
let listadoPreguntasFrecuentes = [];
let listadoMenusManuales = [];
let listadoGeneralValoraciones = [];
let listadoGeneralIncidentes = [];
let perfilUsuario;
let seleccionEstadoIncidente = localStorage.getItem('seleccionEstadoIncidente') || 'Todos'; // Variable para guardar la selección de filtrado por estado de incidente
let limiteIncidentes = localStorage.getItem('limiteIncidentes') || 1000;
let paginaActualIncidentes = 1; // Página inicial
let hayMasIncidentes = true; // Indicador para saber si hay más incidentes
let ultimaSeccion = localStorage.getItem('ultimaSeccion') || 'Inicio';
let seccionActual = 'Inicio';
let subtituloActual;
// Variables para la eliminación de PDFs y nuevo PDF
let eliminarPDF = false;
// Contenedores para la inserción de Datos
let contenedorIncidentes;
let contenedorModalIncidentePendiente;
let contenedorModalIncidenteResuelto;
let contenedorModalNuevoIncidente;
let contenedorPreguntasFrecuentes;
let contenedorTitulosManuales;
let contenedorGestorManuales;
let contenedorContenidoManuales;

//TODO == ESCUCHA DE EVENTOS PARA SINCRONIZACIÓN DE DATOS EN TIEMPO REAL ==

//? SINCRONIZACIÒN INCIDENTES
socket.on('/cliente/nuevoIncidente', function (data) {
    console.log('Nuevo incidente recibido:', data);

    // Agregar incidente al listado general si no es el primer incidente
    if (Object.keys(listadoGeneralIncidentes).length > 0) {
        listadoGeneralIncidentes.unshift(data);
    }

    if (seccionActual === 'Incidentes') {
        // Verificar si el nuevo incidente cumple con los filtros actuales
        const agregarPorEstado = data.estado === seleccionEstadoIncidente || seleccionEstadoIncidente === 'Todos';

        if (agregarPorEstado) {
            const template = document.getElementById('templateItemIncidente');
            const clone = document.importNode(template.content, true);

            // Asignar valores del nuevo incidente
            clone.querySelector('.incidente').setAttribute('data-id', data.id_incidente);
            clone.querySelector(".num-incidente .detalles-lista").textContent = data.id_incidente;
            clone.querySelector('.nombre-incidente .detalles-lista').textContent = data.titulo;
            clone.querySelector('.detalles-incidente .detalles-lista').textContent = data.descripcion_incidente;
            clone.querySelector('.nombre-empresa .detalles-lista').textContent = data.ruc_empresa;
            clone.querySelector('.fecha-incidente .detalles-lista').textContent = new Date(data.fecha_creacion).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true, // Para formato AM/PM
            });
            clone.querySelector('.estado-incidente .detalles-lista').textContent = data.estado;
            clone.querySelector('.estado-incidente .detalles-lista').classList.remove('estado-incidente-Pendiente', 'estado-incidente-Resuelto');
            clone.querySelector('.estado-incidente .detalles-lista').classList.add(`estado-incidente-${data.estado}`);
            clone.querySelector(".btn-abrir-incidente").classList.remove('btn-incidente-pendiente', 'btn-incidente-resuelto');
            if (data.estado === 'Pendiente') {
                clone.querySelector(".btn-abrir-incidente").classList.add('btn-incidente-pendiente');
            } else if (data.estado === 'Resuelto') {
                clone.querySelector(".btn-abrir-incidente").classList.add('btn-incidente-resuelto');
            }

            // Insertar la clase para abrir el Modal de Incidente Pendiente o Resuelto
            clone.querySelector(".btn-abrir-incidente").setAttribute('data-id', data.id_incidente);

            // Insertar el nuevo incidente al inicio del contenedor
            document.getElementById('contenedorIncidentes').insertBefore(clone, document.getElementById('contenedorIncidentes').firstChild);

        }
    }

    // Mostrar un toast o notificación no invasiva
    Utils.mostrarNotificacion(
        'Incidente Creado',
        `Tu empresa ha registrado un nuevo incidente: <strong>${data.titulo}</strong>.`,
        'notificar_exito',
        3000
    );

});
socket.on('/cliente/actualizacionIncidente', function (data) {
    console.log('Actualización de incidente recibida: ' + data);

    // Añadir el nuevo incidente al listado genera si no es el primer incidente
    if (Object.keys(listadoGeneralIncidentes).length > 0) {
        const incidenteLista = listadoGeneralIncidentes.find(inc => inc.id_incidente == data.id_incidente);

        if (incidenteLista) {
            console.log(`✔️ Incidente encontrado en listado: ${incidenteLista.id_incidente}`);
            Object.assign(incidenteLista, data);
        }
    }

    if (seccionActual === 'Incidentes') {
        console.log('Actualizando incidente en el DOM...');

        // Buscar el incidente en el DOM y actualizar sus datos (si está actualmente en el contenedorIncidentes)
        const incidenteActualizar = document.querySelector(`#contenedorIncidentes .incidente[data-id="${data.id_incidente}"]`);

        if (incidenteActualizar) {
            incidenteActualizar.dataset.id = data.id_incidente;
            incidenteActualizar.querySelector(".num-incidente .detalles-lista").textContent = data.id_incidente;
            incidenteActualizar.querySelector(".nombre-empresa .detalles-lista").textContent = data.ruc_empresa;

            // Formatear la fecha de creación con horas y minutos
            let fechaCreacion = new Date(data.fecha_creacion);
            let fechaCreacionFormateada = new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true, // Para formato AM/PM
            }).format(fechaCreacion);

            incidenteActualizar.querySelector(".fecha-incidente .detalles-lista").textContent = fechaCreacionFormateada || 'Sin fecha de creacíon';
            let itemEstadoIncidente = incidenteActualizar.querySelector(".estado-incidente .detalles-lista");
            itemEstadoIncidente.textContent = data.estado;
            itemEstadoIncidente.classList.remove(`estado-incidente-Pendiente`, `estado-incidente-Resuelto`);
            itemEstadoIncidente.classList.add(`estado-incidente-${data.estado}`);
            incidenteActualizar.querySelector(".btn-abrir-incidente").setAttribute('data-id', data.id_incidente);

            // Insertar la clase para abrir el Modal de Incidente Pendiente o Resuelto
            incidenteActualizar.querySelector(".btn-abrir-incidente").classList.remove('btn-incidente-pendiente', 'btn-incidente-resuelto');
            if (data.estado === 'Pendiente') {
                incidenteActualizar.querySelector(".btn-abrir-incidente").classList.add('btn-incidente-pendiente');
            } else if (data.estado === 'Resuelto') {
                incidenteActualizar.querySelector(".btn-abrir-incidente").classList.add('btn-incidente-resuelto');
            }
        } else {
            console.log("No se encontró el incidente en el DOM");
        }
    }

    // Mostrar un toast o notificación no invasiva
    Utils.mostrarNotificacion(
        'Incidente Resuelto',
        `El incidente: <strong>${data.titulo}</strong> ya tiene una resolución.`,
        'notificar_exito',
        7000
    );
});
//! NO IMPLEMENTADO: ANUALACIÓN DE INCIDENTES POR PARTE DEL CLIENTE
//!  FALTA IMPLEMENTAR LA ACTUALIZACIÓN DEL DOM DE FORMA NO INVASIVA PARA EL EVENTO DE ELIMINACIÓN DE INCIDENTE
socket.on('/cliente/anulacionIncidente', function (data) {
    console.log('Incidente eliminado recibido: ' + data);

    // Eliminar incidente
    for (let i = 0; i < listadoGeneralIncidentes.length; i++) {
        if (listadoGeneralIncidentes[i].id === data.id) {
            listadoGeneralIncidentes.splice(i, 1);
            break;
        }
    }

    if (seccionActual === 'Incidentes') {
        listarIncidentes(paginaActualIncidentes, limiteIncidentes);
    }

    // Show a toast notification
    Utils.mostrarNotificacion(
        'Incidente Anulado',
        `Se ha eliminado el incidente: <strong>${data.titulo}</strong>`,
        'info',
        7000,
    );
});
socket.on('/cliente/logout', function () {
    // Mostrar mensaje al usuario
    Swal.fire({
        title: 'Cuenta Inhabilitada',
        text: 'Tu cuenta ha sido inhabilitada por un administrador. Por favor, contacta al administrador para más información.',
        icon: 'warning',
        confirmButtonColor: '#0A1E2E',
        confirmButtonText: 'Entendido'
    }).then(() => {
        Utils.cerrarSesion();
    });
});

//TODO ========================LANZAMIENTO DE VISTAS ========================
/* Evento del boton Asesoria */
btnMenuManuales.addEventListener('click', function () {
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
    cardReactivo.appendChild(clone);

    contenedorIncidentes = document.querySelector(`#contenedorIncidentes`);
    // Seleccionar el estado de un incidente ('Todos' de forma predeterminada)
    const opcionEstadoIncidente = document.querySelector(`.op-incidentes-${seleccionEstadoIncidente}`);
    opcionEstadoIncidente.checked = true;
    opcionEstadoIncidente.click();

    consultarIncidentes()
        .then(() => { listarIncidentes(paginaActualIncidentes, limiteIncidentes) })
        .catch((error) => { console.log(error) });


    //! FALTA paginación para listado incidentes
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
    //         socket.emit("/administrador/listadoIncidentes", { pagina: paginaActualIncidentes, limite: limiteIncidentes, estado: seleccionEstadoIncidente }, (respuesta) => {
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

});
/* Evento del boton Calificacion */
btnMenuCalificacion.addEventListener('click', function () {
    cardReactivo.innerHTML = "";

    /* templateValoracion.querySelector('#tituloValoracion').textContent = "Soy modulo valoración"; */
    const clone = templateCalificacion.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
})
// Lanzamiento de la vista de Inicio
btnMenuInicio.addEventListener('click', function () {
    location.reload();

    localStorage.setItem("ultimaSeccion", 'Inicio');
    seccionActual = 'Inicio';
})
// Función del botón Cerrar Sesión
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
//TODO Uso de EVENT DELEGATION para evitar múltiples Event Listeners y reducir memoria

document.addEventListener("click", (e) => {
    switch (true) {

        // TODO: Botones de PREGUNTAS FRECUENTES
        // TODO: Botones de MANUALES
        case e.target.classList.contains("btn-mostrar-contenido-subtitulo"):
            let idSubtitulo_mostrar = e.target.closest('.btn-group').dataset.id;
            mostrarContenidoSubtitulo(idSubtitulo_mostrar);
            break;

        // TODO: Botones de INCIDENTES
        case e.target.classList.contains("op-incidentes-Todos"):
            actualizarEstadoIncidente("Todos");
            break;
        case e.target.classList.contains("op-incidentes-Pendiente"):
            actualizarEstadoIncidente("Pendiente");
            break;
        case e.target.classList.contains("op-incidentes-Resuelto"):
            actualizarEstadoIncidente("Resuelto");
            break;
        case e.target.classList.contains("btn-incidente-pendiente"):
            abrirIncidentePendiente(e);
            break;
        case e.target.classList.contains("btn-incidente-resuelto"):
            abrirIncidenteResuelto(e);
            break;
        case e.target.id === "btnCerrarIncidente":
            modalIncidentePendiente.hide();
            modalIncidenteResuelto.hide();
            break;
        case e.target.id === "btnAbrirNuevoIncidente":
            abrirModalNuevoIncidente();
            break;
        case e.target.id === "btnCrearNuevoIncidente":
            crearNuevoIncidente(formNuevoIncidente);
            break;
        case e.target.id === "btnCancelarNuevoIncidente":
            modalNuevoIncidente.hide();
            break;
        //! FALTA IMPLEMENTAR LA ANULACIÓN DE UN INCIDENTE
        case e.target.id === "btnAnularIncidente":
            anularIncidente(e);
            break;

        default:
            break;
    }
});
function actualizarEstadoIncidente(estado) {
    seleccionEstadoIncidente = estado;
    localStorage.setItem("seleccionEstadoIncidente", estado);
    listarIncidentes(paginaActualIncidentes, limiteIncidentes);
}
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

            templateItemIncidente.querySelector(".incidente").dataset.id = incidente.id_incidente;
            templateItemIncidente.querySelector(".num-incidente .detalles-lista").textContent = incidente.id_incidente;
            templateItemIncidente.querySelector(".nombre-incidente .detalles-lista").innerHTML = incidente.titulo;
            templateItemIncidente.querySelector(".detalles-incidente .detalles-lista").textContent = incidente.descripcion_incidente;
            templateItemIncidente.querySelector(".nombre-empresa .detalles-lista").textContent = incidente.ruc_empresa;
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
            templateItemIncidente.querySelector(".btn-abrir-incidente").classList.remove('btn-incidente-pendiente', 'btn-incidente-resuelto');
            if (incidente.estado === 'Pendiente') {
                templateItemIncidente.querySelector(".btn-abrir-incidente").classList.add('btn-incidente-pendiente');
            } else if (incidente.estado === 'Resuelto') {
                templateItemIncidente.querySelector(".btn-abrir-incidente").classList.add('btn-incidente-resuelto');
            }
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
/**
 * Muestra el modal del incidente pendiente con la información correspondiente
 * @param {Event} e - El evento que desencadena la función
 */
function abrirIncidentePendiente(e) {
    let incidente = listadoGeneralIncidentes.find(incidente => incidente.id_incidente === Number(e.target.dataset.id));
    IncidenteSeleccionado = {
        id_incidente: incidente.id_incidente,
        titulo: incidente.titulo,
        ruc_empresa: incidente.ruc_empresa,
        descripcion_incidente: incidente.descripcion_incidente,
        fecha_creacion: incidente.fecha_creacion,
        fecha_resolucion: incidente.fecha_resolucion,
        fecha_asignacion: incidente.fecha_asignacion,
        fecha_cierre: incidente.fecha_cierre,
        estado: incidente.estado,
    };

    // Crear referencias a los elementos del modal
    contenedorModalIncidentePendiente = document.querySelector('.contenedorModalIncidentePendiente');
    const numeroIncidente = templateModalIncidentePendiente_cliente.querySelector(".numero-incidente");
    const empresa = templateModalIncidentePendiente_cliente.querySelector(".empresa");
    const nombreIncidente = templateModalIncidentePendiente_cliente.querySelector(".nombre-incidente");
    const detalles = templateModalIncidentePendiente_cliente.querySelector(".detalles");
    const fechaIncidente = templateModalIncidentePendiente_cliente.querySelector("#fechaIncidente");
    const horaIncidente = templateModalIncidentePendiente_cliente.querySelector("#horaIncidente");
    const contenedorMultimedia = templateModalIncidentePendiente_cliente.querySelector("#contenedorMultimedia");

    // Modificar los elementos del modal
    numeroIncidente.textContent = incidente.id_incidente;
    empresa.textContent = incidente.ruc_empresa;
    nombreIncidente.textContent = incidente.titulo;
    detalles.textContent = incidente.descripcion_incidente;
    const { fecha: fechaFormateada, hora: horaFormateada } = Utils.formatearFechaHora(incidente.fecha_creacion);
    fechaIncidente.textContent = fechaFormateada;
    horaIncidente.textContent = horaFormateada;

    // Mostrar archivos multimedia
    Utils.mostrarArchivosMultimedia(incidente, contenedorMultimedia);

    // 📌 Preparar y mostrar el modal
    contenedorModalIncidentePendiente.innerHTML = "";
    let clone = templateModalIncidentePendiente_cliente.cloneNode(true);
    contenedorModalIncidentePendiente.appendChild(clone);
    modalIncidentePendiente.show();

    // Obtener el elemento DOM del modal e inicializar el visor de imágenes cuando se muestre
    const modalElement = document.getElementById('modalIncidentePendiente');
    modalElement.addEventListener('shown.bs.modal', function () {
        Utils.inicializarVisorImagenes(modalElement, incidente);
    }, { once: true }); // El evento se ejecutará una sola vez
}
function abrirIncidenteResuelto(e) {

    // Buscamos al incidente en el listado de incidentes
    let incidente = listadoGeneralIncidentes.find(incidente => incidente.id_incidente === Number(e.target.dataset.id));
    console.log("Incidente seleccionado: ", incidente);
    IncidenteSeleccionado = {
        id_incidente: incidente.id_incidente,
        titulo: incidente.titulo,
        ruc_empresa: incidente.ruc_empresa,
        descripcion_incidente: incidente.descripcion_incidente,
        fecha_creacion: incidente.fecha_creacion,
        fecha_resolucion: incidente.fecha_resolucion,
        fecha_asignacion: incidente.fecha_asignacion,
        fecha_cierre: incidente.fecha_cierre,
        estado: incidente.estado,
    };

    // Crear referencias a los elementos del modal
    contenedorModalIncidenteResuelto = document.querySelector('.contenedorModalIncidenteResuelto');
    const numeroIncidenteElement = templateModalIncidenteResuelto_cliente.querySelector(".numero-incidente");
    const empresaElement = templateModalIncidenteResuelto_cliente.querySelector(".empresa");
    const nombreIncidenteElement = templateModalIncidenteResuelto_cliente.querySelector(".nombre-incidente");
    const detallesElement = templateModalIncidenteResuelto_cliente.querySelector(".detalles");
    const fechaIncidenteElement = templateModalIncidenteResuelto_cliente.querySelector("#fechaIncidente");
    const horaIncidenteElement = templateModalIncidenteResuelto_cliente.querySelector("#horaIncidente");
    const respuestaSoporteElement = templateModalIncidenteResuelto_cliente.querySelector("#respuestaIncidenteSoporte");
    const contenedorMultimedia = templateModalIncidenteResuelto_cliente.querySelector("#contenedorMultimedia");

    // Modificar los elementos del modal
    numeroIncidenteElement.textContent = incidente.id_incidente;
    empresaElement.textContent = incidente.ruc_empresa;
    nombreIncidenteElement.textContent = incidente.titulo;
    detallesElement.textContent = incidente.descripcion_incidente;
    respuestaSoporteElement.textContent = incidente.respuesta_soporte;

    // Convertir la fecha_creacion y fecha_resolucion en formato legible
    const { fecha: fechaFormateada, hora: horaFormateada } = Utils.formatearFechaHora(incidente.fecha_resolucion || incidente.fecha_creacion);
    // const { fecha: fechaFormateada2, hora: horaFormateada2 } = formatearFechaHora(incidente.fecha_resolucion);
    // Asignar fecha y hora al modal
    fechaIncidenteElement.textContent = fechaFormateada;
    horaIncidenteElement.textContent = horaFormateada;
    // fechaIncidenteElement.textContent = fechaFormateada2;
    // horaIncidenteElement.textContent = horaFormateada2;

    // Mostrar archivos multimedia
    Utils.mostrarArchivosMultimedia(incidente, contenedorMultimedia);

    // Preparar y mostrar el modal
    contenedorModalIncidenteResuelto.innerHTML = "";
    let clone = templateModalIncidenteResuelto_cliente.cloneNode(true);
    contenedorModalIncidenteResuelto.appendChild(clone);
    modalIncidenteResuelto.show();

    // Obtener el elemento DOM del modal e inicializar el visor de imágenes cuando se muestre
    const modalElement = document.getElementById('modalIncidenteResuelto');
    modalElement.addEventListener('shown.bs.modal', function () {
        Utils.inicializarVisorImagenes(modalElement, incidente);
    }, { once: true }); // El evento se ejecutará una sola vez
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
    templateModalNuevoIncidente_cliente.querySelector("#fechaNuevoIncidente").textContent = fecha;

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
    templateModalNuevoIncidente_cliente.querySelector("#tituloNuevoIncidente").value = "";
    templateModalNuevoIncidente_cliente.querySelector("#descripcionNuevoIncidente").value = "";

    let clone = templateModalNuevoIncidente_cliente.cloneNode(true);
    contenedorModalNuevoIncidente.appendChild(clone);

    modalNuevoIncidente.show();

    // Ejecutar la función de actualización de la hora de inmediato
    actualizarHora();
}
/**
 * Crea un nuevo incidente en el sistema.
 * 
 * @param {HTMLFormElement} formNuevoIncidente Formulario que contiene la información del incidente.
 * 
 * @returns {Promise<void>} Una promesa que se resuelve cuando el incidente se ha creado correctamente.
 */
async function crearNuevoIncidente(formNuevoIncidente) {
    let nombreIncidente = formNuevoIncidente.querySelector("#tituloNuevoIncidente").value.trim();
    let descripcionIncidente = formNuevoIncidente.querySelector("#descripcionNuevoIncidente").value.trim();
    let multimediaInput = formNuevoIncidente.querySelector("#filesNuevoIncidente").files;

    // Validación de campos obligatorios
    if (nombreIncidente === "" || descripcionIncidente === "") {
        Swal.fire({
            title: 'El nombre y la descripción del incidente son obligatorios.',
            position: "center",
            icon: "warning",
            showConfirmButton: true,
        });
        return;
    }

    let archivosSubidos = []; // Array para guardar las URLs de los archivos subidos

    // 📌 Subir los archivos si el usuario ha seleccionado alguno
    if (multimediaInput.length > 0) {
        try {
            archivosSubidos = await subirMultimedia(multimediaInput);
            console.log("Archivos subidos:", archivosSubidos);
        } catch (error) {
            console.error("Error subiendo archivos:", error);
            Swal.fire({
                title: "Error al subir archivos",
                text: "Inténtalo nuevamente",
                icon: "error",
                showConfirmButton: true,
            });
            return;
        }
    }

    // 📌 Crear el objeto con la información del incidente
    let dataIncidente = {
        titulo: nombreIncidente,
        descripcion_incidente: descripcionIncidente,
        archivos: archivosSubidos // Enviar las URLs de los archivos subidos
    };

    // 📌 Enviar el incidente al backend a través del socket
    socket.emit("/cliente/crearNuevoIncidente", dataIncidente, (respuesta) => {
        if (respuesta.success) {
            Swal.fire({
                title: 'El incidente ha sido enviado exitosamente!',
                position: "center",
                icon: "success",
                showConfirmButton: true,
            });
            modalNuevoIncidente.hide();

        } else {
            console.error("Error en el servidor:", respuesta.error);
            Swal.fire({
                title: 'Hubo un problema al crear el nuevo incidente',
                position: "center",
                icon: "error",
                text: "Inténtalo de nuevo",
                showConfirmButton: true,
            });
        }
    });
}
/**
 * Sube varios archivos a la ruta /upload-multiple y devuelve un array con las URLs de los archivos subidos.
 * 
 * @param {FileList} archivos Archivos seleccionados por el usuario.
 * @returns {Promise<string[]>} Una promesa que se resuelve con un array de URLs de los archivos subidos.
 */
async function subirMultimedia(archivos) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();

        // Agregar todos los archivos seleccionados al FormData
        for (let i = 0; i < archivos.length; i++) {
            formData.append('files', archivos[i]);
        }

        // 📌 Enviar la petición al servidor para subir los archivos
        fetch('/upload-multiple', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.files) {
                    // Extraer solo las URLs de los archivos subidos
                    const urls = data.files.map(file => file.url);
                    resolve(urls);
                } else {
                    reject("No se recibieron archivos en la respuesta.");
                }
            })
            .catch(error => reject(error));
    });
}
//! FALTA IMPLEMENTAR LA ANULACIÓN DE UN INCIDENTE
function anularIncidente() {

    let dataIncidente = {
        id_incidente: IncidenteSeleccionado,
        id_persona_incidente: document.querySelector('#modalReasignar .id-persona-incidente').value,
    };
    socket.emit("/cliente/anularIncidente", dataIncidente, (respuesta) => {
        if (respuesta.success) {
            Swal.fire({
                title: 'El incidente ha sido anulado exitosamente!',
                position: "center",
                icon: "success",
                showConfirmButton: true,
            });
            modalNuevoIncidente.hide();

        } else {
            console.log(respuesta.error)
            Swal.fire({
                title: 'Hubo un problema al anular el incidente',
                position: "center",
                icon: "error",
                text: `Inténtalo de nuevo`,
                showConfirmButton: true,
            });
        }
    });
}

//TODO =============== INTERACTIVIDAD DEL SIDEBAR (MENÚ DE NAVEGACIÓN) ===============
/** 
 * Inicializa la interactividad del sidebar cuando el DOM esté completamente cargado
 * Esta función se encarga de asignar los eventos de click a los elementos del sidebar
 * y de inicializar el estado de los elementos del sidebar cuando sea necesario.
 */
document.addEventListener('DOMContentLoaded', () => {
    Utils.inicializarSidebar();
});