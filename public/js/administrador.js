const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

/*MARK: Templates para renderizado */
const templateAsesoria = document.querySelector('#templateAsesoria').content;
const templateValoracion = document.querySelector('#templateValoracion').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;
const templateUsuarios = document.querySelector('#templateUsuarios').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;

/* Etiqueta de botones de menu que vienen de HTMl */
let btnMenuAsesoria = document.querySelector('#btnMenuAsesoria');
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');
let btnMenuValoracion = document.querySelector('#btnMenuValoracion');
let btnMenuUsuarios = document.querySelector('#btnMenuUsuarios');
let btnMenuIncidentes = document.querySelector('#btnMenuIncidentes');

/* Lanzamiento de la vista del menu Usuarios */
btnMenuUsuarios.addEventListener('click', function () {
    cardReactivo.innerHTML = "";

    /* templateUsuarios.querySelector(".titulo-usuario").textContent = persona.nombre; */

    const clone = templateUsuarios.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
});

/* Lanzamiento de la vista del menu Asesoria */
btnMenuAsesoria.addEventListener('click', function () {
    cardReactivo.innerHTML = "";

    /* templateAsesoria.querySelector(".titulo-asesoria").textContent = persona.nombre; */

    const clone = templateAsesoria.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
});

/* Lanzamiento de la vista del menu Incidentes */
btnMenuIncidentes.addEventListener('click', function () {
    cardReactivo.innerHTML = "";

    /* templateIncidentes.querySelector(".titulo-incidentes").textContent = persona.nombre; */

    const clone = templateIncidentes.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
});

/* Lanzamiento de la vista del menu valoración */
btnMenuValoracion.addEventListener('click', function () {
    cardReactivo.innerHTML = "";

    /* templateValoracion.querySelector('#tituloValoracion').textContent = "Soy modulo valoración"; */
    const clone = templateValoracion.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
})

/* Lanzamiento de la vista del menu configuración */
btnMenuConfiguracion.addEventListener('click', function () {
    cardReactivo.innerHTML = "";

    // templateConfiguracion.querySelector("#tituloConfiguracion").textContent = "Hola, soy el modulo configuración";

    const clone = templateConfiguracion.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
});


// MARK: Modal Incidentes
// Script para Manejar la Transición entre los Modales de la sección de Incidentes
// Obtener referencias a los modales
const modalIncidente = new bootstrap.Modal(document.getElementById('modalIncidente'));
const modalReasignar = new bootstrap.Modal(document.getElementById('modalReasignar'));

// Botón para abrir el submodal desde el modal principal
const btnReasignar = document.querySelector('#modalIncidente .btn-reasignar');
btnReasignar.addEventListener('click', function () {
    // Cerrar el modal principal
    modalIncidente.hide();
    modalReasignar.show();
});

// Botón para cancelar en el submodal y volver al modal principal
const botonesCancelarReasignar = document.querySelectorAll('.btnCancelarReasignar');
botonesCancelarReasignar.forEach(boton => {
    boton.addEventListener('click', function () {
        // Cerrar el submodal
        modalIncidente.show();
        modalReasignar.hide();
    });
});




// MARK: Registrar usuario

// Asignar la fecha actual en el input de fecha de ingreso
const formRegistroUsuario = document.getElementById('modalRegistrarUsuario');
const btnRegistrarUsuario = formRegistroUsuario.querySelector('#btnRegistrarUsuario');
const btnCancelarRegistro = formRegistroUsuario.querySelector('#btnCancelarRegistro');
btnRegistrarUsuario.addEventListener('click', registrarUsuario);
btnCancelarRegistro.addEventListener('click', () => limpiarFormulario(formRegistroUsuario));

document.addEventListener("DOMContentLoaded", function () {
    const fechaIngresoInput = formRegistroUsuario.querySelector('#fecha-ingreso');
    const hoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    fechaIngresoInput.value = hoy; // Asignar la fecha actual
});

