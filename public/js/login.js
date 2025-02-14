
// Crear la conexión del socket
const socket = io('/login', {
    withCredentials: true, // Enviar cookies automáticamente
});

// Captura el mensaje desde la URL (localhost:2000/login?mensaje=Hola)
const params = new URLSearchParams(window.location.search);
const mensaje = params.get('mensaje');


// SI hay mensaje mostrarlo en un SweetAlert
if (mensaje) {
    Swal.fire({
        title: 'Atención',
        text: mensaje,
        icon: 'warning',
        confirmButtonText: 'Aceptar'
    }).then(() => {
        // Elimina el parámetro "mensaje" de la URL después de cerrar el modal
        const url = new URL(window.location);
        url.searchParams.delete('mensaje');
        window.history.replaceState(null, '', url);
    });
}

let logo = document.querySelector(".logo-innova");
let inputCorreo = document.querySelector("#correoSesion");
let inputPassword = document.querySelector("#passwordSesion");
let inputDNI = document.querySelector("#dni");
let inputNombre = document.querySelector("#nombre");
let inputTelefono = document.querySelector("#telefono");
let btnRecuperar = document.querySelector(".btn-recueprar-password");
let selectDatos = document.querySelector(".lbx-datos-select");
let btnIngresoInvitado = document.querySelector('#btn-ingresar-invitado');
let btnRegistroInvitado = document.querySelector('#btn-registro-invitado');
let templateDatosInvitado = document.querySelector("#templateDatosInvitado");
let contenedorDatosInvitado = document.querySelector("#contenedorDatosInvitado");

let tipoDocumentoSeleccionado = -1;

let expresiones = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

logo.addEventListener("click", () => {
    window.location.href = "/";
});

inputCorreo.addEventListener("keypress", function (e) {
    if (e.key == 'Enter') {
        inputPassword.focus();
    }
});

inputPassword.addEventListener("keypress", function (e) {
    if (e.key == 'Enter') {
        validarUsuario();
    }
});

/* Recuperacion de contraseña */
btnRecuperar.addEventListener("click", validarCorreoRecuperacion);

/* ========SOCKETS======= */
socket.on('/login/notificaciones', (data) => {
    if (data.tipo === 'Save') {
        Swal.fire({
            position: "center",
            icon: "success",
            text: data.mensaje,
            showConfirmButton: false,
            timer: 2000,
        });
        limpiarRegistro();

        $('#modalRegistro').modal("hide");

        if ($('.modal-backdrop').is(':visible')) {
            $('.modal-backdrop').remove();
        }
    } else if (data.tipo === 'RecuperarPass') {
        Swal.fire({
            position: "center",
            icon: "info",
            text: data.mensaje,
            showConfirmButton: false,
            timer: 3000,
        });

        document.querySelector("#correoRecuperacion").value = "";

        $('#modalRecuperacion').modal("hide");

        if ($('.modal-backdrop').is(':visible')) {
            $('.modal-backdrop').remove();
        }

    } else if (data.tipo === 'Error') {
        Swal.fire({
            title: "Ha ocurrido un error",
            position: "center",
            icon: "error",
            text: data.mensaje,
            showConfirmButton: true,
        });
    } else if (data.tipo === 'Sesion') {
        limpiarLogin();
        document.cookie = "sesion=" + JSON.stringify(data.sesion);
        document.cookie = "loginCliente=false";
        window.location.reload();
    } else if (data.tipo === 'ErrorSesion') {
        Swal.fire({
            title: "Acceso Denegado",
            position: "center",
            icon: "error",
            text: data.mensaje,
            showConfirmButton: true,
        });

        limpiarLogin();
    } else {
        Swal.fire({
            position: "center",
            icon: "info",
            text: data.mensaje,
            showConfirmButton: false,
            timer: 2000,
        });
    }
});

function limpiarRegistro() {
    document.querySelector("#dni").value = "";
    document.querySelector("#nombres").value = "";
    document.querySelector("#telefono").value = "";
}

