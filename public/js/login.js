const socket = io('/login');

let logo = document.querySelector("#logo");
let inputUsuario = document.querySelector("#correoSesion");
let inputPassword = document.querySelector("#passwordSesion");
let lbxDatos = document.querySelectorAll(".lbx-datos");
let btnGuardar = document.querySelector(".btn-guardar-registro");
let btnRecuperar = document.querySelector(".btn-recueprar-password");
let selectDatos = document.querySelector(".lbx-datos-select");

let tipoDocumentoSeleccionado = -1;

let expresiones = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

logo.addEventListener("click", () => {
    window.location.href = "/";
});

inputUsuario.addEventListener("keypress", function (e) {
    if (e.key == 'Enter') {
        inputPassword.focus();
    }
});

inputPassword.addEventListener("keypress", function (e) {
    if (e.key == 'Enter') {
        validarUsuario();
    }
});

/* Cambio de informacion segun el tipo de documento */
lbxDatos.forEach(opcion => {   
    opcion.addEventListener('click', function() {
        let contenedorDatos = document.querySelector("#contenedorDatos");
        contenedorDatos.innerHTML = "";

        if (opcion.classList.contains("op-ruc")) { 
            selectDatos.textContent = "Tipo Documento: RUC";

            tipoDocumentoSeleccionado = 6;

            contenedorDatos.innerHTML = `
                <label for="">N° RUC</label>
                <input id="docc" class="form-control mb-3" type="number">
                <label for="">Razón Social</label>
                <input id="razonSocial" class="form-control mb-3" type="text">
            `
            return;
        } else if (opcion.classList.contains("op-dni")) { 
            selectDatos.textContent = "Tipo Documento: DNI";

            tipoDocumentoSeleccionado = 1;

            contenedorDatos.innerHTML = `
                <label for="">N° Documento</label>
                <input id="docc" class="form-control mb-3" type="number">
                <label for="">Nombres</label>
                <input id="nombres" class="form-control mb-3" type="text">
                <label for="">Apellidos</label>
                <input id="apellidos" class="form-control mb-3" type="text">
            `
            return;
        } else if (opcion.classList.contains("op-otro")) { 
            selectDatos.textContent = "Tipo Documento: OTRO";

            tipoDocumentoSeleccionado = 0;

            contenedorDatos.innerHTML = `
                <label for="">N° Documento</label>
                <input id="docc" class="form-control mb-3" type="text">
                <label for="">Nombres</label>
                <input id="nombres" class="form-control mb-3" type="text">
                <label for="">Apellidos</label>
                <input id="apellidos" class="form-control mb-3" type="text">
            `
            return;
        } else {
            selectDatos.textContent = "Seleccione tipo documento";
            tipoDocumentoSeleccionado = -1;
            contenedorDatos.innerHTML = "";
        }
    });
});

/* Guardar Registro */
btnGuardar.addEventListener("click", validarRegistro);

/* Recuperacion de contraseña */
btnRecuperar.addEventListener("click", validarCorreoRecuperacion);

