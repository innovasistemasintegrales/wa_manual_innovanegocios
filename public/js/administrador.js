const socket = io('/administrador'); // Conectar al namespace administrador
socket.on('connect', () => {
    console.log('Conectado al namespace /administrador');
});

const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

//TODO ========================= TEMPLATES ========================
// Template para las diferentes secciones
const templateInicio = document.querySelector('#cardReactivo').content;
const templateAsesoria = document.querySelector('#templateAsesoria').content;
const templateValoracion = document.querySelector('#templateValoracion').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;
const templateUsuarios = document.querySelector('#templateUsuarios').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;
const templateReportes = document.querySelector('#templateReportes').content;

// Template para las diferentes listas
const templateItemUsuario = templateUsuarios.querySelector('#templateItemUsuario').content;
const templateItemIncidente = templateIncidentes.querySelector('#templateItemIncidente').content;
const templateItemPreguntaFrecuente = templateAsesoria.querySelector('#templateItemPreguntaFrecuente').content;
const templateItemTituloManual = templateAsesoria.querySelector('#templateItemTituloManual').content;
const templateItemSubtituloManual = templateItemTituloManual.querySelector('#templateItemSubtituloManual').content;

// Template para modales
// const templateModalNuevoUsuario = document.querySelector('#templateModalUsuario').content;
const templateModalUsuario = document.querySelector('#templateModalUsuario').content;
const templateModalIncidente = document.querySelector('#templateModalIncidente').content;
const templateModalNuevoIncidente = document.querySelector('#templateModalNuevoIncidente').content;

//TODO ======================= BOTONES - INPUTS - CONTENEDORES ========================
// Botonoes para cambiar de sección
let btnMenuAsesoria = document.querySelector('#btnMenuAsesoria');
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');
let btnMenuValoracion = document.querySelector('#btnMenuValoracion');
let btnMenuUsuarios = document.querySelector('#btnMenuUsuarios');
let btnMenuIncidentes = document.querySelector('#btnMenuIncidentes');
let btnMenuReportes = document.querySelector('#btnMenuReportes');
let btnMenuInicio = document.querySelector('#btnMenuInicio');
let ultimaSeccion = localStorage.getItem('ultimaSeccion') || 'Inicio';
let seccionActual = 'Inicio';

// inputs y labels 
let seleccionEstadosUsuarios;
let lbxEstadosUsuarios;
let seleccionRolUsuario;
let lbxRolUsuarios;
let buscadorUsuario;

let seccionAsesoria = localStorage.getItem('seccionAsesoria') || 'FAQ';
let opcionesTipoIncidente;
let seleccionEstadoIncidente = localStorage.getItem('seleccionEstadoIncidente') || 'Todos';
console.log("seleccionEstadoIncidente: ", seleccionEstadoIncidente);
let switchIncidentesReasignados;
let btnAbrirNuevoIncidente;

// Modales
const modalIncidente = new bootstrap.Modal(document.getElementById('modalIncidente'));
const modalNuevoIncidente = new bootstrap.Modal(document.getElementById('modalNuevoIncidente'));
const modalReasignar = new bootstrap.Modal(document.getElementById('modalReasignar'));
const modalUsuario = new bootstrap.Modal(document.getElementById('modalUsuario'));
const formRegistroUsuario = document.getElementById('modalRegistrarUsuario');
const formNuevoIncidente = document.getElementById('modalNuevoIncidente');

// Otros botones
const botonesCancelarIncidente = document.querySelectorAll('#btnCerrarIncidente');
const botonesCancelarReasignar = document.querySelectorAll('#btnCancelarReasignar');
const btnReasignar = document.querySelector('#modalIncidente #btnReasignarIncidente');
const btnEnviarRespuestaIncidente = document.querySelector('#modalIncidente #btnEnviarRespuestaIncidente');
const btnRegistrarUsuario = formRegistroUsuario.querySelector('#btnRegistrarUsuario');
const btnCancelarRegistro = formRegistroUsuario.querySelector('#btnCancelarRegistro');
const botonesCerrarUsuario = document.querySelectorAll('#btnCerrarUsuario');
const btnCrearNuevoIncidente = document.querySelector('#modalNuevoIncidente #btnCrearNuevoIncidente');
const botonesCancelarNuevoIncidente = document.querySelectorAll('#btnCancelarNuevoIncidente');

// radios
const radiosRol = formRegistroUsuario.querySelectorAll('input[name="seleccionRol"]');

// Contenedores
let contenedorUsuarios;
let contenedorModalUsuario;
let contenedorIncidentes;
let contenedorModalIncidente;
let contenedorModalNuevoIncidente;
let contenedorPreguntasFrecuentes;
let contenedorTitulosManuales;
let contenedorGestorManuales;

let incidenteSeleccionado;
let usuarioSeleccionado;

//TODO ======================== VARIABLES GLOBALES ========================
let listadoGeneralUsuarios = {};
let listadoPreguntasFrecuentes = {};
let listadoManuales = {};
let listadoGeneralValoraciones = {};
// let listadoGeneralReportes = {};
let listadoGeneralIncidentes = {};
let limiteIncidentes = localStorage.getItem('limiteIncidentes') || 1000;
let paginaActualIncidentes = 1; // Página inicial
let hayMasIncidentes = true; // Indicador para saber si hay más incidentes

let confirmAction = null; // Variable para almacenar la función de confirmación actual en el modal de confirmación


//TODO ======================== ESCUCHA DE EVENTOS PARA SINCRONIZACIÓN DE DATOS EN TIEMPO REAL ========================

// ? SINCRONIZACIÓN USUARIOS
socket.on('/administrador/nuevoUsuario', function (data) {
    console.log('Nuevo Usuario recibido:', data);

    // Si hay usuarios en la lista, añadir al principio
    if (Object.keys(listadoGeneralUsuarios).length > 0) {
        listadoGeneralUsuarios.unshift(data);

        //! Si se encuentra en la sección Usuario actualizar la lista de manera no bloqueante
        if (seccionActual === 'Usuarios') {
            listarUsuarios();
        }
    }


});
socket.on('/administrador/edicionUsuario', function (data) {
    console.log('Usuario Editado recibido:', data);

    // Si hay registros en la lista actualizar el registro editado
    if (Object.keys(listadoGeneralUsuarios).length > 0) {
        listadoGeneralUsuarios.forEach(function (element, index) {
            if (element.id === data.id) {
                listadoGeneralUsuarios[index] = data;
            }
            //! Si se encuentra en la sección Usuario actualizar la lista de manera no bloqueante
            if (seccionActual === 'Usuarios') {
                listarUsuarios();
            }
        });
    }
});
socket.on('/administrador/eliminacionUsuario', function (data) {
    console.log('Usuario Eliminado recibido:', data);

    //! Si hay registros en la lista actualizar el registro del usuario al estado eliminado
    if (Object.keys(listadoGeneralUsuarios).length > 0) {
        listadoGeneralUsuarios.forEach(function (element, index) {
            if (element.id === data.id) {
                listadoGeneralUsuarios.splice(index, 1);
            }
            if (seccionActual === 'Usuarios') {
                listarUsuarios();
            }
        });
    }
});

