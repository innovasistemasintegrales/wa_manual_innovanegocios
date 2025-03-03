// administrador.js

// Crear la conexión al socket de administrador
function socketAdminConnect() {
    // Crear la conexión al namespace '/administrador'
    const socket = io('/administrador', {
        withCredentials: true, // Enviar cookies automáticamente
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
        console.log('Conectado al namespace /administrador');
    });

    return socket; // Devolver el socket
};

// Iniciar la conexión del socket creado
const socket = socketAdminConnect();
// Creación de fragmento para optimizar manipulaciones del DOM
const fragmento = document.createDocumentFragment()
// Capturar referencia al contenedor principal de renderizado
let cardReactivo = document.querySelector('#cardReactivo');

//TODO ================== Referencia a TEMPLATES ==================

//? Capturamos los template de las SECCIONES
const templateInicio = document.querySelector('#cardReactivo').content;
const templatePreguntasFrecuentes = document.querySelector('#templatePreguntasFrecuentes').content;
const templateManuales = document.querySelector('#templateManuales').content;
const templateValoracion = document.querySelector('#templateValoracion').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;
const templateUsuarios = document.querySelector('#templateUsuarios').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;
const templateReportes = document.querySelector('#templateReportes').content;

//? Capturamos los templates para los LISTADOS
const templateItemUsuario = templateUsuarios.querySelector('#templateItemUsuario').content;
const templateItemIncidente = templateIncidentes.querySelector('#templateItemIncidente').content;
const templateItemPreguntaFrecuente = templatePreguntasFrecuentes.querySelector('#templateItemPreguntaFrecuente').content;
const templateItemTituloManual = templateManuales.querySelector('#templateItemTituloManual').content;
const templateItemSubtituloManual = templateItemTituloManual.querySelector('#templateItemSubtituloManual').content;
const templateItemContenidoManual = templateManuales.querySelector('#templateItemContenidoManual').content;

//? Capturamos los templates para los MODALES
const templateModalUsuario = document.querySelector('#templateModalUsuario').content;
const templateModalIncidentePendiente = document.querySelector('#templateModalIncidentePendiente').content;
const templateModalIncidenteResuelto = document.querySelector('#templateModalIncidenteResuelto').content;
const templateModalNuevoIncidente = document.querySelector('#templateModalNuevoIncidente').content;

//TODO ================== Referencia a ELEMENTOS ==================
let btnAsesoriaSubmenu = document.querySelector('#btnAsesoriaSubmenu');
let btnMenuPreguntasFrecuentes = document.querySelector('#btnMenuPreguntasFrecuentes');
let btnMenuManuales = document.querySelector('#btnMenuManuales');
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');
let btnMenuValoracion = document.querySelector('#btnMenuValoracion');
let btnMenuUsuarios = document.querySelector('#btnMenuUsuarios');
let btnMenuIncidentes = document.querySelector('#btnMenuIncidentes');
let btnMenuReportes = document.querySelector('#btnMenuReportes');
let btnMenuInicio = document.querySelector('#btnMenuInicio');
let btnMenuCerrar = document.querySelector('#btnMenuCerrar');

let btnSelectEstadosUsuario; // Boton para FILTRAR POR ESTADOS de usuario
let btnSelectRolUsuario; // Boton para FILTRAR POR ROLES de usuario

// Capturamos y creamos los modales para su manipulación 
const modalIncidentePendiente = new bootstrap.Modal(document.getElementById('modalIncidentePendiente'));
const modalIncidenteResuelto = new bootstrap.Modal(document.getElementById('modalIncidenteResuelto'));
const modalNuevoIncidente = new bootstrap.Modal(document.getElementById('modalNuevoIncidente'));
const modalReasignar = new bootstrap.Modal(document.getElementById('modalReasignar'));
const modalUsuario = new bootstrap.Modal(document.getElementById('modalUsuario'));
// Capturamos los Formularios
const formRegistroUsuario = document.getElementById('modalRegistrarUsuario');
const formNuevoIncidente = document.getElementById('modalNuevoIncidente');
// radios para la selección de roles en el formulario de Regisotr de Usuarios
const radiosRol = formRegistroUsuario.querySelectorAll('input[name="seleccionRol"]');
// Contenedores para la inserción de Datos
let contenedorUsuarios;
let contenedorModalUsuario;
let contenedorIncidentes;
let contenedorModalIncidentePendiente;
let contenedorModalIncidenteResuelto;
let contenedorModalNuevoIncidente;
let contenedorPreguntasFrecuentes;
let contenedorTitulosManuales;
let contenedorGestorManuales;
let contenedorContenidoManuales;

//TODO ======================== VARIABLES GLOBALES ========================
let listadoGeneralUsuarios = []; // Listado de usuarios
let listadoPreguntasFrecuentes = []; // Listado de preguntas frecuentes
let listadoMenusManuales = []; // Listado de manuales
let listadoGeneralValoraciones = []; // Listado de valoraciones
let listadoGeneralReportes = []; // Listado de reportes
let listadoGeneralIncidentes = []; // Listado de incidentes
let perfilUsuario; // Objeto para guardar el perfil del usuario actual
let limiteIncidentes = localStorage.getItem('limiteIncidentes') || 1000;
let paginaActualIncidentes = 1; // Página inicial
let hayMasIncidentes = true; // Indicador para saber si hay más incidentes
let seleccionEstadoIncidente = localStorage.getItem('seleccionEstadoIncidente') || 'Todos'; // Variable para guardar la selección de filtrado por estado de incidente
let ultimaSeccion = localStorage.getItem('ultimaSeccion') || 'Inicio';
let seccionActual = 'Inicio';
let subtituloActual;
let incidenteSeleccionado; // Objeto para guardar el incidente seleccionado
let usuarioSeleccionado; // Objeto para guardar el usuario seleccionado
let eliminarPDF = false; // Variables para gestionar la eliminación de PDFs


//TODO MARK: ESCUCHA DE EVENTOS PARA SINCRONIZACIÓN DE DATOS EN TIEMPO REAL

