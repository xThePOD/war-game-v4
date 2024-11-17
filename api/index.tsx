/** @jsxImportSource frog/jsx */

import { Button, Frog } from 'frog'
import { handle } from 'frog/vercel'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Game Logic Interfaces
interface Card {
  value: number
  suit: string
  label: string
  filename: string
}

interface GameState {
  playerDeck: Card[]
  computerDeck: Card[]
  playerCard: Card | null
  computerCard: Card | null
  warPile: Card[]
  message: string
  gameStatus: 'initial' | 'playing' | 'war' | 'ended'
  isWar: boolean
}

// Initialize the Frog app
export const app = new Frog({
  basePath: '/api',
  imageOptions: {
    width: 1200,
    height: 628,
    fonts: [
      {
        name: 'Gloria Hallelujah',
        source: 'google',
        weight: 400,
      },
    ],
  },
  title: 'War Card Game',
  initialState: createInitialState(),
})

// Function to create game UI component
const GameUI = ({ state }: { state: GameState }) => {
  const { playerDeck, computerDeck, playerCard, computerCard, message, isWar } = state
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#1a472a',
        color: 'white',
        padding: '20px',
        width: '100%',
        height: '100%',
      }}
    >
      <h1 style={{ fontSize: '40px', marginBottom: '20px' }}>War Card Game</h1>
      
      <div style={{ fontSize: '24px', marginBottom: '20px' }}>
        Player Cards: {playerDeck.length} | Computer Cards: {computerDeck.length}
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          {playerCard && (
            <>
              <h3>Your Card</h3>
              <img
                src={`/assets/cards/${playerCard.filename}`}
                alt={playerCard.label}
                style={{ width: '200px', height: '280px' }}
              />
            </>
          )}
        </div>
        
        <div style={{ textAlign: 'center' }}>
          {computerCard && (
            <>
              <h3>Computer's Card</h3>
              <img
                src={`/assets/cards/${computerCard.filename}`}
                alt={computerCard.label}
                style={{ width: '200px', height: '280px' }}
              />
            </>
          )}
        </div>
      </div>
      
      <div style={{
        fontSize: '28px',
        textAlign: 'center',
        padding: '20px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: '10px',
        margin: '20px'
      }}>
        {isWar ? "⚔️ WAR! ⚔️" : message}
      </div>
    </div>
  )
}

// Function to create the initial game state
function createInitialState(): GameState {
  const deck = createDeck()
  const shuffledDeck = shuffle(deck)
  const midpoint = Math.floor(shuffledDeck.length / 2)
  
  return {
    playerDeck: shuffledDeck.slice(0, midpoint),
    computerDeck: shuffledDeck.slice(midpoint),
    playerCard: null,
    computerCard: null,
    warPile: [],
    message: "Welcome to War! Draw a card to begin.",
    gameStatus: 'initial',
    isWar: false
  }
}

// Function to create a deck of cards
function createDeck(): Card[] {
  const suits = ['clubs', 'diamonds', 'hearts', 'spades']
  const values = Array.from({ length: 13 }, (_, i) => i + 1)
  
  return suits.flatMap(suit => 
    values.map(value => {
      const label = getCardLabel(value)
      return {
        value,
        suit,
        label: `${label} of ${suit}`,
        filename: `${value}_of_${suit}.png`
      }
    })
  )
}

// Function to get the label for a card value
function getCardLabel(value: number): string {
  const specialCards: { [key: number]: string } = {
    1: 'Ace',
    11: 'Jack',
    12: 'Queen',
    13: 'King'
  }
  return specialCards[value] || value.toString()
}

