const socket = io('/cliente');

const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

/* Templates para renderizado */
const templateAsesoria = document.querySelector('#templateAsesoria').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;
const templateCalificacion = document.querySelector('#templateCalificacion').content;

/* Etiqueta de botones de menu que vienen de HTMl */
let btnMenuInicio = document.querySelector('#btnMenuInicio');
let btnMenuAsesoria = document.querySelector('#btnMenuAsesoria');
let btnMenuIncidente = document.querySelector('#btnMenuIncidente');
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');
let btnMenuCalificacion = document.querySelector('#btnMenuCalificacion');
let btnMenuCerrar = document.querySelector('#btnMenuCerrar');


/* VARIABLES GLOBALES */
let listadoGeneralTitulos = {};

/* SOCKET DE ESCUCHA */
/* Titulo */
socket.on('/cliente/listarTitulo', (data)=>{
    listadoGeneralTitulos = data;
})

/* Evento del boton Inicio */
btnMenuInicio.addEventListener('click', function(){
    location.reload();
})

/* Evento del boton Asesoria */
btnMenuAsesoria.addEventListener('click', function() {
    cardReactivo.innerHTML = "";
    console.log(listadoGeneralTitulos);
    /* templateAsesoria.querySelector(".titulo-asesoria").textContent = persona.nombre; */

    const clone = templateAsesoria.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
});

/* Evento del boton Incidente */
btnMenuIncidente.addEventListener('click', function(){
    cardReactivo.innerHTML = "";
    templateIncidentes.querySelector('#tituloIncidente').textContent = "tituloIncidente";
    const clone = templateIncidentes.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);

})

/* Evento del boton Calificacion */
btnMenuCalificacion.addEventListener('click', function(){
    cardReactivo.innerHTML = "";

    /* templateValoracion.querySelector('#tituloValoracion').textContent = "Soy modulo valoración"; */
    const clone = templateCalificacion.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
})

/* Lanzamiento de la vista del menu configuración */
btnMenuConfiguracion.addEventListener('click', function () {
    cardReactivo.innerHTML = "";

    templateConfiguracion.querySelector("#tituloConfiguracion").textContent = "Hola, soy el modulo configuración";

    const clone = templateConfiguracion.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
});