//? SINCRONIZACIÓN USUARIOS
socket.on('/administrador/nuevoUsuario', function (data) {
    console.log('Nuevo Usuario recibido:', data);

    // Si hay usuarios en la lista, añadir al principio
    if (Object.keys(listadoGeneralUsuarios).length > 0) {
        listadoGeneralUsuarios.unshift(data);

        //! Si se encuentra en la sección Usuario actualizar la lista de manera NO BLOQUEANTE
        if (seccionActual === 'Usuarios') {
            listarUsuarios();
        }
    }

    // Mostrar un toast o notificación no invasiva
    mostrarNotificacion(
        'Nuevo Usuario',
        `Se ha registrado a un nuevo usuario: <strong>${data.nombres} ${data.apellidos}</strong>`,
        'usuario',
        7000
    );

});
socket.on('/administrador/inactivacionUsuario', function (data) {
    console.log(`Usuario Inactivado recibido: ${data.nombres} ${data.apellidos} con DNI: ${data.dni}`)

    if (Object.keys(listadoGeneralUsuarios).length > 0) {
        listadoGeneralUsuarios.forEach(function (element, index) {
            if (element.dni === data.dni) {
                listadoGeneralUsuarios[index].estado = data.estado;
            }

            //! Si se encuentra en la sección Usuario actualizar la lista de manera NO BLOQUEANTE
            if (seccionActual === 'Usuarios') {
                listarUsuarios();
            }
        });
    }

    // Mostrar un toast o notificación no invasiva
    mostrarNotificacion(
        'Usuario Inactivado',
        `Se ha inactivo al usuario <strong>${data.nombres} ${data.apellidos}</strong>`,
        'info',
        7000
    );
});
socket.on('/administrador/edicionUsuario', function (data) {
    console.log('Usuario Editado recibido:', data);

    // Si hay registros en la lista actualizar el registro editado
    if (Object.keys(listadoGeneralUsuarios).length > 0) {
        listadoGeneralUsuarios.forEach(function (element, index) {
            if (element.id === data.dni) {
                listadoGeneralUsuarios[index] = data;
            }

            //! Si se encuentra en la sección Usuario actualizar la lista de manera NO BLOQUEANTE
            if (seccionActual === 'Usuarios') {
                listarUsuarios();
            }
        });
    }

    // Mostrar un toast o notificación no invasiva
    mostrarNotificacion(
        'Usuario Editado',
        `Se han editado los tados de un usuario: <strong>${data.nombres} ${data.apellidos}</strong>`,
        'info',
        7000
    );
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

//? SINCRONIZACIÓN PREGUNTAS FRECUENTES
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
        if (seccionActual === 'PreguntasFrecuentes') {
            // Añadir la nueva pregunta al DOM
            agregarPreguntaFrecuenteDOM(data);
        }
    }
    // Mostrar un toast o notificación no invasiva
    mostrarNotificacion(
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
            if (seccionActual === 'PreguntasFrecuentes') {

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
    mostrarNotificacion(
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
            if (seccionActual === 'PreguntasFrecuentes') {

                // Eliminar directamente del DOM
                const item = contenedorPreguntasFrecuentes.querySelector(`.accordion-item[data-id="${data.id_pfrecuente}"]`);
                if (item) {
                    item.remove();
                }
            }
        }
    }

    // Mostrar un toast o notificación no invasiva
    mostrarNotificacion(
        'Una Pregunta Frecuente se ha ELIMINADO',
        `Se ha eliminado la pregunta frecuente: <strong>${data.pregunta}</strong>.`,
        'info',
        7000
    );
});

