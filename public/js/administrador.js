const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

/* Templates para renderizado */

const templateAsesoria = document.querySelector('#templateAsesoria').content;
const templateValoracion = document.querySelector('#templateValoracion').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;
const templateUsuarios = document.querySelector('#templateUsuarios').content;

/* Etiqueta de botones de menu que vienen de HTMl */
let btnMenuAsesoria = document.querySelector('#btnMenuAsesoria');
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');
let btnMenuValoracion = document.querySelector('#btnMenuValoracion');
let btnMenuUsuarios = document.querySelector('#btnMenuUsuarios');

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


// MARK: MODAL INCIDENTES
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







document.addEventListener('click', function (event) {
  const btnEditar = document.querySelector('#btnEditarUsuario');
  const btnGuardar = document.querySelector('#btnGuardarUsuario');
  const btnCancelar = document.querySelector('#btnCancelarUsuario');
  const inputs = document.querySelectorAll('.modal-usuario input');
  const btnCerrar = document.querySelector('#btnCerrar');

  // Solo agrega los event listeners si los elementos existen
  if (btnEditar && btnGuardar && btnCancelar) {
    // Habilitar edición
    btnEditar.addEventListener('click', () => {
      inputs.forEach(input => input.disabled = false);
      btnEditar.classList.add('d-none');
      btnGuardar.classList.remove('d-none');
      btnCancelar.classList.remove('d-none');
      btnCerrar.classList.add('d-none');
    });

    // Guardar cambios
    btnGuardar.addEventListener('click', () => {
      inputs.forEach(input => input.disabled = true);
      btnEditar.classList.remove('d-none');
      btnGuardar.classList.add('d-none');
      btnCancelar.classList.add('d-none');
      btnCerrar.classList.remove('d-none');
    });

    // Cancelar edición
    btnCancelar.addEventListener('click', () => {
      inputs.forEach(input => input.disabled = true);
      btnEditar.classList.remove('d-none');
      btnGuardar.classList.add('d-none');
      btnCancelar.classList.add('d-none');
      btnCerrar.classList.remove('d-none');
    });
  } else {
    console.error('Algunos de los botones no se encontraron en el DOM');
  }
});


// MARK: MOSTRAR Y OCULATR SECCIONES DE ASESORIA
document.addEventListener('click', () => {

  const radioFAQ = document.querySelector('#menu-radio-faq');
  const radioManual = document.querySelector('#menu-radio-manual');
  const seccionFAQ = document.querySelector('#seccion-faq');
  const seccionManual = document.querySelector('#seccion-manual');

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

})




