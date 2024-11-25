const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

/* Templates para renderizado */
const templateReportes = document.querySelector('#templateReportes').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;


/* Etiqueta de botones de menu que vienen de HTMl */
let btnMenuInicio = document.querySelector('#btnMenuInicio');
let btnMenuIncidentes = document.querySelector('#btnMenuIncidentes');
let btnMenuReportes = document.querySelector('#btnMenuReportes');
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');

//TODO MARK: Inicio
btnMenuInicio.addEventListener('click', function () {
    location.reload();
})

//TODO MARK: Lanzamiento de la vista del menu Reportes
btnMenuReportes.addEventListener('click', function () {
  cardReactivo.innerHTML = "";

  templateReportes.querySelector("#tituloReportes").textContent = "";

  const clone = templateReportes.cloneNode(true);
  fragmento.appendChild(clone);

  cardReactivo.appendChild(fragmento);
});
/* Filtro de búsqueda */
document.addEventListener("keyup", e => {
  if (e.target.matches("#buscador")) {

    // Limpiar el campo si se presiona Escape
    if (e.key === "Escape") e.target.value = "";

    // Obtener el valor de búsqueda en minúsculas
    const busqueda = e.target.value.toLowerCase();

    // Recorrer cada fila de la tabla (cada incidente)
    document.querySelectorAll(".incidenteR").forEach(incidente => {
      // Obtener solo el contenido de las celdas que deseas filtrar
      const numero = incidente.querySelector(".num-incidente .detalles-lista").textContent.toLowerCase();
      const nombreIncidente = incidente.querySelector(".nombre-incidente .detalles-lista").textContent.toLowerCase();
      const detalles = incidente.querySelector(".detalles-incidente .detalles-lista").textContent.toLowerCase();
      const empresa = incidente.querySelector(".nombre-empresa .detalles-lista").textContent.toLowerCase();
      const estado = incidente.querySelector(".estado-incidente .detalles-lista").textContent.toLowerCase();

      // Crear un string de texto concatenado de los campos que quieres buscar
      const textoFila = `${numero} ${nombreIncidente} ${detalles} ${empresa} ${estado}`;

      // Si la búsqueda coincide con algún texto en la fila, la muestra; de lo contrario, la oculta
      textoFila.includes(busqueda)
        ? incidente.classList.remove("d-none")
        : incidente.classList.add("d-none");
    });
  }
});