//? SINCRONIZACIÓN MANUALES
socket.on('/administrador/nuevoTituloManual', function (data) {
    console.log('Nuevo título de manual recibido:', data);

    // Si hay registros en el listado de Manuales actualizarlo con el nuevo registro
    if (Object.keys(listadoMenusManuales).length > 0) {
        listadoMenusManuales.push({
            id_menu: data.id_menu,
            titulo: data.titulo,
        });

        // Si la sección actual es "Asesoria" y está en la sección Manuales, agregar el nuevo manual al DOM
        if (seccionActual === 'Manuales') {
            // Añadir el nuevo manual al DOM
            agregarTituloDOM(data);
        }
    }

    // Mostrar un toast o notificación no invasiva
    mostrarNotificacion(
        'Un nuevo Titulo de Manual se AGREGÓ',
        `Se ha agregado el título: <strong>${data.titulo}</strong>.`,
        'info',
        7000
    );
});
function agregarTituloDOM(data) {
    // Configurar el contenido del template con los datos del manual
    templateItemTituloManual.querySelector('.accordion-item').dataset.id = data.id_menu;
    templateItemTituloManual.querySelector('.accordion-button').setAttribute('data-bs-target', `#collapse${data.id_menu}`);
    templateItemTituloManual.querySelector('.accordion-collapse').id = `collapse${data.id_menu}`;
    templateItemTituloManual.querySelector('.manual-title').textContent = data.titulo;


    const clone = templateItemTituloManual.cloneNode(true);
    // Añadir el nuevo item al principio del contenedor
    contenedorTitulosManuales.appendChild(clone);
}
socket.on('/administrador/edicionTituloManual', function (data) {
    console.log('Edición de título de manual recibida:', data);

    // Si hay registros en el listado de Manuales actualizar el registro editado
    if (Object.keys(listadoMenusManuales).length > 0) {

        const index = listadoMenusManuales.findIndex(m => m.id_menu == data.id_menu);

        if (index !== -1) {
            // Actualizar el nombre del titulo en el listado local
            listadoMenusManuales[index].titulo = data.titulo;

            // Si se encuentra en la sección de Asesoría y en el listado de Manuales actualizar el registro editado
            if (seccionActual === 'Manuales') {
                // Actualizar directamente en el DOM
                const item = contenedorTitulosManuales.querySelector(`.accordion-item[data-id="${data.id_menu}"]`);
                if (item) {
                    item.querySelector('.manual-title').textContent = data.titulo;
                }
            }
        }
    }

    mostrarNotificacion(
        'Un Manual se ha EDITADO',
        `Se ha editado el manual: <strong>${data.titulo}</strong>.`,
        'info',
        7000
    );

    // Imprimir el listado de manuales
    console.log('Listado de manuales actualizado:', listadoMenusManuales);
});
socket.on('/administrador/eliminacionTituloManual', function (data) {
    console.log('Eliminación de título de manual recibida:', data);

    // Si hay registros en el listado de Manuales actualizarlos
    if (Object.keys(listadoMenusManuales).length > 0) {
        const index = listadoMenusManuales.findIndex(m => m.id_menu == data.id_menu);
        if (index !== -1) {
            // Eliminar del listado local
            listadoMenusManuales.splice(index, 1);

            // Si se encuentra en la sección de Asesoría y en el listado de Manuales eliminar el registro
            if (seccionActual === 'Manuales') {
                // Eliminar directamente del DOM
                const item = contenedorTitulosManuales.querySelector(`.accordion-item[data-id="${data.id_menu}"]`);
                if (item) {
                    item.remove();
                }
            }
        }
    }

    // Mostrar un toast o notificación no invasiva
    mostrarNotificacion(
        'Un Manual se ha ELIMINADO',
        `Se ha eliminado el manual: <strong>${data.titulo}</strong>.`,
        'info',
        7000
    );
});
socket.on('/administrador/nuevoSubtituloManual', function (data) {
    console.log('Nuevo subtítulo de manual recibido:', data);

    // Find the manual in listadoManuales that matches data.id_menu
    const menuIndex = listadoMenusManuales.findIndex(menu => menu.id_menu == data.id_menu);
    if (menuIndex !== -1) {
        // Check if manuales array exists, if not, initialize it
        if (!listadoMenusManuales[menuIndex].manuales) {
            listadoMenusManuales[menuIndex].manuales = [];
        }
        // Push the new subtitle into manuales
        listadoMenusManuales[menuIndex].manuales.push(data);
    } else {
        // Si el menu no está en la lista, añadirlo junto con el nuevo subtítulo
        listadoMenusManuales.push({
            id_menu: data.id_menu,
            titulo: 'Sin nombre', // Title might be empty or need to be fetched
            manuales: [data]
        });
    }

    // If current section is 'Asesoria' and sub-section is 'Manual', update the DOM
    if (seccionActual === 'Manuales') {
        // Find the accordion item that corresponds to data.id_menu
        const accordionItem = contenedorTitulosManuales.querySelector(`.accordion-item[data-id="${data.id_menu}"]`);
        if (accordionItem) {
            // Find the contenedorSubtitulos within this accordion item
            const contenedorSubtitulos = accordionItem.querySelector('#contenedorSubtitulos');

            const template = templateItemSubtituloManual.cloneNode(true);

            // Clone the templateItemSubtituloManual and fill in the data
            template.querySelector('.btn-group').dataset.id = data.id_manual;
            template.querySelector('label').textContent = data.subtitulo;
            template.querySelector('input').id = `manual-${data.id_manual}`;
            template.querySelector('label').setAttribute('for', `manual-${data.id_manual}`);
            // Append to contenedorSubtitulos
            contenedorSubtitulos.appendChild(template);
        }
    }

    // Show a toast notification
    mostrarNotificacion(
        'Un nuevo Subtítulo de Manual se AGREGÓ',
        `Se ha agregado el subtítulo: <strong>${data.subtitulo}</strong>.`,
        'info',
        7000
    );
});
socket.on('/administrador/eliminarSubtituloManual', function (data) {
    console.log('Eliminación de subtítulo de manual recibida:', data);
    let tituloManualSubtituloEliminado;

    if (Object.keys(listadoMenusManuales).length > 0) {

        let idManualSubtituloEliminado;


        // Find the id_manual in listadoManuales and remove it
        for (let i = 0; i < listadoMenusManuales.length; i++) {
            if (listadoMenusManuales[i].manuales) {
                const index = listadoMenusManuales[i].manuales.findIndex(contenido => contenido.id_manual == data.id_manual);
                if (index !== -1) {
                    listadoMenusManuales[i].manuales.splice(index, 1);
                    idManualSubtituloEliminado = listadoMenusManuales[i].id_menu;
                    tituloManualSubtituloEliminado = listadoMenusManuales[i].titulo;
                }
            }
        }

        // If current section is 'Asesoria' and sub-section is 'Manual', update the DOM
        if (seccionActual === 'Manuales') {
            // Find the accordion item that corresponds to data.id_menu
            const accordionItem = contenedorTitulosManuales.querySelector(`.accordion-item[data-id="${idManualSubtituloEliminado}"]`);
            if (accordionItem) {
                // Find the contenedorSubtitulos within this accordion item
                const contenedorSubtitulos = accordionItem.querySelector('#contenedorSubtitulos');
                // Find the item that corresponds to data.id_manual
                const item = contenedorSubtitulos.querySelector(`.btn-group[data-id="${data.id_manual}"]`);
                if (item) {
                    item.remove();
                }
            }
        }
    }

    // Show a toast notification
    mostrarNotificacion(
        'Un Subtítulo de Manual se ha ELIMINADO',
        `Se ha eliminado el subtítulo: <strong>${data.subtitulo}</strong>, del manual: <strong>${tituloManualSubtituloEliminado}</strong>.`,
        'info',
        7000,
    );
});
socket.on('/administrador/edicionContenidoManual', function (data) {
    console.log(`Edición de subtítulo manual recibida por el administrador: ${data}`);

    // Asegurarse de que listadoManuales no esté vacío
    if (Object.keys(listadoMenusManuales).length > 0) {
        let menuIndex = -1;
        let manualIndex = -1;

        // Buscar en el manual el subtítulo editado
        for (let i = 0; i < listadoMenusManuales.length; i++) {
            const menu = listadoMenusManuales[i];
            const contenidoManual = menu.manuales.find(c => c.id_manual == data.id_manual);
            if (contenidoManual) {
                menuIndex = i;
                // Actualizamos el contenido del subtítulo
                manualIndex = menu.manuales.findIndex(c => c.id_manual == data.id_manual);
                break;
            }
        }

        if (menuIndex !== -1 && manualIndex !== -1) {

            // Update the subtitle data in listadoManuales
            listadoMenusManuales[menuIndex].manuales[manualIndex] = data;

            // Check if the current displayed content matches the edited subtitle
            if (seccionActual === 'Manuales') {

                // Actualizar el subtítulo directamente en el DOM
                const item = contenedorTitulosManuales.querySelector(`.accordion-item .btn-group[data-id="${data.id_manual}"]`);
                if (item) {
                    item.querySelector('label').textContent = data.subtitulo;
                }

                if (subtituloActual == data.id_manual) {
                    mostrarContenidoSubtitulo(data.id_manual);
                }
            }
        }
        console.log(`- Listado de Manuales actualizado: ${listadoMenusManuales}`);
    }

    // Show a toast notification
    mostrarNotificacion(
        'Un Subtítulo de Manual se ha EDITADO',
        `Se ha editado el subtítulo: <strong>${data.subtitulo}</strong>.`,
        'info',
        7000
    );
});

