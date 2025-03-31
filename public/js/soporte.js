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
let listadoGeneralIncidentes = []; // Listado de incidentes
let listadoGeneralTecnicos = []; // Listado de técnicos
let perfilUsuario; // Objeto para guardar el perfil del usuario actual

let seleccionEstadoIncidente = localStorage.getItem('seleccionEstadoIncidente') || 'Todos'; // Variable para guardar la selección de filtrado por estado de incidente
let limiteIncidentes = localStorage.getItem('limiteIncidentes') || 25;
let paginaActualIncidentes = 1; // Página inicial
let hayMasIncidentes = true; // Indicador para saber si hay más incidentes
let totalIncidentes = 0; // Total de incidentes
let forzarRecargaIncidentes = false; // Bandera para forzar la recarga de incidentes
let reasignados = false; // Bandera para indicar si se muestran solo los incidentes reasignados

let ultimaSeccion = localStorage.getItem('ultimaSeccion') || 'Inicio';
let seccionActual = 'Inicio';

let idIncidenteSeleccionado; // Objeto para guardar el incidente seleccionado
// Contenedores
let contenedorIncidentes;
let contenedorModalIncidentePendiente;
let contenedorModalIncidenteResuelto;


//TODO ESCUCHA DE EVENTOS PARA SINCRONIZACIÓN DE DATOS EN TIEMPO REAL

