import { writable } from 'svelte/store';

interface BettingState {
  balance: number;
  currentBet: number;
  canBet: boolean;
  showBettingUI: boolean;
  needsBet: boolean;
}

const initialState: BettingState = {
  balance: 1000,
  currentBet: 0,
  canBet: true,
  showBettingUI: false,
  needsBet: true
};

function createBettingStore() {
  const { subscribe, set, update } = writable<BettingState>(initialState);

  return {
    subscribe,
    placeBet: (amount: number) => update(state => ({
      ...state,
      currentBet: state.currentBet + amount,
      balance: state.balance - amount,
      needsBet: false
    })),
    clearBet: () => update(state => ({
      ...state,
      balance: state.balance + state.currentBet,
      currentBet: 0,
      needsBet: true
    })),
    toggleBettingUI: () => update(state => ({
      ...state,
      showBettingUI: !state.showBettingUI
    })),
    setBetState: (canBet: boolean) => update(state => ({
      ...state,
      canBet,
      showBettingUI: false,
      needsBet: canBet
    })),
    reset: () => set(initialState),
    win: () => update(state => ({
      ...state,
      balance: state.balance + (state.currentBet * 2),
      currentBet: 0,
      canBet: true,
      needsBet: true
    })),
    lose: () => update(state => ({
      ...state,
      currentBet: 0,
      canBet: true,
      needsBet: true
    })),
    push: () => update(state => ({
      ...state,
      balance: state.balance + state.currentBet,
      currentBet: 0,
      canBet: true,
      needsBet: true
    }))
  };
}

export const bettingStore = createBettingStore(); 