//? SINCRONIZACIÒN INCIDENTES
socket.on('/administrador/nuevoIncidente', function (data) {
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
socket.on('/administrador/actualizacionIncidente', function (data) {
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
socket.on('/administrador/anulacionIncidente', function (data) {
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
// Lanzamiento de vista de Usuarios
btnMenuUsuarios.addEventListener('click', function () {
    localStorage.setItem('ultimaSeccion', 'Usuarios');
    seccionActual = 'Usuarios';

    cardReactivo.innerHTML = "";
    const clone = templateUsuarios.cloneNode(true);
    fragmento.appendChild(clone);
    cardReactivo.appendChild(fragmento);

    btnSelectEstadosUsuario = document.querySelector('.btn-select-estados-usuario');
    btnSelectRolUsuario = document.querySelector('.btn-select-rol-usuario');
    contenedorUsuarios = document.querySelector('#contenedorUsuarios');

    consultarUsuarios()
        .then(() => listarUsuarios())
        .catch(error => console.log(error));

});
// Lanzamiento de vista de Prguntas Frecuentes
btnMenuPreguntasFrecuentes.addEventListener('click', function () {
    localStorage.setItem('ultimaSeccion', 'PreguntasFrecuentes');
    seccionActual = 'PreguntasFrecuentes';
    cardReactivo.innerHTML = "";
    const clone = templatePreguntasFrecuentes.cloneNode(true);
    cardReactivo.appendChild(clone);

    contenedorPreguntasFrecuentes = document.querySelector('#contenedorPreguntasFrecuentes');

    consultarPreguntasFrecuentes()
        .then(() => listarPreguntasFrecuentes())
        .catch((error) => console.log(error));

});
// Lanzamiento de vista de Manuales
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
// Lanzamiento de la vista de Incidentes
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
// Lanzamiento de la vista de Valoración
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
// Lanzamiento de la vista de Configuración
btnMenuConfiguracion.addEventListener('click', async function () {
    localStorage.setItem('ultimaSeccion', 'Configuracion');
    seccionActual = 'Configuracion';
    cardReactivo.innerHTML = "";

    perfilUsuario = await miInfoUsuario(); // consultar info del usuario

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
    const btnEditarUsuario = formConfiguracionUsuario.querySelector('#btnEditarPerfil');
    const btnCancelarEdicion = formConfiguracionUsuario.querySelector('#btnCancelarEditarPerfil');
    const btnGuardarCambios = formConfiguracionUsuario.querySelector('#btnGuardarCambiosPerfil');

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
// Lanzamiento de la vista de Reportes
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
        // TODO: Botones de USUARIO
        case e.target.classList.contains("op-usuario-administrador"):
            actualizarBotonRolUsuario("Solo Administradores", "btn-danger");
            break;
        case e.target.classList.contains("op-usuario-tecnico"):
            actualizarBotonRolUsuario("Solo Técnicos", "btn-primary");
            break;
        case e.target.classList.contains("op-usuario-soporte"):
            actualizarBotonRolUsuario("Solo Soporte", "btn-success");
            break;
        case e.target.classList.contains("op-usuario-cliente"):
            actualizarBotonRolUsuario("Solo Clientes", "btn-dark");
            break;
        case e.target.classList.contains("op-usuario-todos"):
            actualizarBotonRolUsuario("Tipo de Rol", null);
            break;
        // Botones de ESTADOS DE USUARIO
        case e.target.classList.contains("op-activos-usuario"):
            actualizarBotonEstadoUsuario("Solo Activos", "btn-success");
            break;
        case e.target.classList.contains("op-inactivos-usuario"):
            actualizarBotonEstadoUsuario("Solo Inactivos", "btn-danger");
            break;
        case e.target.classList.contains("op-todos-usuario"):
            actualizarBotonEstadoUsuario("Estado Usuario", "btn-dark");
            break;
        // Otras acciones de usuario
        case e.target.classList.contains("btn-abrir-usuario"):
            abrirUsuario(e.target.dataset.id);
            break;
        case e.target.id === "btnRegistrarUsuario":
            registrarUsuario(formRegistroUsuario);
            break;
        case e.target.id === "btnCancelarRegistro":
            limpiarFormulario(formRegistroUsuario);
            break;
        case e.target.id === "btnCerrarUsuario":
            modalUsuario.hide();
            break;
        case e.target.id === "btnInactivarUsuario":
            inactivarUsuario();
            break;
        //! FALTA LA IMPLEMENTACIÓN PARA ACTIVAR USUARIOS INACTIVADOS
        case e.target.id === "btnActivarUsuario":
            activarUsuario();
            break;

        // TODO: Botones de PREGUNTAS FRECUENTES
        case e.target.id === "addFaqBtn":
            agregarPreguntaFrecuente();
            break;
        case e.target.classList.contains("save-btn"):
            guardarPreguntaFrecuente(e.target.closest(".accordion-item").dataset.id);
            break;
        case e.target.classList.contains("edit-btn"):
            editarPreguntaFrecuente(e.target.closest(".accordion-item").dataset.id);
            break;
        case e.target.classList.contains("delete-btn"):
            eliminarPreguntaFrecuente(e.target.closest(".accordion-item").dataset.id);
            break;
        case e.target.classList.contains("cancel-btn"):
            cancelarPreguntaFrecuente(e.target.closest(".accordion-item").dataset.id);
            break;
        case e.target.classList.contains("cancel-edit-btn"):
            cancelarEditarPreguntaFrecuente();
            break;

        // TODO: Botones de MANUALES
        case e.target.classList.contains("btn-agregar-titulo"):
            agregarTituloManual();
            break;
        case e.target.classList.contains("btn-eliminar-titulo"):
            let id_eliminar = e.target.closest('.accordion-item').dataset.id;
            let titulo = e.target.closest('.accordion-item').querySelector('.manual-title').textContent;
            eliminarTituloManual(id_eliminar, titulo);
            break;
        case e.target.classList.contains("btn-editar-titulo"):
            let id_editar = e.target.closest('.accordion-item').dataset.id;
            editarTitulo(id_editar);
            break;
        case e.target.classList.contains("btn-mostrar-contenido-subtitulo"):
            let idSubtitulo_mostrar = e.target.closest('.btn-group').dataset.id;
            mostrarContenidoSubtitulo(idSubtitulo_mostrar);
            break;
        case e.target.classList.contains("btn-agregar-subtitulo"):
            let idTitulo = e.target.closest('.accordion-item').dataset.id;
            agregarSubtituloManual(idTitulo);
            break;
        case e.target.classList.contains("btn-agregar-titulo"):
            agregarTituloManual();
            break;
        case e.target.classList.contains("btn-eliminar-subtitulo"):
            let accionesDiv = e.target.closest('.acciones-contenido-manual');
            let idSubtitulo_eliminar = accionesDiv.dataset.id;
            eliminarSubtituloManual(idSubtitulo_eliminar);
            break;
        case e.target.classList.contains("btn-editar-subtitulo"):
            let idSubtitulo_editar = e.target.closest('.acciones-contenido-manual').dataset.id;
            editarSubtituloManual(idSubtitulo_editar);
            break;
        case e.target.classList.contains("btn-guardar-subtitulo"):
            let idSubtitulo_guardar = e.target.closest('.acciones-contenido-manual').dataset.id;
            guardarEditarContenidoSubtituloManual(idSubtitulo_guardar, eliminarPDF);
            break;
        case e.target.classList.contains("delete-pdf-btn"):
            const contenedorContenidoManual = e.target.closest('.manual-contenido');
            contenedorContenidoManual.querySelector('.pdf-link').classList.add('d-none');
            eliminarPDF = true;
            break;
        case e.target.classList.contains("btn-cancelar-editar-subtitulo"):
            let idSubtitulo_cancelar = e.target.closest('.acciones-contenido-manual').dataset.id;
            mostrarContenidoSubtitulo(idSubtitulo_cancelar);
            eliminarPDF = false;
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
function actualizarBotonRolUsuario(texto, clase) {
    btnSelectRolUsuario.textContent = texto;
    btnSelectRolUsuario.className = "btn dropdown-toggle btn-select-rol-usuario " + (clase ? clase : "btn-dark");
    listarUsuarios();
}
function actualizarBotonEstadoUsuario(texto, clase) {
    btnSelectEstadosUsuario.textContent = texto;
    btnSelectEstadosUsuario.className = "btn dropdown-toggle btn-select-estados-usuario " + (clase ? clase : "btn-dark");
    listarUsuarios();
}
function actualizarEstadoIncidente(estado) {
    seleccionEstadoIncidente = estado;
    localStorage.setItem("seleccionEstadoIncidente", estado);
    listarIncidentes(paginaActualIncidentes, limiteIncidentes);
}
document.addEventListener('change', e => {
    // Si se cambia o agrega otro archivo PDF en algún manual, se oculta el botón para ver y eliminar el PDF anterior
    if (e.target.id === "pdf-manual") {
        const btnVerPDF = document.querySelector(".input-group .pdf-link");
        const btnEliminarPDF = document.querySelector(".input-group .delete-pdf-btn");

        // Ocultar el botón para ver el PDF
        btnVerPDF.classList.add("d-none");
        btnEliminarPDF.classList.add("d-none");

        eliminarPDF = true;
    }
})
document.addEventListener('input', e => {
    // Cuando el usuario escribe algo en el campo de búsqueda
    if (e.target.id === "buscadorUsuarios") {
        listarUsuarios();
    }
})

//TODO  ======================== MARK: FUNCIONES ========================

//? FUNCIONES DE SECCIÓN "USUARIOS"
function consultarUsuarios() {
    return new Promise((resolve, reject) => {
        if (Object.keys(listadoGeneralUsuarios).length > 0) {
            console.log("No se consultaron los usuarios porque ya se cargaron");
            resolve();
        } else {
            socket.emit("/administrador/listadoGeneralUsuarios", {}, (respuesta) => {
                if (respuesta.success) {

                    console.log("Se consultaron los usuarios: ", respuesta.data);
                    listadoGeneralUsuarios = respuesta.data;
                    resolve();

                } else {
                    console.log(respuesta.error)
                    reject(respuesta.error);
                }
            });
        }
    });
}
function listarUsuarios() {

    let usuariosFiltrados = 0;
    let agregarPorNombreDNIcorreo = false;
    let agregarPorEstado = false;
    let agregarPorRol = false;

    let buscarPorEstado = btnSelectEstadosUsuario.textContent;
    let buscadorPorRol = btnSelectRolUsuario.textContent;
    let contenidoBuscadorUsuario = document.querySelector("#buscadorUsuarios").value;

    contenedorUsuarios.innerHTML = "";

    listadoGeneralUsuarios.forEach(usuario => {

        let nombreUsuario = usuario.nombres + " " + usuario.apellidos;

        if (contenidoBuscadorUsuario == "") {
            agregarPorNombreDNIcorreo = true;
        } else {
            agregarPorNombreDNIcorreo = nombreUsuario.toUpperCase().includes(contenidoBuscadorUsuario.toUpperCase())
                || usuario.correo.toUpperCase().includes(contenidoBuscadorUsuario.toUpperCase())
                || usuario.dni.toUpperCase().includes(contenidoBuscadorUsuario.toUpperCase());
        }
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
                agregarPorRol = usuario.id_rol == 3;
            } else if (buscadorPorRol == "Solo Soporte") {
                agregarPorRol = usuario.id_rol == 2;
            } else if (buscadorPorRol == "Solo Clientes") {
                agregarPorRol = usuario.id_rol == 4;
            } else { agregarPorRol = false; }
        }

        if (agregarPorNombreDNIcorreo == true && agregarPorRol == true && agregarPorEstado == true) {

            templateItemUsuario.querySelector(".dni-usuario .detalles-lista").textContent = usuario.dni;
            const rolClase = usuario.id_rol === 1 ? 'danger' :
                usuario.id_rol === 2 ? 'success' :
                    usuario.id_rol === 3 ? 'primary' :
                        usuario.id_rol === 4 ? 'black' : '';

            const rolTexto = usuario.id_rol === 1 ? 'Administrador' :
                usuario.id_rol === 2 ? 'Soporte' :
                    usuario.id_rol === 3 ? 'Técnico' :
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
function abrirUsuario(id) {

    // Buscamos al usuario en el listado de usuarios
    let usuario = listadoGeneralUsuarios.find(usuario => usuario.dni === id);
    console.log("Usuario seleccionado: ", usuario);
    usuarioSeleccionado = {
        dni: usuario.dni,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos
    };

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
    if (usuario.id_rol == 2) { templateModalUsuario.querySelector('#rolSoporteUpdate').checked = true; }
    if (usuario.id_rol == 3) { templateModalUsuario.querySelector('#rolTecnicoUpdate').checked = true; }
    if (usuario.id_rol == 4) { templateModalUsuario.querySelector('#rolClienteUpdate').checked = true; }
    // templateModalUsuario.querySelector('#estadoUpdateUser').value = usuario.estado;

    contenedorModalUsuario = document.querySelector('.contenedorModalUsuario');
    contenedorModalUsuario.innerHTML = "";
    let clone = templateModalUsuario.cloneNode(true);
    contenedorModalUsuario.appendChild(clone);

    modalUsuario.show();
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
    let nacimiento = formRegistroUsuario.querySelector("#nacimientoNewUser").value || null;
    let estado = formRegistroUsuario.querySelector("#estadoNewUser").value;
    let rolSeleccionado = formRegistroUsuario.querySelector('input[name="seleccionRol"]:checked');
    let foto_perfil = null;
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
    } else if (rolSeleccionado.id === 'rolCliente') {
        id_rol = 4;
    }

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
            modalUsuario.hide();
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
                title: `${respuesta.error}`,
                position: "center",
                icon: "error",
                text: `Inténtalo de nuevo.`,
                showConfirmButton: true,
            });
        }
    });


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
    document.getElementById('btnCancelarEditarPerfil').classList.add('d-none');
    document.getElementById('btnGuardarCambiosPerfil').classList.add('d-none');
    document.getElementById('btnEditarPerfil').classList.remove('d-none');
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

                    Swal.fire({
                        title: '¿Estás seguro?',
                        text: '¿Estás seguro de que deseas guardar los cambios?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Guardar cambios'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            console.log('Cambios guardados con éxito');
                            deshabilitarEdicion(formConfiguracionUsuario);
                        }
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
function limpiarFormulario(formRegistroUsuario) {

    const inputs = formRegistroUsuario.querySelectorAll('input:not([type="file"]):not(#nacimientoNewUser):not([type="radio"])');

    inputs.forEach(input => {
        input.value = "";
        input.classList.remove('is-valid', 'is-invalid');
    });

    formRegistroUsuario.querySelector('input[name="seleccionRol"]:checked').checked = false;
}
function inactivarUsuario() {
    // Modal de confirmación
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esto desactivará temporalmente el usuario y no podrá acceder al sistema, puedes reactivarlo en cualquier momento.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#CC0000',
        cancelButtonColor: '#0A1E2E',
        confirmButtonText: 'Si, desactivar usuario',
        cancelButtonText: 'Cancelar',
    }).then(result => {
        if (result.isConfirmed) {
            let dataUsuario = {
                dni: usuarioSeleccionado.dni,
                nombres: usuarioSeleccionado.nombres,
                apellidos: usuarioSeleccionado.apellidos
            };
            console.log("Datos para inactivar usuario: ", dataUsuario);
            // Desactivar usuario
            socket.emit('/administrador/inactivarUsuario', dataUsuario, (respuesta) => {
                if (respuesta.success) {
                    modalUsuario.hide();
                } else {
                    Swal.fire({
                        title: 'Hubo un problema al inactivar el usuario.',
                        position: "center",
                        icon: "error",
                        text: `Inténtalo de nuevo, error: ${respuesta.error}`,
                        showConfirmButton: true,
                    });
                }
            });
        }
    });
}


//? FUNCIONES DE SECCIÓN "PREGUNTAS FRECUENTES"
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
function agregarPreguntaFrecuente() {
    const id = Date.now();
    const clone = templateItemPreguntaFrecuente.cloneNode(true);
    const date = new Date().toLocaleDateString();

    console.log("Agregando pregunta frecuente: ", clone, id, date);

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

    contenedorPreguntasFrecuentes.appendChild(clone);
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

//? FUNCIONES DE SECCIÓN "MANUALES"
function consultarManuales() {
    return new Promise((resolve, reject) => {
        if (Object.keys(listadoMenusManuales).length > 0) {
            console.log(`- No se han consultado los manuales porque ya se han consultado antes`);
            resolve();
        } else {
            socket.emit("/administrador/listadoManuales", (respuesta) => {
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
        const template = templateItemContenidoManual.cloneNode(true);

        template.querySelector('.subtitulo-manual').value = contenidoSubtitulo.subtitulo || 'Sin subtitulo';
        template.querySelector('.introduccion-manual').value = contenidoSubtitulo.introduccion || '';

        if (contenidoSubtitulo.id_multimedia !== null) {
            template.querySelector('.link-video-manual').value = contenidoSubtitulo.link_video || '';

            const pdfLink = template.querySelector('.pdf-link');

            if (contenidoSubtitulo.link_pdf && contenidoSubtitulo.link_pdf !== 'null') {
                pdfLink.href = contenidoSubtitulo.link_pdf;
                pdfLink.classList.remove('d-none');
            }
        }

        template.querySelector('.acciones-contenido-manual').dataset.id = contenidoSubtitulo.id_manual;

        contenedorContenidoManuales.appendChild(template);
    } else {
        contenedorContenidoManuales.innerHTML = '<p class="text-dark">No hay contenido disponible para este subtítulo.</p>';
    }

}
function agregarTituloManual() {

    Swal.fire({
        title: 'Nuevo Título',
        input: 'text',
        inputValidator: (value) => !value && '¡El nombre es obligatorio!',
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            const titulo = result.value;
            socket.emit('/administrador/guardarNuevoTituloManual', { titulo }, (respuesta) => {
                if (respuesta.success) {
                } else {
                    console.error(respuesta.error);
                    Swal.fire({
                        icon: "error",
                        title: "Error al agregar nuevo Tïtulo",
                        text: "Ocurrió un error al intentar agregar el manual.",
                    });
                }
            });
        }
    });
}
function editarTitulo(Id) {
    Swal.fire({
        title: 'Editar Título',
        input: 'text',
        inputValidator: (value) => !value && '¡El nombre es obligatorio!',
        showCancelButton: true,
        confirmButtonText: 'Editar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            socket.emit('/administrador/editarTitulo', {
                id_menu: Id,
                nuevoTitulo: result.value,
            }, (respuesta) => {
                if (respuesta.success) {
                } else {
                    console.error(respuesta.error);
                    Swal.fire({
                        icon: "error",
                        title: "Error al editar el Título",
                        text: "Ocurrió un error al intentar editar el manual.",
                    });
                }
            });
        }
    });
}
function agregarSubtituloManual(idTitulo) {
    Swal.fire({
        title: 'Nuevo Subtítulo',
        input: 'text',
        inputValidator: (value) => !value && '¡El nombre es obligatorio!',
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            const subtitulo = result.value;
            socket.emit('/administrador/agregarSubtituloManual', { id_menu: idTitulo, subtitulo }, (respuesta) => {
                if (respuesta.success) {
                    console.log('Manual agregado con éxito a la Base de Datos');
                } else {
                    console.error(respuesta.error);
                    Swal.fire({
                        icon: "error",
                        title: "Error al agregar manual",
                        text: "Ocurrió un error al intentar agregar el manual.",
                    });
                }
            });
        }
    });

}
function eliminarTituloManual(id, titulo) {

    Swal.fire({
        title: '¿Estás seguro de que deseas eliminar este Tìtulo y todos sus Subtítulos?',
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
                id_menu: id,
                titulo: titulo
            };
            socket.emit('/administrador/eliminarTituloManual', data, (respuesta) => {
                if (respuesta.success) {
                    console.log('Título eliminado con éxito');
                    // Remover el contenido del DOM
                    contenedorContenidoManuales.innerHTML = '';
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
function eliminarSubtituloManual(idSubtitulo) {
    Swal.fire({
        title: '¿Estás seguro de que deseas eliminar este subtítulo?',
        position: "center",
        icon: "warning",
        text: "Esta acción no se puede deshacer.",
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
    }).then((result) => {
        if (result.isConfirmed) {

            // Obtener el contenido del subtitulo y el id_multimedia
            let contenidoManual = buscarContenidoManual(idSubtitulo);
            let subtitulo = contenidoManual.subtitulo;
            let id_multimedia = null;

            if (contenidoManual.id_multimedia) {
                id_multimedia = contenidoManual.id_multimedia;
            }
            let data = {
                id_manual: idSubtitulo,
                subtitulo: subtitulo,
                id_multimedia: id_multimedia
            };
            socket.emit('/administrador/eliminarSubtituloManual', data, (respuesta) => {
                if (respuesta.success) {
                    console.log('Subtitulo eliminado con éxito');

                    // Remover el contenido del DOM
                    contenedorContenidoManuales.innerHTML = '';

                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: `Algo salió mal y nose pudo eliminar el subtitulo: ${respuesta.error}`,
                    });
                }
            });
        }
    });
}
function editarSubtituloManual(idSubtitulo) {
    const contenedor = document.querySelector(`.acciones-contenido-manual[data-id="${idSubtitulo}"]`).closest('.manual-contenido');

    contenedor.querySelectorAll('input, textarea').forEach(input => input.disabled = false);
    contenedor.querySelector('.btn-editar-subtitulo').classList.add('d-none');
    contenedor.querySelector('.btn-eliminar-subtitulo').classList.add('d-none');
    contenedor.querySelector('.btn-guardar-subtitulo').classList.remove('d-none');
    contenedor.querySelector('.btn-cancelar-editar-subtitulo').classList.remove('d-none');

    // Buscar el contenido del subtitulo
    let contenidoManual = buscarContenidoManual(idSubtitulo);

    // Si el contenido del subtitulo tiene multimedia y un PDF subido, se muestra el botón de eliminar el PDF
    if (contenidoManual) {
        if (contenidoManual.id_multimedia !== null) {
            if (contenidoManual.link_pdf) {
                contenedor.querySelector('.delete-pdf-btn').classList.remove('d-none');
            }
        }
    }
}
async function guardarEditarContenidoSubtituloManual(idSubtitulo) {

    // Obtener el elemento a editar
    const itemToEdit = document.querySelector(`.acciones-contenido-manual[data-id="${idSubtitulo}"]`).closest('.manual-contenido');

    // Si no se encontró el elemento
    if (!itemToEdit) {
        console.log('No se encontró el elemento a editar');
        return;
    }

    // Obtener los inputs del elemento
    const subtitulo = itemToEdit.querySelector('.subtitulo-manual').value;
    const introduccion = itemToEdit.querySelector('.introduccion-manual').value || null;
    const link_video = itemToEdit.querySelector('.link-video-manual').value || null;
    const pdfInput = itemToEdit.querySelector('.pdf-manual');
    const pdfLink = itemToEdit.querySelector('.pdf-link');


    let link_pdf_anterior = pdfLink.getAttribute('href');
    let link_pdf_subido = link_pdf_anterior || null;

    // Obtener el ID del multimedia para actualizar el enlace PDF en caso de que se haya cambiado
    let contenidoManual = buscarContenidoManual(idSubtitulo);
    let id_multimedia;
    console.log("contenidoManual: ", contenidoManual);

    if (contenidoManual && contenidoManual.id_multimedia) {
        id_multimedia = contenidoManual.id_multimedia;
        console.log("id_multimedia: ", id_multimedia);
    } else {
        id_multimedia = null;
    }

    // 1. Si eliminarPDF = true
    // Si subió un nuevo PDF, eliminar el anterior, subirlo y actualizar el enlace en la base de datos
    // Si no subió un nuevo PDF, no eliminar el anterior y actualizar el enlace a null en la base de datos
    // 2. Si eliminarPDF = false:
    // Si subió un nuevo PDF, subirlo y actualizar el enlace en la base de datos
    // Si no subió un nuevo PDF, no actualizar el enlace en la base de datos

    // Eliminar el PDF anterior si existe o eliminar el PDF si se presiono eliminarPDF
    if ((link_pdf_anterior && link_pdf_anterior !== '' && link_pdf_anterior !== '#') && eliminarPDF) {

        await eliminarArchivoDB(link_pdf_anterior)
            .then(data => {
                console.log('PDF eliminado con éxito', data);
                link_pdf_subido = null;
            })
            .catch(error => {
                console.error('Error eliminando PDF anterior:', error);
            });
    }

    // Si hay un archivo PDF nuevo para subir, subir el nuevo y actualizar el enlace
    if (pdfInput.files && pdfInput.files[0]) {
        const formData = new FormData();
        formData.append('file', pdfInput.files[0]);

        await subirPDF(pdfInput, link_pdf_anterior)
            .then(respuesta => {
                console.log('PDF subido con éxito, respuesta del servidor:', respuesta);
                link_pdf_subido = respuesta.file.url;
            })
            .catch(error => {
                console.error('Error subiendo PDF:', error);
            });
    }

    const data = {
        id_manual: idSubtitulo,
        subtitulo: subtitulo,
        introduccion: introduccion,
        link_video: link_video,
        link_pdf: link_pdf_subido,
        id_multimedia: id_multimedia,
    };

    console.log("Datos enviados a la DB: ", data);

    // Emitir el evento para guardar los cambios
    socket.emit('/administrador/editarContenidoManual', data, (respuesta) => {
        if (respuesta.success) {
            console.log('Contenido editado con éxito');
        } else {
            console.error(respuesta.error);
            Swal.fire({
                icon: "error",
                title: "Error al editar contenido",
                text: `${respuesta.error}`,
            });
        }
    });

    // Restablecer variables
    eliminarPDF = false;
}
async function eliminarArchivoDB(url_file) {
    return new Promise((resolve, reject) => {
        if (url_file) {
            fetch('/delete-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url_file: url_file })
            }).then(response => response.json()).then(data => {
                if (data.success) {
                    resolve(data.message);
                } else {
                    reject(data.meesage);
                }
            });
        } else {
            resolve(null);
        }
    });
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

//? FUNCIONES DE SECCIÓN "INCIDENTES"
function consultarIncidentes() {
    return new Promise((resolve, reject) => {
        if (Object.keys(listadoGeneralIncidentes).length > 0) {
            console.log("No se consultaron los incidentes porque ya se consultaron.");
            resolve();
        } else {
            socket.emit("/administrador/listadoIncidentes", { pagina: 1, limite: limiteIncidentes, estado: 'Todos' }, (respuesta) => {
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
    const switchIncidentesReasignados = document.querySelector('#switchIncidentesReasignados');

    listadoGeneralIncidentes.forEach(incidente => {

        let agregarPorEstado = incidente.estado === seleccionEstadoIncidente || seleccionEstadoIncidente === 'Todos';
        let agregarPorReasignados = !switchIncidentesReasignados.checked || incidente.dni_tecnico;

        if (agregarPorEstado && agregarPorReasignados) {

            templateItemIncidente.querySelector(".incidente").dataset.id = incidente.id_incidente;
            templateItemIncidente.querySelector(".num-incidente .detalles-lista").textContent = incidente.id_incidente;
            templateItemIncidente.querySelector(".nombre-incidente .detalles-lista").innerHTML = `${incidente.titulo} ${incidente.id_rol == 3 ? '<span class="badge bg-warning text-dark">Reasignado</span>' : ''}`;

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
            if (incidente.estado === 'Resuelto') {
                templateItemIncidente.querySelector(".btn-abrir-incidente").classList.add('btn-incidente-resuelto');
            } else if (incidente.estado === 'Pendiente') {
                templateItemIncidente.querySelector(".btn-abrir-incidente").classList.add('btn-incidente-pendiente');
            }

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
    templateModalIncidentePendiente.querySelector(".numero-incidente").textContent = incidente.id_incidente;
    templateModalIncidentePendiente.querySelector(".empresa").textContent = incidente.ruc_empresa;
    templateModalIncidentePendiente.querySelector(".nombre-incidente").innerHTML = `${incidente.titulo} ${incidente.id_rol == 3 ? '<span class="badge bg-warning text-dark">Reasignado</span>' : ''}`;
    templateModalIncidentePendiente.querySelector(".detalles").textContent = incidente.descripcion_incidente;

    // Asignar fecha y hora al modal
    templateModalIncidentePendiente.querySelector("#fechaIncidente").textContent = fechaFormateada;
    templateModalIncidentePendiente.querySelector("#horaIncidente").textContent = horaFormateada;

    contenedorModalIncidentePendiente = document.querySelector('.contenedorModalIncidentePendiente');
    contenedorModalIncidentePendiente.innerHTML = "";
    let clone = templateModalIncidentePendiente.cloneNode(true);
    contenedorModalIncidentePendiente.appendChild(clone);

    modalIncidentePendiente.show();
}
function abrirIncidenteResuelto(e) {
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
    templateModalIncidenteResuelto.querySelector(".numero-incidente").textContent = incidente.id_incidente;
    templateModalIncidenteResuelto.querySelector(".empresa").textContent = incidente.ruc_empresa;
    templateModalIncidenteResuelto.querySelector(".nombre-incidente").innerHTML = `${incidente.titulo} ${incidente.id_rol == 3 ? '<span class="badge bg-warning text-dark">Reasignado</span>' : ''}`;
    templateModalIncidenteResuelto.querySelector(".detalles").textContent = incidente.descripcion_incidente;

    // Asignar fecha y hora al modal
    templateModalIncidenteResuelto.querySelector("#fechaIncidente").textContent = fechaFormateada;
    templateModalIncidenteResuelto.querySelector("#horaIncidente").textContent = horaFormateada;

    contenedorModalIncidenteResuelto = document.querySelector('.contenedorModalIncidenteResuelto');
    contenedorModalIncidenteResuelto.innerHTML = "";
    let clone = templateModalIncidenteResuelto.cloneNode(true);
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

//? FUNCIONES DE SECCIÓN "CONFIGURACIÓN DE USUARIO"
async function miInfoUsuario() {
    return new Promise((resolve, reject) => {

        if (perfilUsuario) {
            resolve(perfilUsuario);
            console.log("Perfil del usuario ya consultado: ", perfilUsuario);

        } else {
            console.log('Se está consultando el perfil del usuario');
            socket.emit("/administrador/miInfoUsuario", (respuesta) => {
                if (respuesta?.success) {
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
    document.getElementById('btnCancelarEditarPerfil').classList.remove('d-none');
    document.getElementById('btnGuardarCambiosPerfil').classList.remove('d-none');
    document.getElementById('btnGuardarCambiosPerfil').disabled = true; // Solo activado si hay cambios
    document.getElementById('btnEditarPerfil').classList.add('d-none');
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
    document.getElementById('btnCancelarEditarPerfil').classList.add('d-none');
    document.getElementById('btnGuardarCambiosPerfil').classList.add('d-none');
    document.getElementById('btnEditarPerfil').classList.remove('d-none');
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
// Función para mostrar mensaje de error en tiempo real para cada input en el formulario de Registro de Usuario
function mostrarError(input, mensaje) {
    input.classList.remove('is-valid', 'is-invalid');
    input.classList.add('is-invalid');
    const feedbackElement = input.nextElementSibling;
    if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
        feedbackElement.textContent = mensaje;
    }
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

//TODO ======================== LISTENERS ========================

// Event Listener para verificar la selección de un rol válido en el formulario de Registro de Usuarios
radiosRol.forEach(radio => {
    radio.addEventListener('change', () => {
        // Remover la clase is-invalid del divSeleccionRol si se selecciona algún rol
        const divSeleccionRol = document.getElementById('divSeleccionRolNewUser');
        const parrafoSeleccionRol = divSeleccionRol.querySelector('p');
        parrafoSeleccionRol.classList.remove('is-invalid');
        divSeleccionRol.classList.remove('is-invalid');
    });
});

// Agregar validación en tiempo real a todos los campos excepto radio buttons y fecha de nacimiento en el formulario de Registro de Usuarios
formRegistroUsuario.querySelectorAll('input:not([type="file"]):not(#nacimientoNewUser):not([type="radio"])').forEach(input => {
    input.addEventListener('input', () => {
        validarCampo(input);
    });
});

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
