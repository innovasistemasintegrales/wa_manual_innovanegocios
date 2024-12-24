const socket = io('/soporte'); // Conectar al namespace administrador
socket.on('connect', () => {
  console.log('Conectado al namespace /soporte');
});

const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

//TODO ========================= TEMPLATES ========================
// Template para las diferentes secciones
const templateInicio = document.querySelector('#cardReactivo').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;
const templateReportes = document.querySelector('#templateReportes').content;

// Template para las diferentes listas
const templateItemIncidente = templateIncidentes.querySelector('#templateItemIncidente').content;

// Template para modales
// const templateModalNuevoUsuario = document.querySelector('#templateModalUsuario').content;
const templateModalUsuario = document.querySelector('#templateModalUsuario').content;
const templateModalIncidente = document.querySelector('#templateModalIncidente').content;
const templateModalNuevoIncidente = document.querySelector('#templateModalNuevoIncidente').content;

//TODO ======================= BOTONES - INPUTS - CONTENEDORES ========================
// Botonoes para cambiar de sección
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');
let btnMenuIncidentes = document.querySelector('#btnMenuIncidentes');
let btnMenuReportes = document.querySelector('#btnMenuReportes');
let btnMenuInicio = document.querySelector('#btnMenuInicio');
let ultimaSeccion = localStorage.getItem('ultimaSeccion') || 'Inicio';
let seccionActual = 'Inicio';

let opcionesTipoIncidente;
let seleccionEstadoIncidente = localStorage.getItem('seleccionEstadoIncidente') || 'Todos';
console.log("seleccionEstadoIncidente: ", seleccionEstadoIncidente);
let switchIncidentesReasignados;
let btnAbrirNuevoIncidente;

// Modales
const modalIncidente = new bootstrap.Modal(document.getElementById('modalIncidente'));
const modalNuevoIncidente = new bootstrap.Modal(document.getElementById('modalNuevoIncidente'));
const modalReasignar = new bootstrap.Modal(document.getElementById('modalReasignar'));
const modalUsuario = new bootstrap.Modal(document.getElementById('modalUsuario'));
const formNuevoIncidente = document.getElementById('modalNuevoIncidente');

// Otros botones
const botonesCancelarIncidente = document.querySelectorAll('#btnCerrarIncidente');
const botonesCancelarReasignar = document.querySelectorAll('#btnCancelarReasignar');
const btnReasignar = document.querySelector('#modalIncidente #btnReasignarIncidente');
const btnEnviarRespuestaIncidente = document.querySelector('#modalIncidente #btnEnviarRespuestaIncidente');
const botonesCerrarUsuario = document.querySelectorAll('#btnCerrarUsuario');
const btnCrearNuevoIncidente = document.querySelector('#modalNuevoIncidente #btnCrearNuevoIncidente');
const botonesCancelarNuevoIncidente = document.querySelectorAll('#btnCancelarNuevoIncidente');

// Contenedores
let contenedorModalUsuario;
let contenedorIncidentes;
let contenedorModalIncidente;
let contenedorModalNuevoIncidente;

// Selecciones
let incidenteSeleccionado;
let usuarioSeleccionado;

//TODO ======================== VARIABLES GLOBALES ========================
// let listadoGeneralReportes = {};
let listadoGeneralIncidentes = {};
let limiteIncidentes = localStorage.getItem('limiteIncidentes') || 1000;
let paginaActualIncidentes = 1; // Página inicial
let hayMasIncidentes = true; // Indicador para saber si hay más incidentes

let confirmAction = null; // Variable para almacenar la función de confirmación actual en el modal de confirmación

