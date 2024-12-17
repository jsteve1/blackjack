import { writable } from 'svelte/store';
import type { Card } from '../types/card';

interface SplitHandsState {
  hands: {
    cards: Card[];
    score: number;
    done: boolean;
    bet: number;
  }[];
  currentHandIndex: number;
  canSplit: boolean;
  isSplit: boolean;
}

const initialState: SplitHandsState = {
  hands: [],
  currentHandIndex: 0,
  canSplit: false,
  isSplit: false
};

function createSplitHandsStore() {
  const { subscribe, set, update } = writable<SplitHandsState>(initialState);

  return {
    subscribe,
    reset: () => set(initialState),
    
    initializeSplit: (firstCard: Card, secondCard: Card, initialBet: number) => update(state => ({
      ...state,
      hands: [
        { cards: [firstCard], score: 0, done: false, bet: initialBet },
        { cards: [secondCard], score: 0, done: false, bet: initialBet }
      ],
      currentHandIndex: 0,
      isSplit: true,
      canSplit: false
    })),

    addCardToCurrentHand: (card: Card) => update(state => {
      const newHands = [...state.hands];
      newHands[state.currentHandIndex].cards.push(card);
      return { ...state, hands: newHands };
    }),

    updateScore: (handIndex: number, score: number) => update(state => {
      const newHands = [...state.hands];
      newHands[handIndex].score = score;
      return { ...state, hands: newHands };
    }),

    finishCurrentHand: () => update(state => {
      const newHands = [...state.hands];
      newHands[state.currentHandIndex].done = true;
      
      // Move to next hand if available
      const nextHandIndex = state.currentHandIndex + 1;
      const newHandIndex = nextHandIndex < newHands.length ? nextHandIndex : state.currentHandIndex;
      
      return {
        ...state,
        hands: newHands,
        currentHandIndex: newHandIndex
      };
    }),

    checkCanSplit: (hand: Card[]) => update(state => {
      const canSplit = hand.length === 2 && 
        hand[0].value === hand[1].value && 
        !state.isSplit;
      return { ...state, canSplit };
    }),

    getAllHandsDone: () => update(state => {
      const allDone = state.hands.every(hand => hand.done);
      if (allDone) {
        return initialState;
      }
      return state;
    })
  };
}

export const splitHandsStore = createSplitHandsStore(); 