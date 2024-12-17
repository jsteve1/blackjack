<script lang="ts">
  import { splitHandsStore } from '../stores/splitHands';
  import { fly } from 'svelte/transition';
  import type { Card } from '../types/card';

  export let calculateScore: (hand: Card[]) => number;
</script>

<div class="split-hands-container" class:is-split={$splitHandsStore.isSplit}>
  {#if $splitHandsStore.isSplit}
    {#each $splitHandsStore.hands as hand, index}
      <div 
        class="split-hand" 
        class:active={index === $splitHandsStore.currentHandIndex}
        class:done={hand.done}
      >
        <div class="hand-header">
          <h4>Hand {index + 1}</h4>
          <div class="hand-info">
            <span class="score">Score: {hand.score}</span>
            <span class="bet">Bet: ${hand.bet}</span>
          </div>
        </div>
        <div class="cards">
          {#each hand.cards as card, cardIndex}
            <div 
              class="card" 
              style="--card-index: {cardIndex}"
              in:fly|local={{
                x: window?.innerWidth ? window.innerWidth / 2 - (cardIndex * 60) : 0,
                y: -300,
                duration: 600,
                delay: cardIndex * 200
              }}
            >
              <img 
                src={card.imageUrl} 
                alt={`${card.value} of ${card.suit}`}
              />
            </div>
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .split-hands-container {
    display: flex;
    gap: 2rem;
    justify-content: center;
    flex-wrap: wrap;
    margin: 1rem 0;
  }

  .split-hand {
    flex: 1;
    min-width: 200px;
    max-width: 400px;
    padding: 1rem;
    border-radius: 12px;
    background: rgba(44, 62, 80, 0.3);
    transition: all 0.3s ease;
  }

  .split-hand.active {
    background: rgba(44, 62, 80, 0.6);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
  }

  .split-hand.done {
    opacity: 0.7;
  }

  .hand-header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .hand-header h4 {
    color: #fff;
    font-size: 1.2rem;
    margin: 0 0 0.5rem;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  }

  .hand-info {
    display: flex;
    justify-content: space-around;
    font-size: 0.9rem;
    color: #ffd700;
  }

  .cards {
    display: flex;
    justify-content: center;
    padding: 0.5rem;
    min-height: 150px;
    position: relative;
    overflow: visible;
  }

  .card {
    position: absolute;
    transform-origin: center bottom;
    transform: rotate(calc(var(--card-index) * 5deg - 10deg)) translateX(calc(var(--card-index) * 30px - 60px));
    transition: transform 0.3s ease;
    will-change: transform;
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

  .card:hover {
    transform: translateY(-20px) rotate(calc(var(--card-index) * 5deg - 10deg)) translateX(calc(var(--card-index) * 30px - 60px));
    z-index: 10;
  }

  @media (max-width: 768px) {
    .split-hands-container {
      flex-direction: column;
      gap: 1rem;
    }

    .split-hand {
      min-width: unset;
      width: 100%;
    }

    .card img {
      width: 60px;
    }

    .card {
      transform: rotate(calc(var(--card-index) * 5deg - 10deg)) translateX(calc(var(--card-index) * 20px - 40px));
    }

    .card:hover {
      transform: translateY(-10px) rotate(calc(var(--card-index) * 5deg - 10deg)) translateX(calc(var(--card-index) * 20px - 40px));
    }
  }
</style> 