//TODO ======================== ESCUCHA DE EVENTOS PARA SINCRONIZACIÓN DE DATOS EN TIEMPO REAL ========================
// ? SINCRONIZACIÒN INCIDENTES
socket.on('/soporte/nuevoIncidente', function (data) {
  console.log('Nuevo incidente recibido:', data);

  if (Object.keys(listadoGeneralIncidentes).length > 0) {
    // Añadir el nuevo incidente al listado general
    listadoGeneralIncidentes.unshift(data);

    if (seccionActual === 'Incidentes') {
      // Verificar si el nuevo incidente cumple con los filtros actuales
      const agregarPorEstado = data.estado === seleccionEstadoIncidente || seleccionEstadoIncidente === 'Todos';
      const agregarPorReasignados = !switchIncidentesReasignados.checked || data.dni_tecnico;

      if (agregarPorEstado && agregarPorReasignados) {
        const template = document.getElementById('templateItemIncidente');
        const clone = document.importNode(template.content, true);

        // Asignar valores del nuevo incidente
        clone.querySelector('.incidente').setAttribute('data-id', data.id_incidente);
        clone.querySelector(".num-incidente .detalles-lista").textContent = data.id_incidente;
        clone.querySelector('.nombre-incidente .detalles-lista').textContent = data.titulo;
        clone.querySelector('.detalles-incidente .detalles-lista').textContent = data.descripcion_incidente;
        clone.querySelector('.nombre-empresa .detalles-lista').textContent = data.razon_social;
        clone.querySelector('.fecha-incidente .detalles-lista').textContent = new Date(data.fecha_creacion).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true, // Para formato AM/PM
        });
        clone.querySelector('.estado-incidente .detalles-lista').textContent = data.estado;
        clone.querySelector('.estado-incidente .detalles-lista').classList.remove('estado-incidente-Pendiente', 'estado-incidente-Resuelto');
        clone.querySelector('.estado-incidente .detalles-lista').classList.add(`estado-incidente-${data.estado}`);
        clone.querySelector('.btn-abrir-incidente').setAttribute('data-id', data.id_incidente);

        // Insertar el nuevo incidente al inicio del contenedor
        document.getElementById('contenedorIncidentes').insertBefore(clone, document.getElementById('contenedorIncidentes').firstChild);

      }
    }
  }
  // Mostrar un toast o notificación no invasiva
  mostrarToast(
    'Nuevo Incidente',
    `Se ha registrado un nuevo incidente: <strong>${data.titulo}</strong>.`,
    'info',
    7000
  );

});
socket.on('/soporte/actualizacionIncidente', function (data) {
  console.log('Incidente actualizado recibido: ' + data);
  for (let i = 0; i < listadoGeneralIncidentes.length; i++) {
    if (listadoGeneralIncidentes[i].id === data.id) {
      listadoGeneralIncidentes[i] = data;
      break;
    }
  }

});
socket.on('/soporte/eliminacionIncidente', function (data) {
  console.log('Incidente eliminado recibido: ' + data);
  for (let i = 0; i < listadoGeneralIncidentes.length; i++) {
    if (listadoGeneralIncidentes[i].id === data.id) {
      listadoGeneralIncidentes.splice(i, 1);
      break;
    }
  }
  if (seccionActual === 'Incidentes') {
    listarIncidentes(paginaActualIncidentes, limiteIncidentes);
  }
});