/* ========SOCKETS======= */
socket.on('/login/notificaciones', (data) => {
    if(data.tipo==='Save'){
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
    } else if(data.tipo==='RecuperarPass'){
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

    }else if(data.tipo==='Error'){
        Swal.fire({
            title: "Ha ocurrido un error",
            position: "center",
            icon: "error",
            text: data.mensaje,
            showConfirmButton: true,
        });
    } else if(data.tipo==='Sesion'){
        limpiarLogin();
        document.cookie = "sesion="+JSON.stringify(data.sesion);
        document.cookie = "loginCliente=false";
        window.location.reload();
    } else if(data.tipo==='ErrorSesion'){
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
    document.querySelector("#correoRegistro").value = "";
    document.querySelector("#passwordRegistro").value = "";
    document.querySelector("#direccion").value = "";
    document.querySelector("#telefono").value = "";

    selectDatos.textContent = "Seleccione tipo documento";
    tipoDocumentoSeleccionado = -1;
    document.querySelector("#contenedorDatos").innerHTML = "";
}

function validarRegistro() {
    let correo = document.querySelector("#correoRegistro").value;
    let password = document.querySelector("#passwordRegistro").value;
    let docc = "";
    let razonSocial = "";
    let nombres = "";
    let apellidos = "";
    let direccion = document.querySelector("#direccion").value;
    let telefono = document.querySelector("#telefono").value;
    
    if(correo=="") {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Es obligatorio ingresar un correo para realizar el registro.",
            showConfirmButton: true,
        });

        return;
    } else {
        let formatoCorreoValido = expresiones.test(correo);

        if(!formatoCorreoValido){
            Swal.fire({
                title: 'Algo ha salido mal...!!!',
                position: "center",
                icon: "warning",
                text: "Es obligatorio ingresar un correo con formato valido para realizar el registro.",
                showConfirmButton: true,
            });
            return;
        }
    }
    if(password=="") {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Es obligatorio ingresar una contraseña para realizar el registro.",
            showConfirmButton: true,
        });

        return;
    }
    if(tipoDocumentoSeleccionado==-1) {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Es obligatorio seleccionar un tipo de documento para realizar el registro.",
            showConfirmButton: true,
        });

        return;
    } else {
        docc = document.querySelector("#docc").value;
    
        if(tipoDocumentoSeleccionado==6){
            if(docc=="") {
                Swal.fire({
                    title: 'Algo ha salido mal...!!!',
                    position: "center",
                    icon: "warning",
                    text: "Es obligatorio ingresar un numero de documento para realizar el registro.",
                    showConfirmButton: true,
                });
    
                return;
            } else {
                if(docc.length!=11) {
                    Swal.fire({
                        title: 'Algo ha salido mal...!!!',
                        position: "center",
                        icon: "warning",
                        text: "Es obligatorio ingresar un numero de ruc valido con 11 digitos para realizar el registro.",
                        showConfirmButton: true,
                    });
        
                    return;
                }
            }

            razonSocial = document.querySelector("#razonSocial").value;
            if(razonSocial=="") {
                Swal.fire({
                    title: 'Algo ha salido mal...!!!',
                    position: "center",
                    icon: "warning",
                    text: "Es obligatorio ingresar una razon social para realizar el registro.",
                    showConfirmButton: true,
                });

                return;
            }
        } else {
            if(tipoDocumentoSeleccionado==1){
                if(docc=="") {
                    Swal.fire({
                        title: 'Algo ha salido mal...!!!',
                        position: "center",
                        icon: "warning",
                        text: "Es obligatorio ingresar un numero de documento para realizar el registro.",
                        showConfirmButton: true,
                    });
        
                    return;
                } else {
                    if(docc.length!=8) {
                        Swal.fire({
                            title: 'Algo ha salido mal...!!!',
                            position: "center",
                            icon: "warning",
                            text: "Es obligatorio ingresar un numero de dni valido con 8 digitos para realizar el registro.",
                            showConfirmButton: true,
                        });
            
                        return;
                    }
                }
            } else {
                if(docc=="") {
                    Swal.fire({
                        title: 'Algo ha salido mal...!!!',
                        position: "center",
                        icon: "warning",
                        text: "Es obligatorio ingresar un numero de documento para realizar el registro.",
                        showConfirmButton: true,
                    });
        
                    return;
                }
            }

            nombres = document.querySelector("#nombres").value;
            if(nombres=="") {
                Swal.fire({
                    title: 'Algo ha salido mal...!!!',
                    position: "center",
                    icon: "warning",
                    text: "Es obligatorio ingresar un nombre para realizar el registro.",
                    showConfirmButton: true,
                });

                return;
            }

            apellidos = document.querySelector("#apellidos").value;
            if(apellidos=="") {
                Swal.fire({
                    title: 'Algo ha salido mal...!!!',
                    position: "center",
                    icon: "warning",
                    text: "Es obligatorio ingresar un apellido para realizar el registro.",
                    showConfirmButton: true,
                });

                return;
            }
        }
    }
    if(direccion=="") {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Es obligatorio ingresar una direccion para realizar el registro.",
            showConfirmButton: true,
        });

        return;
    }
    if(telefono=="") {
        Swal.fire({
            title: 'Algo ha salido mal...!!!',
            position: "center",
            icon: "warning",
            text: "Es obligatorio ingresar un telefono para realizar el registro.",
            showConfirmButton: true,
        });

        return;
    } else {
        if(telefono.length!=9) {
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
        correo,
        password,
        tipoDoc : tipoDocumentoSeleccionado,
        docc,
        razonSocial,
        nombres,
        apellidos,
        direccion,
        telefono
    };

    guardarRegistro(objeto);
}

function guardarRegistro(objeto) {
    socket.emit('/login/registrarCliente', objeto);
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
            correo,
            password
        }

        login(objeto);
    }
}

function login(objeto) {
    socket.emit('/login/validarCredenciales', objeto);
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
    }else{
        let formatoCorreoValido = expresiones.test(correo);

        if(!formatoCorreoValido){
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

    let objeto ={
        correo
    }

    socket.emit('/login/validarCorreo', objeto);
}