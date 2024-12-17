<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { bettingStore } from '$lib/stores/betting';
    import OdometerNumber from '$lib/components/OdometerNumber.svelte';
  let isDarkMode = false;
  let showHelp = false;

  onMount(() => {
    isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    updateTheme();
  });

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    updateTheme();
  }

  function updateTheme() {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }
</script>

<div class="app">
  <nav class="navbar">
    <div class="navbar-left">
      <div class="logo">
        <h1><span class="spade">♠️</span> Learn&nbsp;Blackjack</h1>
      </div>
    <div class="navbar-controls">
      <button class="help-button" on:click={() => showHelp = true}>?</button>
      <button class="theme-toggle" on:click={toggleTheme}>
        {#if isDarkMode}
          🌙
        {:else}
          ☀️
        {/if}
      </button>
      </div>
    </div>
    <div class="balance-bet-info-cont"> 
      <div class="balance-info-cont">
        Balance: <OdometerNumber value={$bettingStore.balance} isBalance={true} />
      </div>
      <div class="bet-info-cont">
        Bet: <OdometerNumber value={$bettingStore.currentBet} />
      </div>
    </div>
  </nav>
  
  <main>
    <slot />
  </main>
</div>

{#if showHelp}
  <div class="modal-overlay" 
       on:click={() => showHelp = false} 
       transition:fade={{ duration: 200 }}>
    <div class="modal" 
         on:click|stopPropagation 
         transition:fly={{ y: 20, duration: 300 }}>
      <div class="modal-content">
        <h2>How to Play Blackjack</h2>
        <div class="help-text">
          <p>🎯 <strong>Goal:</strong> Get closer to 21 than the dealer without going over.</p>
          <p>🎴 <strong>Card Values:</strong></p>
          <ul>
            <li>2-10: Face value</li>
            <li>J, Q, K: 10 points</li>
            <li>Ace: 1 or 11 (whichever helps you more)</li>
          </ul>
          <p>🎮 <strong>Controls:</strong></p>
          <ul>
            <li><strong>Hit:</strong> Take another card</li>
            <li><strong>Stand:</strong> Keep your current hand</li>
            <li><strong>Deal:</strong> Start a new game</li>
          </ul>
        </div>
        <button class="casino-button primary" 
                on:click={() => showHelp = false}>
          Got it!
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(:root) {
    --bg-color: #ffffff;
    --text-color: #333333;
    --nav-bg: #f8f9fa;
    --card-bg: #ffffff;
    --border-color: #e0e0e0;
  }

  :global(:root.dark) {
    --bg-color: #1a1a1a;
    --text-color: #ffffff;
    --nav-bg: #2d2d2d;
    --card-bg: #333333;
    --border-color: #404040;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    background-color: var(--bg-color);
    color: var(--text-color);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, sans-serif;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background-color: var(--nav-bg);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }

  .navbar-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  @media (max-width: 590px) {
    .navbar {
      padding: 0 1rem;
      height: 90px;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
    }
    .navbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
  }

  .logo h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: bold;
    color: #fff;
    white-space: nowrap;
  }

  @media (max-width: 480px) {
    .logo h1 {
      font-size: 1.2rem;
    }

    .navbar {
      padding: 0 1rem;
    }
  }

  .navbar-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .help-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    color: #fff;
    transition: opacity 0.3s ease;
    opacity: 0.9;
  }

  .help-button:hover {
    opacity: 1;
  }

  .theme-toggle {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: background-color 0.3s ease;
  }

  .theme-toggle:hover {
    background-color: var(--border-color);
  }

  main {
    margin-top: 60px;
    flex: 1;
    padding: 2rem;
  }

  .help-text {
    text-align: left;
    margin: 1rem 0;
  }

  .help-text p {
    margin: 0.5rem 0;
  }

  .help-text ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
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
    color: #fff;
  }

  .modal-content {
    text-align: center;
  }

  .modal-content h2 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: #fff;
  }

  .spade {
    filter: brightness(10);
  }

  .balance-display {
    display: flex;
    gap: 1rem;
    align-items: center;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  }

  .balance, .current-bet {
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    font-size: 1rem;
  }

  .current-bet {
    color: #2ecc71;
  }

  @media (max-width: 768px) {
    .balance-display {
      display: none;
    }

    .balance, .current-bet {
      display: none;
    }
  }

  .balance-bet-info-cont {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    align-items: center;
  }

  @media (max-width: 768px) {
    .balance-bet-info-cont {
      justify-content: flex-start;
    }
  }

  .balance-info-cont {
    width: fit-content;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: .9rem;
    padding: 8px 16px;
    border-radius: 15px;
    background-color: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }

  .bet-info-cont {
    width: fit-content;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: .9rem;
    padding: 8px 16px;
    border-radius: 15px;
    background-color: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }
</style> 