//TODO ======================== LANZAMIENTO DE VISTAS ========================
// Inicio
btnMenuInicio.addEventListener('click', function () {
  location.reload();

  localStorage.setItem("ultimaSeccion", 'Inicio');
  seccionActual = 'Inicio';
})
// Lanzamiento de la vista del menu Incidentes
btnMenuIncidentes.addEventListener('click', function () {
  localStorage.setItem('ultimaSeccion', 'Incidentes');
  seccionActual = 'Incidentes';

  cardReactivo.innerHTML = "";
  const clone = templateIncidentes.cloneNode(true);
  fragmento.appendChild(clone);
  cardReactivo.appendChild(fragmento);

  // filtrar incidentes reasignados
  switchIncidentesReasignados = document.querySelector('#switchIncidentesReasignados');
  contenedorIncidentes = document.querySelector(`#contenedorIncidentes`);
  opcionesTipoIncidente = document.querySelectorAll('.opcion-estado-incidente');
  btnAbrirNuevoIncidente = document.querySelector('#btnAbrirNuevoIncidente');
  let inputRadio = document.querySelector(`.op-incidentes-${seleccionEstadoIncidente}`);
  inputRadio.checked = true;
  inputRadio.click();

  if (Object.keys(listadoGeneralIncidentes).length > 0) {
    console.log("No se consultaron los incidentes porque ya se cargaron");
    listarIncidentes(paginaActualIncidentes, limiteIncidentes);
  } else {
    socket.emit("/soporte/listadoIncidentes", { pagina: 1, limite: limiteIncidentes, estado: 'Todos' }, (respuesta) => {
      if (respuesta.success) {

        console.log("Se consultaron los incidentes: ", respuesta.data);
        listadoGeneralIncidentes = respuesta.data;
        listarIncidentes(paginaActualIncidentes, limiteIncidentes);

      } else {
        console.log(respuesta.error)
      }
    });
  }

  opcionesTipoIncidente.forEach(opcion => {

    opcion.addEventListener('click', function () {
      if (opcion.classList.contains("op-incidentes-Todos")) {
        seleccionEstadoIncidente = "Todos";
        localStorage.setItem('seleccionEstadoIncidente', seleccionEstadoIncidente)
      } else if (opcion.classList.contains("op-incidentes-Pendiente")) {
        seleccionEstadoIncidente = "Pendiente";
        localStorage.setItem('seleccionEstadoIncidente', seleccionEstadoIncidente)
      } else if (opcion.classList.contains("op-incidentes-Resuelto")) {
        seleccionEstadoIncidente = "Resuelto";
        localStorage.setItem('seleccionEstadoIncidente', seleccionEstadoIncidente)
      }
      listarIncidentes(paginaActualIncidentes, limiteIncidentes);

    });
  });

  switchIncidentesReasignados.addEventListener('click', function () {
    listarIncidentes(paginaActualIncidentes, limiteIncidentes);
  });

  // Crear botón "Cargar más" si no existe
  // let btnCargarMas = document.querySelector('#btnCargarMas');
  // if (!btnCargarMas) {
  //     btnCargarMas = document.createElement('button');
  //     btnCargarMas.id = 'btnCargarMas';
  //     btnCargarMas.textContent = 'Cargar más';
  //     btnCargarMas.className = 'btn btn-primary my-3';
  //     btnCargarMas.style.display = 'none'; // Ocultar inicialmente
  //     contenedorIncidentes.parentElement.appendChild(btnCargarMas);

  //     // Evento para cargar más incidentes
  //     btnCargarMas.addEventListener('click', () => {
  //         paginaActualIncidentes++;
  //         socket.emit("/soporte/listadoIncidentes", { pagina: paginaActualIncidentes, limite: limiteIncidentes, estado: seleccionEstadoIncidente }, (respuesta) => {
  //             if (respuesta.success) {
  //                 console.log("Incidentes cargados: ", respuesta.data);
  //                 listadoGeneralIncidentes.push(...respuesta.data);

  //                 if (respuesta.hayMasIncidentes && respuesta.estado === 'Todos') {
  //                     hayMasIncidentesTodos = respuesta.hayMasIncidentes;
  //                 } else if (respuesta.hayMasIncidentes && respuesta.estado === 'Pendiente') {
  //                     hayMasIncidentesPendientes = respuesta.hayMasIncidentes;
  //                 } else if (respuesta.hayMasIncidentes && respuesta.estado === 'Resuelto') {
  //                     hayMasIncidentesResueltos = respuesta.hayMasIncidentes;
  //                 }

  //                 listarIncidentes(paginaActualIncidentes, limiteIncidentes);
  //             } else {
  //                 console.log(respuesta.error);
  //                 hayMasIncidentes = false;
  //             }
  //         });
  //     });
  // }

  btnAbrirNuevoIncidente.addEventListener('click', function () {
    abrirModalNuevoIncidente();
  });

  contenedorIncidentes.addEventListener('click', e => {
    abrirIncidente(e)
  }
  )

});
// Lanzamiento de la vista del menu reportes
btnMenuReportes.addEventListener('click', () => {
  localStorage.setItem('ultimaSeccion', 'Reportes');
  seccionActual = 'Reportes';
  cardReactivo.innerHTML = "";

  const clone = templateReportes.cloneNode(true);
  fragmento.appendChild(clone);
  cardReactivo.appendChild(fragmento);

  let radioReportesIncidentes = document.querySelector('#radioReportesIncidentes');
  let radioReportesValoracion = document.querySelector('#radioReportesValoracion');
  let radioReportesGuardados = document.querySelector('#radioReportesGuardados');

  let seccionReportesIncidentes = document.querySelector('#seccionReportesIncidentes');
  let seccionReportesValoracion = document.querySelector('#seccionReportesValoracion');
  let seccionReportesGuardados = document.querySelector('#seccionReportesGuardados');

  if (seccionReportesIncidentes && seccionReportesValoracion && seccionReportesGuardados) {

    radioReportesIncidentes.addEventListener('click', () => {
      if (radioReportesIncidentes.checked) {
        seccionReportesIncidentes.classList.remove('d-none');
        seccionReportesGuardados.classList.add('d-none');
        seccionReportesValoracion.classList.add('d-none');
      }
    });

    radioReportesValoracion.addEventListener('click', () => {
      if (radioReportesValoracion.checked) {
        seccionReportesValoracion.classList.remove('d-none');
        seccionReportesGuardados.classList.add('d-none');
        seccionReportesIncidentes.classList.add('d-none');
      }
    });

    radioReportesGuardados.addEventListener('click', () => {
      if (radioReportesGuardados.checked) {
        seccionReportesGuardados.classList.remove('d-none');
        seccionReportesValoracion.classList.add('d-none');
        seccionReportesIncidentes.classList.add('d-none');
      }
    });
  }

  /* Filtro de busqueda */
  document.addEventListener("keyup", e => {
    if (e.target.matches("#buscador")) {
      // Limpiar el campo si se presiona Escape
      if (e.key === "Escape") e.target.value = "";
      // Obtener el valor de búsqueda en minúsculas
      const busqueda = e.target.value.toLowerCase();
      // Recorrer cada fila de la tabla (cada incidente)
      document.querySelectorAll(".reporteIncidente").forEach(incidente => {
        // Buscar en el contenido de la fila: número, incidente, detalles, empresa, estado
        const textoFila = incidente.textContent.toLowerCase();
        // Si la búsqueda coincide con algún texto en la fila, la muestra, de lo contrario la oculta
        textoFila.includes(busqueda)
          ? incidente.classList.remove("d-none")
          : incidente.classList.add("d-none");
      });
    }
  });

  //Filtro de busqueda por fecha
  document.addEventListener("change", e => {

    if (e.target.matches("#buscador-fecha")) {

      const fechaSeleccionada = e.target.value; // Fecha seleccionada en formato AAAA-MM-DD

      document.querySelectorAll(".reporteIncidente").forEach(incidente => {
        // Obtener la fecha de cada fila (deberías asegurarte de que la fecha esté en el formato correcto)
        const fechaIncidente = incidente.querySelector(".fecha-incidente .detalles-lista").textContent;

        // Convertimos la fecha del incidente y la fecha seleccionada a un formato que se pueda comparar
        const [dia, mes, an] = fechaIncidente.split('/'); // Suponiendo que la fecha está en formato DD/MM/AAAA
        const fechaFormateada = `${an}-${mes}-${dia}`; // Formato AAAA-MM-DD

        // Si la fecha del incidente coincide con la seleccionada, la fila se muestra, de lo contrario se oculta
        fechaFormateada === fechaSeleccionada
          ? incidente.classList.remove("d-none")
          : incidente.classList.add("d-none");
      });
    }
  })
})
// Lanzamiento de la vista del menu configuración
btnMenuConfiguracion.addEventListener('click', function () {
  localStorage.setItem('ultimaSeccion', 'Configuracion');
  seccionActual = 'Configuracion';
  cardReactivo.innerHTML = "";

  // templateConfiguracion.querySelector("#tituloConfiguracion").textContent = "Hola, soy el modulo configuración";

  const clone = templateConfiguracion.cloneNode(true);
  fragmento.appendChild(clone);

  cardReactivo.appendChild(fragmento);


  // Selecciona el contenedor de configuración o el template que se muestra al hacer click
  const formConfiguracionUsuario = document.getElementById('editarUsuarioConfiguracion');

  // Botones dentro de la sección de configuración
  const btnEditarUsuario = formConfiguracionUsuario.querySelector('#editButton');
  const btnCancelarEdicion = formConfiguracionUsuario.querySelector('#cancelButton');
  const btnGuardarCambios = formConfiguracionUsuario.querySelector('#saveButton');

  // Estado original para restaurar al cancelar
  let estadoOriginal = {};

  // Listeners para los botones de editar, cancelar y guardar
  btnEditarUsuario.addEventListener('click', () => habilitarEdicion(formConfiguracionUsuario));
  btnCancelarEdicion.addEventListener('click', () => cancelarEdicion(formConfiguracionUsuario, estadoOriginal));
  btnGuardarCambios.addEventListener('click', () => guardarCambios(btnGuardarCambios, formConfiguracionUsuario));

  // Guardar estado original al iniciar la configuración
  guardarEstadoOriginal(formConfiguracionUsuario, estadoOriginal);

  // Validación en tiempo real para los inputs
  formConfiguracionUsuario.querySelectorAll('input:not([type="file"]):not(#nacimientoUsuario):not([type="radio"])').forEach(input => {
    input.addEventListener('input', () => {
      const esValido = validarCampoConfiguracion(input);
      verificarCambios(formConfiguracionUsuario, estadoOriginal, btnGuardarCambios);
      btnGuardarCambios.disabled = !esValido;
    });
  });
});

