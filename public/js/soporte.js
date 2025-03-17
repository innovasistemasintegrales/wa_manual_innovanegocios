// soporte.js
import * as Utils from '/js/utils.js';


// Crear la conexión al socket de soporte
let socketSoporte = null;
function conectarSocket() {
    if (!socketSoporte) {
        socketSoporte = Utils.socketConnect('/soporte');
    }
    return socketSoporte;
};

// Iniciar la conexión del socket
const socket = conectarSocket();

// Creación de fragmento para optimizar manipulaciones del DOM
const fragmento = document.createDocumentFragment();
/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

//TODO ====================== Referencia a TEMPLATES =====================
//? Template para las diferentes secciones
const templateInicio = document.querySelector('#cardReactivo').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;
const templateReportes = document.querySelector('#templateReportes').content;

//? Capturamos templates para los listados
const templateItemIncidente = templateIncidentes.querySelector('#templateItemIncidente').content;

//? Template para modales
const templateModalIncidentePendiente = document.querySelector('#templateModalIncidentePendiente').content;
const templateModalIncidenteResuelto = document.querySelector('#templateModalIncidenteResuelto').content;

//TODO ======================= Referencia a ELEMENTOS ========================
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');
let btnMenuIncidentes = document.querySelector('#btnMenuIncidentes');
let btnMenuReportes = document.querySelector('#btnMenuReportes');
let btnMenuInicio = document.querySelector('#btnMenuInicio');
let btnMenuCerrar = document.querySelector('#btnMenuCerrar');

// Capturamos y creamos los modales para su manipulación 
const modalIncidentePendiente = new bootstrap.Modal(document.getElementById('modalIncidentePendiente'));
const modalIncidenteResuelto = new bootstrap.Modal(document.getElementById('modalIncidenteResuelto'));
const modalReasignar = new bootstrap.Modal(document.getElementById('modalReasignar'));

// Capturamos los Formularios
const formRespuestaIncidente = document.getElementById('modalIncidentePendiente');

//TODO ======================== VARIABLES GLOBALES ========================
// let listadoGeneralReportes = {}; // Listado de reportes
let listadoGeneralIncidentes = []; // Listado de incidentes
let listadoGeneralTecnicos = []; // Listado de técnicos
let perfilUsuario; // Objeto para guardar el perfil del usuario actual
let limiteIncidentes = localStorage.getItem('limiteIncidentes') || 1000;
let paginaActualIncidentes = 1; // Página inicial
let hayMasIncidentes = true; // Indicador para saber si hay más incidentes
let ultimaSeccion = localStorage.getItem('ultimaSeccion') || 'Inicio';
let seccionActual = 'Inicio';
let seleccionEstadoIncidente = localStorage.getItem('seleccionEstadoIncidente') || 'Todos'; // Variable para guardar la selección de filtrado por estado de incidente
let idIncidenteSeleccionado; // Objeto para guardar el incidente seleccionado
// Contenedores
let contenedorIncidentes;
let contenedorModalIncidentePendiente;
let contenedorModalIncidenteResuelto;
let contenedorModalNuevoIncidente;

//TODO ESCUCHA DE EVENTOS PARA SINCRONIZACIÓN DE DATOS EN TIEMPO REAL

