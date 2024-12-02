const socket = io('/administrador'); // Conectar al namespace administrador
socket.on('connect', () => {
    console.log('Conectado al namespace /administrador');
});

const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

//TODO ========================= TEMPLATES ========================
// Template para las diferentes secciones
const templateAsesoria = document.querySelector('#templateAsesoria').content;
const templateValoracion = document.querySelector('#templateValoracion').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;
const templateUsuarios = document.querySelector('#templateUsuarios').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;
const templateReportes = document.querySelector('#templateReportes').content;


// Template para modales
// const templateModalNuevoUsuario = document.querySelector('#templateModalUsuario').content;
// const templateModalUsuario = document.querySelector('#templateModalEditarUsuario').content;
// const templateModalIncidente = document.querySelector('#templateModalIncidente').content;

//TODO ======================== CONTENEDORES ========================
const contenedorUsuarios = document.querySelector('#contenedorUsuarios');
// const templatePreguntasFrecuentes = document.querySelector('#templatePreguntasFrecuentes').content;
// const templateTablaAsesoria = document.querySelector('#templateTablaAsesoria').content;
// const templateTablaValoracion = document.querySelector('#templateTablaValoracion').content;
// const templateTablaIncidentes = document.querySelector('#templateTablaIncidentes').content;



//TODO ======================= BOTONES ========================
// Botonoes para cambiar de sección
let btnMenuAsesoria = document.querySelector('#btnMenuAsesoria');
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');
let btnMenuValoracion = document.querySelector('#btnMenuValoracion');
let btnMenuUsuarios = document.querySelector('#btnMenuUsuarios');
let btnMenuIncidentes = document.querySelector('#btnMenuIncidentes');
let btnMenuReportes = document.querySelector('#btnMenuReportes');
let btnMenuInicio = document.querySelector('#btnMenuInicio');

// inputs y labels 
let seleccionEstadosUsuarios = document.querySelector("lbx-estados-select-usuario")
let lbxEstadosUsuarios = document.querySelector("lbx-estados-usuario")

//TODO ======================== VARIABLES GLOBALES ========================
let listadoGeneralUsuarios = {};
// let listadoGeneralManual = {};
// let listadoGeneralIncidentes = {};
// let listadoGeneralValoracion = {};
// let listadoGeneralReportes = {};

//TODO ======================== SOCKETS DE CONSULTA ========================
// socket.on('/administrador/usuarios', (data) => {
//     if (data.success) {
//         console.log(data.data);
//         listadoGeneralUsuarios = data.data;
//         listarUsuarios();
//     } else {
//         console.error('Error al obtener usuarios:', data.error);
//     }
// });
// socket.on('/administrador/manual', (data) => {
//     console.log(data);
//     listadoManual = data;
// });
// socket.on('/administrador/incidentes', (data) => {
//     console.log(data);
//     listadoGeneralIncidentes = data;
// });
// socket.on('/administrador/valoraciones', (data) => {
//     console.log(data);
//     listadoGeneralValoracion = data;
// });

//TODO ======================== LANZAMIENTO DE VISTAS ========================

// Lanzamiento de vista de usuarios
btnMenuUsuarios.addEventListener('click', function () {

    cardReactivo.innerHTML = "";
    const clone = templateUsuarios.cloneNode(true);
    fragmento.appendChild(clone);
    cardReactivo.appendChild(fragmento);

    socket.emit("listadoGeneralUsuarios", {}, (respuesta) => {
        if (respuesta.success) {
            console.log(respuesta.data);
            listadoGeneralUsuarios = respuesta.data;
            listarUsuarios();
        } else {
            console.log(respuesta.error)
        }
    });

});

