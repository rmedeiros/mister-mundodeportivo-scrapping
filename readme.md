# Script de Scrapping para el seguimiento de una Liga Fantasy en https://mister.mundodeportivo.com/ y Actualización de Datos en Google Sheets

Este script está diseñado para realizar tareas de web scraping y manipulación de datos para Mister Mundo Deportivo. Utiliza las bibliotecas `googleapis`, `puppeteer` y `dotenv`.

## Descripción General

El script comienza definiendo dos objetos de mapeo: `mapJugadores` y `mapPrecios`. `mapJugadores` mapea los apodos de los jugadores a sus nombres reales, y `mapPrecios` mapea las posiciones de los jugadores a la cantidad de dinero que debera aportar cada jugador dependiendo de su posición (ver excel de ejemplo).

El script luego realiza las siguientes tareas:

1. Lanza una instancia del navegador Puppeteer e inicia sesión en mister.mundodeportivo.com utilizando credenciales almacenadas en variables de entorno.
2. Recupera la última jornada del menú desplegable en la página de clasificaciones.
3. Recupera los jugadores de la última jornada, mapea sus apodos a sus nombres reales (definidos en la hoja excel) y devuelve un arreglo de objetos de jugadores.
4. Calcula el precio de cada jugador basado en su posición y el número de puntos que anotaron. Si varios jugadores anotaron el mismo número de puntos, sus precios se promedian.
5. Se autentica con la API de Google Sheets utilizando un archivo de clave y actualiza un documento de Google Sheets con la posición y precio de cada jugador.

## Requisitos

- Node.js
- Puppeteer
- Googleapis
- Dotenv

## Configuración

1. **Variables de Entorno**: Necesitas un archivo `.env` en la raíz de tu proyecto con las variables `EMAIL` y `PASSWORD` para el inicio de sesión en la página web desde donde se extraerán los datos.

2. **Archivo de Clave de Google API**: Para autenticar la solicitud a la API de Google Sheets, necesitarás un archivo `key.json`. Este archivo se obtiene al configurar tus credenciales de servicio en Google Cloud Platform.

3. **Instalación de Dependencias**:
   Ejecuta `npm install` o `yarn install` para instalar las dependencias necesarias.

El script se ejecuta con el comando `node index.js` desde la terminal. Realiza las siguientes operaciones principales:


## Nota

Este script está diseñado para un sitio web y documento de Google Sheets específicos. Si deseas usarlo para un sitio web o documento diferente, necesitarás modificar los selectores y URL en las funciones de Puppeteer y las llamadas a la API de Google Sheets.
