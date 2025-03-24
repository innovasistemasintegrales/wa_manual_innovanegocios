// tecnico.js

import * as Utils from '/js/utils.js';

// Crear la conexión al socket de tecnico
let socketTecnico = null;
function conectarSocket() {
    if (!socketTecnico) {
        socketTecnico = Utils.socketConnect('/tecnico');
    }
    return socketTecnico;
};

// Iniciar la conexión del socket
const socket = conectarSocket();

// Creación de fragmento para optimizar manipulaciones del DOM
const fragmento = document.createDocumentFragment();

// Capturar referencia al contenedor principal de renderizado
let cardReactivo = document.querySelector('#cardReactivo');

//TODO ========================= TEMPLATES ========================
//? Capturamos los template de las SECCIONES
const templateInicio = document.querySelector('#cardReactivo').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;
const templateReportes = document.querySelector('#templateReportes').content;
//? Capturamos los templates para los LISTADOS
const templateItemIncidente = templateIncidentes.querySelector('#templateItemIncidente').content;
//? Capturamos los templates para los MODALES
const templateModalIncidentePendiente = document.querySelector('#templateModalIncidentePendiente').content;
const templateModalIncidenteResuelto = document.querySelector('#templateModalIncidenteResuelto').content;

//TODO ================== Referencia a ELEMENTOS ==================
let btnMenuInicio = document.querySelector('#btnMenuInicio');
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');
let btnMenuIncidentes = document.querySelector('#btnMenuIncidentes');
let btnMenuReportes = document.querySelector('#btnMenuReportes');
let btnMenuCerrar = document.querySelector('#btnMenuCerrar');

// Capturamos y creamos los modales para su manipulación 
const modalIncidentePendiente = new bootstrap.Modal(document.getElementById('modalIncidentePendiente'));
const modalIncidenteResuelto = new bootstrap.Modal(document.getElementById('modalIncidenteResuelto'));
// Capturamos los Formularios
const formRespuestaIncidente = document.getElementById('modalIncidentePendiente');

//TODO ======================== VARIABLES GLOBALES ========================
let listadoGeneralIncidentes = [];
// let listadoGeneralReportes = [];
let perfilUsuario; // Objeto para guardar el perfil del usuario actual


let seleccionEstadoIncidente = localStorage.getItem('seleccionEstadoIncidente') || 'Todos'; // Variable para guardar la selección de filtrado por estado de incidente
let limiteIncidentes = localStorage.getItem('limiteIncidentes') || 25;
let paginaActualIncidentes = 1; // Página inicial
let hayMasIncidentes = true; // Indicador para saber si hay más incidentes
let totalIncidentes = 0; // Total de incidentes
let forzarRecargaIncidentes = false; // Bandera para forzar la recarga de incidentes


let ultimaSeccion = localStorage.getItem('ultimaSeccion') || 'Inicio';
let seccionActual = 'Inicio';
let idIncidenteSeleccionado; // Objeto para guardar el incidente seleccionado
// Contenedores para la inserción de Datos
let contenedorIncidentes;

//TODO ======================== ESCUCHA DE EVENTOS PARA SINCRONIZACIÓN DE DATOS EN TIEMPO REAL ========================

