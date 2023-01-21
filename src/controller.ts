import { Player } from "./player";
import { Game } from "./game";
import { WSocket } from './websocket';

const uuid = require('uuid');

function saveSession(request: any, playerName: string, gameCode: string) {
  request.session.playerName = playerName;
  request.session.gameCode = gameCode;
  request.session.save();
}

const controller = function(wss: WSocket) {
  return {
    index: (request: any, response: any) => {
      response.render('pages/index');
    },

    new: (request: any, response: any) => {
      if (!request.session || !request.session.userId) {
        request.session.userId = uuid.v4();
      }
      const locals = {
        name: request.session.playerName || ''
      };
      response.render('pages/new', locals);
    },

    create: async (request: any, response: any) => {
      if (!request.session || !request.session.userId) {
        request.session.userId = uuid.v4();
      }
      const player = new Player(request.session.userId);
      if (request.params.name) {
        player.changeName(request.params.name);
      }
      try {
        const game = await Game.createNewGame(player);
        saveSession(request, player.name, game.code);
        response.redirect(`/lobby/${game.code}`);
      } catch (error) {
        console.error(error);
        response.redirect('/');
      }
    },

    join: async (request: any, response: any) => {
      if (!request.session || !request.session.userId) {
        request.session.userId = uuid.v4();
      }
      const player = new Player(request.session.userId);
      if (request.params.name) {
        player.changeName(request.params.name);
      }
      try {
        const code = request.params.code;
        const game = await Game.getGameByCode(code);
        if (!game) {
          return;
        }
        game.joinGame(player);
        saveSession(request, player.name, game.code);
        response.redirect(`/lobby/${game.code}`);
      } catch (error) {
        console.error(error);
        response.redirect('/');
      }
    },

    joinIndex: (request: any, response: any) => {
      if (!request.session || !request.session.userId) {
        request.session.userId = uuid.v4();
      }
      const locals = {
        name: request.session.playerName || '',
        code: request.session.gameCode || '',
      };
      response.render('pages/join', locals);
    },

    lobby: async (request: any, response: any) => {
      if (!request.session || !request.session.userId) {
        request.session.userId = uuid.v4();
      }
      const code = request.session.gameCode;
      const game = await Game.getGameByCode(code);
      const isDealer = game?.waitingPlayers[0].id === request.session.userId;
      const locals = {
        name: request.session.playerName || '',
        code: code || '',
        isDealer: isDealer
      };
      console.log('The id you specified is ' + request.params.code);
      response.render('pages/lobby', locals);
      await wss.sendUpdate(code);
    },

    gameStart: async (request: any, response: any) => {
      try {
        const code = request.params.code;
        const game = await Game.getGameByCode(code);
        if (!game) {
          response.redirect('/');
          return;
        }
        if (game.round.currentPlayers.length === 0 && game.waitingPlayers.length === 1) {
          await game.startRound();
        }
        response.redirect(`/game/${game.code}`);
      } catch (error) {
        console.error(error);
        response.redirect('/');
      }
    },

    game: async (request: any, response: any) => {
      if (!request.session || !request.session.userId) {
        request.session.userId = uuid.v4();
      }
      const code = request.session.gameCode;
      const locals = {
        name: request.session.playerName || '',
        code: code || '',
      };
      console.log('The id you specified is ' + request.params.code);
      response.render('pages/game', locals);
    },

    gamePlayerMove: async (request: any, response: any) => {
      const code = request.params.code;
      const data = request.body;
      if (!request.session || !request.session.userId || !code || !data || !data.action) {
        response.redirect('/');
        return;
      }
      const game = await Game.getGameByCode(code);
      if (!game) {
        response.redirect('/');
        return;
      }
      const userId = request.session.userId;
      const player = game.getPlayer(userId);
      if (!player) {
        response.status(401).send('Sorry, cant find you');
        return
      }
      switch (data.action) {
        case 'player_played': {
          const cardIds = data.card_ids;
          if (!cardIds) {
            response.status(400).send('Sorry, cant find that card');
            return;
          }
          await game.playerPlayed(player, cardIds);
          break;
        }
        case 'dealer_picked': {
          const cardIds = data.card_ids;
          if (!cardIds) {
            response.status(400).send('Sorry, cant find that card');
            return;
          }
          await game.dealerPickedCard(player, cardIds);
          break;
        }
      }
      await wss.sendUpdate(code);
      response.send({ result: 'OK', message: JSON.stringify(data) });
    },

    leave: async (request: any, response: any) => {
      const userId = request.session.userId;
      const ws = wss.getSocket(userId);
      const games = await Game.getAllGames();
      games.forEach(async (gameObj) => {
        const game = Object.assign(new Game(gameObj.id), gameObj);
        const player = game.getPlayer(userId);
        if (player) {
          await game.leaveGame(player);
        }
      });
      request.session.destroy(function () {
        if (ws) {
          ws.close();
        }
        response.send({ result: 'OK', message: 'Session destroyed' });
      });
    }
  }
};

module.exports = controller;
