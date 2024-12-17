<script lang="ts">
  import { sideBetStore } from '../stores/sideBets';
  import { bettingStore } from '../stores/betting';
  import { fade, slide } from 'svelte/transition';

  let selectedBetType: string | null = null;
  let customBetAmount = '';

  function handleBet(betType: string, amount: number) {
    if ($bettingStore.balance >= amount) {
      sideBetStore.placeBet(betType as any, amount);
      bettingStore.placeBet(amount);
    }
  }

  function handleCustomBet(betType: string) {
    const amount = parseInt(customBetAmount);
    if (!isNaN(amount) && amount > 0 && amount <= $bettingStore.balance) {
      handleBet(betType, amount);
      customBetAmount = '';
    }
  }
</script>

<div class="side-bets-container">
  <div class="side-bets-header">
    <h3>Side Bets</h3>
    <button class="history-button" on:click={() => selectedBetType = 'history'}>
      History
    </button>
  </div>

  {#if selectedBetType === 'history'}
    <div class="history-panel" transition:slide>
      <h4>Side Bet History</h4>
      <div class="history-list">
        {#each $sideBetStore.history as entry}
          <div class="history-item">
            <span class="bet-type">{entry.betType}</span>
            <span class="amount">${entry.amount}</span>
            <span class="result" class:won={entry.result === 'Won'}>
              {entry.result}: ${entry.payout}
            </span>
          </div>
        {/each}
      </div>
      <button class="close-button" on:click={() => selectedBetType = null}>
        Close History
      </button>
    </div>
  {:else}
    <div class="side-bets-grid">
      {#each Object.values($sideBetStore.bets) as bet}
        {#if bet.isAvailable}
          <div 
            class="side-bet-card" 
            class:selected={selectedBetType === bet.id}
            on:click={() => selectedBetType = selectedBetType === bet.id ? null : bet.id}
          >
            <div class="bet-header">
              <h4>{bet.name}</h4>
              {#if bet.amount > 0}
                <span class="current-bet">Bet: ${bet.amount}</span>
              {/if}
            </div>
            
            {#if selectedBetType === bet.id}
              <div class="bet-details" transition:slide>
                <p class="description">{bet.description}</p>
                <div class="payout-info">
                  {#each bet.payoutInfo as info}
                    <div class="payout-line">{info}</div>
                  {/each}
                </div>
                
                <div class="betting-controls">
                  <div class="quick-bets">
                    {#each [5, 10, 25, 50] as amount}
                      <button 
                        class="chip"
                        disabled={$bettingStore.balance < amount || amount > bet.maxBet}
                        on:click={() => handleBet(bet.id, amount)}
                      >
                        ${amount}
                      </button>
                    {/each}
                  </div>
                  
                  <div class="custom-bet">
                    <input
                      type="number"
                      bind:value={customBetAmount}
                      placeholder="Custom amount"
                      min="1"
                      max={Math.min($bettingStore.balance, bet.maxBet)}
                    />
                    <button 
                      on:click={() => handleCustomBet(bet.id)}
                      disabled={!customBetAmount || parseInt(customBetAmount) > Math.min($bettingStore.balance, bet.maxBet)}
                    >
                      Bet
                    </button>
                  </div>

                  {#if bet.amount > 0}
                    <button 
                      class="clear-bet"
                      on:click={() => sideBetStore.clearBet(bet.id as any)}
                    >
                      Clear Bet
                    </button>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .side-bets-container {
    background: rgba(44, 62, 80, 0.95);
    backdrop-filter: blur(10px);
    padding: 1rem;
    border-radius: 12px;
    color: white;
    margin-top: 1rem;
  }

  .side-bets-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .side-bets-header h3 {
    margin: 0;
    color: #ffd700;
    font-size: 1.2rem;
  }

  .history-button {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .history-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .side-bets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .side-bet-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .side-bet-card:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .side-bet-card.selected {
    background: rgba(255, 215, 0, 0.1);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
  }

  .bet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }



  .bet-header h4 {
    margin: 0;
    color: #ffd700;
  }

  .current-bet {
    color: #2ecc71;
    font-weight: bold;
  }

  .bet-details {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .description {
    margin: 0 0 1rem;
    font-size: 0.9rem;
    opacity: 0.8;
  }

  .payout-info {
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .payout-line {
    padding: 0.2rem 0;
    color: #ffd700;
  }

  .betting-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .quick-bets {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .chip {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px dashed rgba(255, 255, 255, 0.3);
    background: linear-gradient(135deg, #2ecc71, #27ae60);
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .chip:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .custom-bet {
    display: flex;
    gap: 0.5rem;
  }

  .custom-bet input {
    flex: 1;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .custom-bet button {
    padding: 0.5rem 1rem;
    background: #ffd700;
    color: #2c3e50;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }

  .clear-bet {
    width: 100%;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .clear-bet:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .history-panel {
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .history-list {
    max-height: 300px;
    overflow-y: auto;
    margin: 1rem 0;
  }

  .history-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .history-item .result {
    color: #e74c3c;
  }

  .history-item .result.won {
    color: #2ecc71;
  }

  .close-button {
    width: 100%;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .close-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 768px) {
    .side-bets-grid {
      grid-template-columns: 1fr;
    }

    .chip {
      width: 40px;
      height: 40px;
      font-size: 0.9rem;
    }
  }

  @media (max-width: 375px) {
    .bet-header {
      display: flex;
      align-items: flex-end;
    }
  }
</style> 