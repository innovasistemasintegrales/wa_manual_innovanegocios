const fragmento = document.createDocumentFragment();
/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

/* Template para renderizado */

const templateAsesoria = document.querySelector('#templateAsesoria').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;
const templateValoracion = document.querySelector('#templateValoracion').content;

/* Etiqueta de botones de menu que vienen de HTMl */
let btnMenuAsesoria = document.querySelector('#btnMenuAsesoria');
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');
let btnMenuValoracion = document.querySelector('#btnMenuValoracion');



/* Lanzamiento de la vista del menu Asesoria */
btnMenuAsesoria.addEventListener('click', function () {
    cardReactivo.innerHTML = "";
    
    templateAsesoria.querySelector(".titulo-asesoria").textContent = "Hola, soy el modulo asesoria";

    const clone = templateAsesoria.cloneNode(true);
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

/* Lanzamiento de la vista del menu Valoracion */
btnMenuValoracion.addEventListener('click', function () {
    cardReactivo.innerHTML = "";
    

    templateValoracion.querySelector("#tituloValoracion").textContent = "Hola, soy el modulo Valoracion";

    const clone = templateValoracion.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
});

