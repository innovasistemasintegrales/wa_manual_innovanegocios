const fragmento = document.createDocumentFragment();

/* Card global para reenderizado y item */
let cardReactivo = document.querySelector('#cardReactivo');

/* Templates para renderizado */
const templateReportes = document.querySelector('#templateReportes').content;
const templateIncidentes = document.querySelector('#templateIncidentes').content;
const templateConfiguracion = document.querySelector('#templateConfiguracion').content;


/* Etiqueta de botones de menu que vienen de HTMl */
let btnMenuReportes = document.querySelector('#btnMenuReportes');
let btnMenuIncidentes = document.querySelector('#btnMenuIncidentes');
let btnMenuConfiguracion = document.querySelector('#btnMenuConfiguracion');

// MARK: MODAL REPORTES
/* Lanzamiento de la vista del menu Reportes */
btnMenuReportes.addEventListener('click', function () {
  cardReactivo.innerHTML = "";

  templateReportes.querySelector("#tituloReportes").textContent = "Hola, soy el modulo Reportes";

  const clone = templateReportes.cloneNode(true);
  fragmento.appendChild(clone);

  cardReactivo.appendChild(fragmento);

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
  document.getElementById("buscador-fecha").addEventListener("change", e => {
    const fechaSeleccionada = e.target.value; // Fecha seleccionada en formato AAAA-MM-DD

    document.querySelectorAll(".incidenteR").forEach(incidente => {
      // Obtener la fecha de cada fila (deberías asegurarte de que la fecha esté en el formato correcto)
      const fechaIncidente = incidente.querySelector(".fecha-incidente .detalles-lista").textContent;

      // Convertimos la fecha del incidente y la fecha seleccionada a un formato que se pueda comparar
      const [dia, mes, anio] = fechaIncidente.split('/'); // Suponiendo que la fecha está en formato DD/MM/AAAA
      const fechaFormateada = `${anio}-${mes}-${dia}`; // Formato AAAA-MM-DD

      // Si la fecha del incidente coincide con la seleccionada, la fila se muestra, de lo contrario se oculta
      fechaFormateada === fechaSeleccionada
        ? incidente.classList.remove("filtro")
        : incidente.classList.add("filtro");
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



/* Lanzamiento de la vista del menu Incidentes */
btnMenuIncidentes.addEventListener('click', function () {
  cardReactivo.innerHTML = "";

  templateIncidentes.querySelector("#tituloIncidentes").textContent = "Hola soy el modulo Incidentes";

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

  templateConfiguracion.querySelector("#tituloConfiguracion").textContent = "Hola, soy el modulo configuración";

  const clone = templateConfiguracion.cloneNode(true);
  fragmento.appendChild(clone);

  cardReactivo.appendChild(fragmento);
});


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