function verificarDNI() {


    let dni = inputDNI.value;

    if (dni == "") {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Es obligatorio ingresar un DNI para poder ingresar.",
            showConfirmButton: true,
        });

        return;
    } else {
        if (dni.length != 8) {

            Swal.fire({
                title: 'Algo ha salido mal...!!!',
                position: "center",
                icon: "warning",
                text: "Es obligatorio ingresar un DNI válido con 8 dígitos para poder ingresar.",
                showConfirmButton: true,
            });

            return;
        }
    }

    // Verificar si es la primera vez que se ingresa como invitado con este DNI
    socket.emit('/login/verificarDNI', { dni: dni }, (respuesta) => {
        if (respuesta.success) {

            // Redirigir a sitio de invitado
            window.location.href = '/invitado';

        } else {

            inputNombre.classList.remove('d-none');
            inputTelefono.classList.remove('d-none');

            btnIngresoInvitado.classList.add('d-none');
            btnRegistroInvitado.classList.remove('d-none');
            document.querySelector('label[for="nombre"]').classList.remove('d-none');
            document.querySelector('label[for="telefono"]').classList.remove('d-none');
        }
    });
}

function registroAccesoInvitado() {

    let dni = inputDNI.value;
    let nombres = inputNombre.value;
    let telefono = inputTelefono.value;

    if (dni == "") {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Es obligatorio ingresar un DNI para poder ingresar.",
            showConfirmButton: true,
        });

        return;
    }

    if (nombres == "") {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Es obligatorio ingresar un nombre para realizar el registro.",
            showConfirmButton: true,
        });
        return;
    }

    if (telefono == "") {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Es obligatorio ingresar un telefono para realizar el registro.",
            showConfirmButton: true,
        });

        return;
    } else {
        if (telefono.length != 9) {
            Swal.fire({
                title: 'Algo ha salido mal...!!!',
                position: "center",
                icon: "warning",
                text: "Es obligatorio ingresar un numero telefono valido con 9 digitos para realizar el registro.",
                showConfirmButton: true,
            });

            return;
        }
    }

    var objeto = {
        dni,
        nombres,
        telefono
    };

    socket.emit('/login/registrarInvitado', objeto, (respuesta) => {
        if (respuesta.success) {
            window.location.href = '/invitado';
        } else {
            Swal.fire({
                title: 'Algo ha salido mal...',
                text: respuesta.error,
                icon: 'error',
                confirmButtonText: 'Aceptar',
            });
        }
    });
}



/* Incio de Sesion */
function limpiarLogin() {
    document.querySelector("#correoSesion").value = "";
    document.querySelector("#passwordSesion").value = "";
}

function validarUsuario() {

    let correo = document.querySelector("#correoSesion").value;
    let password = document.querySelector("#passwordSesion").value;

    if (correo == "" || password == "") {
        Swal.fire({
            title: 'Importante...!!!',
            position: "center",
            icon: "warning",
            text: "Ingrese sus credenciales.",
            showConfirmButton: true,
        });
    } else {
        let objeto = {
            tipoUsuario: 'PersonalInnova',
            correo: correo,
            password: password,
            nroDocumento: null
        }

        login(objeto);
    }
}

function login(objeto) {

    fetch('/login/validarCredenciales', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(objeto)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                limpiarLogin();
                console.log('Access Token guardado en la cookie:', data.accessToken);
                console.log('Refresh Token guardado en la cookie:', data.refreshToken);

                window.location.reload();
            } else {
                Swal.fire({
                    title: 'Algo ha salido mal.',
                    text: data.error,
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                });
            }
        });
}

function validarCorreoRecuperacion() {
    let correo = document.querySelector("#correoRecuperacion").value;

    if (correo == "") {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Es obligatorio ingresar un correo para recuperar contraseña.",
            showConfirmButton: true,
        });
        return;
    } else {
        let formatoCorreoValido = expresiones.test(correo);

        if (!formatoCorreoValido) {
            Swal.fire({
                title: 'Algo ha salido mal...!!!',
                position: "center",
                icon: "warning",
                text: "Es obligatorio ingresar un correo con formato valido para recuperar contraseña.",
                showConfirmButton: true,
            });
            return;
        }
    }

    let objeto = {
        correo
    }

    socket.emit('/login/validarCorreo', objeto);
}

