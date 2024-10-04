const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

/* Templates para renderizado */

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
var modalIncidente = new bootstrap.Modal(document.getElementById('modalIncidente'));
var modalReasignar = new bootstrap.Modal(document.getElementById('modalReasignar'));

// Botón para abrir el submodal desde el modal principal
var btnReasignar = document.querySelector('#modalIncidente .btn-reasignar');

btnReasignar.addEventListener('click', function () {
    // Cerrar el modal principal
    modalIncidente.hide();

    // Esperar a que el modal principal se cierre antes de abrir el submodal
    document.getElementById('modalIncidente').addEventListener('hidden.bs.modal', function () {
        modalReasignar.show();
    }, { once: true });
});

// Botón para cancelar en el submodal y volver al modal principal
var botonesCancelarReasignar = document.querySelectorAll('.btnCancelarReasignar');

botonesCancelarReasignar.forEach(boton => {

    boton.addEventListener('click', function () {
        // Cerrar el submodal
        modalReasignar.hide();

        // Esperar a que el submodal se cierre antes de abrir el modal principal
        document.getElementById('modalReasignar').addEventListener('hidden.bs.modal', function () {
            modalIncidente.show();
        }, { once: true });
    });
});





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






// MARK: Formulario de edición de usuario
document.addEventListener('click', function (event) {
    const btnEditar = document.querySelector('#btnEditarUsuario');
    const btnGuardar = document.querySelector('#btnGuardarUsuario');
    const btnCancelar = document.querySelector('#btnCancelarUsuario');
    const inputs = document.querySelectorAll('.modal-editar-usuario input');
    const selects = document.querySelectorAll('.modal-editar-usuario select');
    const btnCerrar = document.querySelector('#btnCerrar');
    const customImageContainer = document.querySelector('#custom-image-container-editar-usuario');

    // Variables para almacenar los valores originales
    let valoresOriginales = {};

    // Solo agrega los event listeners si los elementos existen
    if (btnEditar && btnGuardar && btnCancelar) {

        // Habilitar edición
        btnEditar.addEventListener('click', () => {
            // Guardar los valores originales de inputs y selects
            inputs.forEach(input => {
                valoresOriginales[input.id] = input.value;
                input.disabled = false; // Habilitar inputs
            });
            selects.forEach(select => {
                valoresOriginales[select.id] = select.value;
                select.disabled = false; // Habilitar selects
            });

            btnEditar.classList.add('d-none');
            btnGuardar.classList.remove('d-none');
            btnCancelar.classList.remove('d-none');
            btnCerrar.classList.add('d-none');
            customImageContainer.classList.remove('d-none');

            // Guardamos la imagen actual antes de hacer cambios
            imagenOriginalSrc = document.getElementById('imgPerfilPreview').src;
        });

        // Guardar cambios
        btnGuardar.addEventListener('click', () => {

            inputs.forEach(input => {
                input.disabled = true;
                valoresOriginales[input.id] = input.value; // Actualizar valores originales
            });
            selects.forEach(select => {
                select.disabled = true;
                valoresOriginales[select.id] = select.value; // Actualizar valores originales
            });

            btnEditar.classList.remove('d-none');
            btnGuardar.classList.add('d-none');
            btnCancelar.classList.add('d-none');
            btnCerrar.classList.remove('d-none');
            customImageContainer.classList.add('d-none');

        });

        // Cancelar edición
        btnCancelar.addEventListener('click', () => {

            // Restaurar valores originales de los inputs
            inputs.forEach(input => {
                input.value = valoresOriginales[input.id];
                input.disabled = true; // Deshabilitar inputs
            });
            selects.forEach(select => {
                select.value = valoresOriginales[select.id];
                select.disabled = true; // Deshabilitar selects
            });

            btnEditar.classList.remove('d-none');
            btnGuardar.classList.add('d-none');
            btnCancelar.classList.add('d-none');
            btnCerrar.classList.remove('d-none');
            customImageContainer.classList.add('d-none');

            // Restaurar la imagen original
            document.getElementById('imgPerfilPreview').src = imagenOriginalSrc;
        });

    } else {
        console.error('Algunos de los botones no se encontraron en el DOM');
    }
});

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



// Scripts para mostrar la imagen de perfil subida en el modal de editar o agregar un nuevo usuario
let imagenOriginalSrc = '';

// Función para previsualizar la imagen subida
function previewImagenPerfil(event) {
    try {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('imgPerfilPreview').src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    } catch (error) {
        console.error('Error al cargar la imagen:', error);
        alert('No se pudo cargar la imagen. Intente nuevamente.');
    }
}






// MARK: Mostrar y Ocultar Secciones de Asesoria e Incidentes
document.addEventListener('click', () => {

    const radioFAQ = document.querySelector('#menu-radio-faq');
    const radioManual = document.querySelector('#menu-radio-manual');
    const radioIncidentesNuevos = document.querySelector('#radioIncidentesNuevos');
    const radioIncidentesProceso = document.querySelector('#radioIncidentesEnProceso');
    const radioIncidentesResueltos = document.querySelector('#radioIncidentesResueltos');

    const seccionFAQ = document.querySelector('#seccionFaq');
    const seccionManual = document.querySelector('#seccionManual');
    const seccionIncidentesNuevos = document.querySelector('#seccionIncidentesNuevos');
    const seccionIncidentesProceso = document.querySelector('#seccionIncidentesProceso');
    const seccionIncidentesResueltos = document.querySelector('#seccionIncidentesResueltos');

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




