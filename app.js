/* Este archivo sirve para configurar el servidor o la aplicación*/
const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();

/* SETTINGS */
app.set('port', process.env.PORT || 2000);// Si es que existe un puerto definido para la app usalo, sino por defecto usa 4000
app.set('views', path.join(__dirname, 'views'));// Node sabe la ruta completa de esa carpeta.

//Establecemos y configuramos el motor de plantillas.
app.engine('.hbs', exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs'
}).engine);

app.set('view engine', '.hbs'); //Usa el motor que se cofiguro anteriormente.

/* MIDELWARE */
app.use(morgan('dev')); //Utilizamos el modulo de morgan
app.use(express.urlencoded({extended: true})); //Acepta los datos de un formulario HTML

/* ROUTERS */
//Utilizamos las rutas definidas en la carpeta router
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(require('./routes/routes'));

/* STATIC FILES */
//Indicamos donde estan archivos públicos.
app.use(express.static(path.join(__dirname, 'public')));

/* CONFIGURATION */
//Definimos maximo de peso de json
app.use(express.json({limit: '200mb'}));

module.exports = app;