//TODO ======================== FUNCIONES ========================

function abrirUsuario(e) {
  if (e.target.classList.contains('btn-abrir-usuario')) {
    console.log(e.target.dataset.id);
    let usuario = listadoGeneralUsuarios.find(usuario => usuario.dni === e.target.dataset.id);
    console.log("Usuario seleccionado: ", usuario);
    usuarioSeleccionado = usuario.dni;

    modalUsuario.show();
    templateModalUsuario.querySelector('#nombreUpdateUser').value = `${usuario.nombres} ${usuario.apellidos}`;
    templateModalUsuario.querySelector('#correoUpdateUser').value = usuario.correo;
    templateModalUsuario.querySelector('#dniUpdateUser').value = usuario.dni;
    templateModalUsuario.querySelector('#telefonoUpdateUser').value = usuario.telefono;
    templateModalUsuario.querySelector('#direccionUpdateUser').value = usuario.direccion;
    // Convierte la fecha de nacimiento al formato "YYYY-MM-DD"
    const fechaNacimiento = usuario.fecha_nacimiento
      ? new Date(usuario.fecha_nacimiento).toISOString().slice(0, 10)
      : ""; // Si no hay fecha, asigna un valor vacío
    templateModalUsuario.querySelector('#nacimientoUpdateUser').value = fechaNacimiento;

    if (usuario.id_rol == 1) { templateModalUsuario.querySelector('#rolAdministradorUpdate').checked = true; }
    if (usuario.id_rol == 2) { templateModalUsuario.querySelector('#rolTecnicoUpdate').checked = true; }
    if (usuario.id_rol == 3) { templateModalUsuario.querySelector('#rolSoporteUpdate').checked = true; }
    if (usuario.id_rol == 4) { templateModalUsuario.querySelector('#rolClienteUpdate').checked = true; }
    // templateModalUsuario.querySelector('#estadoUpdateUser').value = usuario.estado;

    contenedorModalUsuario = document.querySelector('.contenedorModalUsuario');
    contenedorModalUsuario.innerHTML = "";
    let clone = templateModalUsuario.cloneNode(true);
    contenedorModalUsuario.appendChild(clone);

  }
}

