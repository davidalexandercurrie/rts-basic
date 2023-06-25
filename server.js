const express = require('express');
const app = express();
const http = require('http').createServer(app); // create http server
const io = require('socket.io')(http); // pass the http server to socket.io
let names = {};
let anonymous = 0;

app.use(express.static('public'));

let gameState = {
  tiles: [],
  players: [],
};

// populate the tiles
for (let i = 0; i < 20; i++) {
  let row = [];
  for (let j = 0; j < 40; j++) {
    row.push({
      resource: null,
      building: { type: null, owner: null, health: null },
      x: j,
      y: i,
    });
  }
  gameState.tiles.push(row);
}
// add oil and water to the map
for (let i = 0; i < 20; i++) {
  for (let j = 0; j < 40; j++) {
    if (Math.random() < 0.02) {
      gameState.tiles[i][j].resource = 'oil';
    } else if (Math.random() < 0.02) {
      gameState.tiles[i][j].resource = 'water';
    } else if (Math.random() < 0.01) {
      gameState.tiles[i][j].resource = 'gold';
    }
  }
}

console.log(gameState);

// Game update loop
setInterval(() => {
  // Update the game state (move NPCs, spawn resources, etc.)
  let tilesToDestroy = [];
  for (let i = 0; i < gameState.tiles.length; i++) {
    for (let j = 0; j < gameState.tiles[i].length; j++) {
      if (gameState.tiles[i][j].building.type === 'turret') {
        for (let x = -1; x < 2; x++) {
          for (let y = -1; y < 2; y++) {
            if (i + x < 0 || i + x > 19 || j + y < 0 || j + y > 39) {
              continue;
            } else if (
              gameState.tiles[i + x][j + y].building.owner !==
                gameState.tiles[i][j].building.owner &&
              gameState.tiles[i + x][j + y].building.type !== null
            ) {
              gameState.tiles[i + x][j + y].building.health -= 1;
              if (gameState.tiles[i + x][j + y].building.health <= 0) {
                tilesToDestroy.push(gameState.tiles[i + x][j + y]);
              }
            }
          }
        }
      }
    }
  }
  for (let i = 0; i < tilesToDestroy.length; i++) {
    gameState.tiles[tilesToDestroy[i].y][tilesToDestroy[i].x].building;

    for (let i = 0; i < tilesToDestroy.length; i++) {
      io.to(
        gameState.tiles[tilesToDestroy[i].y][tilesToDestroy[i].x].building.owner
      ).emit(
        'destroyBuilding',
        gameState.tiles[tilesToDestroy[i].y][tilesToDestroy[i].x]
      );
      gameState.tiles[tilesToDestroy[i].y][tilesToDestroy[i].x].building = {
        type: null,
        owner: null,
        health: null,
      };
      io.emit(
        'updateTile',
        gameState.tiles[tilesToDestroy[i].y][tilesToDestroy[i].x]
      );
    }
  }
  // Send the updated game state to all clients
  io.emit('gameState', gameState);
}, 100); // Send updates every 100 milliseconds (10 times per second)

io.on('connection', client => {
  names[client.id] = `Anonymous-${anonymous++}`;
  client.broadcast.emit('userConnected', `${names[client.id]} connected`);
  client.on('event', data => {
    /* … */
  });
  client.on('name', data => {
    client.broadcast.emit(
      'chat',
      `${names[client.id]} changed their name to ${data}`
    );
    names[client.id] = data;
  });
  client.on('createBuilding', data => {
    gameState.tiles[data.y][data.x] = {
      x: data.x,
      y: data.y,
      building: {
        type: data.type,
        owner: client.id,
        health: 100,
      },
      resource: null,
    };
    client.broadcast.emit('updateTile', gameState.tiles[data.y][data.x]);
  });
  client.on('chat', data => {
    client.broadcast.emit('chat', `${names[client.id]}: ${data}`);
  });
  client.on('playerMoved', data => {
    gameState.players[client.id] = data;
    client.broadcast.emit('playerMoved', { player: client.id, data });
  });
  client.on('disconnect', () => {
    /* … */
  });
});

http.listen(3000); // you listen on the http server, not the express app

function resetGame() {
  gameState = {
    tiles: [],
  };
  // populate the tiles
  for (let i = 0; i < 40; i++) {
    let row = [];
    for (let j = 0; j < 20; j++) {
      row.push({
        resource: null,
        building: { type: null, owner: null },
        x: i,
      });
    }
    gameState.tiles.push(row);
  }
  console.log(gameState);
}
