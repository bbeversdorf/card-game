import { PlayerCard, JudgeCard, BlackCard, WhiteCard, GreenCard, RedCard } from "./card";
import { Player } from "./player";
import Round from "./round";
import { blackcards } from "./blackcards";
import { whitecards } from "./whitecards";

const deckType = 'cah';

const storage = require('node-persist');

class Game {
  id: number
  code: string
  whiteDeck: Array<PlayerCard> = [];
  blackDeck: Array<JudgeCard> = [];
  waitingPlayers: Array<Player> = [];
  round: Round = new Round(undefined, JudgeCard.tempCard());

  constructor(id: number, player: Player | null = null) {
    this.id = id;
    this.code = Game.makeCode(4);
    blackcards.shuffle().forEach((card, index) => {
      if (deckType === 'cah') {
        this.blackDeck.push(new BlackCard(index, card));
      } else {
        this.blackDeck.push(new GreenCard(index, card));
      }
    });
    whitecards.shuffle().forEach((card, index) => {
      if (deckType === 'cah') {
        this.whiteDeck.push(new WhiteCard(index, card));
      } else {
        this.whiteDeck.push(new RedCard(index, card));
      }
    });
  }
  get blackCard(): JudgeCard {
    return this.round.blackCard;
  }

  async joinGame(player: Player) {
    if (this.waitingPlayers.find(waitingPlayer => waitingPlayer.id === player.id)) {
      return;
    }
    if (this.round.currentPlayers.find(currentPlayer => currentPlayer.id === player.id)) {
      return;
    }
    const numberOfCardsInHand = player.whiteCards.length;
    for (let i = 0; i < 7 - numberOfCardsInHand; i++) {
      const whiteCard = this.whiteDeck.pop();
      if (!whiteCard) {
        return;
      }
      player.whiteCards.push(whiteCard);
    }
    this.waitingPlayers.push(player);
    await this.save();
  }

  async leaveGame(player: Player) {
    this.round.currentPlayers = this.round.currentPlayers.filter((currentPlayer) => currentPlayer.id != player.id);
    this.waitingPlayers = this.waitingPlayers.filter((currentPlayer) => currentPlayer.id != player.id);
    // if (this.submittedCards.length === this.players.length - 1) {
    //   this.dealerCanChoose = true;
    // }
    await this.save();
  }

  async startRound() {
    if (this.round.currentPlayers.length === 0) {
      const blackCard = this.blackDeck.pop() ?? JudgeCard.tempCard();
      this.round = new Round(undefined, blackCard);
    }
    this.round.startRound(this.waitingPlayers, this.whiteDeck);
    await this.save();
    return;
    if (this.round.currentPlayers.length < 3) {
      throw new Error("Opps not enough people to play");
    }
    await this.save();
  }

  async finishRound() {
    const blackCard = this.blackDeck.shift() ?? new JudgeCard(-1, "oops");
    this.round = new Round(this.round, blackCard);
  }


  getPlayer(userId: string): Player | undefined {
    const player = this.round.currentPlayers.find((player) => player.id === userId);
    if (!player) {
      return;
    }
    return Object.assign(new Player(player.id), player);
  }

  async playerPlayed(playerRef: Player, cardIds: [string]) {
    const player = this.round.currentPlayers.find((player) => player.id === playerRef.id);
    if (!player || player.isDealer || cardIds.length != this.round.blackCard.numberOfRequiredCards) {
      return;
    }
    if (this.round.submittedCards.find(submittedSet => submittedSet.playerId === player.id)) {
      return;
    }
    let cards: Array<PlayerCard> = [];
    cardIds.forEach((cardId) => {
      const playedCard = player.whiteCards.find(card => card.uuid === cardId);
      player.whiteCards = player.whiteCards.filter(card => card.uuid !== cardId);
      if (!playedCard) {
        return;
      }
      cards.push(playedCard);
    });
    this.round.playerPlayed(player, cards);
    await this.save();
  }

  async dealerPickedCard(dealer: Player, cardIds: [string]) {
    if (!dealer.isDealer) {
      return;
    }
    const cardId = cardIds[0];
    const submittedSet = this.round.submittedCards.find(submittedSet => submittedSet.cards.find(card => card.uuid === cardId));
    if (!submittedSet) {
      return;
    }
    const player = this.getPlayer(submittedSet.playerId);
    player?.wonCards.push(this.round.blackCard);
    await this.save();
    await this.finishRound();
  }

  async save() {
    let games = await Game.getAllGames();
    games = games.filter((game) => game.id !== this.id);
    games.push(this);
    try {
      await storage.setItem('games', games);
    } catch {}
  }

  static makeCode(length: number) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  static async setupStorage() {
    await storage.init({
      dir: 'storage/games',
    });
  }

  static async createNewGame(player: Player): Promise<Game> {
    const id = new Date().getTime();
    let game = new Game(id);
    game.joinGame(player);
    game.waitingPlayers = [player];
    let games = await storage.getItem('games') || [];
    games.push(game);
    await storage.setItem('games', games);
    return game;
  }

  static async getAllGames(): Promise<Array<Game>> {
    try {
      const games = await storage.getItem('games') || []
      return games;
    } catch {
      return [];
    }
  }

  static async getGame(id: number): Promise<Game | undefined> {
    let games = await Game.getAllGames();
    return games.find((game) => game.id === id);
  }

  static async getGameByCode(code: string): Promise<Game | undefined> {
    const games = await Game.getAllGames();
    const gameObj = games.find((game: Game) => game.code === code);
    if (!gameObj) {
      return;
    }
    const game = Object.assign(new Game(gameObj.id), gameObj);
    const roundObj = game.round as Round;
    game.round = Object.assign(new Round(undefined, JudgeCard.tempCard()), roundObj);
    return game;
  }
}

export { Game };