// ? SINCRONIZACIÒN INCIDENTES
socket.on('/soporte/nuevoIncidente', function (data) {
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
        'Nuevo Incidente Recibido',
        `Tienes un nuevo incidente pendiente: <strong>${data.titulo}</strong>.`,
        'notificar_problema',
        7000
    );

});
socket.on('/soporte/actualizacionIncidente', function (data) {
    console.log('🔄 Actualización de incidente recibida:', data);

    // Añadir el nuevo incidente al listado genera si no es el primer incidente
    if (Object.keys(listadoGeneralIncidentes).length > 0) {
        const incidenteLista = listadoGeneralIncidentes.find(inc => inc.id_incidente == data.id_incidente);

        if (incidenteLista) {
            console.log(`✔️ Incidente encontrado en listado: ${incidenteLista.id_incidente}`);
            Object.assign(incidenteLista, data);
        }
    }

    // 🔹 Solo actualizar el DOM si estamos en la sección "Incidentes"
    if (seccionActual === 'Incidentes') {
        console.log('🎯 Actualizando incidente en el DOM...');

        // Buscar el incidente en el DOM
        const incidenteActualizar = document.querySelector(`#contenedorIncidentes .incidente[data-id="${data.id_incidente}"]`);

        if (incidenteActualizar) {
            // 🔹 Elementos dentro del incidente
            const numIncidente = incidenteActualizar.querySelector('.num-incidente .detalles-lista');
            const nombreEmpresa = incidenteActualizar.querySelector('.nombre-empresa .detalles-lista');
            const tituloIncidente = incidenteActualizar.querySelector('.nombre-incidente .detalles-lista');
            const estadoElemento = incidenteActualizar.querySelector('.estado-incidente .detalles-lista');
            const btnAbrirIncidente = incidenteActualizar.querySelector('.btn-abrir-incidente');

            // 🔹 Actualizar datos básicos
            incidenteActualizar.dataset.id = data.id_incidente;
            numIncidente.textContent = data.id_incidente;
            nombreEmpresa.textContent = data.ruc_empresa;

            // 🔹 Gestionar badges (evitar duplicados)
            const badgeReasignado = data.tecnico_asignado.length > 0 ? '<span class="badge bg-warning text-dark">Reasignado</span>' : '';
            const badgeRespuesta = data.respuesta_tecnico ? '<span class="badge bg-success">Respuesta Recibida</span>' : '';
            tituloIncidente.innerHTML = `${data.titulo} ${badgeReasignado} ${badgeRespuesta}`;

            // 🔹 Actualizar estado visualmente
            estadoElemento.textContent = data.estado;
            estadoElemento.classList.remove('estado-incidente-Pendiente', 'estado-incidente-Resuelto');
            estadoElemento.classList.add(`estado-incidente-${data.estado}`);

            // 🔹 Actualizar atributos del botón de apertura
            btnAbrirIncidente.setAttribute('data-id', data.id_incidente);
            btnAbrirIncidente.classList.remove('btn-incidente-pendiente', 'btn-incidente-resuelto');
            btnAbrirIncidente.classList.add(data.estado === 'Pendiente' ? 'btn-incidente-pendiente' : 'btn-incidente-resuelto');

        } else {
            console.warn("⚠️ No se encontró el incidente en el DOM");
        }
    }

    // Mostrar notificación
    Utils.mostrarNotificacion(
        'Incidente Actualizado',
        `Se ha actualizado el incidente: <strong>${data.titulo}</strong>.`,
        'notificar_informacion',
        7000
    );
});
socket.on('/soporte/logout', function () {
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
//! NO IMPLEMENTADO: ANUALACIÓN DE INCIDENTES POR PARTE DEL CLIENTE
//!  FALTA IMPLEMENTAR LA ACTUALIZACIÓN DEL DOM DE FORMA NO INVASIVA PARA EL EVENTO DE ELIMINACIÓN DE INCIDENTE
socket.on('/soporte/anulacionIncidente', function (data) {
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

    // Mostrar notificación
    Utils.mostrarNotificacion(
        'Incidente Actualizado',
        `Se ha actualizado el incidente: <strong>${data.titulo}</strong>.`,
        'notificar_informacion',
        7000
    );
});

//TODO ======================== LANZAMIENTO DE VISTAS ========================
// Lanzamiento de la vista  Incidentes
btnMenuIncidentes.addEventListener('click', function () {
    localStorage.setItem('ultimaSeccion', 'Incidentes');
    seccionActual = 'Incidentes';

    cardReactivo.innerHTML = "";
    const clone = templateIncidentes.cloneNode(true);
    cardReactivo.appendChild(clone);

    contenedorIncidentes = document.querySelector(`#contenedorIncidentes`);
    // Seleccionar el estado de un incidente ('Todos' de forma predeterminada
    const opcionEstadoIncidente = document.querySelector(`.op-incidentes-${seleccionEstadoIncidente}`);
    opcionEstadoIncidente.checked = true;
    opcionEstadoIncidente.click();

    consultarIncidentes()
        .then(() => { listarIncidentes(paginaActualIncidentes, limiteIncidentes) })
        .catch((error) => { console.log(error) });

    consultarTecnicos()
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
// Lanzamiento de la vista  configuración
btnMenuConfiguracion.addEventListener('click', async function () {
    localStorage.setItem('ultimaSeccion', 'Configuracion');
    seccionActual = 'Configuracion';
    cardReactivo.innerHTML = "";

    // consultar info del usuario
    perfilUsuario = await miInfoUsuario();

    if (perfilUsuario) {
        templateConfiguracion.querySelector('#nombreUsuario').value = perfilUsuario.nombres + " " + perfilUsuario.apellidos;
        templateConfiguracion.querySelector('#correoUsuario').value = perfilUsuario.correo;
        templateConfiguracion.querySelector('#userUsuario').value = perfilUsuario.usuario;
        templateConfiguracion.querySelector('#dniUsuario').value = perfilUsuario.dni;
        templateConfiguracion.querySelector('#telefonoUsuario').value = perfilUsuario.telefono;
        templateConfiguracion.querySelector('#direccionUsuario').value = perfilUsuario.direccion;
        templateConfiguracion.querySelector('#nacimientoUsuario').value = perfilUsuario.nacimiento;
        templateConfiguracion.querySelector('#estadoUsuario').value = perfilUsuario.estado;
    }

    const clone = templateConfiguracion.cloneNode(true);
    fragmento.appendChild(clone);
    cardReactivo.appendChild(fragmento);


    // Selecciona el contenedor de configuración o el template que se muestra al hacer click
    const formConfiguracionUsuario = document.getElementById('editarUsuarioConfiguracion');

    // Botones dentro de la sección de configuración
    const btnEditarUsuario = formConfiguracionUsuario.querySelector('#editButton');
    const btnCancelarEdicion = formConfiguracionUsuario.querySelector('#cancelButton');
    const btnGuardarCambios = formConfiguracionUsuario.querySelector('#saveButton');

    // Estado original para restaurar al cancelar
    let estadoOriginal = {};

    // Listeners para los botones de editar, cancelar y guardar
    btnEditarUsuario.addEventListener('click', () => habilitarEdicion(formConfiguracionUsuario));
    btnCancelarEdicion.addEventListener('click', () => cancelarEdicion(formConfiguracionUsuario, estadoOriginal));
    btnGuardarCambios.addEventListener('click', () => guardarCambios(btnGuardarCambios, formConfiguracionUsuario));

    // Guardar estado original al iniciar la configuración
    guardarEstadoOriginal(formConfiguracionUsuario, estadoOriginal);

    // Validación en tiempo real para los inputs
    formConfiguracionUsuario.querySelectorAll('input:not([type="file"]):not(#nacimientoUsuario):not([type="radio"])').forEach(input => {
        input.addEventListener('input', () => {
            const esValido = validarCampoConfiguracion(input);
            verificarCambios(formConfiguracionUsuario, estadoOriginal, btnGuardarCambios);
            btnGuardarCambios.disabled = !esValido;
        });
    });
});
// Lanzamiento de la vista reportes
btnMenuReportes.addEventListener('click', function () {
    localStorage.setItem('ultimaSeccion', 'Reportes');
    seccionActual = 'Reportes';
    cardReactivo.innerHTML = "";

    // Clonar el template de reportes
    const clone = document.importNode(templateReportes, true);

    // Establecer la fecha actual como valor predeterminado para fechaFin
    const fechaActual = new Date();
    const fechaFinInput = clone.querySelector('#fechaFin');
    fechaFinInput.valueAsDate = fechaActual;

    // Establecer la fecha de hace un mes como valor predeterminado para fechaInicio
    const fechaUnMesAtras = new Date();
    fechaUnMesAtras.setMonth(fechaUnMesAtras.getMonth() - 1);
    const fechaInicioInput = clone.querySelector('#fechaInicio');
    fechaInicioInput.valueAsDate = fechaUnMesAtras;

    const contenedorReportes = clone.querySelector('#contenedorReportesGenerados');
    // Cargar reportes guardados en localStorage
    cargarReportesGuardados(contenedorReportes);

    // Agregar el clone al DOM
    cardReactivo.appendChild(clone);
});
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
    }).then((resultado) => {
        if (resultado.isConfirmed) {

            Utils.cerrarSesion();

        }
    });
})

