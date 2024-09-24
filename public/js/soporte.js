    // Obtener el contenedor de las tarjetas
    const cardContainer = document.getElementById('card-container');

    // Obtener el template
    const template = document.getElementById('card-template');

    // Datos de ejemplo para las tarjetas
    const cardData = [
        { nro: 1, incidente: 'Error 404', detalles: 'Página no encontrada', nombreEmpresa: 'Empresa A', fecha: '2024-09-16', estado: 'Abierto', opciones: 'Ver Detalles' },
        { nro: 2, incidente: 'Error 500', detalles: 'Error interno del servidor', nombreEmpresa: 'Empresa B', fecha: '2024-09-15', estado: 'En Proceso', opciones: 'Ver Detalles' },
        // Agrega más objetos de datos según sea necesario
    ];

    // Crear y añadir las tarjetas al contenedor
    cardData.forEach(data => {
        // Clonar el contenido del template
        const clone = template.content.cloneNode(true);

        // Actualizar el contenido de la tarjeta clonada
        clone.querySelector('.card-title:nth-child(1)').textContent = `Nro.: ${data.nro}`;
        clone.querySelector('.card-title:nth-child(2)').textContent = `Incidente: ${data.incidente}`;
        clone.querySelector('.card-title:nth-child(3)').textContent = `Detalles: ${data.detalles}`;
        clone.querySelector('.card-title:nth-child(4)').textContent = `Nombre/RUC Empresa: ${data.nombreEmpresa}`;
        clone.querySelector('.card-title:nth-child(5)').textContent = `Fecha: ${data.fecha}`;
        clone.querySelector('.card-title:nth-child(6)').textContent = `Estado: ${data.estado}`;
        clone.querySelector('.card-title:nth-child(7)').textContent = `Opciones: ${data.opciones}`;

        // Añadir la tarjeta clonada al contenedor
        cardContainer.appendChild(clone);
    });