function listarIncidentes(pagina, limite) {
  console.log(`Función listarIncidentes(${pagina}, ${limite})`);
  contenedorIncidentes.innerHTML = "";

  let incidentesFiltrados = 0;

  listadoGeneralIncidentes.forEach(incidente => {

    let agregarPorEstado = incidente.estado === seleccionEstadoIncidente || seleccionEstadoIncidente === 'Todos';
    let agregarPorReasignados = !switchIncidentesReasignados.checked || incidente.dni_tecnico;

    if (agregarPorEstado && agregarPorReasignados) {

      templateItemIncidente.querySelector(".num-incidente .detalles-lista").textContent = incidente.id_incidente;
      templateItemIncidente.querySelector(".nombre-incidente .detalles-lista").innerHTML = `${incidente.titulo} ${incidente.dni_tecnico ? '<span class="badge bg-warning text-dark">Reasignado</span>' : ''}`;

      templateItemIncidente.querySelector(".detalles-incidente .detalles-lista").textContent = incidente.descripcion_incidente;
      templateItemIncidente.querySelector(".nombre-empresa .detalles-lista").textContent = incidente.razon_social;
      // Formatear la fecha de creación con horas y minutos
      let fechaCreacion = new Date(incidente.fecha_creacion);
      let fechaFormateada = new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // Para formato AM/PM
      }).format(fechaCreacion);
      templateItemIncidente.querySelector(".fecha-incidente .detalles-lista").textContent = fechaFormateada || 'Sin fecha de creación';
      // clone.querySelector(".estado-usuario .detalles-lista").innerHTML = `<input class="form-check-input" type="checkbox" value="" id="flexCheckDefault" ${usuario.estado ? "checked" : null} disabled>`;
      let itemEstadoIncidente = templateItemIncidente.querySelector(".estado-incidente .detalles-lista");
      itemEstadoIncidente.textContent = incidente.estado;
      itemEstadoIncidente.classList.remove(`estado-incidente-Pendiente`, `estado-incidente-Resuelto`);
      itemEstadoIncidente.classList.add(`estado-incidente-${incidente.estado}`);
      templateItemIncidente.querySelector(".btn-abrir-incidente").dataset.id = incidente.id_incidente;

      const clone = templateItemIncidente.cloneNode(true);
      fragmento.appendChild(clone);

      incidentesFiltrados += 1;
    }
  });

  let divSinResultados = document.querySelector(`#divSinResultadosIncidentes`);
  divSinResultados.innerHTML = '';

  if (incidentesFiltrados === 0) {
    divSinResultados.innerHTML =
      `
                <div class="d-flex justify-content-center align-items-center my-5">
                    <p class="text-center">Sin incidentes...</p>
                </div>
            `
  } else {
    contenedorIncidentes.appendChild(fragmento);
  }

  // Mostrar u ocultar el botón "Cargar más"
  // const btnCargarMas = document.querySelector('#btnCargarMas');
  // if (!hayMasIncidentes) {
  //     btnCargarMas.style.display = 'none';
  // } else {
  //     btnCargarMas.style.display = 'block';
  // }
}