// Lanzamiento de la vista del menu Asesoria
btnMenuAsesoria.addEventListener('click', function () {
    cardReactivo.innerHTML = "";

    /* templateAsesoria.querySelector(".titulo-asesoria").textContent = persona.nombre; */

    const clone = templateAsesoria.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);


    let radioFAQ = document.querySelector('#menu-radio-faq');
    let radioManual = document.querySelector('#menu-radio-manual');

    let seccionFAQ = document.querySelector('#seccionFaq');
    let seccionManual = document.querySelector('#seccionManual');

    if (radioFAQ && radioManual) {
        radioFAQ.addEventListener('click', () => {
            if (radioFAQ.checked) {
                seccionFAQ.classList.remove('d-none');
                seccionManual.classList.add('d-none');
            }
        });

        radioManual.addEventListener('click', () => {
            if (radioManual.checked) {
                seccionFAQ.classList.add('d-none');
                seccionManual.classList.remove('d-none');
            }
        });
    }

    // Permitir cerrar el acordeón haciendo clic en el elemento abierto
    document.querySelectorAll('.accordion-button').forEach(button => {
        button.addEventListener('click', function () {
            const targetCollapse = document.querySelector(this.getAttribute('data-bs-target'));

            // Si el acordeón ya está abierto, se cierra cuando se hace clic nuevamente
            if (targetCollapse.classList.contains('show')) {
                const bsCollapse = new bootstrap.Collapse(targetCollapse, {
                    toggle: true
                });
                bsCollapse.hide();  // Cierra el acordeón manualmente
            }
        });
    });


    document.getElementById('addFaqBtn').addEventListener('click', function () {
        const accordionFAQ = document.getElementById('accordionFAQ');
        const newId = Date.now(); // Generar un id único para cada nuevo acordeón

        // Crear un nuevo acordeón dinámicamente
        const newAccordionItem = `
      <div class="accordion-item" id="accordionItem${newId}">
        <h2 class="accordion-header">
          <button class="accordion-button d-flex flex-wrap justify-content-between gap-1 gap-sm-3"
            type="button" data-bs-toggle="collapse" data-bs-target="#collapse${newId}" aria-expanded="true"
            aria-controls="collapse${newId}">
            <input id="questionInput${newId}" class="fw-bold fs-5 flex-grow-1 me-3 px-3" type="text"
              value="" placeholder="Nueva pregunta...">
            <span id="questionText${newId}" class="fs-5 fw-bold d-none flex-grow-1 px-3"></span>
            <span class="badge rounded bg-success ms-0 ms-sm-auto px-3 py-2">Vistas: 0</span>
            <span class="badge rounded bg-secondary px-3 py-2">Creado/modificado: ${new Date().toLocaleDateString()}</span>
          </button>
        </h2>
        <div id="collapse${newId}" class="accordion-collapse collapse show" data-bs-parent="#accordionFAQ">
          <div class="accordion-body">
            <b>Respuesta:</b>
            <textarea id="answerText${newId}" class="" rows="4" placeholder="Escribe aquí la respuesta..."></textarea>
            <div class="d-flex flex-wrap gap-2 justify-content-end mt-2">
              <button class="btn btn-danger cancel-btn" data-id="${newId}">Cancelar</button>
              <button class="btn btn-success save-btn" data-id="${newId}">Guardar</button>
            </div>
          </div>
        </div>
      </div>`;

        // Añadir el nuevo acordeón al final
        accordionFAQ.insertAdjacentHTML('beforeend', newAccordionItem);

        // Manejar el botón de "Cancelar"
        document.querySelector(`#accordionItem${newId} .cancel-btn`).addEventListener('click', function () {
            showConfirmModal('Cancalar nueva pregunta frecuente', '¿Estás seguro de que deseas cancelar y eliminar esta nueva pregunta?', 'Si, cancelar', function () {
                const accordionItem = document.getElementById(`accordionItem${newId}`);
                accordionItem.remove(); // Eliminar la nueva pregunta si se hace clic en "Cancelar"
            });
        });

        // Manejar el botón de "Guardar"
        document.querySelector(`#accordionItem${newId} .save-btn`).addEventListener('click', function () {
            const questionInput = document.getElementById(`questionInput${newId}`);
            const questionText = document.getElementById(`questionText${newId}`);
            const answerText = document.getElementById(`answerText${newId}`);

            // Verificar si se han ingresado datos
            if (questionInput.value.trim() !== '' && answerText.value.trim() !== '') {
                // Actualizar el texto de la pregunta
                questionText.textContent = questionInput.value;
                questionText.classList.remove('d-none'); // Mostrar el span con la pregunta
                questionInput.classList.add('d-none'); // Ocultar el input

                // Deshabilitar el textarea de la respuesta
                answerText.disabled = true;

                // Cambiar los botones "Guardar" y "Cancelar" por "Editar" y ocultar "Cancelar"
                const cancelButton = document.querySelector(`#accordionItem${newId} .cancel-btn`);
                cancelButton.classList.add('d-none'); // Ocultar botón "Cancelar"
                const saveButton = document.querySelector(`#accordionItem${newId} .save-btn`);
                saveButton.classList.add('d-none'); // Ocultar botón "Guardar"

                // Verificar si los botones "Editar" y "Eliminar" ya existen
                if (!document.querySelector(`#accordionItem${newId} .edit-btn`)) {
                    const editBtn = document.createElement('button');
                    editBtn.classList.add('btn', 'btn-color-1', 'edit-btn');
                    editBtn.textContent = 'Editar';

                    const deleteBtn = document.createElement('button');
                    deleteBtn.classList.add('btn', 'btn-danger', 'delete-btn');
                    deleteBtn.textContent = 'Eliminar';

                    // Insertar los botones "Editar" y "Eliminar"
                    saveButton.parentNode.insertBefore(editBtn, saveButton);
                    saveButton.parentNode.insertBefore(deleteBtn, editBtn);

                    // Manejar el botón de "Editar"
                    editBtn.addEventListener('click', function () {
                        questionText.classList.add('d-none'); // Ocultar el span con la pregunta
                        questionInput.classList.remove('d-none'); // Mostrar el input
                        questionInput.disabled = false;
                        answerText.disabled = false;
                        saveButton.classList.remove('d-none'); // Mostrar botón "Guardar"
                        editBtn.remove(); // Eliminar el botón "Editar"
                        deleteBtn.remove(); // Eliminar el botón "Eliminar"
                    });

                    // Manejar el botón de "Eliminar"
                    deleteBtn.addEventListener('click', function () {

                        // Mostrar el modal de confirmación dinámico
                        showConfirmModal('Eliminar pregunta frecuente', '¿Estás seguro de que deseas eliminar esta pregunta?', 'Eliminar', function () {
                            const accordionItem = document.getElementById(`accordionItem${newId}`);
                            accordionItem.remove(); // Eliminar el acordeón del DOM
                        });
                    });
                }

            } else {
                alert('Por favor, ingresa una pregunta y una respuesta antes de guardar.');
            }
        });

    });

    // Función para manejar la edición
    document.querySelectorAll('.edit-btn').forEach(function (editButton) {
        editButton.addEventListener('click', function (event) {
            const accordionItem = event.target.closest('.accordion-item');  // Encontrar el contenedor más cercano  
            const questionInput = accordionItem.querySelector('input');
            const questionText = accordionItem.querySelector('span');
            const answerText = accordionItem.querySelector('textarea');
            const saveBtn = accordionItem.querySelector('.save-btn');

            // Habilitar edición de esta pregunta específica
            questionText.classList.add('d-none');
            questionInput.classList.remove('d-none');
            questionInput.disabled = false;
            answerText.disabled = false;

            // Cambiar botones
            editButton.classList.add('d-none');
            saveBtn.classList.remove('d-none');
        });
    });

    // Función para manejar el guardado
    document.querySelectorAll('.save-btn').forEach(function (saveBtn) {
        saveBtn.addEventListener('click', function (event) {
            const accordionItem = event.target.closest('.accordion-item');  // Encontrar el contenedor más cercano
            const questionInput = accordionItem.querySelector('input');
            const questionText = accordionItem.querySelector('span');
            const answerText = accordionItem.querySelector('textarea');
            const editBtn = accordionItem.querySelector('.edit-btn');

            // Deshabilitar edición de esta pregunta específica
            questionInput.disabled = true;
            answerText.disabled = true;
            questionText.textContent = questionInput.value;

            // Cambiar botones
            saveBtn.classList.add('d-none');
            editBtn.classList.remove('d-none');
            questionText.classList.remove('d-none');
            questionInput.classList.add('d-none');
        });
    });

    // Función para manejar la eliminación
    document.querySelectorAll('.delete-btn').forEach(function (deleteButton) {
        deleteButton.addEventListener('click', function (event) {
            const accordionItem = event.target.closest('.accordion-item');  // Encontrar el contenedor más cercano

            // Mostrar el modal de confirmación dinámico
            showConfirmModal('Eliminar pregunta frecuente', '¿Estás seguro de que deseas eliminar esta pregunta?', 'Eliminar', function () {
                accordionItem.remove();  // Eliminar el acordeón del DOM
            });
        });
    });
});

