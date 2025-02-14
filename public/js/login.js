
// Crear la conexión del socket
const socket = io('/login', {
    withCredentials: true, // Enviar cookies automáticamente
});

// Captura el mensaje desde la URL
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
let btnRecuperar = document.querySelector(".btn-recueprar-password");
let selectDatos = document.querySelector(".lbx-datos-select");
let btnIngresoClientes = document.querySelector('#ingreso-clientes-tab');
let btnIngresoPersonal = document.querySelector('#ingreso-personal-tab');

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

function validarRegistroInvidato() {

    let dni = document.querySelector("#dni").value;
    let nombres = document.querySelector("#nombres").value;
    let telefono = document.querySelector("#telefono").value;

    if (dni == "") {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Es obligatorio ingresar un DNI para realizar el registro.",
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
                    text: 'Error al ingresar al manual, intenta nuevamente.',
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

