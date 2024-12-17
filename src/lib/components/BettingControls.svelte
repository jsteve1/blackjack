<script lang="ts">
  import { bettingStore } from '$lib/stores/betting';
  import { splitHandsStore } from '../stores/splitHands';
  import { sideBetStore } from '../stores/sideBets';
  import { spring } from 'svelte/motion';
  import { fade, fly } from 'svelte/transition';
  import { getContext } from 'svelte';
  import { onMount } from 'svelte';
  import type { Card } from '$lib/types/card';

  const chipRotation = spring(0, {
    stiffness: 0.05,
    damping: 0.3
  });

  let customBetAmount = '';
  export let playerHand: Card[] = [];
  export let gameInProgress: boolean = false;
  export let canDoubleDown: boolean;
  
  const handleSplit = getContext<() => void>('handleSplit');
  const handleDoubleDown = getContext<() => void>('handleDoubleDown');

  let isMobile = false;

  onMount(() => {
    isMobile = window.innerWidth <= 375;
    window.addEventListener('resize', () => {
      isMobile = window.innerWidth <= 375;
    });

    let startTime = Date.now();
    const animateChip = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      chipRotation.set(Math.sin(elapsed * 0.5) * 10);
      requestAnimationFrame(animateChip);
    };
    animateChip();
  });

  const betDenominations = [25, 50, 100, 500];

  function getChipColor(denomination: number): string {
    switch(denomination) {
      case 25: return '#4CAF50';  // Green
      case 50: return '#2196F3';  // Blue
      case 100: return '#F44336';  // Red
      case 500: return '#9C27B0';  // Purple
      default: return '#757575';   // Grey
    }
  }

  function handleCustomBet() {
    const amount = parseInt(customBetAmount);
    if (!isNaN(amount) && amount > 0 && amount <= $bettingStore.balance) {
      bettingStore.placeBet(amount);
      customBetAmount = '';
    }
  }

  function onSplitClick() {
    if ($splitHandsStore.canSplit && $bettingStore.balance >= $bettingStore.currentBet) {
      bettingStore.placeBet($bettingStore.currentBet);
      handleSplit();
      bettingStore.setBetState(false);
    }
  }

  let doubleDownUsed = false;

  function onDoubleDown() {
    if (canDoubleDown && !doubleDownUsed && $bettingStore.balance >= $bettingStore.currentBet) {
      bettingStore.placeBet($bettingStore.currentBet);
      doubleDownUsed = true;
      handleDoubleDown();
      bettingStore.setBetState(false);
    }
  }

  $: canPlaceBet = (amount: number) => $bettingStore.balance >= amount;

  $: if (!gameInProgress) {
    doubleDownUsed = false;
  }

  $: shouldShowMenu = $bettingStore.showBettingUI && (
    !gameInProgress ||
    $splitHandsStore.canSplit ||
    canDoubleDown
  );
</script>

