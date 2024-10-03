const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

/* Templates para renderizado */
const templateReportes = document.querySelector('#templateReportes').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;


/* Etiqueta de botones de menu que vienen de HTMl */
let btnMenuReportes = document.querySelector('#btnMenuReportes');
let btnMenuIncidentes = document.querySelector('#btnMenuIncidentes');
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');

/* Lanzamiento de la vista del menu Reportes */
btnMenuReportes.addEventListener('click', function () {
  cardReactivo.innerHTML = "";

  templateReportes.querySelector("#tituloReportes").textContent = "Hola, soy el modulo Reportes";

  const clone = templateReportes.cloneNode(true);
  fragmento.appendChild(clone);

  cardReactivo.appendChild(fragmento);
});

/* Lanzamiento de la vista del menu Incidentes */
btnMenuIncidentes.addEventListener('click', function () {
  cardReactivo.innerHTML = "";

  templateIncidentes.querySelector("#tituloIncidentes").textContent = "Hola soy el modulo Incidentes";

  const clone = templateIncidentes.cloneNode(true);
  fragmento.appendChild(clone);

  cardReactivo.appendChild(fragmento);

});

/* Lanzamiento de la vista del menu configuración */
btnMenuConfiguracion.addEventListener('click', function () {
  cardReactivo.innerHTML = "";

  templateConfiguracion.querySelector("#tituloConfiguracion").textContent = "Hola, soy el modulo configuración";

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

// MARK: MOSTRAR Y OCULATR SECCIONES DE ASESORIA
document.addEventListener('click', () => {

  const menureportesclientes = document.querySelector('#menu-reportes-clientes');
  const menureportestecnicos = document.querySelector('#menu-reportes-tecnicos');
  const seccionreportesclientes = document.querySelector('#seccion-reportes-clientes');
  const seccionreportestecnicos = document.querySelector('#seccion-reportes-tecnicos');

  menureportesclientes.addEventListener('click', () => {
    if (menureportesclientes.checked) {
      seccionreportesclientes.classList.remove('d-none');
      seccionreportestecnicos.classList.add('d-none');
    }
  });

  menureportestecnicos.addEventListener('click', () => {
    if (menureportestecnicos.checked) {
      seccionreportesclientes.classList.add('d-none');
      seccionreportestecnicos.classList.remove('d-none');
    }
  });

})