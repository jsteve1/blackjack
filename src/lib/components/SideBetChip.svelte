<script lang="ts">
  import { spring } from 'svelte/motion';
  import { fade, fly } from 'svelte/transition';
  import { sideBetStore } from '../stores/sideBets';
  import { onMount } from 'svelte';

  const chipRotation = spring(0, {
    stiffness: 0.05,
    damping: 0.3
  });

  // Smooth oscillation animation
  onMount(() => {
    let startTime = Date.now();
    const animateChip = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      chipRotation.set(Math.sin(elapsed * 0.5) * 10);
      requestAnimationFrame(animateChip);
    };
    animateChip();
  });

  // Check if any side bets are available
  $: hasAvailableBets = Object.values($sideBetStore.bets).some(bet => bet.isAvailable);
</script>

{#if hasAvailableBets}
  <div class="side-bet-container">
    <button 
      class="chip-button"
      on:click={() => sideBetStore.toggleSideBets()}
      style="transform: rotate({$chipRotation}deg)"
    >
      <div class="chip-inner">
        <span class="chip-text">SIDE BETS</span>
        <div class="fire-effect"></div>
      </div>
    </button>

    {#if $sideBetStore.showSideBets}
      <div class="betting-dropdown" transition:fly={{ y: 50, duration: 300 }}>
        {#each Object.values($sideBetStore.bets) as bet}
          {#if bet.isAvailable}
            <div class="side-bet-option">
              <div class="bet-header">
                <div class="bet-title">
                  <span>{bet.name}</span>
                  <div class="tooltip-container">
                    <span class="info-icon">?</span>
                    <div class="tooltip">
                      <div class="tooltip-header">{bet.name}</div>
                      <div class="tooltip-description">{bet.description}</div>
                      <div class="tooltip-payouts">
                        {#each bet.payoutInfo as payout}
                          <div class="payout-line">{payout}</div>
                        {/each}
                      </div>
                    </div>
                  </div>
                </div>
                {#if bet.amount > 0}
                  <span class="current-bet">${bet.amount}</span>
                {/if}
              </div>
              <div class="quick-bets">
                {#each [5, 10, 25, 50] as amount}
                  <button 
                    class="mini-chip"
                    on:click={() => sideBetStore.placeBet(bet.id as any, amount)}
                  >
                    ${amount}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .side-bet-container {
    position: relative;
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
    background: linear-gradient(135deg, #ff4e50, #f9d423);
    box-shadow: 
      0 4px 15px rgba(0,0,0,0.2),
      0 0 20px rgba(255,78,80,0.4),
      inset 0 2px 2px rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4px dashed rgba(255, 255, 255, 0.5);
    position: relative;
    overflow: hidden;
  }

  .chip-text {
    color: white;
    font-weight: bold;
    font-size: 0.8rem;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    z-index: 1;
  }

  .fire-effect {
    position: absolute;
    bottom: -50%;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(0deg, #ff4e50, transparent 70%);
    filter: blur(8px);
    animation: fire 2s infinite;
    opacity: 0.7;
  }

  @keyframes fire {
    0% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-10px) scale(1.1); }
    100% { transform: translateY(0) scale(1); }
  }

  .betting-dropdown {
    position: fixed;
    left: 50%;
    bottom: 5rem;
    transform: translateX(-50%);
    background: rgba(44, 62, 80, 0.95);
    backdrop-filter: blur(10px);
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    min-width: 300px;
    z-index: 100;
  }

  @media (max-width: 375px) {
    .betting-dropdown {
      min-width: 250px;
      width: calc(100% - 2rem);
      margin: 0 1rem;
      background: transparent;
      backdrop-filter: none;
      box-shadow: none;
    }
  }



  .side-bet-option {
    padding: 0.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }

  .bet-header {
    display: flex;
    justify-content: space-between;
    color: #ffd700;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .current-bet {
    color: #2ecc71;
  }

  .quick-bets {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
    justify-content: end;
  }

  @media (max-width: 375px) {
    .bet-header {
      flex-direction: column;
      align-items: flex-end;
    }

  }

  .mini-chip {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    border: 2px dashed rgba(255,255,255,0.3);
    background: linear-gradient(135deg, #ff4e50, #f9d423);
    color: white;
    font-size: 0.8rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .mini-chip:hover {
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .chip-button {
      width: 60px;
      height: 60px;
    }

    .chip-text {
      font-size: 0.7rem;
    }
  }

  .bet-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tooltip-container {
    position: relative;
    display: inline-block;
  }

  .info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.7rem;
    cursor: help;
    transition: all 0.3s ease;
  }

  .tooltip-container:hover .info-icon {
    background: rgba(255, 255, 255, 0.3);
  }

  .tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(44, 62, 80, 0.98);
    backdrop-filter: blur(10px);
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    width: 200px;
    margin-bottom: 0.5rem;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 200;
  }

  .tooltip-container:hover .tooltip {
    opacity: 1;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: rgba(44, 62, 80, 0.98) transparent transparent transparent;
  }

  .tooltip-header {
    color: #ffd700;
    font-weight: bold;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .tooltip-description {
    color: white;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }

  .tooltip-payouts {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 0.5rem;
  }

  .payout-line {
    color: #ffd700;
    font-size: 0.75rem;
    padding: 0.2rem 0;
  }
</style> 