function crearNuevoIncidente(formNuevoIncidente) {

  let nombreIncidente = formNuevoIncidente.querySelector("#tituloNuevoIncidente").value.trim();
  let descripcionIncidente = formNuevoIncidente.querySelector("#descripcionNuevoIncidente").value.trim();
  // let imagenesIncidente = formNuevoIncidente.querySelector("#filesNuevoIncidente").files;

  if (nombreIncidente === "" || descripcionIncidente === "") {
    Swal.fire({
      title: 'El nombre y la descripción son obligatorios para enviar el incidente.',
      position: "center",
      icon: "warning",
      showConfirmButton: true,
    });
    return;
  }

  let nuevoIncidente = {
    titulo: nombreIncidente,
    descripcion_incidente: descripcionIncidente,
    cliente_dni: "72156100",
    ruc_empresa: "12345678901",
    dni_soporte: "87654321",
  };

  socket.emit("/soporte/crearNuevoIncidente", nuevoIncidente, (respuesta) => {
    if (respuesta.success) {
      Swal.fire({
        title: 'El incidente ha sido enviado exitosamente!',
        position: "center",
        icon: "success",
        showConfirmButton: true,
      });
      modalNuevoIncidente.hide();

    } else {
      console.log(respuesta.error)
      Swal.fire({
        title: 'Hubo un problema al crear el nuevo incidente',
        position: "center",
        icon: "error",
        text: `Inténtalo de nuevo`,
        showConfirmButton: true,
      });
    }
  });
}

function abrirIncidente(e) {
  if (e.target.classList.contains('btn-abrir-incidente')) {
    let incidente = listadoGeneralIncidentes.find(incidente => incidente.id_incidente === Number(e.target.dataset.id));
    console.log("Incidente seleccionado: ", incidente);
    incidenteSeleccionado = incidente.id_incidente;

    // Convertir la fecha_creacion en formato legible
    const fechaCreacion = new Date(incidente.fecha_creacion);
    const fechaFormateada = fechaCreacion.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const horaFormateada = fechaCreacion.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true // Formato AM/PM
    });

    // Asignar valores al modal
    templateModalIncidente.querySelector(".numero-incidente").textContent = incidente.id_incidente;
    templateModalIncidente.querySelector(".empresa").textContent = incidente.razon_social;
    templateModalIncidente.querySelector(".nombre-incidente").innerHTML = `${incidente.titulo} ${incidente.dni_tecnico ? '<span class="badge bg-warning text-dark">Reasignado</span>' : ''}`;
    templateModalIncidente.querySelector(".detalles").textContent = incidente.descripcion_incidente;

    // Asignar fecha y hora al modal
    templateModalIncidente.querySelector("#fechaIncidente").textContent = fechaFormateada;
    templateModalIncidente.querySelector("#horaIncidente").textContent = horaFormateada;

    templateModalIncidente.querySelector(".estado").textContent = incidente.estado;
    templateModalIncidente.querySelector(".estado").classList.remove('estado-incidente-Resuelto', 'estado-incidente-Pendiente');
    templateModalIncidente.querySelector(".estado").classList.add(`estado-incidente-${incidente.estado}`);

    btnReasignar.classList.remove('d-none', 'd-block')
    btnEnviarRespuestaIncidente.classList.remove('d-none', 'd-block')
    if (incidente.estado === 'Resuelto') {
      btnReasignar.classList.add('d-none');
      btnEnviarRespuestaIncidente.classList.add('d-none');
    } else if (incidente.estado === 'Pendiente') {
      btnReasignar.classList.add('d-block');
      btnEnviarRespuestaIncidente.classList.add('d-block')
    }

    contenedorModalIncidente = document.querySelector('.contenedorModalIncidente');
    contenedorModalIncidente.innerHTML = "";
    let clone = templateModalIncidente.cloneNode(true);
    contenedorModalIncidente.appendChild(clone);

    modalIncidente.show();
  }
}