/*Filtro de busqueda por fecha*/
btnMenuReportes.addEventListener('click', () => {
  document.getElementById("buscador-fecha").addEventListener("change", e => {
    const fechaSeleccionada = e.target.value; // Fecha seleccionada en formato AAAA-MM-DD

    document.querySelectorAll(".incidenteR").forEach(incidente => {
      // Obtener la fecha de cada incidente en formato DD/MM/AAAA
      const fechaIncidenteTexto = incidente.querySelector(".fecha-incidente .detalles-lista").textContent.trim();

      // Convertir la fecha del incidente al formato AAAA-MM-DD
      const [dia, mes, anio] = fechaIncidenteTexto.split('/');
      const fechaIncidenteFormateada = `${anio}-${mes}-${dia}`;

      // Comparar la fecha formateada del incidente con la fecha seleccionada
      if (fechaIncidenteFormateada === fechaSeleccionada) {
        incidente.classList.remove("filtro"); // Mostrar si coinciden
      } else {
        incidente.classList.add("filtro"); // Ocultar si no coinciden
      }
    });
  });


  /*Descarga de PDF*/
  document.getElementById("descargar-pdf").addEventListener("click", function () {
    // Crea un nuevo documento PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Añadir una imagen (puede ser un logotipo o imagen de cabecera)
    const logoUrl = "/img/innova.png";
    doc.addImage(logoUrl, "PNG", 160, 5, 40, 12); // Añade la imagen (x, y, width, height)


    // Añadir un título al documento
    const title = "Reporte de Incidentes";
    doc.setFontSize(25); // Tamaño de la fuente del título
    doc.setFont("helvetica", "bold"); // Estilo de fuente (negrita)
    doc.text(title, 60, 25); // Posición (x, y) del título


    // Ajustar el espacio después del título
    let y = 35;

    // Definir los encabezados y los datos
    const headers = [
      "Nro.",
      "Incidente",
      "Detalles",
      "Empresa",
      "Fecha",
      "Estado"
    ];

    const data = [];

    document.querySelectorAll(".incidenteR:not(.filtro)").forEach(incidente => {
      const numero = incidente.querySelector(".num-incidente .detalles-lista").textContent;
      const incidenteNombre = incidente.querySelector(".nombre-incidente .detalles-lista").textContent;
      const detalles = incidente.querySelector(".detalles-incidente .detalles-lista").textContent;
      const empresa = incidente.querySelector(".nombre-empresa .detalles-lista").textContent;
      const fecha = incidente.querySelector(".fecha-incidente .detalles-lista").textContent;
      const estado = incidente.querySelector(".estado-incidente .detalles-lista").textContent;

      data.push([numero, incidenteNombre, detalles, empresa, fecha, estado]);
    });

    // Generar la tabla con recuadros en las celdas
    doc.autoTable({
      head: [headers],
      body: data,
      startY: y, // Posición inicial después de la imagen
      theme: 'striped', // Tema (striped, grid, plain)
      headStyles: {
        fillColor: [10, 30, 46], // Color del encabezado
        textColor: [255, 255, 255], // Color del texto en el encabezado
        lineWidth: 0.5, // Ancho de línea del borde
        lineColor: [38, 62, 82] // Color de borde (negro)
      },
      bodyStyles: {
        lineWidth: 0.25, // Ancho del borde para las celdas del cuerpo
        lineColor: [38, 62, 82], // Color del borde (negro)
        fillColor: [255, 255, 255], // Fondo blanco
        textColor: [0, 0, 0], // Color del texto
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240] // Fondo alterno para filas
      },
      styles: {
        fontSize: 10, // Tamaño de fuente
        cellPadding: 5, // Padding interno de las celdas
        halign: 'center', // Alineación horizontal del texto en las celdas
      },
      margin: { top: 20, right: 10, bottom: 10, left: 10 }, // Márgenes del PDF
      tableLineColor: [38, 62, 82], // Color del borde de la tabla
      tableLineWidth: 0.25, // Ancho del borde de la tabla
    });

    // Generar pie de página con paginación
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Página ${i} de ${totalPages}`, 200, 290, { align: 'right' });
    }

    // Guardar el archivo PDF
    doc.save("Reporte_de_Incidentes.pdf");
  });
});


// Filtro por estado
function filterByStatus(status) {
  const incidents = document.querySelectorAll('.incidenteR');
  incidents.forEach(incident => {
    if (status === '' || incident.getAttribute('data-status') === status) {
      incident.style.display = ''; // Muestra el incidente
    } else {
      incident.style.display = 'none'; // Oculta el incidente
    }
  });
}
// Manejo del menu de reportes
btnMenuReportes.addEventListener('click', () => {
  let radioMisReportes = document.getElementById('radioMisReportes');
  let radioHistorialReportes = document.getElementById('radioHistorialReportes');


  let seccionMisReportes = document.getElementById('seccionMisReportes');
  let seccionHistorialReportes = document.getElementById('seccionHistorialReportes');

  radioMisReportes.addEventListener('click', () => {
    seccionMisReportes.classList.remove('d-none');
    seccionHistorialReportes.classList.add('d-none');
  });

  radioHistorialReportes.addEventListener('click', () => {
    seccionHistorialReportes.classList.remove('d-none');
    seccionMisReportes.classList.add('d-none');
  });
});

/* Lanzamiento de la vista del menu Incidentes */
btnMenuIncidentes.addEventListener('click', function () {
  cardReactivo.innerHTML = "";

  templateIncidentes.querySelector("#tituloIncidentes").textContent = "";

  const clone = templateIncidentes.cloneNode(true);
  fragmento.appendChild(clone);

  cardReactivo.appendChild(fragmento);

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

});

/* Lanzamiento de la vista del menu configuración */
btnMenuConfiguracion.addEventListener('click', function () {
  cardReactivo.innerHTML = "";

  templateConfiguracion.querySelector("#tituloConfiguracion").textContent = "";

  const clone = templateConfiguracion.cloneNode(true);
  fragmento.appendChild(clone);

  cardReactivo.appendChild(fragmento);
});
btnMenuConfiguracion.addEventListener("click", () => {
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

// Función para habilitar la edición de los campos
function habilitarEdicion(formConfiguracionUsuario) {
  formConfiguracionUsuario.querySelectorAll('input').forEach(input => {
    if (input.id !== 'fechaIngresoUsuario' && input.id !== 'estadoUsuario') {
      input.disabled = false
    }
  }
  );
  document.getElementById('cancelButton').classList.remove('d-none');
  document.getElementById('saveButton').classList.remove('d-none');
  document.getElementById('saveButton').disabled = true; // Solo activado si hay cambios
  document.getElementById('editButton').classList.add('d-none');
}

// Función para guardar el estado actual de los campos
function guardarEstadoOriginal(form, estadoOriginal) {
  form.querySelectorAll('input').forEach(input => {
    estadoOriginal[input.id] = input.value;
  });
}

// Función para revertir los cambios y desactivar edición
function cancelarEdicion(formConfiguracionUsuario, estadoOriginal) {
  formConfiguracionUsuario.querySelectorAll('input').forEach(input => {
    input.value = estadoOriginal[input.id]; // Revertir al valor inicial
    input.classList.remove('is-valid', 'is-invalid');
    input.disabled = true;
  });
  document.getElementById('cancelButton').classList.add('d-none');
  document.getElementById('saveButton').classList.add('d-none');
  document.getElementById('editButton').classList.remove('d-none');
}

// Verificar si hay cambios en los campos
function verificarCambios(form, estadoOriginal, btnGuardarCambios) {
  const hayCambios = Array.from(form.querySelectorAll('input')).some(input => {
    return input.value !== estadoOriginal[input.id];
  });
  btnGuardarCambios.disabled = !hayCambios;
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

// Mostrar mensaje de error
function mostrarError(input, mensaje) {
  input.classList.add('is-invalid');
  const feedbackElement = input.nextElementSibling;
  if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
    feedbackElement.textContent = mensaje;
  }
}

function guardarCambios(btnGuardarCambios, formConfiguracionUsuario) {
  if (!btnGuardarCambios.disabled) {
    actualizarDatosUsuario(formConfiguracionUsuario);

  }
}

// Deshabilitar la edición y ocultar botones Guardar y Cancelar
function deshabilitarEdicion(formConfiguracionUsuario) {
  formConfiguracionUsuario.querySelectorAll('input').forEach(input => {
    input.classList.remove('is-valid', 'is-invalid');
    input.disabled = true;
  });
  document.getElementById('cancelButton').classList.add('d-none');
  document.getElementById('saveButton').classList.add('d-none');
  document.getElementById('editButton').classList.remove('d-none');
}

function actualizarDatosUsuario(form) {

  let nombre = form.querySelector("#nombreUsuario").value;
  let correo = form.querySelector("#correoUsuario").value;
  let usuario = form.querySelector("#userUsuario").value;
  let password = form.querySelector("#passwordUsuario").value;
  let dni = form.querySelector("#dniUsuario").value;
  let telefono = form.querySelector("#telefonoUsuario").value;
  let direccion = form.querySelector("#direccionUsuario").value;
  let fechaIngreso = form.querySelector("#fechaIngresoUsuario").value;
  let nacimiento = form.querySelector("#nacimientoUsuario").value;
  let estado = form.querySelector("#estadoUsuario").value;
  //let imagenPerfil = formRegistroUsuario.querySelector('#addImg').files[0]; // Capturamos el archivo de imagen
  let expresiones = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let valido = expresiones.test(correo);

  if (nombre !== "" && correo !== "" && usuario !== "" && password !== "" && dni !== "" && telefono !== "" && direccion !== "" && estado !== "") {
    if (valido === true) {
      if (telefono.length == 9) {
        if (dni.length == 8) {
          let usuarioActualizado = {
            rolSeleccionado,
            nombre,
            correo,
            usuario,
            password,
            dni,
            telefono,
            direccion,
            fechaIngreso,
            nacimiento,
            estado,
          }
          //? Implementación de la imagen perfil (pendiente)
          // if (imagenPerfil) {
          //     nuevoUsuario.append(imagenPerfil);
          // }

          // socket.emit('/administrador/registrarUsuario', nuevoUsuario);
          showConfirmModal('Confirmar cambios', '¿Estás seguro de que deseas guardar los cambios?', 'Guardar cambios', function () {
            console.log('Cambios guardados con éxito');
            deshabilitarEdicion(formConfiguracionUsuario);
            mostrarAlerta('¡Los cambios se han guardado con éxito!', 'success', 3000);
          });

        }
        else {
          mostrarError(form.querySelector('#dniUsuario'), "El DNI debe tener 8 dígitos");
        }
      }
      else {
        mostrarError(form.querySelector('#telefonoUsuario'), "El teléfono debe tener 9 dígitos");
      }
    }
    else {
      mostrarError(form.querySelector('#correoUsuario'), 'Ingrese un correo electrónico válido');
    }
  }
  else {
    form.querySelectorAll('input:not(#fecha-ingreso):not([type="file"]):not(#nacimiento):not([type="radio"])').forEach(input => {
      validarCampoConfiguracion(input)
    });
  }

}


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