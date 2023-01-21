import { Player } from "./player";
import { JudgeCard, PlayerCard } from "./card";
import { Game } from "./game";

type SubmittedSet = {
  playerId: string;
  cards: Array<PlayerCard>;
}

class Round {

  dealer: Player | undefined;
  blackCard: JudgeCard;
  id = 0;
  dealerCanChoose = false;
  submittedCards: Array<SubmittedSet> = [];
  currentPlayers: Array<Player> = [];
  waitingPlayers: Array<Player> = [];
  previousDealerId: string;

  constructor(previousRound: Round | undefined, blackCard: JudgeCard) {
    this.blackCard = blackCard;
    this.previousDealerId = previousRound?.dealer?.id || '';
    this.id = (previousRound?.id ?? -1) + 1;
  }

  startRound(waitingPlayers: Array<Player>, whiteDeck: Array<PlayerCard>) {
    this.dealerCanChoose = false;
    waitingPlayers.forEach(player => {
      this.currentPlayers.push(player);
    });
    let wasPreviousDealer = false;
    for (let i = 0; i < this.currentPlayers.length; i++) {
      const player = this.currentPlayers[i];
      if (this.previousDealerId === player.id) {
        wasPreviousDealer = true;
      } else if (wasPreviousDealer) {
        this.dealer = player;
        wasPreviousDealer = false;
      }
      const numberOfCardsInHand = player.whiteCards.length;
      for (let i = 0; i < 7 - numberOfCardsInHand; i++) {
        const whiteCard = whiteDeck.pop();
        if (!whiteCard) {
          return;
        }
        player.whiteCards.push(whiteCard);
      }
    }
    if (this.currentPlayers.length && this.dealer === null) {
      this.dealer = this.currentPlayers[0];
    }
  }

  async playerPlayed(player: Player, cards: Array<PlayerCard>) {
    const submittedSet: SubmittedSet = {
      playerId: player.id,
      cards: cards
    };
    this.submittedCards.push(submittedSet);
    if (this.submittedCards.length == this.currentPlayers.length - 1) {
      this.dealerCanChoose = true;
    }
  }

  async dealerPickedCard(game: Game, dealer: Player, cardIds: [string]) {
    if (!this.dealer || dealer.id !== this.dealer.id) {
      return;
    }
    const cardId = cardIds[0];
    const submittedSet = this.submittedCards.find(submittedSet => submittedSet.cards.find(card => card.uuid === cardId));
    if (!submittedSet) {
      return;
    }
    const player = game.getPlayer(submittedSet.playerId);
    player?.wonCards.push(this.blackCard);
    await game.save();
    await game.finishRound();
  }

  isDealer(player: Player): boolean {
    if (this.dealer && player.id === this.dealer.id) {
      return true;
    }
    return false;
  }
}

export default Round;