function abrirModalNuevoIncidente() {
  contenedorModalNuevoIncidente = document.querySelector('.contenedorModalNuevoIncidente');
  contenedorModalNuevoIncidente.innerHTML = "";

  // Obtener la fecha estática al abrir la modal
  let fechaHora = new Date();
  let fecha = fechaHora.getDate().toString().padStart(2, '0') + "/" +
    (fechaHora.getMonth() + 1).toString().padStart(2, '0') + "/" +
    fechaHora.getFullYear();

  // Asignar la fecha al elemento correspondiente
  templateModalNuevoIncidente.querySelector("#fechaNuevoIncidente").textContent = fecha;

  // Función para actualizar la hora dinámicamente
  function actualizarHora() {
    let ahora = new Date();

    // Formatear la hora a 12 horas con AM/PM
    let horas = ahora.getHours();
    let minutos = ahora.getMinutes().toString().padStart(2, '0');
    let segundos = ahora.getSeconds().toString().padStart(2, '0');
    let sufijo = horas >= 12 ? "PM" : "AM";
    horas = horas % 12 || 12; // Convierte 0 (medianoche) a 12

    let hora = `${horas}:${minutos}:${segundos} ${sufijo}`;
    let horaElemento = document.querySelector("#horaNuevoIncidente");
    if (horaElemento) {
      horaElemento.textContent = hora;
    }
  }

  // Iniciar la actualización de la hora
  setInterval(actualizarHora, 1000);

  // Asignar valores iniciales a los campos del modal
  templateModalNuevoIncidente.querySelector("#tituloNuevoIncidente").value = "";
  templateModalNuevoIncidente.querySelector("#descripcionNuevoIncidente").value = "";

  let clone = templateModalNuevoIncidente.cloneNode(true);
  contenedorModalNuevoIncidente.appendChild(clone);

  modalNuevoIncidente.show();

  // Ejecutar la función de actualización de la hora de inmediato
  actualizarHora();
}

// Función para validar cada campo individual
function validarCampoConfiguracion(input) {
  let esValido = true;
  const feedbackElement = input.nextElementSibling;
  input.classList.remove('is-valid', 'is-invalid');

  // Validaciones específicas por campo
  switch (input.id) {
    case 'correoUsuario':
      esValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
      if (!esValido) mostrarError(input, 'Ingrese un correo electrónico válido');
      break;
    case 'dniUsuario':
      esValido = input.value.length === 8 && /^\d+$/.test(input.value);
      if (!esValido) mostrarError(input, 'El DNI debe tener 8 dígitos numéricos');
      break;
    case 'telefonoUsuario':
      esValido = input.value.length === 9 && /^\d+$/.test(input.value);
      if (!esValido) mostrarError(input, 'El teléfono debe tener 9 dígitos numéricos');
      break;
    default:
      esValido = input.value.trim() !== '';
      if (!esValido) mostrarError(input, 'Este campo es obligatorio');
  }

  if (esValido) input.classList.add('is-valid');
  return esValido;
}

function guardarCambios(btnGuardarCambios, formConfiguracionUsuario) {
  if (!btnGuardarCambios.disabled) {
    actualizarDatosUsuario(formConfiguracionUsuario);
  }
}

// Deshabilitar la edición y ocultar botones Guardar y Cancelar del Modal para actualizar datos del usuario
function deshabilitarEdicion(formConfiguracionUsuario) {
  formConfiguracionUsuario.querySelectorAll('input').forEach(input => {
    input.classList.remove('is-valid', 'is-invalid');
    input.disabled = true;
  });
  document.getElementById('cancelButton').classList.add('d-none');
  document.getElementById('saveButton').classList.add('d-none');
  document.getElementById('editButton').classList.remove('d-none');
}

function guardarEstadoOriginal(form, estadoOriginal) {
  form.querySelectorAll('input').forEach(input => {
      estadoOriginal[input.id] = input.value;
  });
}

/**
 * Función para mostrar el modal de confirmación dinámico.
 * @param {String} title - El título del modal.
 * @param {String} message - El mensaje del modal.
 * @param {String} confirmButtonText - El texto del botón de confirmación.
 * @param {Function} actionCallback - La función a ejecutar si se confirma.
 */