// Function to shuffle an array of cards
function shuffle(array: Card[]): Card[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// Global game state
let gameState: GameState = createInitialState()

// Main game frame
app.frame('/', (c) => {
  const { gameStatus } = gameState
  
  const buttons = []
  
  if (gameStatus === 'initial' || gameStatus === 'playing') {
    buttons.push(<Button action="/draw_card">Draw Card</Button>)
  }
  
  if (gameStatus === 'war') {
    buttons.push(<Button action="/continue_war">Continue War</Button>)
  }
  
  buttons.push(<Button action="/reset_game">Reset Game</Button>)
  buttons.push(<Button action="/view_rules">Rules</Button>)
  
  if (gameStatus === 'ended') {
    buttons.push(<Button action="/exit_game">Exit Game</Button>)
  }

  return c.res({
    image: <GameUI state={gameState} />,
    intents: buttons
  })
})

// Draw card action
app.frame('/draw_card', (c) => {
  const { playerDeck, computerDeck } = gameState
  
  if (!playerDeck.length || !computerDeck.length) {
    gameState.message = `Game Over! ${playerDeck.length ? 'Player' : 'Computer'} Wins!`
    gameState.gameStatus = 'ended'
    return c.res({
      image: <GameUI state={gameState} />,
      intents: [<Button action="/">Return to Game</Button>]
    })
  }

  const playerCard = playerDeck.shift()!
  const computerCard = computerDeck.shift()!
  
  gameState.playerCard = playerCard
  gameState.computerCard = computerCard
  
  if (playerCard.value === computerCard.value) {
    gameState.isWar = true
    gameState.gameStatus = 'war'
    gameState.warPile = [playerCard, computerCard]
    gameState.message = "It's a tie! War begins!"
  } else {
    const winner = playerCard.value > computerCard.value ? 'player' : 'computer'
    if (winner === 'player') {
      playerDeck.push(playerCard, computerCard)
      gameState.message = `You win with ${playerCard.label}!`
    } else {
      computerDeck.push(playerCard, computerCard)
      gameState.message = `Computer wins with ${computerCard.label}!`
    }
    gameState.gameStatus = 'playing'
  }
  
  return c.res({
    image: <GameUI state={gameState} />,
    intents: [<Button action="/">Return to Game</Button>]
  })
})

// War continuation action
app.frame('/continue_war', (c) => {
  const { playerDeck, computerDeck, warPile } = gameState
  
  if (playerDeck.length < 4 || computerDeck.length < 4) {
    gameState.message = `${playerDeck.length > computerDeck.length ? 'Player' : 'Computer'} wins the war by default!`
    gameState.gameStatus = 'ended'
    return c.res({
      image: <GameUI state={gameState} />,
      intents: [<Button action="/">Return to Game</Button>]
    })
  }

  // Draw war cards
  for (let i = 0; i < 3; i++) {
    warPile.push(playerDeck.shift()!, computerDeck.shift()!)
  }
  
  const playerCard = playerDeck.shift()!
  const computerCard = computerDeck.shift()!
  warPile.push(playerCard, computerCard)
  
  gameState.playerCard = playerCard
  gameState.computerCard = computerCard
  
  if (playerCard.value === computerCard.value) {
    gameState.message = "Another tie! The war continues!"
  } else {
    const winner = playerCard.value > computerCard.value ? 'player' : 'computer'
    if (winner === 'player') {
      playerDeck.push(...warPile)
      gameState.message = `You win the war with ${playerCard.label}!`
    } else {
      computerDeck.push(...warPile)
      gameState.message = `Computer wins the war with ${computerCard.label}!`
    }
    gameState.warPile = []
    gameState.isWar = false
    gameState.gameStatus = 'playing'
  }
  
  return c.res({
    image: <GameUI state={gameState} />,
    intents: [<Button action="/">Return to Game</Button>]
  })
})

// Reset game action
app.frame('/reset_game', (c) => {
  gameState = createInitialState()
  return c.res({
    image: <GameUI state={gameState} />,
    intents: [<Button action="/">Return to Game</Button>]
  })
})

// View rules action
app.frame('/view_rules', (c) => {
  gameState.message = 'Each player draws a card. Higher card wins! If cards match, WAR begins!'
  return c.res({
    image: <GameUI state={gameState} />,
    intents: [<Button action="/">Return to Game</Button>]
  })
})

// Exit game action
app.frame('/exit_game', (c) => {
  gameState.message = 'Thanks for playing! Come back soon!'
  gameState.gameStatus = 'ended'
  return c.res({
    image: <GameUI state={gameState} />,
    intents: [<Button action="/">Return to Game</Button>]
  })
})

export const GET = handle(app)
export const POST = handle(app)