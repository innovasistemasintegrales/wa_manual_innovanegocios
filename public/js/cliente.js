// cliente.js

// Crear la conexión al socket de cliente
const socketClienteConect = () => {
    // Crear la conexión al namespace '/cliente'
    const socket = io('/cliente', {
        withCredentials: true, // Enviar cookies automáticamente
    });

    // Escuchar errores de conexión
    socket.on('connect_error', async (err) => {
        console.error('Error de conexión con el soket:', err.message);


        if (err.message === 'Token inválido o expirado.') {
            console.log('Intentando renovar el token...');

            //! NO SE PUEDE RENOVAR EL TOKEN DE ACCESO PORQUE NO HAY REFRESH TOKEN PARA LOS USUARIOS "CLIENTE"
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
// Iniciar la conexión del socket creado
const socket = socketClienteConect();
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

//? Capturamos los templates para los LISTADOS
const templateItemIncidente = templateIncidentes.querySelector('#templateItemIncidente').content;

//? Capturamos los templates para los MODALES
const templateModalIncidentePendiente_cliente = document.querySelector('#templateModalIncidentePendiente_cliente').content;
const templateModalIncidenteResuelto_cliente = document.querySelector('#templateModalIncidenteResuelto_cliente').content;
const templateModalNuevoIncidente_cliente = document.querySelector('#templateModalNuevoIncidente_cliente').content;

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

// Otros botones
const botonesCancelarIncidente = document.querySelectorAll('#btnCerrarIncidente');
const btnEnviarRespuestaIncidente = document.querySelector('#modalIncidente #btnEnviarRespuestaIncidente');
const btnCrearNuevoIncidente = document.querySelector('#modalNuevoIncidente #btnCrearNuevoIncidente');
const botonesCancelarNuevoIncidente = document.querySelectorAll('#btnCancelarNuevoIncidente');

//TODO ======================== VARIABLES GLOBALES ========================
let listadoGeneralTitulos;
let listadoGeneralUsuarios = [];
let listadoPreguntasFrecuentes = [];
let listadoMenusManuales = [];
let listadoGeneralValoraciones = [];
// let listadoGeneralReportes = [];
let listadoGeneralIncidentes = [];
let perfilUsuario;
let seleccionEstadoIncidente = localStorage.getItem('seleccionEstadoIncidente') || 'Todos'; // Variable para guardar la selección de filtrado por estado de incidente
let limiteIncidentes = localStorage.getItem('limiteIncidentes') || 1000;
let paginaActualIncidentes = 1; // Página inicial
let hayMasIncidentes = true; // Indicador para saber si hay más incidentes
let incidenteSeleccionado;
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
        const switchIncidentesReasignados = document.querySelector('#switchIncidentesReasignados');
        const agregarPorReasignados = !switchIncidentesReasignados.checked || data.dni_tecnico;

        if (agregarPorEstado && agregarPorReasignados) {
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
            clone.querySelector('.btn-abrir-incidente').setAttribute('data-id', data.id_incidente);

            // Insertar el nuevo incidente al inicio del contenedor
            document.getElementById('contenedorIncidentes').insertBefore(clone, document.getElementById('contenedorIncidentes').firstChild);

        }
    }

    // Mostrar un toast o notificación no invasiva
    mostrarNotificacion(
        'Nuevo Incidente',
        `Se ha registrado un nuevo incidente: <strong>${data.titulo}</strong>.`,
        'info',
        7000
    );

});
socket.on('/cliente/actualizacionIncidente', function (data) {
    console.log('Actualización de incidente recibida: ' + data);

    // Añadir el nuevo incidente al listado genera si no es el primer incidente
    if (Object.keys(listadoGeneralIncidentes).length > 0) {
        for (let i = 0; i < Object.keys(listadoGeneralIncidentes).length; i++) {
            if (listadoGeneralIncidentes[i].id_incidente == data.id_incidente) {
                // Actualizar solo los campos proporcionados
                console.log("ID de incidente encontrado: ", listadoGeneralIncidentes[i].id_incidente);
                Object.assign(listadoGeneralIncidentes[i], data);
                break;
                // Otra opción para actulizar solo los campos proporcionados
                // listadoGeneralIncidentes[i] = { ...listadoGeneralIncidentes[i], ...data }
            }
        }
    }

    if (seccionActual === 'Incidentes') {
        console.log('Actualizando incidente en el DOM...');

        // Buscar el incidente en el DOM y actualizar sus datos (si está actualmente en el contenedorIncidentes)
        const incidenteActualizar = document.querySelector(`#contenedorIncidentes .incidente[data-id="${data.id_incidente}"]`);
        console.log(incidenteActualizar)

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
            incidenteActualizar.querySelector(".estado-incidente .detalles-lista").textContent = data.estado;
            incidenteActualizar.querySelector(".estado-incidente .detalles-lista").classList.remove('estado-incidente-Pendiente', 'estado-incidente-Resuelto');
            incidenteActualizar.querySelector(".estado-incidente .detalles-lista").classList.add(`estado-incidente-${data.estado}`);
            incidenteActualizar.querySelector(".btn-abrir-incidente").setAttribute('data-id', data.id_incidente);
        } else {
            console.log("No se encontró el incidente en el DOM");
        }
    }

    // Mostrar un toast o notificación no invasiva
    mostrarNotificacion(
        'Nuevo Incidente',
        `Se ha registrado un nuevo incidente: <strong>${data.titulo}</strong>.`,
        'info',
        7000
    );
});
//!  FALTA IMPLEMENTAR LA ACUTALIZACIÓN DEL DOM DE FORMA NO INVASIVA
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
    mostrarNotificacion(
        'Un Incidente ha sido anulado por el cliente',
        `Se ha eliminado el incidente: <strong>${data.titulo}</strong>`,
        'info',
        7000,
    );
});