// Lanzamiento de la vista del menu valoración 
btnMenuValoracion.addEventListener('click', function () {
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
            if (radioValoracionManual.checked) {
                seccionValoracionManual.classList.remove('d-none');
                seccionValoracionAtencion.classList.add('d-none');
                seccionValoracionSoftwareInnova.classList.add('d-none');
            }
        });

        radioValoracionAtencion.addEventListener('click', () => {
            if (radioValoracionAtencion.checked) {
                seccionValoracionAtencion.classList.remove('d-none');
                seccionValoracionManual.classList.add('d-none');
                seccionValoracionSoftwareInnova.classList.add('d-none');
            }
        });

        radioValoracionSoftwareInnova.addEventListener('click', () => {
            if (radioValoracionSoftwareInnova.checked) {
                seccionValoracionSoftwareInnova.classList.remove('d-none');
                seccionValoracionManual.classList.add('d-none');
                seccionValoracionAtencion.classList.add('d-none');
            }
        });

    }
})

// Lanzamiento de la vista del menu configuración
btnMenuConfiguracion.addEventListener('click', function () {
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
})


//TODO ======================== FUNCIONES ========================

function listarUsuarios() {

    let usuariosFiltrados = 0;
    let agregarPorDocumento = false;
    let agregarPorNombre = false;
    let agregarPorEstado = false;
    let agregarPorRol = false;

    let buscarPorDocumento = templateUsuarios.querySelector(".busca-por-documento-usuario").value;
    let buscarPorNombre = document.querySelector(".busca-por-nombre-usuario").value;
    let buscarPorEstado = seleccionEstadosUsuarios.textContent;
    let buscarPorRol = selectRolPersonal.textContent;

    contenedorUsuarios.innerHTML = "";

    listadoGeneralUsuarios.forEach(usuario => {
        if (buscarPorDocumento == "") {
            agregarPorDocumento = true;
        } else {
            agregarPorDocumento = usuario.docc.toUpperCase().includes(buscarPorDocumento.toUpperCase());
        }

        let nomnbreUsuario = "";
        nomnbreUsuario = usuario.nombres + " " + usuario.apellidos;

        if (buscarPorNombre == "") {
            agregarPorNombre = true;
        } else {
            agregarPorNombre = nomnbreUsuario.toUpperCase().includes(buscarPorNombre.toUpperCase());
        }

        if (buscarPorEstado == "Todos") {
            agregarPorEstado = true;
        } else {
            if (buscarPorEstado == "Solo Activos") {
                agregarPorEstado = usuario.estado;
            } else {
                agregarPorEstado = !usuario.estado;
            }
        }

        if (usuario.rol == 2 && agregarPorDocumento == true && agregarPorNombre == true && agregarPorEstado == true) {
            templateUsuarios.querySelector(".dni-usuario .detalles-lista").textContent = usuario.docc;
            templateUsuarios.querySelector(".nombre-personal").textContent = usuario.nombres;
            templateUsuarios.querySelector(".celular-personal").textContent = usuario.telefono;
            templateUsuarios.querySelector(".correo-personal").textContent = usuario.correo;
            templateUsuarios.querySelector(".direccion-personal").innerHTML = usuario.direccion;
            templateUsuarios.querySelector(".check-estado-personal").innerHTML = `<input class="form-check-input" type="checkbox" value="" id="flexCheckDefault" ${usuario.estado ? "checked" : null} disabled>`;
            templateUsuarios.querySelector(".btn-ver-personal").dataset.id = usuario.id;

            const clone = templateUsuarios.cloneNode(true);
            fragmento.appendChild(clone);

            usuariosFiltrados += 1;
        }
    });

    let personalVacio = document.querySelector("#personalVacio");
    personalVacio.innerHTML = '';

    if (usuariosFiltrados === 0) {
        personalVacio.innerHTML =
            `
                    <div>
                        <span class="fw-bold fs-4">Aun no hay personal en la lista.</span>
                    </div>
                    <div>
                        <span><i class="bi bi-emoji-dizzy pedidos-vacio"></i></span>
                    </div>
                    <div>
                        <span class="fw-bold">Resultados no encontrados... </span>
                    </div>
                `
    } else {
        contenedorPersonal.appendChild(fragmento);
    }

}

