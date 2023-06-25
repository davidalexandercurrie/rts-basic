const socket = io();
let playerX = 0;
let playerY = 0;
let fuel = 10;
let fuelinc = 0;
let water = 0;
let waterinc = 0;
let gold = 0;
let goldinc = 0;
let gameState;
let startGame = true;
let boosted = 'none';

function setup() {
  createCanvas(1200, 600);
  socket.on('userConnected', message => {
    console.log(message);
    document.getElementById(
      'logs'
    ).innerHTML += `<p style="color: lightpink">${message}</p>`;
    document.getElementById('logs').scrollTop =
      document.getElementById('logs').scrollHeight;
  });
  socket.on('chat', message => {
    document.getElementById('logs').innerHTML += `<p>${message}</p>`;
    document.getElementById('logs').scrollTop =
      document.getElementById('logs').scrollHeight;
  });
  socket.on('destroyBuilding', tile => {
    destroyBuilding(tile);
  });
  socket.on('updateTile', tile => {
    drawTile(tile, tile.x, tile.y);
    for (let i = 0; i < gameState.players.length; i++) {
      if (gameState.players[i].x == x && gameState.players[i].y == y) {
        if (gameState.players[i].id !== socket.id) {
          updatePlayers(gameState.players[i]);
        } else {
          drawPlayer();
        }
      }
    }
  });
  socket.on('playerMoved', player => {
    updatePlayers(player);
  });
  socket.on('gameState', state => {
    gameState = state;
    if (startGame) {
      drawBoard();
      drawPlayer();
      startGame = false;
    }
  });
  document.getElementById('close-logs').addEventListener('click', () => {
    console.log('hi');
    document.getElementById('logs-container').style.left =
      document.getElementById('logs-container').style.left == '-370px'
        ? '0px'
        : '-370px';
    document.getElementById('close-logs').innerText =
      document.getElementById('close-logs').innerText == 'X' ? '->' : 'X';
  });
  document.getElementById('chat-input').addEventListener('keydown', e => {
    if (e.key == 'Enter') {
      if (checkCommands(e.target.value)) {
        e.target.value = '';
        return;
      }
      socket.emit('chat', e.target.value);
      document.getElementById(
        'logs'
      ).innerHTML += `<p style="color: lightblue; text-align: right">${e.target.value}</p>`;
      e.target.value = '';
      document.getElementById('logs').scrollTop =
        document.getElementById('logs').scrollHeight;
    }
  });
}
function draw() {
  gameTimer();
}

function checkCommands(message) {
  const regex = /^-name/;
  if (regex.test(message)) {
    const name = message.split(' ')[1];
    socket.emit('name', name);
    document.getElementById(
      'logs'
    ).innerHTML += `<p style="color: lightblue; text-align: right">Changed name to ${name}</p>`;
    document.getElementById('logs').scrollTop =
      document.getElementById('logs').scrollHeight;
    return true;
  }
  return false;
}

function drawBoard() {
  for (let i = 0; i < 40; i++) {
    for (let j = 0; j < 20; j++) {
      fill('white');
      rect(i * 30, j * 30, 30, 30);
      drawTile(gameState.tiles[j][i], i, j);
    }
  }
}

function gameTimer() {
  document.getElementById('timer').innerText = `Game Time: ${Math.floor(
    frameCount / 60
  )}`;

  if (frameCount % 60 == 0) {
    switch (boosted) {
      case 'fuel':
        fuelinc -= 1;
        break;
      case 'water':
        waterinc -= 1;
        break;
      case 'gold':
        goldinc -= 1;
        break;
      case 'none':
        break;
    }
    if (gameState.tiles[playerY][playerX].resource !== null) {
      switch (gameState.tiles[playerY][playerX].resource) {
        case 'oil':
          if (fuel < 10) {
            boosted = 'fuel';
            fuelinc += 1;
          }
          break;
        case 'water':
          boosted = 'water';
          waterinc += 1;
          break;
        case 'gold':
          boosted = 'gold';
          goldinc += 1;
          break;
      }
    } else {
      boosted = 'none';
    }
  }
  if (frameCount % 60 == 0) {
    if (fuel < 10) {
      fuel += fuelinc;
      if (fuel > 10) {
        fuel = 10;
      }
    }
    water += waterinc;
    gold += goldinc;
  }
  if (fuel < 10 && frameCount % 240 == 0) {
    fuel++;
  }
  displayResources();
}

function drawPlayer() {
  textSize(25);
  stroke('purple');
  strokeWeight(4);
  noFill();
  rect(playerX * 30 + 2, playerY * 30 + 2, 26, 26);
  stroke('black');
  strokeWeight(1);
  text('👾', playerX * 30 + 2, playerY * 30 + 25);
}