//TODO Uso de EVENT DELEGATION para evitar múltiples Event Listeners y reducir memoria
document.addEventListener("click", (e) => {
    switch (true) {

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
        case e.target.id === "btnEnviarRespuestaIncidente":
            enviarRespuestaIncidente(formRespuestaIncidente);
            break;
        case e.target.id === "btnReasignarIncidente":
            abrirModalReasignarIncidente();
            break;
        case e.target.id === "btnConfirmarReasignarIncidente":
            reasignarIncidente();
            break;
        case e.target.id === "btnCancelarReasignar":
            modalReasignar.hide();
            modalIncidentePendiente.show();
            break;
        case e.target.id === "btnCerrarIncidente":
            modalIncidentePendiente.hide();
            modalIncidenteResuelto.hide();
            break;

        // TODO: Botones de REPORTES
        case e.target.classList.contains("btn-descargar-reporte"):
            const reporteIdDescargar = e.target.closest('.btn-descargar-reporte').dataset.reporteId;
            const reportesGuardados = JSON.parse(localStorage.getItem('reportes_soporte') || '[]');
            const reporteInfo = reportesGuardados.find(r => r.id === reporteIdDescargar);
            if (reporteInfo) {
                descargarReporte(reporteInfo);
            }
            break;
        case e.target.classList.contains("btn-eliminar-reporte"):
            const reporteIdEliminar = e.target.closest('.btn-eliminar-reporte').dataset.reporteId;
            eliminarReporte(reporteIdEliminar);
            break;
        case e.target.id === "btnGenerarReporte":
            consultarIncidentes()
                .then(() => { generarReporte() })
                .catch((error) => { console.log(error) });
            break;
        case e.target.id === "btnLimpiarFiltros":
            limpiarFiltrosReporte();
            break;

        default:
            break;
    }
});

//TODO ======================== FUNCIONES ========================