//TODO ======================== MARK: LANZAMIENTO DE VISTAS ========================
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
        case e.target.id === "switchIncidentesReasignados":
            listarIncidentes(paginaActualIncidentes, limiteIncidentes);
            break;
        case e.target.classList.contains("btn-incidente-pendiente"):
            abrirIncidentePendiente(e);
            break;
        case e.target.classList.contains("btn-incidente-resuelto"):
            abrirIncidenteResuelto(e);
            break;
        //! FALTA LA IMPLEMENTACIÓN PARA ENVIAR UNA RESPUESTA DE UN INCIDENTE (OPCIONAL)
        case e.target.id === "btnEnviarRespuestaIncidente":
            break;
        case e.target.id === "btnReasignarIncidente":
            // Obtener los datos del modal de incidente
            const numeroIncidente = document.querySelector('#modalIncidentePendiente .numero-incidente').innerText;
            const empresa = document.querySelector('#modalIncidentePendiente .empresa').innerText;
            const nombreIncidente = document.querySelector('#modalIncidentePendiente .nombre-incidente').innerText;
            const detallesIncidente = document.querySelector('#modalIncidentePendiente .detalles').innerText;

            // Pasar los datos al modal de reasignación
            document.querySelector('#modalReasignar .numero-incidente').innerText = numeroIncidente;
            document.querySelector('#modalReasignar .empresa').innerText = empresa;
            document.querySelector('#modalReasignar .nombre-incidente').innerText = nombreIncidente;
            document.querySelector('#modalReasignar .detalles').innerText = detallesIncidente;

            // Cerrar el modal principal y abrir el de reasignación
            modalIncidentePendiente.hide();
            modalReasignar.show();
            console.log(incidenteSeleccionado)
            break;
        case e.target.id === "btnCancelarReasignar":
            modalReasignar.hide();
            modalIncidentePendiente.show();
            break;
        case e.target.id === "btnCerrarIncidente":
            modalIncidentePendiente.hide();
            modalIncidenteResuelto.hide();
            break;
        //! FALTA IMPLEMENTAR LA CREACIÓN DE NUEVOS INCIDENTES PARA EL ADMINISTRADOR (OPCIONAL)
        case e.target.id === "btnCrearNuevoIncidente":
            crearNuevoIncidente(formNuevoIncidente);
            break;
        case e.target.id === "btnCancelarNuevoIncidente":
            modalNuevoIncidente.hide();
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
function abrirIncidentePendiente(e) {
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
    templateModalIncidentePendiente_cliente.querySelector(".numero-incidente").textContent = incidente.id_incidente;
    templateModalIncidentePendiente_cliente.querySelector(".empresa").textContent = incidente.ruc_empresa;
    templateModalIncidentePendiente_cliente.querySelector(".nombre-incidente").innerHTML = `${incidente.titulo} ${incidente.id_rol == 3 ? '<span class="badge bg-warning text-dark">Reasignado</span>' : ''}`;
    templateModalIncidentePendiente_cliente.querySelector(".detalles").textContent = incidente.descripcion_incidente;

    // Asignar fecha y hora al modal
    templateModalIncidentePendiente_cliente.querySelector("#fechaIncidente").textContent = fechaFormateada;
    templateModalIncidentePendiente_cliente.querySelector("#horaIncidente").textContent = horaFormateada;

    contenedorModalIncidentePendiente = document.querySelector('.contenedorModalIncidentePendiente');
    contenedorModalIncidentePendiente.innerHTML = "";
    let clone = templateModalIncidentePendiente_cliente.cloneNode(true);
    contenedorModalIncidentePendiente.appendChild(clone);

    modalIncidentePendiente.show();
}
function abrirIncidenteResuelto(e) {

    // Buscamos al incidente en el listado de incidentes
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
    templateModalIncidenteResuelto_cliente.querySelector(".numero-incidente").textContent = incidente.id_incidente;
    templateModalIncidenteResuelto_cliente.querySelector(".empresa").textContent = incidente.ruc_empresa;
    templateModalIncidenteResuelto_cliente.querySelector(".nombre-incidente").innerHTML = `${incidente.titulo} ${incidente.id_rol == 3 ? '<span class="badge bg-warning text-dark">Reasignado</span>' : ''}`;
    templateModalIncidenteResuelto_cliente.querySelector(".detalles").textContent = incidente.descripcion_incidente;
    templateModalIncidenteResuelto_cliente.querySelector("#respuestaIncidenteSoporte").textContent = incidente.respuesta_soporte;

    // Asignar fecha y hora al modal
    templateModalIncidenteResuelto_cliente.querySelector("#fechaIncidente").textContent = fechaFormateada;
    templateModalIncidenteResuelto_cliente.querySelector("#horaIncidente").textContent = horaFormateada;


    contenedorModalIncidenteResuelto = document.querySelector('.contenedorModalIncidenteResuelto');
    contenedorModalIncidenteResuelto.innerHTML = "";
    let clone = templateModalIncidenteResuelto_cliente.cloneNode(true);
    contenedorModalIncidenteResuelto.appendChild(clone);

    modalIncidenteResuelto.show();
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

    let dataIncidente = {
        titulo: nombreIncidente,
        descripcion_incidente: descripcionIncidente,
    };

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

//? OTRAS FUNCIONES
/**
 * Función para mostrar un toast o notificación
 * @param {String} titulo - El título del toast
 * @param {String} mensaje - El mensaje del toast
 * @param {String} tipo - El tipo del toast (info, success, warning, danger)
 * @param {Number} duracion - La duración del toast en milisegundos
 */
function mostrarNotificacion(titulo, mensaje, tipo = 'info', duracion = 5000) {
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

//TODO =============== INTERACTIVIDAD DEL SIDEBAR (MENÚ DE NAVEGACIÓN) ===============
const btnColapsar = document.getElementById('toggle-btn')
const sidebar = document.getElementById('sidebar')
const btnsNavegacion = document.querySelectorAll('#sidebar > ul > li:nth-child(n+3):not(#btnMenuCerrar)') // Desde el 3er <li> en adelante
const btnsSubmenu = document.querySelectorAll('#sidebar .sub-menu li') // Botones de todos los submenús
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
    })
})
const esVistaMovil = () => window.matchMedia("(max-width: 800px)").matches;
// Cerrar el submenú si se hace clic fuera de él en la vista móvil
document.addEventListener('click', (e) => {
    if (esVistaMovil()) {
        // Verificar si el clic fue fuera del sidebar y no en un btnSubmenu
        if (!sidebar.contains(e.target) && !e.target.closest('.dropdown-btn')) {
            closeAllSubMenus()
        }
    }
});
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
function toggleSubMenu(button) {

    if (!button.nextElementSibling.classList.contains('show') && !esVistaMovil()) {
        closeAllSubMenus()
    }

    button.nextElementSibling.classList.toggle('show')
    button.classList.toggle('rotate')

    if (sidebar.classList.contains('close')) {
        sidebar.classList.toggle('close')
        btnColapsar.classList.toggle('rotate')
    }
}
function toggleSidebar() {
    sidebar.classList.toggle('close')
    btnColapsar.classList.toggle('rotate')

    closeAllSubMenus()
}
function closeAllSubMenus() {
    Array.from(sidebar.getElementsByClassName('show')).forEach(ul => {
        ul.classList.remove('show')
        ul.previousElementSibling.classList.remove('rotate')
    })
}