function updatePlayers(player) {
  rect(player.data.oldX * 30, player.data.oldY * 30, 30, 30);
  drawTile(
    gameState.tiles[player.data.oldY][player.data.oldX],
    player.data.oldX,
    player.data.oldY
  );
  textSize(25);
  stroke('orange');
  strokeWeight(4);
  noFill();
  rect(player.data.x * 30 + 2, player.data.y * 30 + 2, 26, 26);
  stroke('black');
  strokeWeight(1);
  text('👾', player.data.x * 30 + 2, player.data.y * 30 + 25);
}

function keyPressed() {
  rect(playerX * 30, playerY * 30, 30, 30);
  drawTile(gameState.tiles[playerY][playerX], playerX, playerY);
  let oldX = playerX;
  let oldY = playerY;
  if (keyCode == 87 && fuel > 0) {
    if (playerY == 0) return;
    playerY--;
    fuel--;
  } else if (keyCode == 83 && fuel > 0) {
    if (playerY == 19) return;
    playerY++;
    fuel--;
  } else if (keyCode == 65 && fuel > 0) {
    if (playerX == 0) return;
    playerX--;
    fuel--;
  } else if (keyCode == 68 && fuel > 0) {
    if (playerX == 39) return;
    playerX++;
    fuel--;
  } else if (
    keyCode == 74 &&
    gameState.tiles[playerY][playerX].building.type == null &&
    gameState.tiles[playerY][playerX].resource == null
  ) {
    createBuilding('factory');
  } else if (keyCode == 75) {
    createBuilding('turret');
  }
  drawPlayer();
  socket.emit('playerMoved', { x: playerX, y: playerY, oldX, oldY });
  displayResources();
}

function drawTile(tile, x, y) {
  console.log(tile);
  // Draw base tile
  fill('white');
  rect(x * 30, y * 30, 30, 30);

  // Set text size for emoji
  textSize(25);

  // Check what is on the tile and draw the appropriate emoji
  if (tile.resource !== null) {
    switch (tile.resource) {
      case 'oil':
        text('🛢️', x * 30 + 5, y * 30 + 25);
        break;
      case 'water':
        text('🌊', x * 30 + 5, y * 30 + 25);
        break;
      case 'gold':
        text('💰', x * 30 + 5, y * 30 + 25);
        break;
    }
  } else if (tile.building.type !== null) {
    if (tile.building.owner === socket.id) {
      stroke('purple');
      strokeWeight(4);
      noFill();
      rect(x * 30 + 2, y * 30 + 2, 26, 26);
      stroke('black');
      strokeWeight(1);
    } else {
      stroke('orange');
      strokeWeight(4);
      noFill();
      rect(x * 30 + 2, y * 30 + 2, 26, 26);
      stroke('black');
      strokeWeight(1);
    }

    switch (tile.building.type) {
      case 'factory':
        text('🏭', x * 30 + 5, y * 30 + 25);
        break;
      case 'house':
        text('🏠', x * 30 + 5, y * 30 + 25);
        break;
      case 'turret':
        text('🛡', x * 30 + 5, y * 30 + 25);
      // Add other buildings here...
    }
  }
}

function createBuilding(type) {
  drawTile({ building: { type } }, playerX, playerY);
  socket.emit('createBuilding', { type, x: playerX, y: playerY });
  switch (type) {
    case 'factory':
      for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
          if (
            playerX + i < 0 ||
            playerX + i > 39 ||
            playerY + j < 0 ||
            playerY + j > 19
          ) {
            continue;
          } else {
            switch (gameState.tiles[playerY + j][playerX + i].resource) {
              case 'oil':
                fuelinc++;
                break;
              case 'water':
                waterinc++;
                break;
              case 'gold':
                goldinc++;
                break;
            }
          }
        }
      }
  }
}

function destroyBuilding(tile) {
  console.log(tile, 'destroyed');
  switch (tile.building.type) {
    case 'factory':
      for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
          console.log(
            'tiles around destroyed building',
            gameState.tiles[tile.y + j][tile.x + i]
          );
          if (
            tile.x + i < 0 ||
            tile.x + i > 39 ||
            tile.y + j < 0 ||
            tile.y + j > 19
          ) {
            continue;
          } else {
            switch (gameState.tiles[tile.y + j][tile.x + i].resource) {
              case 'oil':
                fuelinc--;
                break;
              case 'water':
                waterinc--;
                break;
              case 'gold':
                goldinc--;
                break;
            }
          }
        }
      }
  }
}

function displayResources() {
  document.getElementById('display-resources').innerText = `Fuel: ${fuel}/10 +${
    fuelinc + 0.25
  }   Water: ${water} +${waterinc}   Gold: ${gold} +${goldinc}`;
}