// ? SINCRONIZACIÒN INCIDENTES
socket.on('/tecnico/nuevoIncidenteAsignado', function (data) {
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

        if (agregarPorEstado) {
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

            // Eliminar las clases para el estado del incidente
            clone.querySelector(".btn-abrir-incidente").classList.remove('btn-incidente-pendiente', 'btn-incidente-resuelto');
            clone.querySelector(".estado-incidente .detalles-lista").classList.remove('estado-incidente-Pendiente', 'estado-incidente-Resuelto');

            // Asignar el estado del incidente
            if (data.respuesta_tecnico || data.estado === 'Resuelto') {
                // Clase para ABRIR EL MODAL de Incidente Resuelto
                clone.querySelector(".btn-abrir-incidente").classList.add('btn-incidente-resuelto');
                // Clases para MOSTRAR el incidente como resuelto
                clone.querySelector(".estado-incidente .detalles-lista").classList.add('estado-incidente-Resuelto');
                clone.querySelector('.estado-incidente .detalles-lista').textContent = 'Resuelto';
            } else {
                // Clase para ABRIR EL MODAL de Incidente Pendiente
                clone.querySelector(".btn-abrir-incidente").classList.add('btn-incidente-pendiente');
                // Clases para MOSTRAR el incidente como pendiente
                clone.querySelector(".estado-incidente .detalles-lista").classList.add('estado-incidente-Pendiente');
                clone.querySelector('.estado-incidente .detalles-lista').textContent = 'Pendiente';
            }

            clone.querySelector('.btn-abrir-incidente').setAttribute('data-id', data.id_incidente);

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
socket.on('/tecnico/actualizacionIncidente', function (data) {
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
        console.log(incidenteActualizar);

        if (incidenteActualizar) {

            const numIncidente = incidenteActualizar.querySelector('.num-incidente .detalles-lista');
            const nombreEmpresa = incidenteActualizar.querySelector('.nombre-empresa .detalles-lista');
            const fechaIncidente = incidenteActualizar.querySelector('.fecha-incidente .detalles-lista');
            const btnAbrirIncidente = incidenteActualizar.querySelector('.btn-abrir-incidente');
            const estadoIncidente = incidenteActualizar.querySelector('.estado-incidente .detalles-lista');

            incidenteActualizar.dataset.id = data.id_incidente;
            numIncidente.textContent = data.id_incidente;
            nombreEmpresa.textContent = data.ruc_empresa;
            const fechaCreacion = Utils.formatearFechaHora(data.fecha_creacion);
            fechaIncidente.textContent = fechaCreacion.fecha + ' ' + fechaCreacion.hora;

            // Eliminar las clases para el estado del incidente
            btnAbrirIncidente.classList.remove('btn-incidente-pendiente', 'btn-incidente-resuelto');
            estadoIncidente.classList.remove('estado-incidente-Pendiente', 'estado-incidente-Resuelto');

            // Asignar el estado del incidente
            if (data.respuesta_tecnico || data.estado === 'Resuelto') {
                // Clase para ABRIR EL MODAL de Incidente Resuelto
                btnAbrirIncidente.classList.add('btn-incidente-resuelto');
                // Clases para MOSTRAR el incidente como resuelto
                estadoIncidente.classList.add('estado-incidente-Resuelto');
                estadoIncidente.textContent = 'Resuelto';
            } else {
                // Clase para ABRIR EL MODAL de Incidente Pendiente
                btnAbrirIncidente.classList.add('btn-incidente-pendiente');
                // Clases para MOSTRAR el incidente como pendiente
                estadoIncidente.classList.add('estado-incidente-Pendiente');
                estadoIncidente.textContent = 'Pendiente';
            }

            btnAbrirIncidente.setAttribute('data-id', data.id_incidente);
        } else {
            console.log('No se encontró el incidente en el DOM');
        }
    }

    // Mostrar un toast o notificación no invasiva
    Utils.mostrarNotificacion(
        'Respuesta Enviada',
        `Se ha enviado correctamente la respuesta al soporte: <strong>${data.soporte_dni}</strong>.`,
        'notificar_exito',
        7000
    );
});
socket.on('/tecnico/logout', function () {
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
socket.on('/tecnico/anulacionIncidente', function (data) {
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

    // Mostrar un toast o notificación no invasiva
    Utils.mostrarNotificacion(
        'Un Incidente ha sido anulado por el cliente',
        `Se ha eliminado el incidente: <strong>${data.titulo}</strong>`,
        'info',
        7000,
    );
});

//TODO ======================== LANZAMIENTO DE VISTAS ========================
// Lanzamiento de la vista del menu Incidentes
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
        .then(() => { listarIncidentes() })
        .catch((error) => { console.log(error) });

});
// Lanzamiento de la vista del menu configuración
btnMenuConfiguracion.addEventListener('click', async function () {
    localStorage.setItem('ultimaSeccion', 'Configuracion');
    seccionActual = 'Configuracion';
    cardReactivo.innerHTML = "";

    // consultar info del usuario
    perfilUsuario = await infoUsuario();

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
    cardReactivo.appendChild(clone);

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
// Lanzamiento de la vista del menu reportes
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

    // Cargar reportes guardados en localStorage
    const contenedorReportes = clone.querySelector('#contenedorReportesGenerados');
    Utils.cargarReportesGuardados(contenedorReportes);

    // Agregar el clone al DOM
    cardReactivo.appendChild(clone);
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
        case e.target.classList.contains("btn-incidente-pendiente"):
            abrirIncidentePendiente(e);
            break;
        case e.target.classList.contains("btn-incidente-resuelto"):
            abrirIncidenteResuelto(e);
            break;
        case e.target.id === "btnEnviarRespuestaIncidente":
            enviarRespuestaIncidente(formRespuestaIncidente);
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

//? PARA SECCIÒN INCIDENTES
function consultarIncidentes() {
    return new Promise((resolve, reject) => {
        if (Object.keys(listadoGeneralIncidentes).length > 0 && !forzarRecargaIncidentes) {
            console.log("No se consultaron los incidentes porque ya se consultaron.");
            resolve();
        } else {
            socket.emit("/tecnico/listadoIncidentes", { pagina: paginaActualIncidentes, limite: limiteIncidentes, estado: seleccionEstadoIncidente }, (respuesta) => {
                if (respuesta.success) {
                    console.log("Se consultaron los incidentes: ", respuesta.data);
                    listadoGeneralIncidentes = respuesta.data;
                    totalIncidentes = respuesta.total;
                    hayMasIncidentes = respuesta.hayMasIncidentes;
                    console.log("Hay más incidentes: ", hayMasIncidentes);
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
        socket.emit("/tecnico/listadoIncidentes", { pagina: 1, limite: 1000000, estado: seleccionEstadoIncidente }, (respuesta) => {
            if (respuesta.success) {
                console.log("Se consultaron los incidentes: ", respuesta.data);
                listadoGeneralIncidentes = respuesta.data;
                resolve();
            } else {
                reject(respuesta.error);
            }
        });
    });
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
function listarIncidentes() {
    console.log(`Función listarIncidentes()`);
    contenedorIncidentes.innerHTML = "";

    let incidentesFiltrados = 0;

    listadoGeneralIncidentes.forEach(incidente => {


        // Obtener referencias a todos los elementos que se modificarán
        const itemIncidente = templateItemIncidente.querySelector(".incidente");
        const numIncidente = templateItemIncidente.querySelector(".num-incidente .detalles-lista");
        const nombreIncidente = templateItemIncidente.querySelector(".nombre-incidente .detalles-lista");
        const detallesIncidente = templateItemIncidente.querySelector(".detalles-incidente .detalles-lista");
        const nombreEmpresa = templateItemIncidente.querySelector(".nombre-empresa .detalles-lista");
        const fechaIncidente = templateItemIncidente.querySelector(".fecha-incidente .detalles-lista");
        const estadoIncidente = templateItemIncidente.querySelector(".estado-incidente .detalles-lista");
        const btnAbrirIncidente = templateItemIncidente.querySelector(".btn-abrir-incidente");

        // Actualizar los datos básicos del incidente
        itemIncidente.dataset.id = incidente.id_incidente;
        numIncidente.textContent = incidente.id_incidente;
        nombreIncidente.innerHTML = `${incidente.titulo}`;
        detallesIncidente.textContent = incidente.descripcion_incidente;
        nombreEmpresa.textContent = incidente.ruc_empresa;
        const fechaCreacion = Utils.formatearFechaHora(incidente.fecha_creacion);
        fechaIncidente.textContent = fechaCreacion.fecha + ' ' + fechaCreacion.hora;

        // Eliminar las clases para el estado del incidente
        btnAbrirIncidente.classList.remove('btn-incidente-pendiente', 'btn-incidente-resuelto');
        estadoIncidente.classList.remove('estado-incidente-Pendiente', 'estado-incidente-Resuelto');

        // Asignar el estado del incidente
        if (incidente.respuesta_tecnico || incidente.estado === 'Resuelto') {
            // Clase para ABRIR EL MODAL de Incidente Resuelto
            btnAbrirIncidente.classList.add('btn-incidente-resuelto');
            // Clases para MOSTRAR el incidente como resuelto
            estadoIncidente.classList.add('estado-incidente-Resuelto');
            estadoIncidente.textContent = 'Resuelto';
        } else {
            // Clase para ABRIR EL MODAL de Incidente Pendiente
            btnAbrirIncidente.classList.add('btn-incidente-pendiente');
            // Clases para MOSTRAR el incidente como pendiente
            estadoIncidente.classList.add('estado-incidente-Pendiente');
            estadoIncidente.textContent = 'Pendiente';
        }

        btnAbrirIncidente.dataset.id = incidente.id_incidente;

        const clone = templateItemIncidente.cloneNode(true);
        fragmento.appendChild(clone);

        incidentesFiltrados += 1;

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
function abrirIncidentePendiente(e) {

    // Buscar el incidente seleccionado en el listado de incidentes
    let incidente = listadoGeneralIncidentes.find(incidente => incidente.id_incidente === Number(e.target.dataset.id));
    console.log("Incidente seleccionado: ", incidente);
    idIncidenteSeleccionado = {
        id_incidente: incidente.id_incidente,
        soporte_dni: incidente.soporte_dni,
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
    const contenedorModalIncidentePendiente = document.querySelector('.contenedorModalIncidentePendiente');
    const numeroIncidente = templateModalIncidentePendiente.querySelector(".numero-incidente");
    const empresaIncidente = templateModalIncidentePendiente.querySelector(".empresa");
    const nombreIncidente = templateModalIncidentePendiente.querySelector(".nombre-incidente");
    const detallesIncidente = templateModalIncidentePendiente.querySelector(".detalles");
    const fechaIncidenteElement = templateModalIncidentePendiente.querySelector("#fechaIncidente");
    const horaIncidenteElement = templateModalIncidentePendiente.querySelector("#horaIncidente");
    const comentariosSoporteElement = templateModalIncidentePendiente.querySelector(".comentariosIncidenteSoporte");
    const respuestaTextarea = templateModalIncidentePendiente.querySelector("#respuestaIncidente");
    const contenedorRespuestaTecnico = templateModalIncidentePendiente.querySelector("#contenedorRespuestaTecnico");
    const respuestaTecnico = templateModalIncidentePendiente.querySelector("#respuestaTecnico");
    // 📌 Obtener el contenedor de multimedia
    const contenedorMultimedia = templateModalIncidentePendiente.querySelector("#contenedorMultimedia");

    // Asignar valores al modal
    numeroIncidente.textContent = incidente.id_incidente;
    empresaIncidente.textContent = incidente.ruc_empresa;
    const badgeReasignado = incidente.id_rol == 3
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

    // Asignar comentarios de soporte
    if (comentariosSoporteElement) {
        comentariosSoporteElement.textContent = incidente.comentarios_soporte || '';
    }

    // Mostrar la respuesta del técnico si existe
    if (contenedorRespuestaTecnico && respuestaTecnico) {
        if (incidente.respuesta_tecnico) {
            // Mostrar el contenedor de respuesta del técnico
            contenedorRespuestaTecnico.style.display = 'block';
            respuestaTecnico.textContent = incidente.respuesta_tecnico;
        } else {
            // Ocultar el contenedor de respuesta del técnico
            contenedorRespuestaTecnico.style.display = 'none';
        }
    }

    // Limpiar el textarea para la nueva respuesta si existe
    if (respuestaTextarea) {
        respuestaTextarea.value = "";
    }

    // 📌 Mostrar archivos multimedia usando la función de utils.js
    if (contenedorMultimedia) {
        Utils.mostrarArchivosMultimedia(incidente, contenedorMultimedia);
    }

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
    // Buscar el incidente seleccionado en el listado
    let incidente = listadoGeneralIncidentes.find(incidente => incidente.id_incidente === Number(e.target.dataset.id));

    // Almacenar datos del incidente seleccionado para uso posterior
    idIncidenteSeleccionado = {
        id_incidente: incidente.id_incidente,
        soporte_dni: incidente.soporte_dni,
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
    const contenedorModalIncidenteResuelto = document.querySelector('.contenedorModalIncidenteResuelto');
    const numeroIncidente = templateModalIncidenteResuelto.querySelector(".numero-incidente");
    const empresaIncidente = templateModalIncidenteResuelto.querySelector(".empresa");
    const nombreIncidente = templateModalIncidenteResuelto.querySelector(".nombre-incidente");
    const detallesIncidente = templateModalIncidenteResuelto.querySelector(".detalles");
    const comentariosSoporte = templateModalIncidenteResuelto.querySelector(".comentariosIncidenteSoporte");
    const respuestaTecnico = templateModalIncidenteResuelto.querySelector("#respuestaIncidenteSoporte");
    const fechaIncidenteElement = templateModalIncidenteResuelto.querySelector("#fechaIncidente");
    const horaIncidenteElement = templateModalIncidenteResuelto.querySelector("#horaIncidente");
    const contenedorMultimedia = templateModalIncidenteResuelto.querySelector("#contenedorMultimedia");

    // Asignar valores al modal
    numeroIncidente.textContent = incidente.id_incidente;
    empresaIncidente.textContent = incidente.ruc_empresa;
    nombreIncidente.textContent = incidente.titulo;
    detallesIncidente.textContent = incidente.descripcion_incidente;
    comentariosSoporte.textContent = incidente.comentarios_soporte;
    respuestaTecnico.textContent = incidente.respuesta_tecnico;
    const fechaHora = Utils.formatearFechaHora(incidente.fecha_creacion);
    fechaIncidenteElement.textContent = fechaHora.fecha;
    horaIncidenteElement.textContent = fechaHora.hora;

    // Mostrar archivos multimedia usando la función de utils.js
    if (contenedorMultimedia) {
        Utils.mostrarArchivosMultimedia(incidente, contenedorMultimedia);
    }

    // Preparar y mostrar el modal
    contenedorModalIncidenteResuelto.innerHTML = "";
    let clone = templateModalIncidenteResuelto.cloneNode(true);
    contenedorModalIncidenteResuelto.appendChild(clone);
    modalIncidenteResuelto.show();

    // Obtener el elemento DOM del modal e inicializar el visor de imágenes cuando se muestre
    const modalElement = document.getElementById('modalIncidenteResuelto');
    modalElement.addEventListener('shown.bs.modal', function () {
        Utils.inicializarVisorImagenes(modalElement, incidente);
    }, { once: true }); // El evento se ejecutará una sola vez
}
function enviarRespuestaIncidente(formRespuestaIncidente) {

    let respuesta = formRespuestaIncidente.querySelector("#respuestaIncidente").value.trim();
    let fecha_resolucion = new Date().toISOString();

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
        id_incidente: idIncidenteSeleccionado.id_incidente,
        soporte_dni: idIncidenteSeleccionado.soporte_dni,
        fecha_resolucion: fecha_resolucion,
    };

    socket.emit("/tecnico/enviarRespuestaSoporte", respuestaIncidente, (respuesta) => {
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


//? PARA SECCIÓN "CONFIGURACIÓN DE USUARIO"
async function infoUsuario() {
    return new Promise((resolve, reject) => {

        if (perfilUsuario) {
            resolve(perfilUsuario);
            console.log("Perfil del usuario ya consultado: ", perfilUsuario);

        } else {
            socket.emit("/tecnico/miInfoUsuario", (respuesta) => {
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