// Agregar validación a los radio buttons dentro del divSeleccionRol
const radiosRol = formRegistroUsuario.querySelectorAll('input[name="seleccionRol"]');
radiosRol.forEach(radio => {
    radio.addEventListener('change', () => {
        // Remover la clase is-invalid del divSeleccionRol si se selecciona algún rol
        const divSeleccionRol = document.getElementById('divSeleccionRol');
        const parrafoSeleccionRol = divSeleccionRol.querySelector('p');
        parrafoSeleccionRol.classList.remove('is-invalid');
        divSeleccionRol.classList.remove('is-invalid');
        divSeleccionRol.classList.remove('is-invalid');
    });
});

// Agregar validación en tiempo real a todos los campos excepto radio buttons y fecha de nacimiento
formRegistroUsuario.querySelectorAll('input:not(#fecha-ingreso):not([type="file"]):not(#nacimiento):not([type="radio"])').forEach(input => {
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
        case 'correo-usuario':
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
            if (!isValid) {
                mostrarError(input, 'Ingrese un correo electrónico válido');
            }
            break;
        case 'dni':
            isValid = input.value.length === 8 && /^\d+$/.test(input.value);
            if (!isValid) {
                mostrarError(input, 'El DNI debe tener 8 dígitos numéricos');
            }
            break;
        case 'telefono':
            isValid = input.value.length === 9 && /^\d+$/.test(input.value);
            if (!isValid) {
                mostrarError(input, 'El teléfono debe tener 9 dígitos numéricos');
            }
            break;
        case 'fecha-ingreso':
            isValid = input.value !== '';
            if (!isValid) {
                mostrarError(input, 'La fecha de ingreso es obligatoria');
            }
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

function registrarUsuario() {
    let rolSeleccionado = formRegistroUsuario.querySelector('input[name="seleccionRol"]:checked');
    if (rolSeleccionado) {
        formRegistroUsuario.querySelector('.divSeleccionRol').classList.remove('is-invalid');
        formRegistroUsuario.querySelector('.divSeleccionRol p').classList.remove('is-invalid');
        console.log(rolSeleccionado.id);
    } else {
        formRegistroUsuario.querySelector('.divSeleccionRol').classList.add('is-invalid');
        formRegistroUsuario.querySelector('.divSeleccionRol p').classList.add('is-invalid');
    }
    let nombre = formRegistroUsuario.querySelector("#nombre-usuario").value;
    let correo = formRegistroUsuario.querySelector("#correo-usuario").value;
    let usuario = formRegistroUsuario.querySelector("#usuario").value;
    let password = formRegistroUsuario.querySelector("#password").value;
    let dni = formRegistroUsuario.querySelector("#dni").value;
    let telefono = formRegistroUsuario.querySelector("#telefono").value;
    let direccion = formRegistroUsuario.querySelector("#direccion").value;
    let fechaIngreso = formRegistroUsuario.querySelector("#fecha-ingreso").value;
    let nacimiento = formRegistroUsuario.querySelector("#nacimiento").value;
    let estado = formRegistroUsuario.querySelector("#estado").value;
    let imagenPerfil = formRegistroUsuario.querySelector('#add-single-img').files[0]; // Capturamos el archivo de imagen
    let expresiones = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let valido = expresiones.test(correo);

    if (rolSeleccionado !== null && nombre !== "" && correo !== "" && usuario !== "" && password !== "" && dni !== "" && telefono !== "" && direccion !== "" && estado !== "") {
        if (valido === true) {
            if (telefono.length == 9) {
                if (dni.length == 8) {
                    let nuevoUsuario = {
                        rolSeleccionado,
                        nombre,
                        correo,
                        usuario,
                        password,
                        dni,
                        telefono,
                        direccion,
                        fechaIngreso,
                        nacimiento,
                        estado,
                    }
                    if (imagenPerfil) {
                        nuevoUsuario.append(imagenPerfil);
                    }
                    // socket.emit('/administrador/registrarUsuario', nuevoUsuario);
                    alert("Formulario enviado");
                    limpiarFormulario();
                }
                else {
                    mostrarError(formRegistroUsuario.querySelector('#dni'), "El DNI debe tener 8 dígitos");
                }
            }
            else {
                mostrarError(formRegistroUsuario.querySelector('#telefono'), "El teléfono debe tener 9 dígitos");
            }
        }
        else {
            mostrarError(formRegistroUsuario.querySelector('#correo-usuario'), 'Ingrese un correo electrónico válido');
        }
    }
    else {
        formRegistroUsuario.querySelectorAll('input:not(#fecha-ingreso):not([type="file"]):not(#nacimiento):not([type="radio"])').forEach(input => {
            validarCampo(input)
        });
    }
}

// Función para mostrar el error
function mostrarError(input, mensaje) {
    input.classList.add('is-invalid');
    const feedbackElement = input.nextElementSibling;
    if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
        feedbackElement.textContent = mensaje;
    }
}

// Función para limpiar el formulario
function limpiarFormulario() {
    formRegistroUsuario.querySelectorAll('.form-control').forEach(input => {
        input.value = "";
        input.classList.remove('is-valid', 'is-invalid');
    });
}

// MARK: Registrar cliente
function registrarCliente() {
    let puntaje = 0;
    let idERP = 0;
    let rol = 3;
    let estado = true;
    let correo = document.querySelector("#correo").value;
    let contrasena = document.querySelector("#contrasena").value;
    let tipoDoc = document.querySelector("#tipoDoc").value;
    let docc = document.querySelector("#docc").value;
    let nombres = document.querySelector("#nombres").value;
    let apellidos = document.querySelector("#apellidos").value;
    let direccion = document.querySelector("#direccion").value;
    let telefono = document.querySelector("#telefono").value;
    let expresiones = /^[a-z0-9!#$%&'+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'+/=?^_`{|}~-]+)@(?:[a-z0-9](?:[a-z0-9-][a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
    let valido = expresiones.test(correo);

    if (correo != "" && contrasena != "" && nombres != "" && direccion != "" && telefono != "") {
        if (valido === true) {
            if (telefono.length == 9) {
                if (tipoDoc != 10) {
                    if ((tipoDoc == 6 && docc.length == 11) || (tipoDoc == 1 && docc.length == 8) || (tipoDoc == 0)) {
                        let tipoDocumento = parseInt(tipoDoc);
                        let persona = {
                            idERP,
                            rol,
                            estado,
                            correo,
                            password: contrasena,
                            tipoDoc: tipoDocumento,
                            docc,
                            nombres,
                            apellidos,
                            direccion,
                            telefono,
                            puntaje
                        }
                        socket.emit('/administrador/registrarCliente', persona);
                        limpiarRegistro();

                        $('#modalRegistro').modal("hide");

                        if ($('.modal-backdrop').is(':visible')) {
                            $('.modal-backdrop').remove();
                        }

                        $('#modalClientes').modal("show");

                    }
                    else {
                        alertWarning("El número de caracteres no coincide con el tipo de documento.");
                    }
                }
                else {
                    alertWarning("Elija tipo de documento");
                }
            }
            else {
                alertWarning("Ingrese un número de celular válido");
            }
        }
        else {
            alertWarning("Ingrese un correo válido");
        }
    }
    else {
        alertWarning("Todos los campos son obligatorios");
    }
}


// MARK: Mostrar y Ocultar Secciones de Asesoria e Incidentes
btnMenuIncidentes.addEventListener('click', () => {

    let radioIncidentesNuevos = document.querySelector('#radioIncidentesNuevos');
    let radioIncidentesProceso = document.querySelector('#radioIncidentesEnProceso');
    let radioIncidentesResueltos = document.querySelector('#radioIncidentesResueltos');

    let seccionIncidentesNuevos = document.querySelector('#seccionIncidentesNuevos');
    let seccionIncidentesProceso = document.querySelector('#seccionIncidentesProceso');
    let seccionIncidentesResueltos = document.querySelector('#seccionIncidentesResueltos');

    if (radioIncidentesNuevos && radioIncidentesResueltos && radioIncidentesEnProceso) {

        radioIncidentesNuevos.addEventListener('click', () => {
            if (radioIncidentesNuevos.checked) {
                seccionIncidentesNuevos.classList.remove('d-none');
                seccionIncidentesResueltos.classList.add('d-none');
                seccionIncidentesProceso.classList.add('d-none');
            }
        });

        radioIncidentesProceso.addEventListener('click', () => {
            if (radioIncidentesProceso.checked) {
                seccionIncidentesProceso.classList.remove('d-none');
                seccionIncidentesResueltos.classList.add('d-none');
                seccionIncidentesNuevos.classList.add('d-none');
            }
        });

        radioIncidentesResueltos.addEventListener('click', () => {
            if (radioIncidentesResueltos.checked) {
                seccionIncidentesResueltos.classList.remove('d-none');
                seccionIncidentesProceso.classList.add('d-none');
                seccionIncidentesNuevos.classList.add('d-none');
            }
        });

    }
})


// MARK: Preguntas Frecuentes
btnMenuAsesoria.addEventListener('click', () => {

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


    document.getElementById('addFaqBtn').addEventListener('click', function () {
        const accordionFAQ = document.getElementById('accordionFAQ');
        const newId = Date.now(); // Generar un id único para cada nuevo acordeón

        // Crear un nuevo acordeón dinámicamente
        const newAccordionItem = `
      <div class="accordion-item" id="accordionItem${newId}">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed d-flex flex-wrap justify-content-between gap-1 gap-sm-3"
            type="button" data-bs-toggle="collapse" data-bs-target="#collapse${newId}" aria-expanded="false"
            aria-controls="collapse${newId}">
            <input id="questionInput${newId}" class="fw-bold fs-5 flex-grow-1 me-3" type="text"
              value="" placeholder="Nueva pregunta...">
            <span id="questionText${newId}" class="d-none flex-grow-1"></span>
            <span class="badge rounded-pill bg-success ms-0 ms-sm-auto p-2">Vistas: 0</span>
            <span class="badge rounded-pill bg-dark p-2">Creado/modificado: ${new Date().toLocaleDateString()}</span>
          </button>
        </h2>
        <div id="collapse${newId}" class="accordion-collapse collapse" data-bs-parent="#accordionFAQ">
          <div class="accordion-body">
            <b>Respuesta:</b>
            <textarea id="answerText${newId}" class="textarea-normal" placeholder="Escribe aquí la respuesta..."></textarea>
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
            const accordionItem = document.getElementById(`accordionItem${newId}`);
            accordionItem.remove(); // Eliminar la nueva pregunta si se hace clic en "Cancelar"
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
                const editButton = document.createElement('button');
                editButton.classList.add('btn', 'btn-dark', 'edit-btn');
                editButton.textContent = 'Editar';

                // Añadir el botón de "Editar"
                saveButton.parentNode.insertBefore(editButton, saveButton);

                // Manejar el botón de "Editar"
                editButton.addEventListener('click', function () {
                    questionText.classList.add('d-none'); // Ocultar el span con la pregunta
                    questionInput.classList.remove('d-none'); // Mostrar el input
                    questionInput.disabled = false;
                    answerText.disabled = false;
                    saveButton.classList.remove('d-none'); // Mostrar botón "Guardar"
                    editButton.remove(); // Eliminar el botón "Editar"
                });
            } else {
                alert('Por favor, ingresa una pregunta y una respuesta antes de guardar.');
            }
        });

    });

    // Función para manejar la edición
    document.querySelectorAll('.edit-btn').forEach(function (editBtn) {
        editBtn.addEventListener('click', function (event) {
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
            editBtn.classList.add('d-none');
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
})

/*
document.querySelector('#formulario-editar').addEventListener('submit', function (event) {
    event.preventDefault();  // Evita que se envíe el formulario si las contraseñas no coinciden
    verificarContraseñas();
});

document.querySelector('#confirmContraseña').addEventListener('input', verificarContraseñas);
document.querySelector('#contraseña').addEventListener('input', verificarContraseñas);

function verificarContraseñas() {
    const contraseña = document.querySelector('#contraseña').value;
    const confirmContraseña = document.getElementById('confirmContraseña').value;
    const errorMessage = document.querySelector('#mensaje-error');

    if (contraseña !== confirmContraseña) {
        document.querySelector('#contraseña').classList.add('error');
        document.querySelector('#confirmContraseña').classList.add('error');
        errorMessage.style.display = 'block';
    } else {
        document.querySelector('#contraseña').classList.remove('error');
        document.querySelector('#confirmContraseña').classList.remove('error');
        errorMessage.style.display = 'none';
    }
}
*/