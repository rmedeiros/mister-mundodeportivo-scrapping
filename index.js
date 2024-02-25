const { google } = require("googleapis");
const puppeteer = require("puppeteer");
require("dotenv").config();

// Mapa de jugadores para cambiar los nombres de los jugadores de Mister por los nombres de los jugadores en el excel

const mapJugadores = {
  Player1: "John Doe",
  Player1: "Myke Was",
  Player1: "Pepe Botella",
  Player1: "Alice ",
  Player1: "Bob",
  "Worst player": "Josh",
  Player1: "Toni Catani",
  Player1: "Joe Toden",
  Player1: "Marcus Foster",
  "Composed name": "Octavien Mituil",
  "Pepito garrigo": "Mashid Hakimi",
  Player1: "Joseph of John",
};

const mapPrecios = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0.5,
  8: 1,
  9: 1.5,
  10: 2,
  11: 2.5,
  12: 3,
};

async function getBrowserPage() {
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  return await browser.newPage();
}

async function login(page) {
  await page.goto(
    "https://mister.mundodeportivo.com/new-onboarding/auth/email",
    {}
  );
  await page.click("#didomi-notice-agree-button");
  await page.focus("#email");
  await page.keyboard.type(process.env.EMAIL);
  await page.focus(
    "#app > div > div.container.container--v-spaced.container--h-spaced.container-login > div > form > div:nth-child(2) > input[type=password]"
  );
  await page.keyboard.type(process.env.PASSWORD);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "load" });
}

async function getLastGameWeek(page) {
  await page.goto("https://mister.mundodeportivo.com/standings", {});
  await page.click(
    "#content > div.wrapper > div.tabs-wrapper > div > button:nth-child(2)"
  );
  return await page.evaluate(() => {
    let options = document.querySelector(
      "#content > div.wrapper > div.panels.panels-standings > div.panel.panel-gameweek > div > select"
    ).options;
    let last = options[options.length - 1];
    return last.innerHTML.trim();
  });
}

async function getPlayersLastWeek(page, mapJugadores) {
  let playersLastWeek = await page.evaluate((mapJugadores) => {
    let tableClasificacion = document.querySelector(
      "#content > div.wrapper > div.panels.panels-standings > div.panel.panel-gameweek > ul"
    );
    let playersLastWeek = [];
    tableClasificacion.children.forEach((element) => {
      let playerLastWeek = {};
      let name = element
        .querySelector("div > a > div.info > div.name")
        .innerHTML.trim();
      let position = element
        .querySelector("div > a > div.position")
        .innerHTML.trim();
      const pointsText = element
        .querySelector("div > a > div.points")
        .textContent.trim();
      const puntos = parseInt(pointsText.match(/\d+/)[0]);
      playerLastWeek["name"] = mapJugadores[name];
      playerLastWeek["points"] = puntos;
      playerLastWeek["position"] = position;
      playersLastWeek.push(playerLastWeek);
    });
    return playersLastWeek;
  }, mapJugadores);

  return playersLastWeek;
}

async function getGoogleSheetsInstance() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "key.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });
  const authClientObject = await auth.getClient();

  return google.sheets({ version: "v4", auth: authClientObject });
}

async function updatePlayerData(
  sheets,
  spreadsheetId,
  players,
  playerPrices,
  lastWeekGame
) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "key.json", //the key file
    //url to spreadsheets API
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });
  const authClientObject = await auth.getClient();

  const googleSheetsInstance = google.sheets({
    version: "v4",
    auth: authClientObject,
  });

  // Step 1: Authenticate with Google Sheets API
  // This is already done in your existing code

  // Step 2: Get the data from the Google Sheets
  const range = "2023-24"; // replace with your sheet name
  let response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  // Step 3: Find the column index of the last game week
  let lastGameWeekColumnIndex = -1;
  const lastGameWeekTitle = lastWeekGame.toUpperCase();
  response.data.values[1].forEach((title, index) => {
    if (title.trim() === lastGameWeekTitle.trim()) {
      lastGameWeekColumnIndex = index;
    }
  });

  // Step 5: Add the data to the Google Sheets
  // Assuming you have an array of players, where each player is an object with properties 'name', 'position', and 'price'
  players.forEach(async (player) => {
    // Find the row index of the player
    let playerRowIndex = -1;
    response.data.values.forEach((row, index) => {
      if (row[3] === player.name) {
        playerRowIndex = index;
      }
    });

    // If the player is found, update the cells with the position and price
    if (playerRowIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `2023-24!${columnToLetter(lastGameWeekColumnIndex + 1)}${
          playerRowIndex + 1
        }:${columnToLetter(lastGameWeekColumnIndex + 2)}${playerRowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[player.position, playerPrices[player.name]]],
        },
      });
    }
  });
}

function calculatePlayerPrices(players, priceMap) {
  let playerPrices = {};
  let pointsMap = {};

  players.forEach((player) => {
    if (priceMap[player.position] != undefined) {
      playerPrices[player.name] = priceMap[player.position];
      if (pointsMap[player.points]) {
        pointsMap[player.points].push(player.name);
      } else {
        pointsMap[player.points] = [player.name];
      }
    }
  });

  for (let points in pointsMap) {
    if (pointsMap[points].length > 1) {
      let total = pointsMap[points].reduce(
        (sum, player) => sum + playerPrices[player],
        0
      );
      let average = total / pointsMap[points].length;
      pointsMap[points].forEach((player) => {
        playerPrices[player] = average;
      });
    }
  }

  return playerPrices;
}

function columnToLetter(column) {
  let temp,
    letter = "";
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

(async () => {
  const page = await getBrowserPage();
  await login(page);
  const lastWeekGame = await getLastGameWeek(page);
  const playersLastWeek = await getPlayersLastWeek(page, mapJugadores);
  await page.browser().close();
  const playerPrices = calculatePlayerPrices(playersLastWeek, mapPrecios);

  const sheets = await getGoogleSheetsInstance();
  const spreadsheetId = "your-spreadsheet-id";
  await updatePlayerData(
    sheets,
    spreadsheetId,
    playersLastWeek,
    playerPrices,
    lastWeekGame
  );

  console.log(playerPrices);
})();