// Registrar usuario   
const formRegistroUsuario = document.getElementById('modalRegistrarUsuario');
const btnRegistrarUsuario = formRegistroUsuario.querySelector('#btnRegistrarUsuario');
const btnCancelarRegistro = formRegistroUsuario.querySelector('#btnCancelarRegistro');
btnRegistrarUsuario.addEventListener('click', registrarUsuario(formRegistroUsuario));
btnCancelarRegistro.addEventListener('click', () => limpiarFormulario(formRegistroUsuario));

// Agregar validación a los radio buttons dentro del divSeleccionRol
const radiosRol = formRegistroUsuario.querySelectorAll('input[name="seleccionRol"]');
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

// Agregar validación en tiempo real a todos los campos excepto radio buttons y fecha de nacimiento
formRegistroUsuario.querySelectorAll('input:not([type="file"]):not(#nacimientoNewUser):not([type="radio"])').forEach(input => {
    if (input.id === 'nacimientoNewUser') {
        console.log('nacimiento');
    }
    input.addEventListener('input', () => {
        validarCampo(input);
    });
});

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
    let rolSeleccionado = formRegistroUsuario.querySelector('input[name="seleccionRol"]:checked');

    if (rolSeleccionado) {
        formRegistroUsuario.querySelector('#divSeleccionRolNewUser').classList.remove('is-invalid');
        formRegistroUsuario.querySelector('#divSeleccionRolNewUser p').classList.remove('is-invalid');
        console.log(rolSeleccionado.id);
    } else {
        formRegistroUsuario.querySelector('#divSeleccionRolNewUser').classList.add('is-invalid');
        formRegistroUsuario.querySelector('#divSeleccionRolNewUser p').classList.add('is-invalid');
    }
    let nombre = formRegistroUsuario.querySelector("#nombreNewUser").value;
    let correo = formRegistroUsuario.querySelector("#correoNewUser").value;
    let usuario = formRegistroUsuario.querySelector("#userNewUser").value;
    let password = formRegistroUsuario.querySelector("#passwordNewUser").value;
    let dni = formRegistroUsuario.querySelector("#dniNewUser").value;
    let telefono = formRegistroUsuario.querySelector("#telefonoNewUser").value;
    let direccion = formRegistroUsuario.querySelector("#direccionNewUser").value;
    let nacimiento = formRegistroUsuario.querySelector("#nacimientoNewUser").value;
    let estado = formRegistroUsuario.querySelector("#estadoNewUser").value;
    let foto_perfil = '';
    //let imagenPerfil = formRegistroUsuario.querySelector('#addImgNewUser').files[0]; // Capturamos el archivo de imagen
    let expresiones = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let correoValidado = expresiones.test(correo);

    if (rolSeleccionado !== null && nombre !== "" && correo !== "" && usuario !== "" && password !== "" && dni !== "" && telefono !== "" && direccion !== "" && estado !== "") {
        if (correoValidado === true) {
            if (telefono.length == 9) {
                if (dni.length == 8) {
                    let nuevoUsuario = {
                        dni,
                        rolSeleccionado,
                        nombre,
                        estado,
                        nacimiento,
                        usuario,
                        password,
                        foto_perfil,
                        telefono,
                        direccion,
                        correo,
                    }
                    //? Implementación de la imagen perfil (pendiente)
                    // if (imagenPerfil) {
                    //     nuevoUsuario.append(imagenPerfil);
                    // }

                    socket.emit('/administrador/registrarUsuario', nuevoUsuario);

                    alert("Formulario enviado");
                    limpiarFormulario();
                    mostrarAlerta('¡El usuario ha sido registrado exitosamente!', 'success', 3000);

                }
                else {
                    mostrarError(formRegistroUsuario.querySelector('#dniNewUser'), "El DNI debe tener 8 dígitos");
                }
            }
            else {
                mostrarError(formRegistroUsuario.querySelector('#telefonoNewUser'), "El teléfono debe tener 9 dígitos");
            }
        }
        else {
            mostrarError(formRegistroUsuario.querySelector('#correoNewUser'), 'Ingrese un correo electrónico válido');
        }
    }
    else {
        formRegistroUsuario.querySelectorAll('input:not(#fecha-ingreso):not([type="file"]):not(#nacimiento):not([type="radio"])').forEach(input => {
            validarCampo(input)
        });
    }
}

