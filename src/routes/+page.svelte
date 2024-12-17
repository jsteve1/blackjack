<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import confetti from 'canvas-confetti';
  import { bettingStore } from '$lib/stores/betting';
  import BettingControls from '$lib/components/BettingControls.svelte';
  import { splitHandsStore } from '$lib/stores/splitHands';
  import SplitHands from '$lib/components/SplitHands.svelte';
  import type { Card } from '$lib/types/card';
  import { setContext } from 'svelte';
  import { sideBetStore } from '$lib/stores/sideBets';
  import SideBets from '$lib/components/SideBets.svelte';
  import SideBetChip from '$lib/components/SideBetChip.svelte';
  import OdometerNumber from '$lib/components/OdometerNumber.svelte';

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
  let betRequired = true;

  // Card setup
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  function createDeck() {
    const newDeck: Card[] = [];
    suits.forEach(suit => {
      values.forEach(value => {
        const cardValue = value === '10' ? '0' : value;
        const suitChar = suit.charAt(0).toUpperCase();
        const imageUrl = `https://deckofcardsapi.com/static/img/${cardValue}${suitChar}.png`;
        
        newDeck.push({
          suit,
          value,
          imageUrl
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
    if (betRequired && $bettingStore.currentBet === 0) {
      gameStatus = "Place a bet to start";
      return;
    }

    splitHandsStore.reset();
    dealingInProgress = true;
    deck = createDeck();
    playerHand = [];
    dealerHand = [];
    bettingStore.setBetState(false);
    
    // Deal cards with animation delay
    await new Promise(resolve => setTimeout(resolve, 300));
    playerHand = [deck.pop()!];
    await new Promise(resolve => setTimeout(resolve, 300));
    dealerHand = [deck.pop()!];
    await new Promise(resolve => setTimeout(resolve, 300));
    playerHand = [...playerHand, deck.pop()!];
    await new Promise(resolve => setTimeout(resolve, 300));
    dealerHand = [...dealerHand, { ...deck.pop()!, hidden: true }];
    
    // Check for insurance availability
    if (dealerHand[0].value === 'A') {
      sideBetStore.setAvailability('insurance', true);
    }
    
    dealingInProgress = false;
    gameInProgress = true;
    gameStatus = "Your turn";
    updateScores();
  }

  function hit() {
    if (!gameInProgress) return;
    
    if ($splitHandsStore.isSplit) {
      const newCard = deck.pop()!;
      splitHandsStore.addCardToCurrentHand(newCard);
      const currentHand = $splitHandsStore.hands[$splitHandsStore.currentHandIndex];
      const score = calculateScore(currentHand.cards);
      splitHandsStore.updateScore($splitHandsStore.currentHandIndex, score);
      
      if (score > 21) {
        splitHandsStore.finishCurrentHand();
        if ($splitHandsStore.hands.every(h => h.done)) {
          endGame('Bust! Dealer wins!');
        }
      }
    } else {
      playerHand = [...playerHand, deck.pop()!];
      updateScores();
      
      if (playerScore > 21) {
        endGame('Bust! Dealer wins!');
      }
    }
  }

  function stand() {
    if (!gameInProgress) return;

    if ($splitHandsStore.isSplit) {
      splitHandsStore.finishCurrentHand();
      if ($splitHandsStore.hands.every(h => h.done)) {
        dealerPlay();
      }
    } else {
      dealerPlay();
    }
  }

  async function dealerPlay() {
    dealerHand[1].hidden = false;
    updateScores();

    while (dealerScore < 17) {
      dealerHand = [...dealerHand, deck.pop()!];
      updateScores();
    }

    if ($splitHandsStore.isSplit) {
      let message = '';
      const hands = $splitHandsStore.hands;
      
      if (dealerScore > 21) {
        message = 'Dealer bust! All hands win!';
        hands.forEach(() => bettingStore.win());
      } else {
        const results = hands.map(hand => {
          if (hand.score > 21) return 'lose';
          if (hand.score > dealerScore) return 'win';
          if (hand.score < dealerScore) return 'lose';
          return 'push';
        });
        
        results.forEach(result => {
          if (result === 'win') bettingStore.win();
          else if (result === 'lose') bettingStore.lose();
          else bettingStore.push();
        });

        const wins = results.filter(r => r === 'win').length;
        const losses = results.filter(r => r === 'lose').length;
        const pushes = results.filter(r => r === 'push').length;
        
        message = `Results: ${wins} win${wins !== 1 ? 's' : ''}, ${losses} loss${losses !== 1 ? 'es' : ''}, ${pushes} push${pushes !== 1 ? 'es' : ''}`;
      }
      
      endGame(message);
      splitHandsStore.reset();
    } else {
      if (dealerScore > 21) endGame('Dealer bust! You win!');
      else if (dealerScore > playerScore) endGame('Dealer wins!');
      else if (dealerScore < playerScore) endGame('You win!');
      else endGame('Push - it\'s a tie!');
    }
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
    
    // Calculate and show floating number
    const betAmount = $bettingStore.currentBet;
    if (message.toLowerCase().includes('you win')) {
      floatingAmount = betAmount * 2;
      floatingNumberType = 'win';
      showFloatingNumber = true;
    } else if (message.toLowerCase().includes('dealer wins')) {
      floatingAmount = betAmount;
      floatingNumberType = 'loss';
      showFloatingNumber = true;
    }
    
    // Hide floating number after animation
    setTimeout(() => {
      showFloatingNumber = false;
    }, 1000);
    
    // Evaluate side bets before handling main bet
    sideBetStore.evaluateBets(playerHand, dealerHand, $bettingStore.currentBet);
    
    // Handle main bet outcome
    if (message.toLowerCase().includes('you win')) {
      bettingStore.win();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else if (message.toLowerCase().includes('dealer wins')) {
      bettingStore.lose();
    } else {
      bettingStore.push();
    }
    
    // Reset side bet availability
    Object.keys($sideBetStore.bets).forEach(betType => {
      sideBetStore.setAvailability(betType as any, betType !== 'insurance');
    });
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

  // Update the reactive statement for split detection
  $: {
    if (playerHand.length === 2 && $bettingStore.currentBet > 0) {
      const canSplit = playerHand[0].value === playerHand[1].value && 
                      $bettingStore.balance >= $bettingStore.currentBet;
      splitHandsStore.checkCanSplit(playerHand);
      console.log('Split check:', {
        cards: `${playerHand[0].value}-${playerHand[1].value}`,
        canSplit,
        currentBet: $bettingStore.currentBet,
        balance: $bettingStore.balance
      });
    } else {
      splitHandsStore.checkCanSplit([]);
    }
  }

  // Add the split handler function
  function handleSplit() {
    if (playerHand.length === 2 && $bettingStore.currentBet > 0) {
      const [firstCard, secondCard] = playerHand;
      splitHandsStore.initializeSplit(firstCard, secondCard, $bettingStore.currentBet);
      playerHand = [];  // Clear the main player hand
      gameStatus = "Playing split hands";
    }
  }

  // Add the context for the split handler
  setContext('handleSplit', handleSplit);

  // Subscribe to split store to handle game state
  $: if ($splitHandsStore.isSplit) {
    playerScore = $splitHandsStore.hands[$splitHandsStore.currentHandIndex]?.score || 0;
  }

  // Add double down handler
  async function handleDoubleDown() {
    if (!gameInProgress) return;
    
    // Deal one card only
    playerHand = [...playerHand, deck.pop()!];
    updateScores();
    
    // Automatically stand after one card
    if (playerScore <= 21) {
      stand();
    } else {
      endGame('Bust! Dealer wins!');
    }
  }

  // Add the context for double down
  setContext('handleDoubleDown', handleDoubleDown);

  // Add reactive statements to log store values
  $: {
    console.log('Store Debug Values:', {
      bettingMenuOpen: $bettingStore.showBettingUI,
      hasBet: $bettingStore.currentBet > 0,
      sidebetsOpen: $sideBetStore.showSideBets,
      currentBet: $bettingStore.currentBet
    });
  }

  // Add near other reactive statements
  let canDoubleDown = false;

  // Add to script section
  let showFloatingNumber = false;
  let floatingAmount = 0;
  let floatingNumberType: 'win' | 'loss' = 'win';
</script>
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

  <div class="game-status" 
       class:animate={gameStatus !== 'Press "Deal" to start'}
       class:betting-open={$bettingStore.showBettingUI}
       class:has-bet={$bettingStore.currentBet > 0}
       class:gameplay-actions={gameInProgress && (canDoubleDown || $splitHandsStore.canSplit)}
       class:sidebets-open={$sideBetStore.showSideBets && !gameInProgress}>
    <span class="status-text" 
          class:win={winningHand === 'player'} 
          class:lose={winningHand === 'dealer'}
          class:info={!winningHand}>
      {gameStatus}
    </span>
  </div>

  {#if showFloatingNumber}
    <div 
      class="floating-number" 
      class:win={floatingNumberType === 'win'}
      class:loss={floatingNumberType === 'loss'}
      transition:fly={{ y: 50, duration: 1000, opacity: 0 }}
    >
      {floatingNumberType === 'win' ? '+' : '-'}${floatingAmount}
    </div>
  {/if}

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

    {#if $splitHandsStore.isSplit}
      <SplitHands calculateScore={calculateScore} />
    {:else}
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
    {/if}

    <div class="controls">
      <BettingControls {playerHand} {gameInProgress} bind:canDoubleDown />
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
      {#if !gameInProgress}
        <SideBetChip />
      {/if}
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

  @media (max-width: 375px) {
    .hand-section { margin-top: 30px; }
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
      margin-bottom: 0.16rem;
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

  /* Base game status */
  .game-status {
    position: fixed;
    bottom: 6rem !important;  /* Default state */
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1001;
    text-align: center;
    opacity: 0;
    transition: all 0.3s ease;
    pointer-events: none;
  }

  .game-status.animate {
    opacity: 1;
  }

  /* iPhone SE specific status positioning */
  @media (max-width: 375px) {
    .game-status {
      bottom: 4.5rem !important;
    }

    .game-status.betting-open {
      bottom: 4.5rem !important;
    }

    .game-status.sidebets-open {
      bottom: 20rem !important;
    }
  }

  /* Larger screens status positioning */
  @media (min-width: 376px) {
    .game-status.betting-open:not(.gameplay-actions):not(.sidebets-open) {
      bottom: 16rem !important;
    }

    .game-status.betting-open.gameplay-actions:not(.sidebets-open) {
      bottom: 6rem !important;
    }

    .game-status.sidebets-open {
      bottom: 20rem !important;
    }
  }

  .status-text {
    display: inline-block;
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    font-size: 1.2rem;
    font-weight: bold;
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    background: linear-gradient(135deg, #2c3e50, #3498db);
    box-shadow: 
      0 4px 15px rgba(0,0,0,0.2),
      0 0 20px rgba(52,152,219,0.2);
  }

  .status-text.win {
    background: linear-gradient(135deg, #27ae60, #2ecc71);
    box-shadow: 
      0 4px 15px rgba(0,0,0,0.2),
      0 0 20px rgba(46,204,113,0.2);
  }

  .status-text.lose {
    background: linear-gradient(135deg, #c0392b, #e74c3c);
    box-shadow: 
      0 4px 15px rgba(0,0,0,0.2),
      0 0 20px rgba(231,76,60,0.2);
  }

  .status-text.info {
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
    padding: 0.75rem;
    z-index: 100;
    backdrop-filter: blur(10px);
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    background: transparent;
  }

  .casino-button {
    min-width: 60px;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
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

    .status-text {
      font-size: 1rem;
      padding: 0.4rem 1.2rem;
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

  .current-bet {
    text-align: center;
    color: #ffd700;
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 1rem;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  }

  .player-stats {
    text-align: center;
    margin-bottom: 0.8rem;
  }

  .stat-line {
    color: #ffd700;
    font-size: 1rem;
    font-weight: bold;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    margin: 0.2rem 0;
  }

  .game-area {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  @media (max-width: 375px) {
    .game-area {
      margin-top: 3rem;
    }
  }

  /* Side-by-side layout for wider screens */
  @media (min-width: 768px) and (max-height: 1200px) {
    .game-area {
      flex-direction: row;
      justify-content: center;
      align-items: flex-start;
      gap: 4rem;
      padding: 0 2rem;
      margin-top: 6rem; /* Increased space for deck and status */
    }

    .hand-section {
      flex: 1;
      max-width: 45%;
      min-width: 300px;
    }

    /* Keep deck area at top */
    .deck-area {
      position: absolute;
      top: 4rem; /* Below status message */
      left: 50%;
      transform: translateX(-50%);
      z-index: 1;
    }

    /* Handle split hands */
    .split-hands-container {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      max-width: 45%;
    }

    .split-hand {
      flex: 1;
      min-width: 200px;
      max-width: calc(50% - 0.5rem);
    }

    /* Adjust card sizes and rotation */
    .card img {
      width: 80px;
    }

    .card {
      transform: rotate(calc(var(--card-index) * 3deg - 6deg)) translateX(calc(var(--card-index) * 20px - 40px));
    }

    .card:hover {
      transform: translateY(-10px) rotate(calc(var(--card-index) * 3deg - 6deg)) translateX(calc(var(--card-index) * 20px - 40px));
    }
  }

  /* Adjustments for shorter heights */
  @media (min-width: 768px) and (max-height: 800px) {
    .game-area {
      margin-top: 5rem;
    }

    .deck-area {
      top: 3rem;
    }

    .card img {
      width: 70px;
    }

    .hand-title {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }

    .player-stats {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
  }

  /* Ensure betting menus don't overlap */
  .betting-dropdown, 
  .side-betting-dropdown {
    @media (min-width: 768px) and (max-height: 1200px) {
      position: fixed;
      bottom: 5rem;
      max-height: calc(100vh - 12rem);
      overflow-y: auto;
      z-index: 1000;
    }
  }

  /* iPhone SE and similar small screens */
  @media (max-width: 375px) {
    .game-container {
      padding: 0.25rem;
      padding-bottom: 70px;
      margin-top: -1.5rem;
    }

    .dealer-section {
      margin-top: -1.5rem;
      padding: 0.25rem;
    }

    .player-section {
      margin-top: -1rem;
    }

    .hand-title {
      font-size: 0.75rem;
      margin-bottom: 0.16rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .dealer-cards, .player-cards {
      min-height: 90px;
      margin-bottom: 0.25rem;
    }

    .card img {
      width: 55px;
    }

    /* Adjust card positioning for larger cards */
    .card {
      transform: rotate(calc(var(--card-index) * 3deg - 6deg)) translateX(calc(var(--card-index) * 18px - 36px));
    }

    .card:hover {
      transform: translateY(-5px) rotate(calc(var(--card-index) * 3deg - 6deg)) translateX(calc(var(--card-index) * 18px - 36px));
    }

    .controls {
      padding: 0.35rem;
      gap: 0.25rem;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      z-index: 1002;
    }

    .casino-button {
      min-width: 45px;
      padding: 0.35rem 0.5rem;
      font-size: 0.75rem;
    }

    /* Game status positioning */
    .game-status {
      transform: translate(-50%, -60px);
    }

    .game-status.betting-open:not(.gameplay-actions):not(.sidebets-open),
    .game-status.betting-open.gameplay-actions:not(.sidebets-open) {
      bottom: 1 !important;
    }

    .game-status.sidebets-open {
      bottom: 20rem !important;
    }

    .status-text {
      font-size: 0.75rem;
      padding: 0.25rem 0.7rem;
    }

    /* Make balance/bet text smaller */
    .balance, .bet {
      font-size: 0.65rem;
    }

    /* Adjust header text */
    .learn-blackjack-header {
      font-size: 0.65rem;
      padding: 0.25rem;
    }

    .learn-blackjack-header .balance,
    .learn-blackjack-header .bet {
      font-size: 0.6rem;
    }
  }

  .floating-number {
    position: fixed;
    left: 50%;
    bottom: 8rem;
    transform: translateX(-50%);
    font-family: 'Monaco', 'Courier New', monospace;
    font-weight: bold;
    font-size: 1.5rem;
    z-index: 1002;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    pointer-events: none;
  }

  .floating-number.win {
    color: #2ecc71;
  }

  .floating-number.loss {
    color: #e74c3c;
  }

  @media (max-width: 375px) {
    .floating-number {
      font-size: 1.2rem;
      bottom: 6rem;
    }
  }
</style>

