const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

/* Templates para renderizado */
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;

/* Etiqueta de botones de menu que vienen de HTMl */
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');
let btnMenuIncidentes = document.querySelector('#btnMenuIncidentes');

/* Lanzamiento de la vista del menu configuración */
btnMenuConfiguracion.addEventListener('click', function () {
    cardReactivo.innerHTML = "";

    templateConfiguracion.querySelector("#tituloConfiguracion").textContent = "Hola, soy el modulo configuración";

    const clone = templateConfiguracion.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
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

/* Lanzamiento de la vista del menu Incidentes */
btnMenuIncidentes.addEventListener('click', function () {
    cardReactivo.innerHTML = "";

    templateIncidentes.querySelector("#tituloIncidentes").textContent = "Hola soy el modulo Incidentes";

    const clone = templateIncidentes.cloneNode(true);
    fragmento.appendChild(clone);

    cardReactivo.appendChild(fragmento);
});
