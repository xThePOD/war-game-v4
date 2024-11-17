interface Card {
  value: number;
  suit: string;
  imageUrl: string;
}

interface LocalState {
  playerDeck: Card[];
  computerDeck: Card[];
  playerCard?: Card;
  computerCard?: Card;
  message: string;
}

function initializeGame(): LocalState {
  const deck = createShuffledDeck();
  const midpoint = Math.floor(deck.length / 2);
  return {
    playerDeck: deck.slice(0, midpoint),
    computerDeck: deck.slice(midpoint),
    message: 'Welcome to War! Press "Next Round" to start.',
  };
}

function createShuffledDeck(): Card[] {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = Array.from({ length: 13 }, (_, i) => i + 1);
  const deck = suits.flatMap((suit) =>
    ranks.map((rank) => ({
      suit,
      value: rank,
      imageUrl: `/assets/cards/${rank}_of_${suit}.png`,
    }))
  );
  return deck.sort(() => Math.random() - 0.5);
}

export { initializeGame, createShuffledDeck };
