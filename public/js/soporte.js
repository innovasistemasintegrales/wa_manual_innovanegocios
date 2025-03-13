// soporte.js
import * as Utils from '/js/utils.js';

// Crear la conexión al socket de soporte
let socketSoporte = null;
function socketSoporteConnect() {
    if (!socketSoporte) {
        socketSoporte = Utils.socketConnect('/soporte');
    }
    return socketSoporte;
};

// Iniciar la conexión del socket
const socket = socketSoporteConnect();

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
            clone.querySelector('.btn-abrir-incidente').setAttribute('data-id', data.id_incidente);

            // Insertar la clase para abrir el Modal de Incidente Pendiente o Resuelto
            clone.querySelector(".btn-abrir-incidente").classList.remove('btn-incidente-pendiente', 'btn-incidente-resuelto');
            if (data.estado === 'Pendiente') {
                clone.querySelector(".btn-abrir-incidente").classList.add('btn-incidente-pendiente');
            } else if (data.estado === 'Resuelto') {
                clone.querySelector(".btn-abrir-incidente").classList.add('btn-incidente-resuelto');
            }

            // Insertar el nuevo incidente al inicio del contenedor
            document.getElementById('contenedorIncidentes').insertBefore(clone, document.getElementById('contenedorIncidentes').firstChild);

        }
    }
    // Mostrar un toast o notificación no invasiva
    Utils.mostrarNotificacion(
        'Nuevo Incidente',
        `Se ha registrado un nuevo incidente: <strong>${data.titulo}</strong>.`,
        'info',
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
        `Se ha actualizado un incidente: <strong>${data.titulo}</strong>.`,
        'info',
        7000
    );
});
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
btnMenuReportes.addEventListener('click', () => {
    localStorage.setItem('ultimaSeccion', 'Reportes');
    seccionActual = 'Reportes';
    cardReactivo.innerHTML = "";

    const clone = templateReportes.cloneNode(true);
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
        //! FALTA IMPLEMENTAR LA CREACIÓN DE NUEVOS INCIDENTES PARA EL SOPORTE (OPCIONAL)
        case e.target.id === "btnCrearNuevoIncidente":
            // crearNuevoIncidente(formNuevoIncidente);
            break;
        case e.target.id === "btnCancelarNuevoIncidente":
            // modalNuevoIncidente.hide();
            break;

        //? Mostrar el visor (viewer.js) al hacer clic en cualquier imagen en los modales de incidentes
        case e.target.id === "contenedorMultimedia":
            viewer.show();
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
    modalElement.addEventListener('shown.bs.modal', function() {
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
    modalElement.addEventListener('shown.bs.modal', function() {
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
window.toggleSubMenu = (button) => {

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

window.toggleSidebar = function () {
    sidebar.classList.toggle('close');
    btnColapsar.classList.toggle('rotate');
    closeAllSubMenus();
};
function closeAllSubMenus() {
    Array.from(sidebar.getElementsByClassName('show')).forEach(ul => {
        ul.classList.remove('show')
        ul.previousElementSibling.classList.remove('rotate')
    })
}