function limpiarFormulario(formRegistroUsuario) {

    const inputs = formRegistroUsuario.querySelectorAll('input:not([type="file"]):not(#nacimientoNewUser):not([type="radio"])');

    inputs.forEach(input => {
        input.value = "";
        input.classList.remove('is-valid', 'is-invalid');
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
    let password = form.querySelector("#passwordUsuario").value;
    let dni = form.querySelector("#dniUsuario").value;
    let telefono = form.querySelector("#telefonoUsuario").value;
    let direccion = form.querySelector("#direccionUsuario").value;
    let nacimiento = form.querySelector("#nacimientoUsuario").value;
    let estado = form.querySelector("#estadoUsuario").value;
    //let imagenPerfil = formRegistroUsuario.querySelector('#addImg').files[0]; // Capturamos el archivo de imagen
    let expresiones = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let valido = expresiones.test(correo);

    if (nombre !== "" && correo !== "" && usuario !== "" && password !== "" && dni !== "" && telefono !== "" && direccion !== "" && estado !== "") {
        if (valido === true) {
            if (telefono.length == 9) {
                if (dni.length == 8) {
                    let usuarioActualizado = {
                        rolSeleccionado,
                        nombre,
                        correo,
                        usuario,
                        password,
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
                        mostrarAlerta('¡Los cambios se han guardado con éxito!', 'success', 3000);
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

//TODO: MARK: Lanzamiento de la vista del menu Incidentes
btnMenuIncidentes.addEventListener('click', function () {
    cardReactivo.innerHTML = "";

    /* templateIncidentes.querySelector(".titulo-incidentes").textContent = persona.nombre; */

    const clone = templateIncidentes.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);

    // paginacion('Pendiente');

    //? cambiar entre tipos de incidentes
    let radioIncidentesNuevos = document.querySelector('#radioIncidentesNuevos');
    let radioIncidentesReasignados = document.querySelector('#radioIncidentesReasignados');
    let radioIncidentesResueltos = document.querySelector('#radioIncidentesResueltos');

    let seccionIncidentesNuevos = document.querySelector('#seccionIncidentesNuevos');
    let seccionIncidentesReasignados = document.querySelector('#seccionIncidentesReasignados');
    let seccionIncidentesResueltos = document.querySelector('#seccionIncidentesResueltos');

    if (radioIncidentesNuevos && radioIncidentesResueltos && radioIncidentesReasignados) {

        radioIncidentesNuevos.addEventListener('click', () => {
            seccionIncidentesNuevos.classList.remove('d-none');
            seccionIncidentesResueltos.classList.add('d-none');
            seccionIncidentesReasignados.classList.add('d-none');
        });

        radioIncidentesReasignados.addEventListener('click', () => {
            seccionIncidentesReasignados.classList.remove('d-none');
            seccionIncidentesResueltos.classList.add('d-none');
            seccionIncidentesNuevos.classList.add('d-none');
        });

        radioIncidentesResueltos.addEventListener('click', () => {
            seccionIncidentesResueltos.classList.remove('d-none');
            seccionIncidentesReasignados.classList.add('d-none');
            seccionIncidentesNuevos.classList.add('d-none');
        });
    }
});

//? Función para agregar el listener a los botones para abrir el modal incidente o usuario
let modalIncidente;
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('btn-abrir-incidente')) {
        const incidente = event.target.closest('.incidente');
        if (incidente) {
            const numeroIncidente = incidente.querySelector('.num-incidente .detalles-lista')?.innerText || 'N/A';
            const nombreIncidente = incidente.querySelector('.nombre-incidente .detalles-lista')?.innerText || 'N/A';
            const detallesIncidente = incidente.querySelector('.detalles-incidente .detalles-lista')?.innerText || 'N/A';
            const empresa = incidente.querySelector('.nombre-empresa .detalles-lista')?.innerText || 'N/A';
            const fecha = incidente.querySelector('.fecha-incidente .detalles-lista')?.innerText || 'N/A';
            const estado = incidente.querySelector('.estado-incidente .detalles-lista')?.innerText || 'N/A';

            console.log({ numeroIncidente, nombreIncidente, detallesIncidente, empresa, fecha, estado });

            const modal = document.querySelector('#modalIncidente');

            // Limpia los datos anteriores
            modal.querySelectorAll('.numero-incidente, .nombre-incidente, .detalles, .empresa, .fecha, .estado')
                .forEach((element) => {
                    element.innerText = ''; // Limpia el contenido
                });

            document.querySelector('#modalIncidente .numero-incidente').innerText = numeroIncidente;
            document.querySelector('#modalIncidente .nombre-incidente').innerText = nombreIncidente;
            document.querySelector('#modalIncidente .detalles').innerText = detallesIncidente;
            document.querySelector('#modalIncidente .empresa').innerText = empresa;
            document.querySelector('#modalIncidente .fecha').innerText = fecha;
            document.querySelector('#modalIncidente .estado').innerText = estado;

            // Limpia las clases anteriores en el estado del modal
            const estadoElemento = document.querySelector('#modalIncidente .estado');
            estadoElemento.classList.remove('estado-incidente-pendiente', 'estado-incidente-reasignado', 'estado-incidente-resuelto');

            // Agrega la clase correspondiente según el estado
            if (estado === 'Pendiente') {
                estadoElemento.classList.add('estado-incidente-pendiente');
            } else if (estado === 'Reasignado') {
                estadoElemento.classList.add('estado-incidente-reasignado');
            } else if (estado === 'Resuelto') {
                estadoElemento.classList.add('estado-incidente-resuelto');
            }
            // Abre el modal
            modalIncidente = new bootstrap.Modal(document.getElementById('modalIncidente'));
            modalIncidente.show();
        }
    } else if (event.target.classList.contains('btn-abrir-usuario')) {

        const usuario = event.target.closest('.usuario');
        if (usuario) {
            const nombreUsuario = usuario.querySelector('.nombre-usuario .detalles-lista').innerText;
            const correoUsuario = usuario.querySelector('.nombre-usuario .correo-usuario').innerText;
            const usernameUsuario = usuario.querySelector('#username-usuario').innerText;
            const passwordUsuario = usuario.querySelector('#password-usuario').innerText;
            const telefonoUsuario = usuario.querySelector('.telefono-usuario .detalles-lista').innerText;
            const dniUsuario = usuario.querySelector('.dni-usuario .detalles-lista').innerText;
            const direccionUsuario = usuario.querySelector('.direccion-usuario .detalles-lista').innerText;
            const estadoUsuario = usuario.querySelector('.estado-usuario .detalles-lista').innerText;

            const rol = event.target.closest('#tablaUsuariosAdministrador') ? 'Administrador' : event.target.closest('#tablaUsuariosTecnico') ? 'Tecnico' : event.target.closest('#tablaUsuariosSoporte') ? 'Soporte' : event.target.closest('#tablaUsuariosCliente') ? 'Cliente' : '';

            if (rol === 'Administrador') {
                document.querySelector(`#modalEditarUsuario input[name="seleccionRolUpdate"][id="rolAdministradorUpdate"]`).checked = true;
            }
            else if (rol === 'Tecnico') {
                document.querySelector(`#modalEditarUsuario input[name="seleccionRolUpdate"][id="rolTecnicoUpdate"]`).checked = true;
            }
            else if (rol === 'Soporte') {
                document.querySelector(`#modalEditarUsuario input[name="seleccionRolUpdate"][id="rolSoporteUpdate"]`).checked = true;
            }
            else if (rol === 'Cliente') {
                document.querySelector(`#modalEditarUsuario input[name="seleccionRolUpdate"][id="rolClienteUpdate"]`).checked = true;
            }

            document.querySelector('#modalEditarUsuario #nombreUpdateUser').value = nombreUsuario;
            document.querySelector('#modalEditarUsuario #correoUpdateUser').value = correoUsuario;
            document.querySelector('#modalEditarUsuario #userUpdateUser').value = usernameUsuario;
            document.querySelector('#modalEditarUsuario #passwordUpdateUser').value = passwordUsuario;
            document.querySelector('#modalEditarUsuario #dniUpdateUser').value = dniUsuario;
            document.querySelector('#modalEditarUsuario #telefonoUpdateUser').value = telefonoUsuario;
            document.querySelector('#modalEditarUsuario #direccionUpdateUser').value = direccionUsuario;
            document.querySelector('#modalEditarUsuario #estadoUpdateUser').value = estadoUsuario;
        }
    } else if (event.target.classList.contains('togglePassword')) {
        const passwordInput = document.getElementById('passwordUpdateUser');
        const toggleIcon = document.getElementById('toggleIcon');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('bi-eye');
            toggleIcon.classList.add('bi-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('bi-eye-slash');
            toggleIcon.classList.add('bi-eye');
        }

    }
});

//? Manejar la Transición entre los Modales Incidente y Reasignación de Incidente
const modalReasignar = new bootstrap.Modal(document.getElementById('modalReasignar'));

// Botón para abrir el submodal desde el modal principal y transferir los datos
const btnReasignar = document.querySelector('#modalIncidente #reasignarIncidente');
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
});

// Botones para cancelar en el submodal y volver al modal principal
const botonesCancelarReasignar = document.querySelectorAll('#btnCancelarReasignar');
botonesCancelarReasignar.forEach(boton => {
    boton.addEventListener('click', function () {
        // Cerrar el submodal y volver a abrir el modal principal
        modalReasignar.hide();
        modalIncidente.show();
    });
});

const botonesCancelarIncidente = document.querySelectorAll('#btnCerrarIncidente');
botonesCancelarIncidente.forEach(boton => {
    boton.addEventListener('click', function () {
        modalIncidente.hide();
    });
});




//? Modal de confirmación con bootstrap reutilizable
let confirmAction = null; // Variable para almacenar la función de confirmación actual

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



//? Alerta reutilizable dinámico
/**
 * Función para mostrar el modal de confirmación dinámico.
 * @param {String} mensaje - El mensaje de la alerta.
 * @param {String} tipo - El tipo de alerta (success, danger, etc.).
 * @param {String} duracion - La duración de la animación en milisegundos.
 */
function mostrarAlerta(mensaje, tipo = 'success', duracion = 3000) {
    // Crear el contenedor de la alerta
    const alerta = document.createElement('div');
    alerta.classList.add('alert', `alert-${tipo}`, 'fade', 'show');
    alerta.setAttribute('role', 'alert');
    alerta.textContent = mensaje;

    // Añadir la alerta al DOM (por ejemplo, al principio del body o dentro de un contenedor específico)
    const containerElement = document.body;
    document.body.appendChild(alerta);

    // Ocultar la alerta después del tiempo especificado (duracion en milisegundos)
    setTimeout(() => {
        alerta.classList.remove('show');
        alerta.classList.add('fade');
        alerta.addEventListener('transitionend', () => {
            alerta.remove(); // Eliminar la alerta del DOM después de la animación
        });
    }, duracion);
}



