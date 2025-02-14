const fragmento = document.createDocumentFragment();
/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

/* Template para renderizado */

const templateAsesoria = document.querySelector('#templateAsesoria');

/* Etiqueta de botones de menu que vienen de HTMl */
let btnMenuAsesoria = document.querySelector('#btnMenuAsesoria');

/* Evento del boton Asesoria */
btnMenuAsesoria.addEventListener('click', function () {
    cardReactivo.innerHTML = "";
    console.log(listadoGeneralTitulos);
    /* templateAsesoria.querySelector(".titulo-asesoria").textContent = persona.nombre; */

    const clone = templateAsesoria.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
});

