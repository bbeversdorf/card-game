import { PlayerCard, JudgeCard } from './card';

class Player {
  id: string;
  name: string = 'Unknown';
  whiteCards: Array<PlayerCard> = [];
  wonCards: Array<JudgeCard> = [];
  isDealer: boolean = false;

  constructor(playerId: string) {
    this.id = playerId;
  }

  changeName(name: string) {
    this.name = name;
  }

  submitCard(card: PlayerCard) {
    this.whiteCards.filter((currentCard) => currentCard != card);
  }

  winCard(card: JudgeCard) {
    this.wonCards.push(card);
  }
}

export { Player };