// ? SINCRONIZACIÒN INCIDENTES
socket.on('/soporte/nuevoIncidente', function (data) {
    console.log('Nuevo incidente recibido:', data);

    // Agregar incidente al listado general si no es el primer incidente
    if (Object.keys(listadoGeneralIncidentes).length > 0) {
        // Solo añadimos al inicio si estamos en la primera página
        if (paginaActualIncidentes === 1) {
            listadoGeneralIncidentes.unshift(data);
            // Si hay más de 'limiteIncidentes', eliminamos el último
            if (listadoGeneralIncidentes.length > limiteIncidentes) {
                listadoGeneralIncidentes.pop();
            }
        }
        // Incrementar el contador total
        totalIncidentes++;
    }

    if (seccionActual === 'Incidentes' && paginaActualIncidentes === 1) {
        // Verificar si el nuevo incidente cumple con los filtros actuales
        const agregarPorEstado = data.estado === seleccionEstadoIncidente || seleccionEstadoIncidente === 'Todos';
        const switchIncidentesReasignados = document.querySelector('#switchIncidentesReasignados');
        const agregarPorReasignados = !switchIncidentesReasignados.checked || data.dni_tecnico;

        // Solo añadimos al DOM si estamos en la primera página y cumple los filtros
        if (agregarPorEstado && agregarPorReasignados) {
            const template = document.getElementById('templateItemIncidente');
            const clone = document.importNode(template.content, true);

            // Asignar valores del nuevo incidente
            clone.querySelector('.incidente').setAttribute('data-id', data.id_incidente);
            clone.querySelector(".num-incidente .detalles-lista").textContent = data.id_incidente;
            clone.querySelector('.nombre-incidente .detalles-lista').textContent = data.titulo;
            clone.querySelector('.detalles-incidente .detalles-lista').textContent = data.descripcion_incidente;
            clone.querySelector('.nombre-empresa .detalles-lista').textContent = data.ruc_empresa;
            const fechaCreacion = Utils.formatearFechaHora(data.fecha_creacion);
            clone.querySelector('.fecha-incidente .detalles-lista').textContent = fechaCreacion.fecha + ' ' + fechaCreacion.hora;
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

            // Actualizar la paginación
            actualizarPaginacion();
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

//! NO IMPLEMENTADO: ANULACIÓN DE INCIDENTES POR PARTE DEL CLIENTE
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
        .then(() => { listarIncidentes() })
        .catch((error) => { console.log(error) });

    consultarTecnicos()
        .catch((error) => { console.log(error) });

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
    fechaActual.setHours(23, 59, 59, 999); // Ajustar al final del día
    const fechaFinInput = clone.querySelector('#fechaFin');
    fechaFinInput.value = fechaActual.toISOString().slice(0, 16);

    // Establecer la fecha de hace un mes como valor predeterminado para fechaInicio
    const fechaUnMesAtras = new Date();
    fechaUnMesAtras.setMonth(fechaUnMesAtras.getMonth() - 1);
    fechaUnMesAtras.setHours(0, 0, 0, 0); // Ajustar al inicio del día
    const fechaInicioInput = clone.querySelector('#fechaInicio');
    fechaInicioInput.value = fechaUnMesAtras.toISOString().slice(0, 16);

    const contenedorReportes = clone.querySelector('#contenedorReportesGenerados');
    // Cargar reportes guardados en localStorage
    Utils.cargarReportesGuardados(contenedorReportes);

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
            // Al cambiar el filtro, volvemos a la primera página
            reasignados = e.target.checked;
            paginaActualIncidentes = 1;
            forzarRecargaIncidentes = true;
            consultarIncidentes()
                .then(() => listarIncidentes())
                .catch(error => console.error('Error al cargar página anterior:', error));
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
        case e.target.classList.contains("btn-prev-incidentes"):
            paginaAnterior();
            break;
        case e.target.classList.contains("btn-next-incidentes"):
            paginaSiguiente();
            break;

        // TODO: Botones de REPORTES
        case e.target.classList.contains("btn-descargar-reporte"):
            const reporteIdDescargar = e.target.closest('.btn-descargar-reporte').dataset.reporteId;
            const reportesGuardados = JSON.parse(localStorage.getItem('reportes_soporte') || '[]');
            const reporteInfo = reportesGuardados.find(r => r.id === reporteIdDescargar);
            if (reporteInfo) {
                Utils.descargarReporte(reporteInfo);
            }
            break;
        case e.target.classList.contains("btn-eliminar-reporte"):
            const reporteIdEliminar = e.target.closest('.btn-eliminar-reporte').dataset.reporteId;
            Utils.eliminarReporte(reporteIdEliminar);
            break;
        case e.target.id === "btnGenerarReporte":
            consultarTodosLosIncidentes()
                .then(() => { Utils.generarReporte(listadoGeneralIncidentes) })
            break;
        case e.target.id === "btnLimpiarFiltros":
            Utils.limpiarFiltrosReporte();
            break;

        default:
            break;
    }
});
document.addEventListener('change', (e) => {
    if (e.target.id === 'selectorLimiteIncidentes') {
        cambiarLimiteIncidentes(e);
    }
})
function actualizarEstadoIncidente(estado) {
    seleccionEstadoIncidente = estado;
    localStorage.setItem('seleccionEstadoIncidente', estado);
    paginaActualIncidentes = 1; // Resetear a la primera página al cambiar filtros
    forzarRecargaIncidentes = true; // Forzar la recarga de incidentes
    consultarIncidentes()
        .then(() => listarIncidentes())
        .catch((error) => { console.log(error) });
}


//TODO ======================== FUNCIONES ========================
//? FUNCIONES DE SECCIÓN "INCIDENTES"
function consultarIncidentes() {
    return new Promise((resolve, reject) => {
        if (Object.keys(listadoGeneralIncidentes).length > 0 && !forzarRecargaIncidentes) {
            console.log("No se consultaron los incidentes porque ya se consultaron.");
            resolve();
        } else {
            forzarRecargaIncidentes = false; // Resetear la bandera después de usarla
            socket.emit("/soporte/listadoIncidentes", { pagina: paginaActualIncidentes, limite: limiteIncidentes, estado: seleccionEstadoIncidente, reasignados: reasignados }, (respuesta) => {
                if (respuesta.success) {
                    console.log("Se consultaron los incidentes: ", respuesta.data);
                    listadoGeneralIncidentes = respuesta.data;
                    totalIncidentes = respuesta.total;
                    hayMasIncidentes = respuesta.hayMasIncidentes;
                    actualizarPaginacion();
                    resolve();
                } else {
                    reject(respuesta.error);
                }
            });
        }
    });
}
function consultarTodosLosIncidentes() {
    return new Promise((resolve, reject) => {
        socket.emit("/soporte/listadoIncidentes", { pagina: 1, limite: 1000000, estado: 'Todos' }, (respuesta) => {
            if (respuesta.success) {
                console.log("Se consultaron todos los incidentes: ", respuesta.data);
                listadoGeneralIncidentes = respuesta.data;
                resolve();
            } else {
                reject(respuesta.error);
            }
        });
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
function listarIncidentes() {
    console.log(`Función listarIncidentes()`);
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
            let fechaCreacion = Utils.formatearFechaHora(incidente.fecha_creacion);
            fechaIncidente.textContent = fechaCreacion.fecha + ' ' + fechaCreacion.hora || 'Sin fecha de creación';

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

    // Actualizar la paginación
    actualizarPaginacion();
}
function actualizarPaginacion() {
    // Obtener el contenedor del footer de paginación
    const contenedorFooter = document.querySelector('.contenedorFooterIncidentes');
    if (!contenedorFooter) return;

    // Limpiar el contenedor
    contenedorFooter.innerHTML = '';

    // Clonar el template del footer
    const templateFooter = document.querySelector('#templateFooterIncidentes').content;
    const cloneFooter = document.importNode(templateFooter, true);

    // Calcular información de paginación
    const inicio = (paginaActualIncidentes - 1) * limiteIncidentes + 1;
    const fin = Math.min(inicio + listadoGeneralIncidentes.length - 1, totalIncidentes);

    // Actualizar texto de información de registros
    cloneFooter.querySelector('#infoRegistros').textContent = `Mostrando ${inicio}-${fin} de ${totalIncidentes} registros`;

    // Actualizar número de página actual
    cloneFooter.querySelector('#paginaActual').textContent = `Página ${paginaActualIncidentes}`;

    // Configurar botones de navegación
    const btnPrev = cloneFooter.querySelector('.btn-prev-incidentes');
    const btnNext = cloneFooter.querySelector('.btn-next-incidentes');

    // Deshabilitar botón anterior si estamos en la primera página
    btnPrev.disabled = paginaActualIncidentes <= 1;

    // Deshabilitar botón siguiente si no hay más incidentes
    btnNext.disabled = !hayMasIncidentes;

    // Configurar selector de límite
    const selectorLimite = cloneFooter.querySelector('#selectorLimiteIncidentes');
    selectorLimite.value = limiteIncidentes;

    // Agregar el footer al contenedor
    contenedorFooter.appendChild(cloneFooter);
}
function paginaAnterior() {
    if (paginaActualIncidentes > 1) {
        paginaActualIncidentes--;
        forzarRecargaIncidentes = true;
        consultarIncidentes()
            .then(() => listarIncidentes())
            .catch(error => console.error('Error al cargar página anterior:', error));
    }
}
function paginaSiguiente() {
    if (hayMasIncidentes) {
        paginaActualIncidentes++;
        forzarRecargaIncidentes = true;
        consultarIncidentes()
            .then(() => listarIncidentes())
            .catch(error => console.error('Error al cargar página siguiente:', error));
    }
}
function cambiarLimiteIncidentes(e) {
    const nuevoLimite = parseInt(e.target.value);
    if (nuevoLimite !== limiteIncidentes) {
        limiteIncidentes = nuevoLimite;
        localStorage.setItem('limiteIncidentes', nuevoLimite);
        paginaActualIncidentes = 1; // Volver a la primera página
        forzarRecargaIncidentes = true;
        consultarIncidentes()
            .then(() => listarIncidentes())
            .catch(error => console.error('Error al cambiar el límite de incidentes:', error));
    }
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
function verificarCambios(form, estadoOriginal, btnGuardarCambios) {
    const hayCambios = Array.from(form.querySelectorAll('input')).some(input => {
        return input.value !== estadoOriginal[input.id];
    });
    btnGuardarCambios.disabled = !hayCambios;
}

//TODO =============== INTERACTIVIDAD DEL SIDEBAR (MENÚ DE NAVEGACIÓN) ===============
/** 
 * Inicializa la interactividad del sidebar cuando el DOM esté completamente cargado
 * Esta función se encarga de asignar los eventos de click a los elementos del sidebar
 * y de inicializar el estado de los elementos del sidebar cuando sea necesario.
 */
document.addEventListener('DOMContentLoaded', () => {
    Utils.inicializarSidebar();
    // Establecer el límite de incidentes a 50 solo si no está configurado
    if (!localStorage.getItem('limiteIncidentes')) {
        localStorage.setItem('limiteIncidentes', 50);
        limiteIncidentes = 50;
    }
});

// Eventos de Bootstrap para los modales
document.getElementById("modalIncidentePendiente").addEventListener("show.bs.modal", function () {
    this.removeAttribute("aria-hidden");
});
document.getElementById("modalIncidentePendiente").addEventListener("hidden.bs.modal", function () {
    this.setAttribute("aria-hidden", "true");
});
document.getElementById("modalIncidenteResuelto").addEventListener("show.bs.modal", function () {
    this.removeAttribute("aria-hidden");
});
document.getElementById("modalIncidenteResuelto").addEventListener("hidden.bs.modal", function () {
    this.setAttribute("aria-hidden", "true");
});
document.getElementById("modalReasignar").addEventListener("show.bs.modal", function () {
    this.removeAttribute("aria-hidden");
});
document.getElementById("modalReasignar").addEventListener("hidden.bs.modal", function () {
    this.setAttribute("aria-hidden", "true");
});

// Función para cargar los datos del dashboard y generar los gráficos
async function cargarDashboard() {
    try {
        // Mostrar indicadores de carga en los contenedores de gráficos
        document.getElementById('graficoEstadoIncidentes').innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
        document.getElementById('graficoIncidentesEmpresa').innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
        document.getElementById('graficoTendenciaIncidentes').innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
        document.getElementById('graficoTiempoRespuesta').innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';

        // Obtener datos para los gráficos del dashboard usando sockets
        socket.emit('/soporte/obtenerDatosDashboard', (response) => {
            if (response.success) {
                const data = response.data;
                
                // Actualizar contadores de usuarios
                document.getElementById('cantidadUsuariosADMINISTRADOR').textContent = data.usuarios?.administradores || 0;
                document.getElementById('cantidadUsuariosTECNICO').textContent = data.usuarios?.tecnicos || 0;
                document.getElementById('cantidadUsuariosSOPORTE').textContent = data.usuarios?.soporte || 0;
                document.getElementById('cantidadUsuariosCLIENTE').textContent = data.usuarios?.clientes || 0;

                // Generar gráficos con los datos obtenidos
                Utils.generarGraficosDashboard(data);
            } else {
                console.error('Error al obtener los datos del dashboard:', response.error);
                mostrarDatosEjemplo();
            }
        });
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        mostrarDatosEjemplo();
    }
}

// Función para mostrar datos de ejemplo en caso de error
function mostrarDatosEjemplo() {
    // Datos de ejemplo para los gráficos
    const datosEjemplo = {
        incidentesPendientes: 15,
        incidentesEnCurso: 8,
        incidentesResueltos: 27,
        empresas: [
            { nombre: 'Empresa A', totalIncidentes: 12, incidentesResueltos: 8 },
            { nombre: 'Empresa B', totalIncidentes: 10, incidentesResueltos: 7 },
            { nombre: 'Empresa C', totalIncidentes: 8, incidentesResueltos: 5 },
            { nombre: 'Empresa D', totalIncidentes: 7, incidentesResueltos: 4 },
            { nombre: 'Empresa E', totalIncidentes: 5, incidentesResueltos: 3 }
        ],
        tendencia: [
            { mes: 'Enero', creados: 12, resueltos: 8 },
            { mes: 'Febrero', creados: 19, resueltos: 15 },
            { mes: 'Marzo', creados: 15, resueltos: 12 },
            { mes: 'Abril', creados: 25, resueltos: 20 },
            { mes: 'Mayo', creados: 22, resueltos: 18 },
            { mes: 'Junio', creados: 30, resueltos: 25 }
        ],
        tiempoRespuesta: [
            { tecnico: 'Juan Pérez', tiempoPromedio: 24 },
            { tecnico: 'María García', tiempoPromedio: 18 },
            { tecnico: 'Carlos López', tiempoPromedio: 36 },
            { tecnico: 'Ana Martínez', tiempoPromedio: 12 },
            { tecnico: 'Luis Rodríguez', tiempoPromedio: 48 }
        ]
    };
    
    // Actualizar contadores de usuarios con datos de ejemplo
    document.getElementById('cantidadUsuariosADMINISTRADOR').textContent = 5;
    document.getElementById('cantidadUsuariosTECNICO').textContent = 10;
    document.getElementById('cantidadUsuariosSOPORTE').textContent = 3;
    document.getElementById('cantidadUsuariosCLIENTE').textContent = 25;
    
    // Generar gráficos con datos de ejemplo
    Utils.generarGraficosDashboard(datosEjemplo);
    
    // Mostrar notificación de error
    Utils.mostrarNotificacion(
        'Error al cargar datos',
        'Se están mostrando datos de ejemplo. Por favor, intente nuevamente más tarde.',
        'error',
        5000
    );
}

// Cargar el dashboard cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la sección de inicio
    if (seccionActual === 'Inicio') {
        cargarDashboard();
    }
    
    // También cargar el dashboard si se restaura la sección de inicio
    if (ultimaSeccion === 'Inicio') {
        cargarDashboard();
    }
});