// ? SINCRONIZACIÓN PREGUNTAS FRECUENTES
socket.on('/administrador/nuevaPreguntaFrecuente', function (data) {
    console.log('Nueva pregunta frecuente recibida:', data);

    // Si hay registros en el listado de Preguntas Frecuentes actualizarlo con el nuevo registro
    if (Object.keys(listadoPreguntasFrecuentes).length > 0) {
        listadoPreguntasFrecuentes.push({
            id_pfrecuente: data.id_pfrecuente,
            pregunta: data.pregunta,
            respuesta: data.respuesta,
        });

        // Si la sección actual es "Asesoria" y está en la sección FAQ, agregar la nueva pregunta al DOM
        if (seccionActual === 'Asesoria' && localStorage.getItem('seccionAsesoria') === 'FAQ') {
            // Añadir la nueva pregunta al DOM
            agregarPreguntaFrecuenteDOM(data);
        }
    }
    // Mostrar un toast o notificación no invasiva
    mostrarToast(
        'Una nueva Pregunta Frecuente se AGREGÓ',
        `Se ha agregado la pregunta frecuente: <strong>${data.pregunta}</strong>.`,
        'info',
        7000
    );
});
function agregarPreguntaFrecuenteDOM(data) {

    // Configurar el contenido del template con los datos de la pregunta
    templateItemPreguntaFrecuente.querySelector('.accordion-item').dataset.id = data.id_pfrecuente;
    templateItemPreguntaFrecuente.querySelector('.accordion-button').setAttribute('data-bs-target', `#collapse${data.id_pfrecuente}`);
    templateItemPreguntaFrecuente.querySelector('.accordion-collapse').id = `collapse${data.id_pfrecuente}`;
    templateItemPreguntaFrecuente.querySelector('.question-text').textContent = data.pregunta;
    templateItemPreguntaFrecuente.querySelector('.answer-text').value = data.respuesta;

    const clone = templateItemPreguntaFrecuente.cloneNode(true);
    // Añadir el nuevo item al principio del contenedor
    contenedorPreguntasFrecuentes.appendChild(clone);
}
socket.on('/administrador/edicionPreguntaFrecuente', function (data) {
    console.log('Edición de pregunta frecuente recibida:', data);

    // Si hay registros en el listado de Preguntas Frecuentes actualizar el registro editado
    if (Object.keys(listadoPreguntasFrecuentes).length > 0) {

        const index = listadoPreguntasFrecuentes.findIndex(pf => pf.id_pfrecuente == data.id_pfrecuente);

        if (index !== -1) {
            // Actualizar en el listado local
            listadoPreguntasFrecuentes[index] = data;

            // Si se encuentra en la sección de Asesoría y en el listado de Preguntas Frecuentes actualizar el registro editado
            if (seccionActual === 'Asesoria' && localStorage.getItem('seccionAsesoria') === 'FAQ') {

                // Actualizar directamente en el DOM
                const item = contenedorPreguntasFrecuentes.querySelector(`.accordion-item[data-id="${data.id_pfrecuente}"]`);
                if (item) {
                    item.querySelector('.question-text').textContent = data.pregunta;
                    item.querySelector('.answer-text').textContent = data.respuesta;
                }
            }
        }
    }

    // Mostrar un toast o notificación no invasiva
    mostrarToast(
        'Una Pregunta Frecuente se ha EDITADO',
        `Se ha editado la pregunta frecuente: <strong>${data.pregunta}</strong>.`,
        'info',
        7000
    );
});
socket.on('/administrador/eliminacionPreguntaFrecuente', function (data) {
    console.log('Eliminación de pregunta frecuente recibida:', data);

    // Si hay registros en el listado local actualizarlos
    if (Object.keys(listadoPreguntasFrecuentes).length > 0) {

        const index = listadoPreguntasFrecuentes.findIndex(pf => pf.id_pfrecuente == data.id_pfrecuente);
        if (index !== -1) {
            // Eliminar del listado local
            listadoPreguntasFrecuentes.splice(index, 1);

            // Si se encuentra en la sección de Asesoría y en el listado de Preguntas Frecuentes eliminar el registro
            if (seccionActual === 'Asesoria' && localStorage.getItem('seccionAsesoria') === 'FAQ') {

                // Eliminar directamente del DOM
                const item = contenedorPreguntasFrecuentes.querySelector(`.accordion-item[data-id="${data.id_pfrecuente}"]`);
                if (item) {
                    item.remove();
                }
            }
        }
    }

    // Mostrar un toast o notificación no invasiva
    mostrarToast(
        'Una Pregunta Frecuente se ha ELIMINADO',
        `Se ha eliminado la pregunta frecuente: <strong>${data.pregunta}</strong>.`,
        'info',
        7000
    );
});

// ? SINCRONIZACIÓN MANUALES
socket.on('/administrador/nuevoTituloManual', function (data) {
    console.log('Nuevo título de manual recibido:', data);

    // Si hay registros en el listado de Manuales actualizarlo con el nuevo registro
    if (Object.keys(listadoManuales).length > 0) {
        listadoManuales.push({
            id_manual: data.id_manual,
            titulo: data.titulo,
            descripcion: data.descripcion,
        });

        // Si la sección actual es "Asesoria" y está en la sección Manuales, agregar el nuevo manual al DOM
        if (seccionActual === 'Asesoria' && localStorage.getItem('seccionAsesoria') === 'Manual') {
            // Añadir el nuevo manual al DOM
            agregarManualDOM(data);
        }
    }

    // Mostrar un toast o notificación no invasiva
    mostrarToast(
        'Un nuevo Manual se AGREGÓ',
        `Se ha agregado el manual: <strong>${data.titulo}</strong>.`,
        'info',
        7000
    );
});

socket.on('/administrador/edicionTituloManual', function (data) {
    console.log('Edición de título de manual recibida:', data);

    // Si hay registros en el listado de Manuales actualizar el registro editado
    if (Object.keys(listadoManuales).length > 0) {

        const index = listadoManuales.findIndex(m => m.id_manual == data.id_manual);

        if (index !== -1) {
            // Actualizar en el listado local
            listadoManuales[index] = data;

            // Si se encuentra en la sección de Asesoría y en el listado de Manuales actualizar el registro editado
            if (seccionActual === 'Asesoria' && localStorage.getItem('seccionAsesoria') === 'Manual') {
                // Actualizar directamente en el DOM
                const item = contenedorGestorManuales.querySelector(`.accordion-item[data-id="${data.id_manual}"]`);
                if (item) {
                    item.querySelector('.manual-title').textContent = data.titulo;
                    item.querySelector('.manual-description').textContent = data.descripcion;
                }
            }
        }
    }

    mostrarToast(
        'Un Manual se ha EDITADO',
        `Se ha editado el manual: <strong>${data.titulo}</strong>.`,
        'info',
        7000
    );
});

socket.on('/administrador/eliminacionTituloManual', function (data) {
    console.log('Eliminación de título de manual recibida:', data);

    // Si hay registros en el listado de Manuales actualizarlos
    if (Object.keys(listadoManuales).length > 0) {
        const index = listadoManuales.findIndex(m => m.id_manual == data.id_manual);
        if (index !== -1) {
            // Eliminar del listado local
            listadoManuales.splice(index, 1);

            // Si se encuentra en la sección de Asesoría y en el listado de Manuales eliminar el registro
            if (seccionActual === 'Asesoria' && localStorage.getItem('seccionAsesoria') === 'Manual') {
                // Eliminar directamente del DOM
                const item = contenedorGestorManuales.querySelector(`.accordion-item[data-id="${data.id_manual}"]`);
                if (item) {
                    item.remove();
                }
            }
        }
    }

    // Mostrar un toast o notificación no invasiva
    mostrarToast(
        'Un Manual se ha ELIMINADO',
        `Se ha eliminado el manual: <strong>${data.titulo}</strong>.`,
        'info',
        7000
    );
});