<div class="betting-container">
  <button 
    class="chip-button"
    class:needs-bet={$bettingStore.needsBet && !$bettingStore.showBettingUI}
    on:click={() => {
      if ($sideBetStore.showSideBets) {
        sideBetStore.toggleSideBets();
      }
      bettingStore.toggleBettingUI();
    }}
    style="transform: rotate({$chipRotation}deg)"
  >
    <div class="chip-inner">
      <span class="chip-text">BET</span>
    </div>
  </button>

  {#if shouldShowMenu}
    <div 
      class="betting-dropdown"
      class:visible={$bettingStore.showBettingUI}
    >
      {#if !gameInProgress}
        {#if !isMobile}
          <div class="betting-info">
            <span>Balance: ${$bettingStore.balance}</span>
            <span>Current Bet: ${$bettingStore.currentBet}</span>
          </div>
        {/if}
        <div class="quick-bets">
          {#each betDenominations as amount}
            <button 
              class="chip" 
              style="--chip-color: {getChipColor(amount)}"
              on:click={() => bettingStore.placeBet(amount)}
              disabled={!canPlaceBet(amount)}
            >
              ${amount}
            </button>
          {/each}
        </div>
        {#if !isMobile}
          <div class="custom-bet">
            <input
              type="number"
              bind:value={customBetAmount}
              placeholder="Custom amount"
              min="1"
              max={$bettingStore.balance}
            />
            <button 
              on:click={handleCustomBet}
              disabled={!customBetAmount || parseInt(customBetAmount) > $bettingStore.balance}
            >
              Bet
            </button>
          </div>
        {/if}
      {/if}

      {#if $splitHandsStore.canSplit && $bettingStore.currentBet > 0}
        <button 
          class="chip split-chip"
          on:click={onSplitClick}
          disabled={$bettingStore.balance < $bettingStore.currentBet}
        >
          Split
        </button>
      {/if}

      {#if canDoubleDown && !doubleDownUsed}
        <button 
          class="chip double-chip"
          on:click={onDoubleDown}
          disabled={$bettingStore.balance < $bettingStore.currentBet}
        >
          2×
        </button>
      {/if}
    </div>
  {:else if $bettingStore.needsBet}
    <div class="overlay" transition:fade></div>
  {/if}
</div>

<style>
  /* Base styles */
  .betting-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .chip-button {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    transition: transform 0.3s ease;
    position: relative;
  }

  .chip-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #ffd700, #ffa500);
    box-shadow: 
      0 4px 15px rgba(0,0,0,0.2),
      0 0 20px rgba(255,215,0,0.2),
      inset 0 2px 2px rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4px dashed rgba(255, 255, 255, 0.5);
  }

  .chip-text {
    color: white;
    font-weight: bold;
    font-size: 1rem;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  }

  .betting-dropdown {
    position: fixed;
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1001;
  }

  .betting-dropdown.visible {
    opacity: 1;
    pointer-events: all;
    visibility: visible;
  }

  /* iPhone SE and similar small screens */
  @media (max-width: 375px) {
    .betting-dropdown {
      left: -100%;
      top: -350%;
      width: auto;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      background: transparent;
      box-shadow: none;
    }

    .betting-dropdown.visible {
      left: 0;
    }

    .quick-bets {
      display: flex;
      gap: 0.75rem;
      margin: 0;
      padding-left: 0.5rem;
      flex-direction: column !important;
    }

    .chip {
      width: 50px;
      height: 50px;
      transform: translateX(-20px);
      opacity: 0;
    }

    .betting-dropdown.visible .chip {
      transform: translateX(0);
      opacity: 1;
    }

    .betting-dropdown.visible .chip:nth-child(1) { transition-delay: 0.1s; }
    .betting-dropdown.visible .chip:nth-child(2) { transition-delay: 0.15s; }
    .betting-dropdown.visible .chip:nth-child(3) { transition-delay: 0.2s; }
    .betting-dropdown.visible .chip:nth-child(4) { transition-delay: 0.25s; }
  }

  /* Larger screens */
  @media (min-width: 376px) {
    .betting-dropdown {
      left: 50%;
      bottom: 5rem;
      transform: translateX(-50%);
      background: rgba(44, 62, 80, 0.95);
      backdrop-filter: blur(10px);
      padding: 1rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      min-width: 300px;
    }

    .betting-dropdown.visible {
      opacity: 1;
      pointer-events: all;
      visibility: visible;
    }

    .quick-bets {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .betting-info {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 0.5rem;
    }

    .custom-bet {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .custom-bet input {
      flex: 1;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      padding: 0.5rem;
      color: white;
      font-size: 0.9rem;
    }

    .custom-bet input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .custom-bet button {
      background: #ffd700;
      color: #2c3e50;
      border: none;
      border-radius: 4px;
      padding: 0.5rem 1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .custom-bet button:hover:not(:disabled) {
      background: #ffed4a;
      transform: translateY(-1px);
    }

    .custom-bet button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .chip {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 4px dashed rgba(255, 255, 255, 0.5);
    background: var(--chip-color);
    color: white;
    font-weight: bold;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 
      0 4px 8px rgba(0,0,0,0.3),
      inset 0 2px 2px rgba(255,255,255,0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .chip:hover:not(:disabled) {
    transform: translateX(5px);
  }

  @media (min-width: 376px) {
    .chip {
      width: 60px;
      height: 60px;
    }

    .chip:hover:not(:disabled) {
      transform: scale(1.1);
    }
  }

  .chip-button.needs-bet {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
    70% { box-shadow: 0 0 0 20px rgba(255, 215, 0, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: transparent;
    z-index: 90;
    pointer-events: none;
  }

  .needs-bet .chip-inner {
    animation: glow 2s infinite alternate;
  }

  @keyframes glow {
    from {
      box-shadow: 
        0 4px 15px rgba(0,0,0,0.2),
        0 0 20px rgba(255,215,0,0.2),
        inset 0 2px 2px rgba(255,255,255,0.3);
    }
    to {
      box-shadow: 
        0 4px 15px rgba(0,0,0,0.3),
        0 0 40px rgba(255,215,0,0.6),
        inset 0 2px 2px rgba(255,255,255,0.5);
    }
  }
</style> 