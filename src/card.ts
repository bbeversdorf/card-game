
const uuid = require('uuid');

interface ColorCard {
  backgroundColor: string
  fontColor: string
  borderColor: string
}

class Card {
  id: number = 0;
  content: string;
  uuid: string;
  constructor(id: number, content: string) {
    this.id = id;
    this.content = content;
    this.uuid = uuid.v4();
  }
}

class JudgeCard extends Card {
  numberOfRequiredCards: number;

  constructor(id: number, content: string) {
    super(id, content);
    this.numberOfRequiredCards = 1;
  }

  static tempCard(): JudgeCard {
    return new JudgeCard(-1, "oops")
  }
}

class PlayerCard extends Card {}

class BlackCard extends JudgeCard implements ColorCard {
  borderColor: string = 'black';
  backgroundColor: string = 'black';
  fontColor: string = 'white';

  constructor(id: number, content: string) {
    super(id, content);
    this.numberOfRequiredCards = (this.content.match(/__________/g) || []).length;
  }
}

class WhiteCard extends PlayerCard implements ColorCard {
  borderColor: string = 'white';
  backgroundColor: string = 'white';
  fontColor: string = 'black';
}
class GreenCard extends JudgeCard implements ColorCard {
  borderColor: string = 'white';
  backgroundColor: string = 'green';
  fontColor: string = 'white';
  subtitle: string;

  constructor(id: number, content: any) {
    super(id, content.name);
    this.subtitle = content.subtitle;
  }
}

class RedCard extends PlayerCard implements ColorCard {
  borderColor: string = 'white';
  backgroundColor: string = 'red';
  fontColor: string = 'white';
  subtitle: string;

  constructor(id: number, content: any) {
    super(id, content.name);
    this.subtitle = content.subtitle;
  }
}

declare global {
  interface Array<T> {
    shuffle(): Array<T>;
  }
}
Array.prototype.shuffle = function <T>(): Array<T> {
  var array = this;
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


export { BlackCard, WhiteCard, GreenCard, RedCard, PlayerCard, JudgeCard };