// ? SINCRONIZACIÒN INCIDENTES
socket.on('/administrador/nuevoIncidente', function (data) {
    console.log('Nuevo incidente recibido:', data);

    if (Object.keys(listadoGeneralIncidentes).length > 0) {
        // Añadir el nuevo incidente al listado general
        listadoGeneralIncidentes.unshift(data);

        if (seccionActual === 'Incidentes') {
            // Verificar si el nuevo incidente cumple con los filtros actuales
            const agregarPorEstado = data.estado === seleccionEstadoIncidente || seleccionEstadoIncidente === 'Todos';
            const agregarPorReasignados = !switchIncidentesReasignados.checked || data.dni_tecnico;

            if (agregarPorEstado && agregarPorReasignados) {
                const template = document.getElementById('templateItemIncidente');
                const clone = document.importNode(template.content, true);

                // Asignar valores del nuevo incidente
                clone.querySelector('.incidente').setAttribute('data-id', data.id_incidente);
                clone.querySelector(".num-incidente .detalles-lista").textContent = data.id_incidente;
                clone.querySelector('.nombre-incidente .detalles-lista').textContent = data.titulo;
                clone.querySelector('.detalles-incidente .detalles-lista').textContent = data.descripcion_incidente;
                clone.querySelector('.nombre-empresa .detalles-lista').textContent = data.razon_social;
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
    }
    // Mostrar un toast o notificación no invasiva
    mostrarToast(
        'Nuevo Incidente',
        `Se ha registrado un nuevo incidente: <strong>${data.titulo}</strong>.`,
        'info',
        7000
    );

});
socket.on('/administrador/actualizacionIncidente', function (data) {
    console.log('Incidente actualizado recibido: ' + data);
    for (let i = 0; i < listadoGeneralIncidentes.length; i++) {
        if (listadoGeneralIncidentes[i].id === data.id) {
            listadoGeneralIncidentes[i] = data;
            break;
        }
    }

});
socket.on('/administrador/eliminacionIncidente', function (data) {
    console.log('Incidente eliminado recibido: ' + data);
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
// Lanzamiento de vista de usuarios
btnMenuUsuarios.addEventListener('click', function () {
    localStorage.setItem('ultimaSeccion', 'Usuarios');
    seccionActual = 'Usuarios';

    cardReactivo.innerHTML = "";
    const clone = templateUsuarios.cloneNode(true);
    fragmento.appendChild(clone);
    cardReactivo.appendChild(fragmento);

    seleccionEstadosUsuarios = document.querySelector('.lbx-estados-select-usuario');
    lbxEstadosUsuarios = document.querySelectorAll('.lbx-estados-usuario');
    seleccionRolUsuario = document.querySelector('.lbx-rol-select-usuario');
    lbxRolUsuarios = document.querySelectorAll('.lbx-rol-usuario');
    buscadorUsuario = document.querySelector("#buscadorUsuarios");
    contenedorUsuarios = document.querySelector('#contenedorUsuarios');

    if (Object.keys(listadoGeneralUsuarios).length > 0) {
        console.log("No se consultaron los usuarios porque ya se cargaron");
        listarUsuarios();
    } else {
        socket.emit("/administrador/listadoGeneralUsuarios", {}, (respuesta) => {
            if (respuesta.success) {

                console.log("Se consultaron los usuarios: ", respuesta.data);
                listadoGeneralUsuarios = respuesta.data;
                listarUsuarios();

            } else {
                console.log(respuesta.error)
            }
        });

    }

    lbxEstadosUsuarios.forEach(opcion => {
        opcion.addEventListener('click', function () {
            seleccionEstadosUsuarios.classList.remove('bg-success', 'bg-secondary')
            if (opcion.classList.contains("op-activos-usuario")) {
                seleccionEstadosUsuarios.textContent = "Solo Activos";
                seleccionEstadosUsuarios.classList.add('bg-success')

            } else if (opcion.classList.contains("op-inactivos-usuario")) {
                seleccionEstadosUsuarios.textContent = "Solo Inactivos";
                seleccionEstadosUsuarios.classList.add('bg-secondary')

            } else {
                seleccionEstadosUsuarios.textContent = "Estado Usuario";
                seleccionEstadosUsuarios.classList.remove('bg-success', 'bg-secondary')

            }
            listarUsuarios();
        });
    });

    lbxRolUsuarios.forEach(opcion => {
        opcion.addEventListener('click', function () {
            seleccionRolUsuario.classList.remove('bg-primario', 'bg-usuario-admin', 'bg-usuario-tecnico', 'bg-usuario-soporte', 'bg-usuario-cliente');
            console.log("Opción seleccionada: ", opcion.textContent);
            if (opcion.classList.contains("op-usuario-administrador")) {
                seleccionRolUsuario.textContent = "Solo Administradores";
                seleccionRolUsuario.classList.add('bg-usuario-admin');
            } else if (opcion.classList.contains("op-usuario-tecnico")) {
                seleccionRolUsuario.textContent = "Solo Técnicos";
                seleccionRolUsuario.classList.add('bg-usuario-tecnico');
            } else if (opcion.classList.contains("op-usuario-soporte")) {
                seleccionRolUsuario.textContent = "Solo Soporte";
                seleccionRolUsuario.classList.add('bg-usuario-soporte');
            } else if (opcion.classList.contains("op-usuario-cliente")) {
                seleccionRolUsuario.textContent = "Solo Clientes";
                seleccionRolUsuario.classList.add('bg-usuario-cliente');
            } else {
                seleccionRolUsuario.textContent = "Tipo de Rol";
                seleccionRolUsuario.classList.remove('bg-primario', 'bg-usuario-admin', 'bg-usuario-tecnico', 'bg-usuario-soporte', 'bg-usuario-cliente');

            }
            listarUsuarios();
        });
    });

    buscadorUsuario.addEventListener('input', () => {
        listarUsuarios();
    })

    contenedorUsuarios.addEventListener('click', e => {
        abrirUsuario(e);
    }
    )

});

// Lanzamiento de la vista del menu Asesoria
btnMenuAsesoria.addEventListener('click', function () {
    localStorage.setItem('ultimaSeccion', 'Asesoria');
    seccionActual = 'Asesoria';
    cardReactivo.innerHTML = "";
    const clone = templateAsesoria.cloneNode(true);
    fragmento.appendChild(clone);
    cardReactivo.appendChild(fragmento);

    contenedorPreguntasFrecuentes = document.querySelector('#contenedorPreguntasFrecuentes');
    contenedorTitulosManuales = document.querySelector('#contenedorTitulosManuales');
    let radioFAQ = document.querySelector('#menu-radio-faq');
    let radioManual = document.querySelector('#menu-radio-manual');
    let seccionFAQ = document.querySelector('#seccionFaq');
    let seccionManual = document.querySelector('#seccionManual');

    if (seccionAsesoria === 'FAQ') {
        radioFAQ.checked = true;
        radioManual.checked = false;
        seccionFAQ.classList.remove('d-none');
        seccionManual.classList.add('d-none');
        consultarPreguntasFrecuentes()
            .then(() => listarPreguntasFrecuentes())
            .catch((error) => console.log(error));
    } else if (seccionAsesoria === 'Manual') {
        radioFAQ.checked = false;
        radioManual.checked = true;
        seccionFAQ.classList.add('d-none');
        seccionManual.classList.remove('d-none');
        consultarManuales()
            .then(() => listarGestorManuales())
            .catch((error) => console.log(error));
    }

    radioFAQ.addEventListener('click', () => {
        localStorage.setItem('seccionAsesoria', 'FAQ');
        seccionFAQ.classList.remove('d-none');
        seccionManual.classList.add('d-none');
        consultarPreguntasFrecuentes()
            .then(() => listarPreguntasFrecuentes())
            .catch((error) => console.log(error));
    });

    radioManual.addEventListener('click', () => {
        localStorage.setItem('seccionAsesoria', 'Manual');
        seccionFAQ.classList.add('d-none');
        seccionManual.classList.remove('d-none');
        consultarManuales()
            .then(() => listarGestorManuales())
            .catch((error) => console.log(error));
    });



    seccionFAQ.addEventListener('click', e => {
        if (e.target.id === "addFaqBtn") {
            agregarPreguntaFrecuente();
        }
        if (e.target.classList.contains("save-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            guardarPreguntaFrecuente(id);
        }
        if (e.target.classList.contains("edit-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            editarPreguntaFrecuente(id);
        }
        if (e.target.classList.contains("delete-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            console.log("Eliminar pregunta frecuente: ", id);
            eliminarPreguntaFrecuente(id);
        }

        if (e.target.classList.contains("cancel-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            cancelarPreguntaFrecuente(id);
        }
        if (e.target.classList.contains("cancel-edit-btn")) {
            cancelarEditarPreguntaFrecuente();
        }
    });

    seccionManual.addEventListener('click', function (e) {
        // CRUD TITULOS (SECCIONES) DE LOS MANUALES)
        if (e.target.classList.contains("add-tittle-btn")) {
            agregarTituloManual();
        }
        if (e.target.classList.contains("save-tittle-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            guardarSeccionManual(id);
        }
        if (e.target.classList.contains("delete-tittle-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            eliminarSeccionManual(id);
        }
        if (e.target.classList.contains("edit-tittle-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            editarSeccionManual(id);
        }
        if (e.target.classList.contains("save-tittle-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            guardarEditarSeccionManual(id);
        }
        if (e.target.classList.contains("cancel-section-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            cancelarNuevaSeccionManual(id);
        }
        if (e.target.classList.contains("cancel-edit-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            cancelarEditarSeccionManual(id);
        }

        // CRUD MANUALES DE CADA SECCION
        if (e.target.classList.contains("add-manual-btn")) {
            let idSection = e.target.closest('.accordion-item').dataset.id;
            agregarManual(idSection);
        }
        if (e.target.classList.contains("save-manual-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            guardarManual(id);
        }
        if (e.target.classList.contains("delete-manual-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            eliminarManual(id);
        }
        if (e.target.classList.contains("edit-manual-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            editarManual(id);
        }
        if (e.target.classList.contains("save-edit-manual-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            guardarEditarManual(id);
        }
        if (e.target.classList.contains("cancel-manual-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            cancelarNuevaManual(id);
        }
        if (e.target.classList.contains("cancel-edit-manual-btn")) {
            let id = e.target.closest('.accordion-item').dataset.id;
            cancelarEditarManual(id);
        }

    });
});

// Lanzamiento de la vista del menu Incidentes
btnMenuIncidentes.addEventListener('click', function () {
    localStorage.setItem('ultimaSeccion', 'Incidentes');
    seccionActual = 'Incidentes';

    cardReactivo.innerHTML = "";
    const clone = templateIncidentes.cloneNode(true);
    fragmento.appendChild(clone);
    cardReactivo.appendChild(fragmento);

    // filtrar incidentes reasignados
    switchIncidentesReasignados = document.querySelector('#switchIncidentesReasignados');
    contenedorIncidentes = document.querySelector(`#contenedorIncidentes`);
    opcionesTipoIncidente = document.querySelectorAll('.opcion-estado-incidente');
    btnAbrirNuevoIncidente = document.querySelector('#btnAbrirNuevoIncidente');
    let inputRadio = document.querySelector(`.op-incidentes-${seleccionEstadoIncidente}`);
    inputRadio.checked = true;
    inputRadio.click();

    if (Object.keys(listadoGeneralIncidentes).length > 0) {
        console.log("No se consultaron los incidentes porque ya se cargaron");
        listarIncidentes(paginaActualIncidentes, limiteIncidentes);
    } else {
        socket.emit("/administrador/listadoIncidentes", { pagina: 1, limite: limiteIncidentes, estado: 'Todos' }, (respuesta) => {
            if (respuesta.success) {

                console.log("Se consultaron los incidentes: ", respuesta.data);
                listadoGeneralIncidentes = respuesta.data;
                listarIncidentes(paginaActualIncidentes, limiteIncidentes);

            } else {
                console.log(respuesta.error)
            }
        });
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

    switchIncidentesReasignados.addEventListener('click', function () {
        listarIncidentes(paginaActualIncidentes, limiteIncidentes);
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

    btnAbrirNuevoIncidente.addEventListener('click', function () {
        abrirModalNuevoIncidente();
    });

    contenedorIncidentes.addEventListener('click', e => {
        abrirIncidente(e)
    }
    )

});

// Lanzamiento de la vista del menu valoración 
btnMenuValoracion.addEventListener('click', function () {
    localStorage.setItem('ultimaSeccion', 'Valoracion');
    seccionActual = 'Valoracion';
    cardReactivo.innerHTML = "";

    /* templateValoracion.querySelector('#tituloValoracion').textContent = "Soy modulo valoración"; */
    const clone = templateValoracion.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);

    let radioValoracionManual = document.querySelector('#radioValoracionManual');
    let radioValoracionAtencion = document.querySelector('#radioValoracionAtencion');
    let radioValoracionSoftwareInnova = document.querySelector('#radioValoracionSoftwareInnova');

    let seccionValoracionManual = document.querySelector('#seccionValoracionManual');
    let seccionValoracionAtencion = document.querySelector('#seccionValoracionAtencion');
    let seccionValoracionSoftwareInnova = document.querySelector('#seccionValoracionSoftwareInnova');

    if (radioValoracionManual && radioValoracionAtencion && radioValoracionSoftwareInnova) {

        radioValoracionManual.addEventListener('click', () => {
            seccionValoracionManual.classList.remove('d-none');
            seccionValoracionAtencion.classList.add('d-none');
            seccionValoracionSoftwareInnova.classList.add('d-none');
        });

        radioValoracionAtencion.addEventListener('click', () => {
            seccionValoracionAtencion.classList.remove('d-none');
            seccionValoracionManual.classList.add('d-none');
            seccionValoracionSoftwareInnova.classList.add('d-none');
        });

        radioValoracionSoftwareInnova.addEventListener('click', () => {
            seccionValoracionSoftwareInnova.classList.remove('d-none');
            seccionValoracionManual.classList.add('d-none');
            seccionValoracionAtencion.classList.add('d-none');
        });

    }

    if (Object.keys(listadoGeneralValoraciones).length > 0) {
        console.log("No se consultaron las valoraciones porque ya se cargaron");
        // listarValoraciones();
    } else {
        socket.emit("/administrador/listadoValoraciones", {}, (respuesta) => {
            if (respuesta.success) {

                console.log("Se consultaron las valoraciones: ", respuesta.data);
                listadoGeneralValoraciones = respuesta.data;
                // listarValoraciones();

            } else {
                console.log(respuesta.error)
            }
        });
    }
})

// Lanzamiento de la vista del menu configuración
btnMenuConfiguracion.addEventListener('click', function () {
    localStorage.setItem('ultimaSeccion', 'Configuracion');
    seccionActual = 'Configuracion';
    cardReactivo.innerHTML = "";

    // templateConfiguracion.querySelector("#tituloConfiguracion").textContent = "Hola, soy el modulo configuración";

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

// Lanzamiento de la vista del menu reportes
btnMenuReportes.addEventListener('click', () => {
    localStorage.setItem('ultimaSeccion', 'Reportes');
    seccionActual = 'Reportes';
    cardReactivo.innerHTML = "";

    const clone = templateReportes.cloneNode(true);
    fragmento.appendChild(clone);
    cardReactivo.appendChild(fragmento);

    let radioReportesIncidentes = document.querySelector('#radioReportesIncidentes');
    let radioReportesValoracion = document.querySelector('#radioReportesValoracion');
    let radioReportesGuardados = document.querySelector('#radioReportesGuardados');

    let seccionReportesIncidentes = document.querySelector('#seccionReportesIncidentes');
    let seccionReportesValoracion = document.querySelector('#seccionReportesValoracion');
    let seccionReportesGuardados = document.querySelector('#seccionReportesGuardados');

    if (seccionReportesIncidentes && seccionReportesValoracion && seccionReportesGuardados) {

        radioReportesIncidentes.addEventListener('click', () => {
            if (radioReportesIncidentes.checked) {
                seccionReportesIncidentes.classList.remove('d-none');
                seccionReportesGuardados.classList.add('d-none');
                seccionReportesValoracion.classList.add('d-none');
            }
        });

        radioReportesValoracion.addEventListener('click', () => {
            if (radioReportesValoracion.checked) {
                seccionReportesValoracion.classList.remove('d-none');
                seccionReportesGuardados.classList.add('d-none');
                seccionReportesIncidentes.classList.add('d-none');
            }
        });

        radioReportesGuardados.addEventListener('click', () => {
            if (radioReportesGuardados.checked) {
                seccionReportesGuardados.classList.remove('d-none');
                seccionReportesValoracion.classList.add('d-none');
                seccionReportesIncidentes.classList.add('d-none');
            }
        });
    }

    /* Filtro de busqueda */
    document.addEventListener("keyup", e => {
        if (e.target.matches("#buscador")) {
            // Limpiar el campo si se presiona Escape
            if (e.key === "Escape") e.target.value = "";
            // Obtener el valor de búsqueda en minúsculas
            const busqueda = e.target.value.toLowerCase();
            // Recorrer cada fila de la tabla (cada incidente)
            document.querySelectorAll(".reporteIncidente").forEach(incidente => {
                // Buscar en el contenido de la fila: número, incidente, detalles, empresa, estado
                const textoFila = incidente.textContent.toLowerCase();
                // Si la búsqueda coincide con algún texto en la fila, la muestra, de lo contrario la oculta
                textoFila.includes(busqueda)
                    ? incidente.classList.remove("d-none")
                    : incidente.classList.add("d-none");
            });
        }
    });

    //Filtro de busqueda por fecha
    document.addEventListener("change", e => {

        if (e.target.matches("#buscador-fecha")) {

            const fechaSeleccionada = e.target.value; // Fecha seleccionada en formato AAAA-MM-DD

            document.querySelectorAll(".reporteIncidente").forEach(incidente => {
                // Obtener la fecha de cada fila (deberías asegurarte de que la fecha esté en el formato correcto)
                const fechaIncidente = incidente.querySelector(".fecha-incidente .detalles-lista").textContent;

                // Convertimos la fecha del incidente y la fecha seleccionada a un formato que se pueda comparar
                const [dia, mes, an] = fechaIncidente.split('/'); // Suponiendo que la fecha está en formato DD/MM/AAAA
                const fechaFormateada = `${an}-${mes}-${dia}`; // Formato AAAA-MM-DD

                // Si la fecha del incidente coincide con la seleccionada, la fila se muestra, de lo contrario se oculta
                fechaFormateada === fechaSeleccionada
                    ? incidente.classList.remove("d-none")
                    : incidente.classList.add("d-none");
            });
        }
    })
})

// Inicio
btnMenuInicio.addEventListener('click', function () {
    location.reload();

    localStorage.setItem("ultimaSeccion", 'Inicio');
    seccionActual = 'Inicio';
})

//TODO ======================== FUNCIONES ========================

function listarUsuarios() {
    console.log("Función listar usuarios");

    let usuariosFiltrados = 0;
    let agregarPorNombreDNI = false;
    let agregarPorEstado = false;
    let agregarPorRol = false;

    let buscarPorEstado = seleccionEstadosUsuarios.textContent;
    let buscadorPorRol = seleccionRolUsuario.textContent;
    let contenidoBuscadorUsuario = buscadorUsuario.value;

    contenedorUsuarios.innerHTML = "";

    listadoGeneralUsuarios.forEach(usuario => {

        let nombreUsuario;
        nombreUsuario = usuario.nombres + " " + usuario.apellidos;

        if (contenidoBuscadorUsuario == "") {
            agregarPorNombreDNI = true;
        } else {
            agregarPorNombreDNI = usuario.dni.toUpperCase().includes(contenidoBuscadorUsuario.toUpperCase()) || nombreUsuario.toUpperCase().includes(contenidoBuscadorUsuario.toUpperCase());
        }
        console.log("Agregar por estado: ", buscarPorEstado);
        if (buscarPorEstado == "Estado Usuario") {
            agregarPorEstado = true;
        } else {
            if (buscarPorEstado == "Solo Activos") {
                agregarPorEstado = usuario.estado === "Activo";
            } else if (buscarPorEstado == "Solo Inactivos") {
                agregarPorEstado = usuario.estado === "Inactivo";
            }
        }

        if (buscadorPorRol == "Tipo de Rol") {
            agregarPorRol = true;
        } else {
            if (buscadorPorRol == "Solo Administradores") {
                agregarPorRol = usuario.id_rol == 1;
            } else if (buscadorPorRol == "Solo Técnicos") {
                agregarPorRol = usuario.id_rol == 2;
            } else if (buscadorPorRol == "Solo Soporte") {
                agregarPorRol = usuario.id_rol == 3;
            } else if (buscadorPorRol == "Solo Clientes") {
                agregarPorRol = usuario.id_rol == 4;
            } else { agregarPorRol = false; }
        }

        if (agregarPorNombreDNI == true && agregarPorRol == true && agregarPorEstado == true) {

            templateItemUsuario.querySelector(".dni-usuario .detalles-lista").textContent = usuario.dni;
            const rolClase = usuario.id_rol === 1 ? 'danger' :
                usuario.id_rol === 2 ? 'primary' :
                    usuario.id_rol === 3 ? 'success' :
                        usuario.id_rol === 4 ? 'black' : '';

            const rolTexto = usuario.id_rol === 1 ? 'Administrador' :
                usuario.id_rol === 2 ? 'Técnico' :
                    usuario.id_rol === 3 ? 'Soporte' :
                        usuario.id_rol === 4 ? 'Cliente' : '';

            templateItemUsuario.querySelector(".nombre-completo-usuario").innerHTML = `${usuario.nombres} ${usuario.apellidos}  <span class="badge bg-${rolClase}">${rolTexto}</span>`;



            templateItemUsuario.querySelector(".telefono-usuario .detalles-lista").textContent = usuario.telefono;
            templateItemUsuario.querySelector(".correo-usuario").textContent = usuario.correo;
            templateItemUsuario.querySelector(".direccion-usuario .detalles-lista").textContent = usuario.direccion;
            templateItemUsuario.querySelector(".estado-usuario .detalles-lista").classList.remove('estado-usuario-activo', 'estado-usuario-inactivo');
            templateItemUsuario.querySelector(".estado-usuario .detalles-lista").classList.add(`${usuario.estado === 'Activo' ? 'estado-usuario-activo' : 'estado-usuario-inactivo'}`)
            templateItemUsuario.querySelector(".estado-usuario .detalles-lista").textContent = usuario.estado;
            templateItemUsuario.querySelector(".btn-abrir-usuario").dataset.id = usuario.dni;

            const clone = templateItemUsuario.cloneNode(true);
            fragmento.appendChild(clone);

            usuariosFiltrados += 1;
        }
    });

    let divSinResultados = document.querySelector("#divSinResultadosUsuario");
    divSinResultados.innerHTML = '';

    if (usuariosFiltrados === 0) {
        divSinResultados.innerHTML =
            `
                <div class="d-flex justify-content-center align-items-center my-5">
                    <p class="text-center">Sin resultados... </p>
                </div>
            `
    } else {
        contenedorUsuarios.appendChild(fragmento);
    }
}

function abrirUsuario(e) {
    if (e.target.classList.contains('btn-abrir-usuario')) {
        console.log(e.target.dataset.id);
        let usuario = listadoGeneralUsuarios.find(usuario => usuario.dni === e.target.dataset.id);
        console.log("Usuario seleccionado: ", usuario);
        usuarioSeleccionado = usuario.dni;

        modalUsuario.show();
        templateModalUsuario.querySelector('#nombreUpdateUser').value = `${usuario.nombres} ${usuario.apellidos}`;
        templateModalUsuario.querySelector('#correoUpdateUser').value = usuario.correo;
        templateModalUsuario.querySelector('#dniUpdateUser').value = usuario.dni;
        templateModalUsuario.querySelector('#telefonoUpdateUser').value = usuario.telefono;
        templateModalUsuario.querySelector('#direccionUpdateUser').value = usuario.direccion;
        // Convierte la fecha de nacimiento al formato "YYYY-MM-DD"
        const fechaNacimiento = usuario.fecha_nacimiento
            ? new Date(usuario.fecha_nacimiento).toISOString().slice(0, 10)
            : ""; // Si no hay fecha, asigna un valor vacío
        templateModalUsuario.querySelector('#nacimientoUpdateUser').value = fechaNacimiento;

        if (usuario.id_rol == 1) { templateModalUsuario.querySelector('#rolAdministradorUpdate').checked = true; }
        if (usuario.id_rol == 2) { templateModalUsuario.querySelector('#rolTecnicoUpdate').checked = true; }
        if (usuario.id_rol == 3) { templateModalUsuario.querySelector('#rolSoporteUpdate').checked = true; }
        if (usuario.id_rol == 4) { templateModalUsuario.querySelector('#rolClienteUpdate').checked = true; }
        // templateModalUsuario.querySelector('#estadoUpdateUser').value = usuario.estado;

        contenedorModalUsuario = document.querySelector('.contenedorModalUsuario');
        contenedorModalUsuario.innerHTML = "";
        let clone = templateModalUsuario.cloneNode(true);
        contenedorModalUsuario.appendChild(clone);

    }
}

function consultarPreguntasFrecuentes() {
    return new Promise((resolve, reject) => {
        if (Object.keys(listadoPreguntasFrecuentes).length > 0) {
            console.log("No se consultaron las preguntas frecuentes porque ya se consultaron y no hay nuevas actualizaciones en la base de datos.");
            resolve();
        } else {
            socket.emit("/administrador/listadoPreguntasFrecuentes", (respuesta) => {
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

function consultarManuales() {
    return new Promise((resolve, reject) => {
        if (Object.keys(listadoManuales).length > 0) { // y si no hay nuevas manuales por actualizar
            console.log("No se consultaron los manuales porque ya se consultaron y no hay nuevas actualizaciones en la base de datos.");
            resolve();
        } else {
            socket.emit("/administrador/listadoManuales", {}, (respuesta) => {
                if (respuesta.success) {

                    console.log("Se consultaron los manuales: ", respuesta.data);
                    listadoManuales = respuesta.data;
                    resolve();
                } else {
                    reject(respuesta.error);
                }
            });
        }
    });
}

function listarPreguntasFrecuentes() {
    console.log("Función listarPreguntasFrecuentes()");
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

function listarTitulosManuales() {
    console.log("Función listarTitulosManuales()");
    contenedorTitulosManuales.innerHTML = "";

    if (listadoManuales.length === 0) {
        contenedorTitulosManuales.innerHTML =
            `
            <div class="d-flex justify-content-center align-items-center my-5">
                <p class="text-center text-white">Sin manuales...</p>
            </div>`
        return;
    }

    // Generar e insertar los titulos de los manuales en la interfaz
    listadoManuales.forEach(tituloManual => {
        templateItemTituloManual.querySelector('.accordion-item').dataset.id = tituloManual.id_manual;
        templateItemTituloManual.querySelector('.accordion-button').setAttribute('data-bs-target', `#collapse${tituloManual.id_manual}`);
        templateItemTituloManual.querySelector('.accordion-collapse').id = `collapse${tituloManual.id_manual}`;
        templateItemTituloManual.querySelector("#tituloManual").textContent = tituloManual.titulo_manual;

        //! Agregar los subtitulos de este titulo del manual
        const contenedorSubtitulos = templateItemTituloManual.querySelector('.accordion-body');
        tituloManual.sub_titulo.forEach(sub_titulo => {
            templateItemSubtituloManual.querySelector('.btn-group').dataset.id = sub_titulo.id_subtitulo_manual;
        });


        const clone = templateItemTituloManual.cloneNode(true);
        fragmento.appendChild(clone);
        contenedorTitulosManuales.appendChild(fragmento);
    });
}

// function listarGestorManuales() {
//     console.log('Función listarGestorManuales()');
//     // contenedorGestorManuales.innerHTML = "";

//     listadoManuales.forEach(seccion => {
//         const templateSeccion = document.createElement('div');
//         templateSeccion.classList.add('accordion-item');
//         templateSeccion.dataset.id = seccion.id_seccion_manual;

//         templateSeccion.innerHTML =
//             `
//             <h2 class="accordion-header" id="heading${seccion.id_seccion_manual}">
//                 <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${seccion.id_seccion_manual}" aria-expanded="false" aria-controls="collapse${seccion.id_seccion_manual}">
//                     ${seccion.nombre_seccion}
//                 </button>
//             </h2>
//             <div id="collapse${seccion.id_seccion_manual}" class="accordion-collapse collapse" aria-labelledby="heading${seccion.id_seccion_manual}" data-bs-parent="#accordionGestorManuales">
//                 <div class="accordion-body">
//                     <div class="d-flex justify-content-between align-items-center">
//                         <button class="btn btn-primary add-manual-btn">Agregar manual</button>
//                     </div>
//                     <div class="accordion" id="accordionManual${seccion.id_seccion_manual}">
//                     </div>
//                 </div>
//             </div>
//             `;

//         contenedorGestorManuales.appendChild(templateSeccion);

//         // Listar manuales de cada sección
//         const contenedorManuales = contenedorGestorManuales.querySelector(`#accordionManual${seccion.id_seccion_manual}`);
//         seccion
// }

function agregarPreguntaFrecuente() {
    const id = Date.now();
    const clone = templateItemPreguntaFrecuente.cloneNode(true);
    const date = new Date().toLocaleDateString();

    clone.querySelector('.accordion-item').dataset.id = id;
    clone.querySelector('.question-input').disabled = false;
    clone.querySelector('.question-input').classList.remove('d-none');
    clone.querySelector('.question-text').classList.add('d-none');
    clone.querySelector('.answer-text').disabled = false;
    clone.querySelector('.answer-text').value = '';
    clone.querySelector('.save-btn').classList.remove('d-none');
    clone.querySelector('.edit-btn').classList.add('d-none');
    clone.querySelector('.cancel-btn').classList.remove('d-none');
    clone.querySelector('.delete-btn').classList.add('d-none');
    // clone.querySelector('.date-badge').textContent = `Creado/modificado: ${date}`;
    clone.querySelector('.accordion-button').setAttribute('data-bs-target', `#collapse${id}`);
    clone.querySelector('.accordion-collapse').id = `collapse${id}`;

    fragmento.appendChild(clone);
    contenedorPreguntasFrecuentes.appendChild(fragmento);
}

function guardarPreguntaFrecuente(idTemp) {
    const item = contenedorPreguntasFrecuentes.querySelector(`.accordion-item[data-id="${idTemp}"]`);
    const questionInput = item.querySelector('.question-input');
    const questionText = item.querySelector('.question-text');
    const answerText = item.querySelector('.answer-text');
    const saveBtn = item.querySelector('.save-btn');
    const editBtn = item.querySelector('.edit-btn');

    // Validar campos
    const pregunta = questionInput.value.trim();
    const respuesta = answerText.value.trim();

    if (!pregunta || !respuesta) {
        Swal.fire({
            icon: "warning",
            title: "Campos incompletos",
            text: "Por favor, completa todos los campos antes de guardar.",
        });
        return;
    }

    // Preparar datos para enviar
    const data = {
        pregunta,
        respuesta,
    };

    // Deshabilitar el botón mientras se procesa
    saveBtn.disabled = true;

    // Emitir el evento de guardar
    socket.emit('/administrador/guardarPreguntaFrecuente', data, (respuesta) => {
        if (respuesta.success) {
            console.log('Id temporal: ', idTemp);
            console.log('Id real: ', respuesta.data.id_pfrecuente);

            const idReal = respuesta.data.id_pfrecuente;

            // Actualizar el ID temporal con el ID real
            item.dataset.id = idReal;

            // Actualizar en listadoPreguntasFrecuentes
            const index = listadoPreguntasFrecuentes.findIndex(pf => pf.id_pfrecuente === idTemp);
            if (index !== -1) {
                listadoPreguntasFrecuentes[index].id_pfrecuente = idReal;
            }

            // Eliminar el acordeón temporal
            if (item) item.remove();

        } else {
            Swal.fire({
                icon: "error",
                title: "Error al guardar",
                text: "Ocurrió un error al intentar guardar la pregunta.",
            });
        }

        // Rehabilitar el botón
        saveBtn.disabled = false;
    });
}

function eliminarPreguntaFrecuente(id) {

    const item = contenedorPreguntasFrecuentes.querySelector(`.accordion-item[data-id="${id}"]`);
    const questionInput = item.querySelector('#pregunta');
    const answerText = item.querySelector('.answer-text');

    // Validar campos
    const pregunta = questionInput.textContent.trim();
    const respuesta = answerText.value.trim();

    Swal.fire({
        title: '¿Estás seguro de que deseas eliminar esta pregunta?',
        position: "center",
        icon: "warning",
        text: "Esta acción no se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
    }).then((result) => {
        if (result.isConfirmed) {
            let data = {
                id_pfrecuente: id,
                pregunta: pregunta,
                respuesta: respuesta
            };
            socket.emit('/administrador/eliminarPreguntaFrecuente', data, (respuesta) => {
                if (respuesta.success) {
                } else {
                    console.error(respuesta.error)
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: `Algo salió mal: ${respuesta.error}`,
                    });
                }
            });
        }
    });
}

function cancelarPreguntaFrecuente(id) {
    const item = contenedorPreguntasFrecuentes.querySelector(`.accordion-item[data-id="${id}"]`);
    item.remove();
}

function editarPreguntaFrecuente(id) {

    const item = contenedorPreguntasFrecuentes.querySelector(`.accordion-item[data-id="${id}"]`);
    const questionInput = item.querySelector('.question-input');
    const questionText = item.querySelector('.question-text');
    const answerText = item.querySelector('.answer-text');
    const saveBtn = item.querySelector('.save-btn');
    const editBtn = item.querySelector('.edit-btn');
    const cancelEditBtn = item.querySelector('.cancel-edit-btn');
    const deleteBtn = item.querySelector('.delete-btn');
    const saveEditBtn = item.querySelector('.save-edit-btn');

    questionInput.value = questionText.textContent;
    questionInput.classList.remove('d-none');
    questionText.classList.add('d-none');
    questionInput.disabled = false;
    answerText.disabled = false;
    saveBtn.classList.remove('d-none');
    editBtn.classList.add('d-none');
    cancelEditBtn.classList.remove('d-none');
    deleteBtn.classList.add('d-none');
    saveEditBtn.classList.remove('d-none');
    saveBtn.classList.add('d-none');

    saveBtn.replaceWith(saveBtn.cloneNode(true)); // Clonar el nodo elimina los eventos asociados
    const newSaveBtn = item.querySelector('.save-edit-btn');

    newSaveBtn.addEventListener('click', function (event) {
        event.preventDefault();
        Swal.fire({
            title: '¿Estás seguro de que deseas editar esta pregunta?',
            position: "center",
            icon: "warning",
            text: "Esta acción no se puede deshacer.",
            showCancelButton: true,
            confirmButtonText: "Editar",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                let updatePregunta = {
                    id_pfrecuente: id,
                    pregunta: questionInput.value.trim(),
                    respuesta: answerText.value.trim()
                };

                socket.emit('/administrador/editarPreguntaFrecuente', updatePregunta, (resp) => {
                    if (resp.success) {
                        questionInput.classList.add('d-none');
                        questionText.classList.remove('d-none');
                        questionInput.disabled = true;
                        answerText.disabled = true;
                        saveBtn.classList.add('d-none');
                        editBtn.classList.remove('d-none');
                        cancelEditBtn.classList.add('d-none');
                        deleteBtn.classList.remove('d-none');
                        saveEditBtn.classList.add('d-none');
                    } else {
                        console.error(resp.error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: respuesta.error,
                            showConfirmButton: true,
                        });
                    }
                });
            }
        });
    });

}

function cancelarEditarPreguntaFrecuente() {
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta seguro que deseas cancelar la edición de la pregunta frecuente?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí',
        cancelButtonText: 'No',
        reverseButtons: true,
    }).then((result) => {
        if (result.isConfirmed) {
            listarPreguntasFrecuentes();
        }
    })
}

function agregarTituloManual() {
    const id = Date.now();
    const clone = templateItemTituloManual.cloneNode(true);

    clone.querySelector('.accordion-item').dataset.id = id;
    clone.querySelector('.manual-title-input').disabled = false;
    clone.querySelector('.manual-title-input').classList.remove('d-none');
    clone.querySelector('.manual-title').classList.add('d-none');
    clone.querySelector('.save-tittle-btn').classList.remove('d-none');
    clone.querySelector('.cancel-tittle-btn').classList.remove('d-none');
    clone.querySelector('.accordion-button').setAttribute('data-bs-target', `#collapse${id}`);
    clone.querySelector('.accordion-collapse').id = `collapse${id}`;

    fragmento.appendChild(clone);
    contenedorTitulosManuales.appendChild(fragmento);
}

function listarIncidentes(pagina, limite) {
    console.log(`Función listarIncidentes(${pagina}, ${limite})`);
    contenedorIncidentes.innerHTML = "";

    let incidentesFiltrados = 0;

    listadoGeneralIncidentes.forEach(incidente => {

        let agregarPorEstado = incidente.estado === seleccionEstadoIncidente || seleccionEstadoIncidente === 'Todos';
        let agregarPorReasignados = !switchIncidentesReasignados.checked || incidente.dni_tecnico;

        if (agregarPorEstado && agregarPorReasignados) {

            templateItemIncidente.querySelector(".num-incidente .detalles-lista").textContent = incidente.id_incidente;
            templateItemIncidente.querySelector(".nombre-incidente .detalles-lista").innerHTML = `${incidente.titulo} ${incidente.dni_tecnico ? '<span class="badge bg-warning text-dark">Reasignado</span>' : ''}`;

            templateItemIncidente.querySelector(".detalles-incidente .detalles-lista").textContent = incidente.descripcion_incidente;
            templateItemIncidente.querySelector(".nombre-empresa .detalles-lista").textContent = incidente.razon_social;
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
            // clone.querySelector(".estado-usuario .detalles-lista").innerHTML = `<input class="form-check-input" type="checkbox" value="" id="flexCheckDefault" ${usuario.estado ? "checked" : null} disabled>`;
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

function crearNuevoIncidente(formNuevoIncidente) {

    let nombreIncidente = formNuevoIncidente.querySelector("#tituloNuevoIncidente").value.trim();
    let descripcionIncidente = formNuevoIncidente.querySelector("#descripcionNuevoIncidente").value.trim();
    // let imagenesIncidente = formNuevoIncidente.querySelector("#filesNuevoIncidente").files;

    if (nombreIncidente === "" || descripcionIncidente === "") {
        Swal.fire({
            title: 'El nombre y la descripción son obligatorios para enviar el incidente.',
            position: "center",
            icon: "warning",
            showConfirmButton: true,
        });
        return;
    }

    let nuevoIncidente = {
        titulo: nombreIncidente,
        descripcion_incidente: descripcionIncidente,
        cliente_dni: "72156100",
        ruc_empresa: "12345678901",
        dni_soporte: "87654321",
    };

    socket.emit("/administrador/crearNuevoIncidente", nuevoIncidente, (respuesta) => {
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
        templateModalIncidente.querySelector(".empresa").textContent = incidente.razon_social;
        templateModalIncidente.querySelector(".nombre-incidente").innerHTML = `${incidente.titulo} ${incidente.dni_tecnico ? '<span class="badge bg-warning text-dark">Reasignado</span>' : ''}`;
        templateModalIncidente.querySelector(".detalles").textContent = incidente.descripcion_incidente;

        // Asignar fecha y hora al modal
        templateModalIncidente.querySelector("#fechaIncidente").textContent = fechaFormateada;
        templateModalIncidente.querySelector("#horaIncidente").textContent = horaFormateada;

        templateModalIncidente.querySelector(".estado").textContent = incidente.estado;
        templateModalIncidente.querySelector(".estado").classList.remove('estado-incidente-Resuelto', 'estado-incidente-Pendiente');
        templateModalIncidente.querySelector(".estado").classList.add(`estado-incidente-${incidente.estado}`);

        btnReasignar.classList.remove('d-none', 'd-block')
        btnEnviarRespuestaIncidente.classList.remove('d-none', 'd-block')
        if (incidente.estado === 'Resuelto') {
            btnReasignar.classList.add('d-none');
            btnEnviarRespuestaIncidente.classList.add('d-none');
        } else if (incidente.estado === 'Pendiente') {
            btnReasignar.classList.add('d-block');
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


function validarCampo(input) {
    let isValid = true;
    const feedbackElement = input.nextElementSibling;

    // Remover clases y mensajes anteriores
    input.classList.remove('is-valid', 'is-invalid');


    if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
        feedbackElement.textContent = '';
    }

    // Validaciones específicas por tipo de campo
    switch (input.id) {
        case 'correoNewUser':
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
            if (!isValid) {
                mostrarError(input, 'Ingrese un correo electrónico válido');
            }
            break;
        case 'dniNewUser':
            isValid = input.value.length === 8 && /^\d+$/.test(input.value);
            if (!isValid) {
                mostrarError(input, 'El DNI debe tener 8 dígitos numéricos');
            }
            break;
        case 'telefonoNewUser':
            isValid = input.value.length === 9 && /^\d+$/.test(input.value);
            if (!isValid) {
                mostrarError(input, 'El teléfono debe tener 9 dígitos numéricos');
            }
            break;
        case "nacimientoNewUser":
            isValid = true;
            break;
        default:
            isValid = input.value.trim() !== '';
            if (!isValid) {
                mostrarError(input, 'Este campo es obligatorio');
            }
    }
    // Marcar como válido si pasa todas las validaciones
    if (isValid) {
        input.classList.add('is-valid');
    }

    return isValid;
}

function registrarUsuario(formRegistroUsuario) {
    let correo = formRegistroUsuario.querySelector("#correoNewUser").value;
    let password = formRegistroUsuario.querySelector("#passwordNewUser").value;
    let nombres = formRegistroUsuario.querySelector("#nombreNewUser").value;
    let apellidos = formRegistroUsuario.querySelector("#apellidoNewUser").value;
    let usuario = formRegistroUsuario.querySelector("#userNewUser").value;
    let dni = formRegistroUsuario.querySelector("#dniNewUser").value;
    let telefono = formRegistroUsuario.querySelector("#telefonoNewUser").value;
    let direccion = formRegistroUsuario.querySelector("#direccionNewUser").value;
    let nacimiento = formRegistroUsuario.querySelector("#nacimientoNewUser").value;
    let estado = formRegistroUsuario.querySelector("#estadoNewUser").value;
    let rolSeleccionado = formRegistroUsuario.querySelector('input[name="seleccionRol"]:checked');
    let foto_perfil = '';
    let expresiones = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let correoValidado = expresiones.test(correo);

    if (rolSeleccionado === null) {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Es obligatorio seleccionar un rol para realizar el registro.",
            showConfirmButton: true,
        });
        formRegistroUsuario.querySelector('#divSeleccionRolNewUser').classList.add('is-invalid');
        formRegistroUsuario.querySelector('#divSeleccionRolNewUser p').classList.add('is-invalid');
        return;
    } else {
        formRegistroUsuario.querySelector('#divSeleccionRolNewUser').classList.remove('is-invalid');
        formRegistroUsuario.querySelector('#divSeleccionRolNewUser p').classList.remove('is-invalid');
    }

    if (nombre === "" || correo === "" || usuario === "" || password === "" || dni === "" || telefono === "" || direccion === "" || estado === "") {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Todos los campos son obligatorios para realizar el registro.",
            showConfirmButton: true,
        });
        return;
    }

    if (!correoValidado) {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Es obligatorio ingresar un correo con formato válido para realizar el registro.",
            showConfirmButton: true,
        });
        return;
    }

    if (telefono.length !== 9) {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "El teléfono debe tener 9 dígitos.",
            showConfirmButton: true,
        });
        return;
    }

    if (dni.length !== 8) {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "El DNI debe tener 8 dígitos.",
            showConfirmButton: true,
        });
        return;
    }
    let id_rol;

    if (rolSeleccionado.id === 'rolAdministrador') {
        id_rol = 1;
    } else if (rolSeleccionado.id === 'rolSoporte') {
        id_rol = 2;
    } else if (rolSeleccionado.id === 'rolTecnico') {
        id_rol = 3;
    } else if (rolSeleccionado.id === 'Cliente') {
        id_rol = 4;
    }


    console.log(id_rol);

    let nuevoUsuario = {
        dni,
        id_rol,
        nombres,
        apellidos,
        estado,
        nacimiento,
        usuario,
        password,
        foto_perfil,
        telefono,
        direccion,
        correo,
    };

    // Emisión del evento para registrar el usuario
    socket.emit("/administrador/registrarUsuario", nuevoUsuario, (respuesta) => {
        if (respuesta.success) {

            Swal.fire({
                title: 'Usuario registrado exitosamente!',
                position: "center",
                icon: "success",
                text: "El usuario ha sido registrado exitosamente.",
                showConfirmButton: true,
            });
            limpiarFormulario(formRegistroUsuario);

        } else {
            console.log(respuesta.error)
            Swal.fire({
                title: 'Hubo un problema al registrar el usuario...',
                position: "center",
                icon: "error",
                text: `Inténtalo de nuevo, error: ${respuesta.error}`,
                showConfirmButton: true,
            });
        }
    });


}

function limpiarFormulario(formRegistroUsuario) {

    const inputs = formRegistroUsuario.querySelectorAll('input:not([type="file"]):not(#nacimientoNewUser):not([type="radio"])');

    inputs.forEach(input => {
        input.value = "";
        input.classList.remove('is-valid', 'is-invalid');
    });

    formRegistroUsuario.querySelector('input[name="seleccionRol"]:checked').checked = false;
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

function guardarCambios(btnGuardarCambios, formConfiguracionUsuario) {
    if (!btnGuardarCambios.disabled) {
        actualizarDatosUsuario(formConfiguracionUsuario);

    }
}

// Deshabilitar la edición y ocultar botones Guardar y Cancelar del Modal para actualizar datos del usuario
function deshabilitarEdicion(formConfiguracionUsuario) {
    formConfiguracionUsuario.querySelectorAll('input').forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
        input.disabled = true;
    });
    document.getElementById('cancelButton').classList.add('d-none');
    document.getElementById('saveButton').classList.add('d-none');
    document.getElementById('editButton').classList.remove('d-none');
}

function actualizarDatosUsuario(form) {

    let nombre = form.querySelector("#nombreUsuario").value;
    let correo = form.querySelector("#correoUsuario").value;
    let usuario = form.querySelector("#userUsuario").value;
    let dni = form.querySelector("#dniUsuario").value;
    let telefono = form.querySelector("#telefonoUsuario").value;
    let direccion = form.querySelector("#direccionUsuario").value;
    let nacimiento = form.querySelector("#nacimientoUsuario").value;
    let estado = form.querySelector("#estadoUsuario").value;
    //let imagenPerfil = formRegistroUsuario.querySelector('#addImg').files[0]; // Capturamos el archivo de imagen
    let expresiones = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let valido = expresiones.test(correo);

    if (nombre !== "" && correo !== "" && usuario !== "" && dni !== "" && telefono !== "" && direccion !== "" && estado !== "") {
        if (valido === true) {
            if (telefono.length == 9) {
                if (dni.length == 8) {
                    let usuarioActualizado = {
                        rolSeleccionado,
                        nombre,
                        correo,
                        usuario,
                        dni,
                        telefono,
                        direccion,
                        nacimiento,
                        estado,
                    }
                    //? Implementación de la imagen perfil (pendiente)
                    // if (imagenPerfil) {
                    //     nuevoUsuario.append(imagenPerfil);
                    // }

                    // socket.emit('/administrador/registrarUsuario', nuevoUsuario);
                    showConfirmModal('Confirmar cambios', '¿Estás seguro de que deseas guardar los cambios?', 'Guardar cambios', function () {
                        console.log('Cambios guardados con éxito');
                        deshabilitarEdicion(formConfiguracionUsuario);

                    });

                }
                else {
                    mostrarError(form.querySelector('#dniUsuario'), "El DNI debe tener 8 dígitos");
                }
            }
            else {
                mostrarError(form.querySelector('#telefonoUsuario'), "El teléfono debe tener 9 dígitos");
            }
        }
        else {
            mostrarError(form.querySelector('#correoUsuario'), 'Ingrese un correo electrónico válido');
        }
    }
    else {
        form.querySelectorAll('input:not(#fecha-ingreso):not([type="file"]):not(#nacimiento):not([type="radio"])').forEach(input => {
            validarCampoConfiguracion(input)
        });
    }

}

/**
 * Función para mostrar el modal de confirmación dinámico.
 * @param {String} title - El título del modal.
 * @param {String} message - El mensaje del modal.
 * @param {String} confirmButtonText - El texto del botón de confirmación.
 * @param {Function} actionCallback - La función a ejecutar si se confirma.
 */
function showConfirmModal(title, message, confirmButtonText, actionCallback) {
    // Establecer el contenido dinámico
    document.getElementById('dynamicConfirmLabel').textContent = title;
    document.getElementById('dynamicConfirmBody').textContent = message;
    const confirmButton = document.getElementById('confirmDynamicBtn');
    confirmButton.textContent = confirmButtonText;

    // Asignar la función de confirmación al botón
    confirmAction = actionCallback;

    // Mostrar el modal
    const dynamicConfirmModal = new bootstrap.Modal(document.getElementById('dynamicConfirmModal'));
    dynamicConfirmModal.show();

    // Escuchar el clic en el botón de "Confirmar" dentro del modal
    document.getElementById('confirmDynamicBtn').addEventListener('click', function () {
        if (confirmAction) {
            confirmAction(); // Ejecutar la función de confirmación
            confirmAction = null; // Restablecer la función de confirmación
        }
        const dynamicConfirmModal = bootstrap.Modal.getInstance(document.getElementById('dynamicConfirmModal'));
        dynamicConfirmModal.hide(); // Cerrar el modal
    });
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
btnRegistrarUsuario.addEventListener('click', () => registrarUsuario(formRegistroUsuario));
btnCancelarRegistro.addEventListener('click', () => limpiarFormulario(formRegistroUsuario));
btnCrearNuevoIncidente.addEventListener('click', () => crearNuevoIncidente(formNuevoIncidente));

radiosRol.forEach(radio => {
    radio.addEventListener('change', () => {
        // Remover la clase is-invalid del divSeleccionRol si se selecciona algún rol
        const divSeleccionRol = document.getElementById('divSeleccionRolNewUser');
        const parrafoSeleccionRol = divSeleccionRol.querySelector('p');
        parrafoSeleccionRol.classList.remove('is-invalid');
        divSeleccionRol.classList.remove('is-invalid');
        divSeleccionRol.classList.remove('is-invalid');
    });
});

btnReasignar.addEventListener('click', function () {
    // Obtener los datos del modal de incidente
    const numeroIncidente = document.querySelector('#modalIncidente .numero-incidente').innerText;
    const empresa = document.querySelector('#modalIncidente .empresa').innerText;
    const nombreIncidente = document.querySelector('#modalIncidente .nombre-incidente').innerText;
    const detallesIncidente = document.querySelector('#modalIncidente .detalles').innerText;

    // Pasar los datos al modal de reasignación
    document.querySelector('#modalReasignar .numero-incidente').innerText = numeroIncidente;
    document.querySelector('#modalReasignar .empresa').innerText = empresa;
    document.querySelector('#modalReasignar .nombre-incidente').innerText = nombreIncidente;
    document.querySelector('#modalReasignar .detalles').innerText = detallesIncidente;

    // Cerrar el modal principal y abrir el de reasignación
    modalIncidente.hide();
    modalReasignar.show();
    console.log(incidenteSeleccionado)
});

botonesCancelarReasignar.forEach(boton => {
    boton.addEventListener('click', function () {
        // Cerrar el submodal y volver a abrir el modal principal
        modalReasignar.hide();
        modalIncidente.show();
    });
});

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

botonesCerrarUsuario.forEach(boton => {
    boton.addEventListener('click', function () {
        modalUsuario.hide();
    });
}
)

// Agregar validación en tiempo real a todos los campos excepto radio buttons y fecha de nacimiento
formRegistroUsuario.querySelectorAll('input:not([type="file"]):not(#nacimientoNewUser):not([type="radio"])').forEach(input => {
    if (input.id === 'nacimientoNewUser') {
        console.log('nacimiento');
    }
    input.addEventListener('input', () => {
        validarCampo(input);
    });
});