//? FUNCIONES DE SECCIÓN "INCIDENTES"
function consultarIncidentes() {
    return new Promise((resolve, reject) => {
        if (Object.keys(listadoGeneralIncidentes).length > 0) {
            console.log("No se consultaron los incidentes porque ya se consultaron.");
            resolve();
        } else {
            socket.emit("/soporte/listadoIncidentes", { pagina: 1, limite: limiteIncidentes, estado: 'Todos' }, (respuesta) => {
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
function consultarTecnicos() {
    return new Promise((resolve, reject) => {
        if (Object.keys(listadoGeneralTecnicos).length > 0) {
            console.log("No se consultaron los técnicos porque ya se consultaron.");
            resolve();
        } else {
            socket.emit("/soporte/listadoTecnicos", (respuesta) => {
                if (respuesta.success) {
                    console.log("Se consultaron los técnicos: ", respuesta.data);
                    listadoGeneralTecnicos = respuesta.data;
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
    const switchIncidentesReasignados = document.querySelector('#switchIncidentesReasignados');

    listadoGeneralIncidentes.forEach(incidente => {

        let agregarPorEstado = incidente.estado === seleccionEstadoIncidente || seleccionEstadoIncidente === 'Todos';
        let agregarPorReasignados = !switchIncidentesReasignados.checked || incidente.tecnico_asignado[0];

        if (agregarPorEstado && agregarPorReasignados) {
            // Obtener referencias a todos los elementos que se modificarán
            const itemIncidente = templateItemIncidente.querySelector(".incidente");
            const numIncidente = templateItemIncidente.querySelector(".num-incidente .detalles-lista");
            const nombreIncidente = templateItemIncidente.querySelector(".nombre-incidente .detalles-lista");
            const detallesIncidente = templateItemIncidente.querySelector(".detalles-incidente .detalles-lista");
            const nombreEmpresa = templateItemIncidente.querySelector(".nombre-empresa .detalles-lista");
            const fechaIncidente = templateItemIncidente.querySelector(".fecha-incidente .detalles-lista");
            const itemEstadoIncidente = templateItemIncidente.querySelector(".estado-incidente .detalles-lista");
            const btnAbrirIncidente = templateItemIncidente.querySelector(".btn-abrir-incidente");

            // Actualizar los datos del incidente
            itemIncidente.dataset.id = incidente.id_incidente;
            numIncidente.textContent = incidente.id_incidente;

            // Mostrar los badges de reasignado y respuesta del técnico
            const badgeReasignado = incidente.tecnico_asignado.length > 0 ? '<span class="badge bg-warning text-dark">Reasignado</span>' : '';
            const badgeRespuesta = incidente.respuesta_tecnico ? '<span class="badge bg-success">Respuesta Recibida</span>' : '';
            nombreIncidente.innerHTML = `${incidente.titulo} ${badgeReasignado} ${badgeRespuesta}`;

            detallesIncidente.textContent = incidente.descripcion_incidente;
            nombreEmpresa.textContent = incidente.ruc_empresa;

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
            fechaIncidente.textContent = fechaFormateada || 'Sin fecha de creación';

            // Actualizar el estado del incidente
            itemEstadoIncidente.textContent = incidente.estado;
            itemEstadoIncidente.classList.remove(`estado-incidente-Pendiente`, `estado-incidente-Resuelto`);
            itemEstadoIncidente.classList.add(`estado-incidente-${incidente.estado}`);

            // Actualizar el botón de abrir incidente
            btnAbrirIncidente.classList.remove('btn-incidente-pendiente', 'btn-incidente-resuelto');
            if (incidente.estado === 'Pendiente') {
                btnAbrirIncidente.classList.add('btn-incidente-pendiente');
            } else if (incidente.estado === 'Resuelto') {
                btnAbrirIncidente.classList.add('btn-incidente-resuelto');
            }
            btnAbrirIncidente.dataset.id = incidente.id_incidente;

            const clone = templateItemIncidente.cloneNode(true);
            fragmento.appendChild(clone);

            incidentesFiltrados += 1;
        }
    });

    let divSinResultados = document.querySelector(`#divSinResultadosIncidentes`);
    divSinResultados.innerHTML = '';

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
    // Buscar el incidente seleccionado en el listado de incidentes
    let incidente = listadoGeneralIncidentes.find(incidente => incidente.id_incidente === Number(e.target.dataset.id));
    console.log("Incidente seleccionado: ", incidente);

    // Almacenar datos del incidente seleccionado para uso posterior
    idIncidenteSeleccionado = {
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

    // Obtener referencias a los elementos del modal
    contenedorModalIncidentePendiente = document.querySelector('.contenedorModalIncidentePendiente');
    const numeroIncidente = templateModalIncidentePendiente.querySelector(".numero-incidente");
    const empresaIncidente = templateModalIncidentePendiente.querySelector(".empresa");
    const nombreIncidente = templateModalIncidentePendiente.querySelector(".nombre-incidente");
    const detallesIncidente = templateModalIncidentePendiente.querySelector(".detalles");
    const fechaIncidenteElement = templateModalIncidentePendiente.querySelector("#fechaIncidente");
    const horaIncidenteElement = templateModalIncidentePendiente.querySelector("#horaIncidente");
    const respuestaTextarea = templateModalIncidentePendiente.querySelector("#respuestaIncidente");
    const contenedorRespuestaTecnico = templateModalIncidentePendiente.querySelector("#contenedorRespuestaTecnico");
    const respuestaTecnico = templateModalIncidentePendiente.querySelector("#respuestaTecnico");
    const contenedorMultimedia = templateModalIncidentePendiente.querySelector("#contenedorMultimedia");

    // Asignar valores al modal
    numeroIncidente.textContent = incidente.id_incidente;
    empresaIncidente.textContent = incidente.ruc_empresa;
    const badgeReasignado = incidente.tecnico_asignado && incidente.tecnico_asignado.length > 0
        ? '<span class="badge bg-warning text-dark">Reasignado</span>'
        : '';
    const badgeRespuesta = incidente.respuesta_tecnico
        ? '<span class="badge bg-success">Respuesta Recibida</span>'
        : '';
    nombreIncidente.innerHTML = `${incidente.titulo} ${badgeReasignado} ${badgeRespuesta}`;
    detallesIncidente.textContent = incidente.descripcion_incidente;
    const fechaHora = Utils.formatearFechaHora(incidente.fecha_creacion);
    fechaIncidenteElement.textContent = fechaHora.fecha;
    horaIncidenteElement.textContent = fechaHora.hora;
    contenedorRespuestaTecnico.style.display = incidente.respuesta_tecnico ? 'block' : 'none';
    if (incidente.respuesta_tecnico) {
        respuestaTecnico.textContent = incidente.respuesta_tecnico;
    }

    // Limpiar el textarea para la nueva respuesta de soporte
    respuestaTextarea.value = "";

    // Mostrar archivos multimedia usando la nueva función
    Utils.mostrarArchivosMultimedia(incidente, contenedorMultimedia);

    // Preparar y mostrar el modal
    contenedorModalIncidentePendiente.innerHTML = "";
    let clone = templateModalIncidentePendiente.cloneNode(true);
    contenedorModalIncidentePendiente.appendChild(clone);
    modalIncidentePendiente.show();

    // Obtener el elemento DOM del modal e inicializar el visor de imágenes cuando se muestre
    const modalElement = document.getElementById('modalIncidentePendiente');
    modalElement.addEventListener('shown.bs.modal', function () {
        Utils.inicializarVisorImagenes(modalElement, incidente);
    }, { once: true }); // El evento se ejecutará una sola vez
}
function abrirIncidenteResuelto(e) {
    let incidente = listadoGeneralIncidentes.find(incidente => incidente.id_incidente === Number(e.target.dataset.id));
    console.log("Incidente seleccionado: ", incidente);
    idIncidenteSeleccionado = {
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

    // Obtener referencias a los elementos del modal
    const numeroIncidente = templateModalIncidenteResuelto.querySelector(".numero-incidente");
    const empresaIncidente = templateModalIncidenteResuelto.querySelector(".empresa");
    const nombreIncidente = templateModalIncidenteResuelto.querySelector(".nombre-incidente");
    const detallesIncidente = templateModalIncidenteResuelto.querySelector(".detalles");
    const fechaIncidenteElement = templateModalIncidenteResuelto.querySelector("#fechaIncidente");
    const horaIncidenteElement = templateModalIncidenteResuelto.querySelector("#horaIncidente");
    const respuestaSoporte = templateModalIncidenteResuelto.querySelector("#respuestaIncidenteSoporte");
    const contenedorMultimedia = templateModalIncidenteResuelto.querySelector("#contenedorMultimedia");

    // Asignar valores al modal
    numeroIncidente.textContent = incidente.id_incidente;
    empresaIncidente.textContent = incidente.ruc_empresa;

    // Preparar los badges para el título
    const badgeReasignado = incidente.tecnico_asignado && incidente.tecnico_asignado.length > 0
        ? '<span class="badge bg-warning text-dark">Reasignado</span>'
        : '';
    const badgeRespuesta = incidente.respuesta_tecnico
        ? '<span class="badge bg-success">Respuesta Recibida</span>'
        : '';
    nombreIncidente.innerHTML = `${incidente.titulo} ${badgeReasignado} ${badgeRespuesta}`;

    detallesIncidente.textContent = incidente.descripcion_incidente;
    respuestaSoporte.textContent = incidente.respuesta_soporte;

    // Formatear y mostrar fecha y hora
    const { fecha: fechaFormateada, hora: horaFormateada } = Utils.formatearFechaHora(incidente.fecha_resolucion || incidente.fecha_creacion);
    fechaIncidenteElement.textContent = fechaFormateada;
    horaIncidenteElement.textContent = horaFormateada;

    // Mostrar archivos multimedia usando la nueva función
    Utils.mostrarArchivosMultimedia(incidente, contenedorMultimedia);

    // Preparar y mostrar el modal
    contenedorModalIncidenteResuelto = document.querySelector('.contenedorModalIncidenteResuelto');
    contenedorModalIncidenteResuelto.innerHTML = "";
    let clone = templateModalIncidenteResuelto.cloneNode(true);
    contenedorModalIncidenteResuelto.appendChild(clone);

    // Mostrar el modal
    modalIncidenteResuelto.show();

    // Obtener el elemento DOM del modal e inicializar el visor de imágenes cuando se muestre
    const modalElement = document.getElementById('modalIncidenteResuelto');
    modalElement.addEventListener('shown.bs.modal', function () {
        Utils.inicializarVisorImagenes(modalElement, incidente);
    }, { once: true }); // El evento se ejecutará una sola vez
}
function enviarRespuestaIncidente(formRespuestaIncidente) {
    let respuesta = formRespuestaIncidente.querySelector("#respuestaIncidente").value.trim();
    let ruc_empresa = formRespuestaIncidente.querySelector("#rucEmpresa").textContent.trim();
    let id_incidente = formRespuestaIncidente.querySelector("#idIncidente").textContent.trim();
    // let imagenesIncidente = formNuevoIncidente.querySelector("#filesNuevoIncidente").files;

    if (respuesta === "") {
        Swal.fire({
            title: 'Es obligatoria una respuesta para el cliente.',
            position: "center",
            icon: "warning",
            showConfirmButton: true,
        });
        return;
    }

    let respuestaIncidente = {
        respuesta: respuesta,
        ruc_empresa: ruc_empresa,
        id_incidente: id_incidente
    };

    console.log("Respuesta para el cliente: ", respuestaIncidente);

    socket.emit("/soporte/enviarRespuestaCliente", respuestaIncidente, (respuesta) => {
        if (respuesta.success) {
            Swal.fire({
                title: 'Tu respuesta se ha sido enviado correctamente!',
                position: "center",
                icon: "success",
                showConfirmButton: true,
            });
            modalIncidentePendiente.hide();

        } else {
            console.log(respuesta.error)
            Swal.fire({
                title: 'Hubo un problema al enviar tu respuesta',
                position: "center",
                icon: "error",
                text: respuesta.error,
                showConfirmButton: true,
            });
        }

    });
}
function abrirModalReasignarIncidente() {

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

    // LIstar la listar de técnicos en cada option del select
    const listadoTecnicos = listadoGeneralTecnicos.map(t => `<option value="${t.dni}">${t.nombres} ${t.apellidos}</option>`);

    document.querySelector('#modalReasignar .contenedorListaTecnicos').innerHTML = listadoTecnicos.join('');

    // Cerrar el modal principal y abrir el de reasignación
    modalIncidentePendiente.hide();
    modalReasignar.show();

}
function reasignarIncidente() {

    let fecha_asignacion = new Date().toISOString();
    let comentario_soporte = document.querySelector('#modalReasignar .comentario').value.trim();

    // Preparar datos para enviar al servidor
    let dataIncidente = {
        id_incidente: idIncidenteSeleccionado.id_incidente,
        titulo: idIncidenteSeleccionado.titulo,
        ruc_empresa: idIncidenteSeleccionado.ruc_empresa,
        descripcion_incidente: idIncidenteSeleccionado.descripcion_incidente,
        fecha_creacion: idIncidenteSeleccionado.fecha_creacion,
        id_tecnico: document.querySelector('#modalReasignar .contenedorListaTecnicos').value,
        comentario_soporte: comentario_soporte,
        fecha_asignacion: fecha_asignacion,
    };

    socket.emit("/soporte/reasignarIncidente", dataIncidente, (respuesta) => {
        if (respuesta.success) {
            Swal.fire({
                title: 'El incidente se ha reasignado exitosamente al tecnico!',
                position: "center",
                icon: "success",
                showConfirmButton: true,
            });

            // Cerrar los modales abiertos
            modalIncidentePendiente.hide();
            modalReasignar.hide();

        } else {
            Swal.fire({
                title: respuesta.error,
                position: "center",
                icon: "error",
                text: `Inténtalo de nuevo`,
                showConfirmButton: true,
            });
        }
    });
}

//? FUNCIONES DE SECCIÓN "REPORTES"
function generarReporte() {
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
    fechaFinObj.setHours(23, 59, 59); // Ajustar al final del día

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
    mostrarReporte(reporteInfo, contenedor);

    // Mostrar notificación de éxito
    Utils.mostrarNotificacion(
        'Reporte Generado',
        `Se ha generado el reporte con ${incidentesFiltrados.length} incidentes.`,
        'notificar_exito',
        2000
    );
}
function cargarReportesGuardados(contenedor) {

    const reportesGuardados = JSON.parse(localStorage.getItem('reportes_soporte') || '[]');

    if (reportesGuardados.length > 0) {

        // Mostrar cada reporte guardado
        reportesGuardados.forEach(reporte => {
            mostrarReporte(reporte, contenedor);
        });
    }
}
function mostrarReporte(reporteInfo, contenedor) {

    // Verificar si el reporte ya existe en el DOM para evitar duplicados
    const reporteExistente = contenedor.querySelector(`[data-reporte-id="${reporteInfo.id}"]`);
    if (reporteExistente) {
        return; // Si ya existe, no lo volvemos a mostrar
    }

    // Crear elemento para el reporte
    const reporteElement = document.createElement('div');
    reporteElement.className = 'card shadow-sm border-0 p-3 bg-light mb-3';
    reporteElement.dataset.reporteId = reporteInfo.id;

    // Formatear fecha
    const fechaReporte = new Date(reporteInfo.fecha);
    const fechaFormateada = fechaReporte.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Determinar el tipo de reporte para mostrar
    const tipoReporteTexto = reporteInfo.tipo === 'incidentes' ? 'Reporte de Incidentes' : 'Reporte de Desempeño';
    const iconoTipo = reporteInfo.tipo === 'incidentes' ? 'bi-list-check' : 'bi-graph-up';
    const colorTipo = reporteInfo.tipo === 'incidentes' ? 'text-primary' : 'text-success';
    const bgTipo = reporteInfo.tipo === 'incidentes' ? 'bg-primary' : 'bg-success';

    // Determinar el formato
    const formatoIcono = reporteInfo.formato === 'pdf' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-text';
    const bgTipoFormato = reporteInfo.formato === 'pdf' ? 'bg-danger' : 'bg-primary';

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

    // Agregar al contenedor
    contenedor.appendChild(reporteElement);
}
function generarReporteIncidentes(incidentes) {
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
                fecha_creacion: new Date(inc.fecha_creacion).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                tiempoRespuesta: inc.fecha_cierre ? calcularTiempoRespuesta(inc.fecha_creacion, inc.fecha_cierre) : 'Sin respuesta',
                tecnico_asignado: tecnico_asignado
            };
        })
    };
}
function generarReporteDesempenio(incidentes) {
    // Calcular métricas de desempeño
    const totalIncidentes = incidentes.length;
    const incidentesResueltos = incidentes.filter(inc => inc.estado === 'Resuelto');
    const porcentajeResueltos = totalIncidentes > 0 ? (incidentesResueltos.length / totalIncidentes * 100).toFixed(2) : 0;

    // Calcular tiempo promedio de respuesta (solo para incidentes resueltos con respuesta)
    let tiemposTotales = 0;
    let incidentesConRespuesta = 0;

    incidentesResueltos.forEach(inc => {
        if (inc.fecha_respuesta) {
            const tiempoRespuesta = new Date(inc.fecha_respuesta) - new Date(inc.fecha_creacion);
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
        tiempoPromedioRespuestaDias: tiempoPromedioDias,
        tiempoPromedioRespuestaHoras: tiempoPromedioHoras,
        analisisPorEmpresa: empresasAnalisis
    };
}
function calcularTiempoRespuesta(fechaCreacion, fechaRespuesta) {
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
function descargarReporte(reporteInfo) {
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
async function llenarGenerarPDF(data, tipo) {
    try {
        // Establecer la fecha actual en el HTML
        const fechaActual = new Date().toLocaleDateString("es-ES");

        let elemento;
        let nombrePDF;
        
        if (tipo === 'incidentes') {
            await llenarReporteIncidentes(data.incidentes);
            elemento = document.getElementById("reportePDFIncidentes");
            // Establecer la fecha en el reporte de incidentes
            elemento.querySelector("#fechaGeneracion").textContent = fechaActual;
            nombrePDF = 'Reporte_Incidentes';
        } else {
            await llenarReporteDesempenio(data);
            elemento = document.getElementById("reportePDFDesempenio");
            // Establecer la fecha en el reporte de desempeño
            elemento.querySelector("#fechaGeneracion").textContent = fechaActual;
            nombrePDF = 'Reporte_Desempeño';
        }

        // Usar la función de utilidad para generar el PDF
        const resultado = await Utils.generarPDFMejorado(elemento, nombrePDF, tipo);
        
        if (resultado) {
            console.log("PDF generado correctamente");
        } else {
            console.error("No se pudo generar el PDF");
        }

    } catch (error) {
        console.error("Error al generar el PDF:", error);
        alert("Ocurrió un error al generar el PDF. Por favor, intente nuevamente.");
    }
}
async function llenarReporteIncidentes(incidentes) {
    const contenedor = document.getElementById("contenedorReporteIncidentes");
    contenedor.innerHTML = ""; // Limpiar la tabla antes de llenarla
    // Template
    const template = document.getElementById("templateReporteIncidentes").content;
    const fragmento = document.createDocumentFragment();

    // Clonar el template
    const clon = template.cloneNode(true);

    // Llenar los datos del encabezado y métricas
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

    // Llenar la tabla de incidentes
    const tablaDetalleIncidentes = clon.querySelector("#tablaDetalleIncidentes");

    // Ordenar incidentes por fecha (más reciente primero)
    const incidentesOrdenados = [...incidentes].sort((a, b) =>
        new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
    );

    // Poblar la tabla con los datos de incidentes
    incidentesOrdenados.forEach(inc => {
        const fila = document.createElement("tr");

        // Determinar si el incidente ha sido reasignado y a quién
        let tecnicoAsignado = 'No asignado';
        
        if (inc.tecnico_asignado && inc.tecnico_asignado.length > 0) {
            // Obtener el técnico asignado
            const tecnico = inc.tecnico_asignado[0]; // Siempre es el primer técnico, ya que no hay reasignación
            tecnicoAsignado = `${tecnico.nombres || ''} ${tecnico.apellidos || ''}`.trim();
        }

        console.log(inc)
        
        // Crear la fila con los datos del incidente
        fila.innerHTML = `
            <td>${inc.id_incidente || 'N/A'}</td>
            <td>${inc.titulo || 'Sin título'}</td>
            <td>${inc.ruc_empresa || 'N/A'}</td>
            <td><span class="badge ${inc.estado === 'Pendiente' ? 'bg-danger' : 'bg-success'}">${inc.estado || 'N/A'}</span></td>
            <td>${inc.fecha_creacion ? new Date(inc.fecha_creacion).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Fecha no disponible'}</td>
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
async function llenarReporteDesempenio(data) {
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
    const fechaInicio = document.getElementById("fechaInicioReporte").value;
    const fechaFin = document.getElementById("fechaFinReporte").value;
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

    // Nota: Los gráficos se implementarían con una biblioteca como Chart.js
    // Por ahora dejamos preparados los contenedores

    // Agregar el clon al fragmento
    fragmento.appendChild(clon);

    // Añadir el fragmento al contenedor
    contenedor.appendChild(fragmento);
}
function generarContenidoCSV(data, tipo) {
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
function eliminarReporte(reporteId) {
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
function limpiarFiltrosReporte() {
    // Restablecer los valores de los filtros
    const fechaActual = new Date();
    document.querySelector('#fechaFin').valueAsDate = fechaActual;

    const fechaUnMesAtras = new Date();
    fechaUnMesAtras.setMonth(fechaUnMesAtras.getMonth() - 1);
    document.querySelector('#fechaInicio').valueAsDate = fechaUnMesAtras;

    document.querySelector('#estadoReporte').value = '';
    document.querySelector('#empresaReporte').value = '';

    // Mostrar notificación
    Utils.mostrarNotificacion(
        'Filtros Restablecidos',
        'Se han restablecido todos los filtros de búsqueda.',
        'notificar_informacion',
        2000
    );
}
function actualizarEstadoIncidente(estado) {
    seleccionEstadoIncidente = estado;
    localStorage.setItem("seleccionEstadoIncidente", estado);
    listarIncidentes(paginaActualIncidentes, limiteIncidentes);
}

//? FUNCIONES DE SECCIÓN "CONFIGURACIÓN DE USUARIO"
async function miInfoUsuario() {
    return new Promise((resolve, reject) => {

        if (perfilUsuario) {
            console.log("Perfil del usuario ya consultado: ", perfilUsuario);
            resolve(perfilUsuario);

        } else {
            socket.emit("/soporte/miInfoUsuario", (respuesta) => {
                if (respuesta.success) {
                    console.log("Se consultó el perfil del usuario: ", respuesta.data);
                    resolve(respuesta.data);
                } else {
                    reject(respuesta.error);
                }
            });
        }
    });
}
function habilitarEdicion(formConfiguracionUsuario) {
    formConfiguracionUsuario.querySelectorAll('input').forEach(input => {
        if (input.id !== 'estadoUsuario') {
            input.disabled = false
        }
    }
    );
    document.getElementById('cancelButton').classList.remove('d-none');
    document.getElementById('saveButton').classList.remove('d-none');
    document.getElementById('saveButton').disabled = true; // Solo activado si hay cambios
    document.getElementById('editButton').classList.add('d-none');
}
function guardarEstadoOriginal(form, estadoOriginal) {
    form.querySelectorAll('input').forEach(input => {
        estadoOriginal[input.id] = input.value;
    });
}
function cancelarEdicion(formConfiguracionUsuario, estadoOriginal) {
    formConfiguracionUsuario.querySelectorAll('input').forEach(input => {
        input.value = estadoOriginal[input.id]; // Revertir al valor inicial
        input.classList.remove('is-valid', 'is-invalid');
        input.disabled = true;
    });
    document.getElementById('cancelButton').classList.add('d-none');
    document.getElementById('saveButton').classList.add('d-none');
    document.getElementById('editButton').classList.remove('d-none');
}
function verificarCambios(form, estadoOriginal, btnGuardarCambios) {
    const hayCambios = Array.from(form.querySelectorAll('input')).some(input => {
        return input.value !== estadoOriginal[input.id];
    });
    btnGuardarCambios.disabled = !hayCambios;
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

//TODO =============== INTERACTIVIDAD DEL SIDEBAR (MENÚ DE NAVEGACIÓN) ===============
/** 
 * Inicializa la interactividad del sidebar cuando el DOM esté completamente cargado
 * Esta función se encarga de asignar los eventos de click a los elementos del sidebar
 * y de inicializar el estado de los elementos del sidebar cuando sea necesario.
 */
document.addEventListener('DOMContentLoaded', () => {
    Utils.inicializarSidebar();
});
