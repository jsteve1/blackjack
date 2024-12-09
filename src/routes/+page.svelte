<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import confetti from 'canvas-confetti';

  // Game state
  let deck: Card[] = [];
  let playerHand: Card[] = [];
  let dealerHand: Card[] = [];
  let gameStatus = 'Press "Deal" to start';
  let gameInProgress = false;
  let playerScore = 0;
  let dealerScore = 0;
  let dealingInProgress = false;
  let winningHand = '';

  interface Card {
    suit: string;
    value: string;
    hidden?: boolean;
    imageUrl: string;
  }

  // Card setup
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  function createDeck() {
    const newDeck: Card[] = [];
    suits.forEach(suit => {
      values.forEach(value => {
        newDeck.push({
          suit,
          value,
          imageUrl: `https://deckofcardsapi.com/static/img/${value === '10' ? '0' : value}${suit.charAt(0).toUpperCase()}.png`
        });
      });
    });
    return shuffle(newDeck);
  }

  function getChipColor(denomination: number): string {
    switch(denomination) {
      case 25: return '#4CAF50';  // Green
      case 50: return '#2196F3';  // Blue
      case 100: return '#F44336';  // Red
      case 500: return '#9C27B0';  // Purple
      default: return '#757575';   // Grey
    }
  }

  function shuffle(array: Card[]) {
    let currentIndex = array.length;
    while (currentIndex > 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  function calculateScore(hand: Card[]) {
    let score = 0;
    let aces = 0;

    hand.forEach(card => {
      if (!card.hidden) {
        if (['K', 'Q', 'J'].includes(card.value)) score += 10;
        else if (card.value === 'A') {
          aces += 1;
          score += 11;
        }
        else score += parseInt(card.value);
      }
    });

    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }

    return score;
  }

  async function dealCards() {
    dealingInProgress = true;
    deck = createDeck();
    playerHand = [];
    dealerHand = [];
    
    // Deal cards with animation delay
    await new Promise(resolve => setTimeout(resolve, 300));
    playerHand = [deck.pop()!];
    await new Promise(resolve => setTimeout(resolve, 300));
    dealerHand = [deck.pop()!];
    await new Promise(resolve => setTimeout(resolve, 300));
    playerHand = [...playerHand, deck.pop()!];
    await new Promise(resolve => setTimeout(resolve, 300));
    dealerHand = [...dealerHand, { ...deck.pop()!, hidden: true }];
    
    dealingInProgress = false;
    gameInProgress = true;
    gameStatus = "Your turn";
    updateScores();
  }

  function hit() {
    if (!gameInProgress) return;
    playerHand = [...playerHand, deck.pop()!];
    updateScores();
    
    if (playerScore > 21) {
      endGame('Bust! Dealer wins!');
    }
  }

  function stand() {
    if (!gameInProgress) return;
    dealerHand[1].hidden = false;
    updateScores();

    while (dealerScore < 17) {
      dealerHand = [...dealerHand, deck.pop()!];
      updateScores();
    }

    if (dealerScore > 21) endGame('Dealer bust! You win!');
    else if (dealerScore > playerScore) endGame('Dealer wins!');
    else if (dealerScore < playerScore) endGame('You win!');
    else endGame('Push - it\'s a tie!');
  }

  function updateScores() {
    playerScore = calculateScore(playerHand);
    dealerScore = calculateScore(dealerHand);
  }

  async function endGame(message: string) {
    gameStatus = message;
    gameInProgress = false;
    winningHand = message.toLowerCase().includes('you win') ? 'player' : 
                  message.toLowerCase().includes('dealer wins') ? 'dealer' : '';
    
    // Wait for card animations to complete (600ms animation + 200ms delay per card)
    const totalDelay = 800;
    await new Promise(resolve => setTimeout(resolve, totalDelay));
    
    showModal = true;
    
    if (message.toLowerCase().includes('you win')) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }

  // Add to existing variables
  let windowWidth: number;
  let showModal = false;

  // Add this to handle window resize
  onMount(() => {
    windowWidth = window.innerWidth;
    const handleResize = () => {
      windowWidth = window.innerWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });
</script>

{#if showModal}
  <div class="modal-overlay" 
       on:click={() => showModal = false} 
       transition:fade={{ duration: 200 }}>
    <div class="modal" 
         on:click|stopPropagation 
         transition:fly={{ y: 20, duration: 300 }}>
      <div class="modal-content">
        <h2 class:win={winningHand === 'player'} 
            class:lose={winningHand === 'dealer'}>
          {gameStatus}
        </h2>
        <button class="casino-button primary" 
                on:click={() => showModal = false}>
          Continue
        </button>
      </div>
    </div>
  </div>
{/if}

<div class="game-container">
  {#if windowWidth > 768}
    <div class="deck-area">
      <div class="deck" class:dealing={dealingInProgress}>
        {#each Array(5) as _, i}
          <div class="deck-card" style="--deck-index: {i}">
            <img src="https://deckofcardsapi.com/static/img/back.png" alt="Card back" />
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="game-status" class:animate={gameStatus !== 'Press "Deal" to start'}>
    <span class="status-text" class:win={winningHand === 'player'} class:lose={winningHand === 'dealer'}>
      {gameStatus}
    </span>
  </div>

  <div class="game-area">
    <div class="hand-section dealer-section">
      <h3 class="hand-title">Dealer's Hand {dealerScore > 0 && !dealerHand[1]?.hidden ? `(${dealerScore})` : ''}</h3>
      <div class="cards dealer-cards">
        {#each dealerHand as card, i}
          <div 
            class="card" 
            class:hidden={card.hidden}
            style="--card-index: {i}; --origin-x: {-50 * i}%;"
            in:fly|local={{
              x: window?.innerWidth ? window.innerWidth / 2 - (i * 60) : 0,
              y: -300,
              duration: 600,
              delay: i * 200
            }}
            out:fly|local={{y: -200, duration: 300}}
          >
            <img
              src={card.hidden ? 'https://deckofcardsapi.com/static/img/back.png' : card.imageUrl}
              alt={card.hidden ? 'Hidden card' : `${card.value} of ${card.suit}`}
            />
          </div>
        {/each}
      </div>
    </div>

    <div class="hand-section player-section">
      <h3 class="hand-title">Your Hand ({playerScore})</h3>
      <div class="cards player-cards">
        {#each playerHand as card, i}
          <div 
            class="card"
            style="--card-index: {i}; --origin-x: {-50 * i}%;"
            in:fly|local={{
              x: window?.innerWidth ? window.innerWidth / 2 - (i * 60) : 0,
              y: -300,
              duration: 600,
              delay: i * 200
            }}
            out:fly|local={{y: 200, duration: 300}}
          >
            <img src={card.imageUrl} alt={`${card.value} of ${card.suit}`} />
          </div>
        {/each}
      </div>
    </div>

    <div class="controls">
      <button 
        on:click={dealCards} 
        disabled={gameInProgress}
        class="casino-button deal-button"
        class:primary={!gameInProgress}
      >
        Deal
      </button>
      <button 
        on:click={hit} 
        disabled={!gameInProgress}
        class="casino-button"
        class:action={gameInProgress}
      >
        Hit
      </button>
      <button 
        on:click={stand} 
        disabled={!gameInProgress}
        class="casino-button"
        class:action={gameInProgress}
      >
        Stand
      </button>
    </div>
  </div>
</div>

<style>
  .game-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
    padding-bottom: 100px;
    position: relative;
    overflow: hidden;
  }

  .hand-section {
    margin-bottom: 1rem;
    padding: 1rem;
    border-radius: 12px;
    overflow: hidden;
  }

  .dealer-cards, .player-cards {
    display: flex;
    justify-content: center;
    padding: 0.5rem;
    min-height: 150px;
    position: relative;
    overflow: visible;
  }

  .hand-title {
    text-align: center;
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0 0 1rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #e0e0e0;
    text-shadow: 
      0 0 10px rgba(255,255,255,0.5),
      2px 2px 0px #000;
  }

  .card img {
    width: 100px;
    height: auto;
    border-radius: 8px;
    box-shadow: 
      0 4px 8px rgba(0,0,0,0.2),
      0 0 20px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
  }

  /* Compact layout for shorter screens or narrower widths */
  @media (max-height: 800px), (max-width: 768px) {
    .game-container {
      padding: 0.5rem;
      padding-bottom: 80px;
    }
    
    .hand-section {
      margin-bottom: 0.5rem;
      padding: 0.25rem;
    }

    .dealer-cards, .player-cards {
      min-height: 100px;
      padding: 0.25rem;
    }

    .hand-title {
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }

    .card img {
      width: 60px;
    }

    .controls {
      background: transparent;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
      padding: 0.5rem;
    }

    .casino-button {
      padding: 0.5rem 1rem;
      font-size: 1rem;
      min-width: unset;
    }
  }

  /* Extra compact layout for very short screens */
  @media (max-height: 600px) {
    .dealer-cards, .player-cards {
      min-height: 80px;
    }

    .card img {
      width: 50px;
    }

    .hand-title {
      font-size: 0.9rem;
      margin-bottom: 0.15rem;
    }

    .game-status {
      margin-bottom: 0.25rem;
    }

    .status-text {
      font-size: 0.9rem;
      padding: 0.25rem 0.75rem;
    }
  }

  /* Prevent oversized elements on wide but short screens */
  @media (min-width: 769px) and (max-height: 800px) {
    .game-container {
      max-width: 800px;
    }

    .card img {
      width: 80px;
    }

    .hand-title {
      font-size: 1.4rem;
    }
  }

  .deck-area {
    position: relative;
    height: 100px;
    margin-bottom: 0.3rem;
  }

  .deck {
    position: absolute;
    left: 47.5%;
    transform: translateX(-50%);
    perspective: 1000px;
  }

  .deck-card {
    position: absolute;
    width: 75px;
    height: 100px;
    transform: translateY(calc(var(--deck-index) * -2px));
    transition: transform 0.3s ease;
  }

  .deck.dealing .deck-card {
    animation: deal-wobble 0.5s ease-in-out;
  }

  @keyframes deal-wobble {
    0% { transform: translateY(calc(var(--deck-index) * -2px)) rotate(0deg); }
    25% { transform: translateY(calc(var(--deck-index) * -2px)) rotate(-5deg); }
    75% { transform: translateY(calc(var(--deck-index) * -2px)) rotate(5deg); }
    100% { transform: translateY(calc(var(--deck-index) * -2px)) rotate(0deg); }
  }

  .deck-card img {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .game-status {
    text-align: center;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    margin-bottom: 2rem;
  }

  .game-status.animate {
    opacity: 1;
    transform: translateY(0);
  }

  .status-text {
    display: inline-block;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    font-size: 1.5rem;
    font-weight: bold;
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    background: linear-gradient(135deg, #2c3e50, #3498db);
    box-shadow: 
      0 4px 15px rgba(0,0,0,0.2),
      0 0 20px rgba(52,152,219,0.2);
  }

  .card {
    position: absolute;
    transform-origin: center bottom;
    transform: rotate(calc(var(--card-index) * 5deg - 10deg)) translateX(calc(var(--card-index) * 30px - 60px));
    transition: transform 0.3s ease;
    will-change: transform;
  }

  .card:last-child {
    margin-right: 0;
  }

  .card:hover {
    transform: translateY(-20px) rotate(calc(var(--card-index) * 5deg - 10deg)) translateX(calc(var(--card-index) * 30px - 60px));
    z-index: 10;
  }

  .controls {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    z-index: 100;
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    gap: 1.5rem;
  }

  .casino-button {
    min-width: 120px;
    padding: 0.75rem 1.5rem;
    font-size: 1.2rem;
  }

  .casino-button {
    font-size: 1.5rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
    padding: 1rem 3rem;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #2c3e50, #3498db);
    box-shadow: 
      0 4px 15px rgba(0,0,0,0.2),
      0 0 20px rgba(52,152,219,0.2),
      inset 0 2px 2px rgba(255,255,255,0.2);
  }

  .casino-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 
      0 6px 20px rgba(0,0,0,0.3),
      0 0 30px rgba(52,152,219,0.3),
      inset 0 2px 2px rgba(255,255,255,0.2);
  }

  .casino-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .casino-button.primary {
    background: linear-gradient(135deg, #27ae60, #2ecc71);
    box-shadow: 
      0 4px 15px rgba(0,0,0,0.2),
      0 0 20px rgba(46,204,113,0.2),
      inset 0 2px 2px rgba(255,255,255,0.2);
  }

  .casino-button.primary:hover:not(:disabled) {
    box-shadow: 
      0 6px 20px rgba(0,0,0,0.3),
      0 0 30px rgba(46,204,113,0.3),
      inset 0 2px 2px rgba(255,255,255,0.2);
  }

  .casino-button.action {
    background: linear-gradient(135deg, #e67e22, #f39c12);
    box-shadow: 
      0 4px 15px rgba(0,0,0,0.2),
      0 0 20px rgba(243,156,18,0.2),
      inset 0 2px 2px rgba(255,255,255,0.2);
  }

  .casino-button.action:hover:not(:disabled) {
    box-shadow: 
      0 6px 20px rgba(0,0,0,0.3),
      0 0 30px rgba(243,156,18,0.3),
      inset 0 2px 2px rgba(255,255,255,0.2);
  }

  .balance-display {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--text-color);
  }

  .betting-area {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .betting-area.hidden {
    display: none;
  }

  .chip-rack {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .chip {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 4px dashed rgba(255, 255, 255, 0.5);
    background: var(--chip-color);
    color: white;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    box-shadow: 
      0 4px 8px rgba(0, 0, 0, 0.2),
      inset 0 2px 3px rgba(255, 255, 255, 0.3);
  }

  .chip:hover:not(:disabled) {
    transform: translateY(-5px);
    box-shadow: 
      0 8px 16px rgba(0, 0, 0, 0.3),
      inset 0 2px 3px rgba(255, 255, 255, 0.3);
  }

  .chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .clear-bet {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    background: var(--nav-bg);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .clear-bet:hover {
    background: var(--border-color);
  }

  @media (max-width: 768px) {
    .chip {
      width: 50px;
      height: 50px;
      font-size: 0.9rem;
    }

    .controls {
      padding: 0.5rem;
      gap: 0.5rem;
    }

    .casino-button {
      min-width: 75px;
      padding: 0.75rem;
      font-size: 1rem;
    }

    .card {
      transform: rotate(calc(var(--card-index) * 5deg - 10deg)) translateX(calc(var(--card-index) * 20px - 40px));
    }

    .card:hover {
      transform: translateY(-10px) rotate(calc(var(--card-index) * 5deg - 10deg)) translateX(calc(var(--card-index) * 20px - 40px));
    }
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(3px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal {
    background: #2c3e50;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 90%;
    width: 400px;
  }

  .modal-content {
    text-align: center;
  }

  .modal-content h2 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: #fff;
  }

  .modal-content h2.win {
    color: #2ecc71;
  }

  .modal-content h2.lose {
    color: #e74c3c;
  }
</style>

