const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

/* Templates para renderizado */

const templateAsesoria = document.querySelector('#templateAsesoria').content;
const templateValoracion = document.querySelector('#templateValoracion').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;

/* Etiqueta de botones de menu que vienen de HTMl */
let btnMenuAsesoria = document.querySelector('#btnMenuAsesoria');
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');
let btnMenuValoracion = document.querySelector('#btnMenuValoracion');





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

// Script para Manejar la Transición entre Modales (Opcional)

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

document.getElementById('formulario-editar').addEventListener('submit', function (event) {
    event.preventDefault();  // Evita que se envíe el formulario si las contraseñas no coinciden
    verificarContraseñas();
});

document.getElementById('confirmContraseña').addEventListener('input', verificarContraseñas);
document.getElementById('contraseña').addEventListener('input', verificarContraseñas);

function verificarContraseñas() {
    const contraseña = document.getElementById('contraseña').value;
    const confirmContraseña = document.getElementById('confirmContraseña').value;
    const errorMessage = document.getElementById('mensaje-error');

    if (contraseña !== confirmContraseña) {
        document.getElementById('contraseña').classList.add('error');
        document.getElementById('confirmContraseña').classList.add('error');
        errorMessage.style.display = 'block';
    } else {
        document.getElementById('contraseña').classList.remove('error');
        document.getElementById('confirmContraseña').classList.remove('error');
        errorMessage.style.display = 'none';
    }
}


