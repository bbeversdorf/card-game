import * as WebSocket from 'ws';
import { Game } from './game';
import e = require('express');

class WSocket {
  sessionParser: Function;
  wss: WebSocket.Server;
  map = new Map();

  constructor(server: any, sessionParser: Function) {
    this.sessionParser = sessionParser;
    this.wss = new WebSocket.Server({ server });
    this.wss.on('connection', (ws: WebSocket, request: any) => {
      this.connection(this, ws, request);
    });
  }

  connection(socket: any, ws: WebSocket, request: any) {
    socket.sessionParser(request, {}, async () => {
      const userId = request.session.userId;
      socket.map.set(userId, ws);
      if (request.session.gameCode) {
        await socket.sendUpdate(request.session.gameCode);
      }
    });

    ws.on('message', function(data: string) {
      socket.message(ws, data);
    });
    ws.on('close', function(){
      socket.close(request);
    });
  }

  message(ws: WebSocket, data: string) {
    const wsocket = this;
    const event = JSON.parse(data);
    let action: string = event.action;
    if (!action) {
      return;
    }
    action = action.toLowerCase();
    switch (action) {
      case 'sendmessage': {
        // only send to channel
        const message = event.message;
        console.log('received: %s', message);
        wsocket.wss.clients.forEach(client => {
          if (client != ws) {
            const messageJson = {
              message: `Hello, broadcast -> ${message}`
            }
            client.send(JSON.stringify(messageJson));
          }
        });
        break;
      }
    }
  }

  async close(request: any) {
    const wsocket = this;
    const userId = request.session.userId;
    wsocket.getSocket(userId).close();
    wsocket.map.delete(userId);
    // setTimeout(async() => {
    //   const games = await Game.getAllGames() ?? [];
    //   games.forEach(async (game) => {
    //     if (this.getSocket(userId)) {
    //       return;
    //     }
    //     game = Object.assign(new Game(game.id), game);
    //     const player = game.getPlayer(userId);
    //     if (!player) {
    //       return;
    //     }
    //     await game.leaveGame(player);
    //     await this.sendUpdate(game.code);
    //   })
    // }, 30 * 1000);
  }

  async sendUpdate(code: string) {
    const websocket = this;
    const game = await Game.getGameByCode(code);
    if (!game) {
      return
    }
    delete game.whiteDeck;
    delete game.blackDeck;
    // submitted cards renove player id
    this.wss.clients.forEach(async (client) => {
      const userId = websocket.getByValue(client);
      const player = await game?.getPlayer(userId ?? '');
      if (!player) {
        return;
      }
      const whiteCards = [...player.whiteCards];
      client.send(JSON.stringify({ whiteCards, isDealer: game.round.isDealer(player) }));
      game.round.currentPlayers.forEach((player) => {
        delete player.whiteCards;
        delete player.id;
      });
      game.round.submittedCards.forEach((cards) => {
        delete cards.playerId;
      });
      client.send(JSON.stringify({ ...game, blackCard: game.round.blackCard }));
    });
  }

  getByValue(searchValue: WebSocket): string | undefined {
    for (let [key, value] of this.map.entries()) {
      if (value === searchValue)
        return key;
    }
  }

  getSocket(userId: string): WebSocket {
    return this.map.get(userId);
  }
}

export { WSocket };
