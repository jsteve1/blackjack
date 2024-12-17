<script lang="ts">
  import { spring } from 'svelte/motion';
  import { onMount } from 'svelte';

  export let value: number = 0;
  export let isBalance: boolean = false;
  
  let displayValue = spring(value, {
    stiffness: 0.1,
    damping: 0.4
  });

  let prevValue = value;
  let isDecreasing = false;
  let pulseTimeout: ReturnType<typeof setTimeout>;

  $: {
    displayValue.set(value);
    if (isBalance) {
      isDecreasing = value < prevValue;
      if (pulseTimeout) clearTimeout(pulseTimeout);
      pulseTimeout = setTimeout(() => {
        isDecreasing = false;
      }, 1000);
    }
    prevValue = value;
  }

  onMount(() => {
    return () => {
      if (pulseTimeout) clearTimeout(pulseTimeout);
    };
  });
</script>

<div class="odometer-wrapper" class:balance={isBalance}>
  <div class="odometer" 
       class:decreasing={isDecreasing} 
       class:zero={value === 0}
       style="--spring-value: {$displayValue}">
    <span class="currency">$</span>
    <span class="digits">{Math.floor($displayValue).toLocaleString()}</span>
  </div>
</div>

<style>
  .odometer-wrapper {
    display: inline-flex;
    align-items: center;
    font-family: 'Monaco', 'Courier New', monospace;
    font-weight: bold;
    position: relative;
    overflow: hidden;
  }

  .odometer {
    display: flex;
    align-items: center;
    gap: 2px;
    transition: color 0.3s ease;
  }

  .currency {
    font-size: 0.9em;
    opacity: 0.9;
  }

  .digits {
    position: relative;
    transform: translateY(calc((var(--spring-value) - floor(var(--spring-value))) * -20px));
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Balance specific styles */
  .balance .odometer {
    color: #2ecc71;
  }

  .balance .odometer.decreasing {
    animation: pulse-red 1s ease-out;
  }

  .balance .odometer.zero {
    color: #c0392b;
  }

  @keyframes pulse-red {
    0% {
      color: #2ecc71;
    }
    50% {
      color: #e74c3c;
    }
    100% {
      color: #2ecc71;
    }
  }

  /* Shared hover effect */
  .odometer:hover .digits {
    transform: translateY(0);
    transition: transform 0.2s ease;
  }

  /* Mobile adjustments */
  @media (max-width: 375px) {
    .odometer-wrapper {
      font-size: 0.9rem;
    }
  }
</style> 