function showConfirmModal(title, message, confirmButtonText, actionCallback) {
  // Establecer el contenido dinámico
  document.getElementById('dynamicConfirmLabel').textContent = title;
  document.getElementById('dynamicConfirmBody').textContent = message;
  const confirmButton = document.getElementById('confirmDynamicBtn');
  confirmButton.textContent = confirmButtonText;

  // Asignar la función de confirmación al botón
  confirmAction = actionCallback;

  // Mostrar el modal
  const dynamicConfirmModal = new bootstrap.Modal(document.getElementById('dynamicConfirmModal'));
  dynamicConfirmModal.show();

  // Escuchar el clic en el botón de "Confirmar" dentro del modal
  document.getElementById('confirmDynamicBtn').addEventListener('click', function () {
    if (confirmAction) {
      confirmAction(); // Ejecutar la función de confirmación
      confirmAction = null; // Restablecer la función de confirmación
    }
    const dynamicConfirmModal = bootstrap.Modal.getInstance(document.getElementById('dynamicConfirmModal'));
    dynamicConfirmModal.hide(); // Cerrar el modal
  });
}

/**
 * Función para mostrar un toast o notificación
 * @param {String} titulo - El título del toast
 * @param {String} mensaje - El mensaje del toast
 * @param {String} tipo - El tipo del toast (info, success, warning, danger)
 * @param {Number} duracion - La duración del toast en milisegundos
 */
function mostrarToast(titulo, mensaje, tipo = 'info', duracion = 5000) {
  // Mapear tipos a íconos y colores específicos
  const iconMap = {
    incidente: { icon: 'bi-exclamation-triangle-fill', color: 'text-danger' },
    usuario: { icon: 'bi-person-fill', color: 'text-primary' },
    faq: { icon: 'bi-question-circle-fill', color: 'text-warning' },
    success: { icon: 'bi-check-circle-fill', color: 'text-success' },
    info: { icon: 'bi-info-circle-fill', color: 'text-info' }
  };

  const { icon, color } = iconMap[tipo] || iconMap['info'];

  // Crear un nuevo Toast
  const toastContainer = document.getElementById('toastContainer');
  const toastElement = document.createElement('div');
  toastElement.className = 'toast text-white bg-dark border-0 mb-2';
  toastElement.setAttribute('role', 'alert');
  toastElement.setAttribute('aria-live', 'assertive');
  toastElement.setAttribute('aria-atomic', 'true');

  // Contenido del Toast
  toastElement.innerHTML = `
        <div class="toast-header bg-dark text-light">
            <i class="bi ${icon} fs-4 me-2 ${color}"></i>
            <strong class="me-auto">${titulo}</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${mensaje}
        </div>
    `;

  // Agregar el Toast al contenedor
  toastContainer.appendChild(toastElement);

  // Inicializar el Toast
  const toast = new bootstrap.Toast(toastElement);
  toast.show();

  // Eliminar el Toast automáticamente después de la duración especificada
  setTimeout(() => {
    toast.hide();
    toastElement.remove();
  }, duracion);
}


//TODO ======================== LISTENERS ========================
btnCrearNuevoIncidente.addEventListener('click', () => crearNuevoIncidente(formNuevoIncidente));
btnReasignar.addEventListener('click', () => {
  // Obtener los datos del modal de incidente
  const numeroIncidente = document.querySelector('#modalIncidente .numero-incidente').innerText;
  const empresa = document.querySelector('#modalIncidente .empresa').innerText;
  const nombreIncidente = document.querySelector('#modalIncidente .nombre-incidente').innerText;
  const detallesIncidente = document.querySelector('#modalIncidente .detalles').innerText;

  // Pasar los datos al modal de reasignación
  document.querySelector('#modalReasignar .numero-incidente').innerText = numeroIncidente;
  document.querySelector('#modalReasignar .empresa').innerText = empresa;
  document.querySelector('#modalReasignar .nombre-incidente').innerText = nombreIncidente;
  document.querySelector('#modalReasignar .detalles').innerText = detallesIncidente;

  // Cerrar el modal principal y abrir el de reasignación
  modalIncidente.hide();
  modalReasignar.show();
  console.log(incidenteSeleccionado)
});

botonesCancelarReasignar.forEach(boton => {
  boton.addEventListener('click', function () {
    // Cerrar el submodal y volver a abrir el modal principal
    modalReasignar.hide();
    modalIncidente.show();
  });
});

botonesCancelarIncidente.forEach(boton => {
  boton.addEventListener('click', function () {
    modalIncidente.hide();
  });
});

botonesCancelarNuevoIncidente.forEach(boton => {
  boton.addEventListener('click', function () {
    modalNuevoIncidente.hide();
  });
});

botonesCerrarUsuario.forEach(boton => {
  boton.addEventListener('click', function () {
    modalUsuario.hide();
  });
}
)
