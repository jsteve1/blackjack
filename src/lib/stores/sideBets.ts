import { writable } from 'svelte/store';
import type { Card } from '../types/card';

interface SideBet {
  id: string;
  name: string;
  description: string;
  amount: number;
  isAvailable: boolean;
  maxBet: number;
  payoutInfo: string[];
}

interface SideBetHistory {
  betType: string;
  amount: number;
  result: string;
  payout: number;
  timestamp: number;
}

interface SideBetState {
  bets: {
    insurance: SideBet;
    perfectPairs: SideBet;
    poker: SideBet;
    luckyLadies: SideBet;
  };
  history: SideBetHistory[];
  showSideBets: boolean;
}

const initialState: SideBetState = {
  bets: {
    insurance: {
      id: 'insurance',
      name: 'Insurance',
      description: 'Bet half your original bet when dealer shows Ace',
      amount: 0,
      isAvailable: false,
      maxBet: 0, // Half of original bet
      payoutInfo: ['Pays 2:1 if dealer has blackjack']
    },
    perfectPairs: {
      id: 'perfectPairs',
      name: 'Perfect Pairs',
      description: 'Bet on getting a pair in your first two cards',
      amount: 0,
      isAvailable: true,
      maxBet: 100,
      payoutInfo: [
        'Mixed Pair (different colors) - 5:1',
        'Colored Pair (same color) - 12:1',
        'Perfect Pair (identical) - 25:1'
      ]
    },
    poker: {
      id: 'poker',
      name: '21+3',
      description: 'Make poker hands with your cards and dealer\'s up card',
      amount: 0,
      isAvailable: true,
      maxBet: 100,
      payoutInfo: [
        'Flush - 5:1',
        'Straight - 10:1',
        'Three of a Kind - 30:1',
        'Straight Flush - 40:1',
        'Suited Three of a Kind - 100:1'
      ]
    },
    luckyLadies: {
      id: 'luckyLadies',
      name: 'Lucky Ladies',
      description: 'Bet on your hand totaling 20',
      amount: 0,
      isAvailable: true,
      maxBet: 100,
      payoutInfo: [
        'Any 20 - 4:1',
        'Suited 20 - 10:1',
        'Matched 20 - 25:1',
        'Queen of Hearts Pair - 200:1',
        'Queen of Hearts Pair + Dealer BJ - 1000:1'
      ]
    }
  },
  history: [],
  showSideBets: false
};

function createSideBetStore() {
  const { subscribe, set, update } = writable<SideBetState>(initialState);

  function validatePokerHand(playerCards: Card[], dealerCard: Card): number {
    const cards = [...playerCards, dealerCard];
    const values = cards.map(c => c.value);
    const suits = cards.map(c => c.suit);
    
    // Check for suited three of a kind
    if (suits.every(s => s === suits[0]) && values.every(v => v === values[0])) {
      return 100;
    }
    
    // Check for straight flush
    if (suits.every(s => s === suits[0])) {
      // Convert face cards to numbers
      const numericValues = values.map(v => {
        if (v === 'A') return 14;
        if (v === 'K') return 13;
        if (v === 'Q') return 12;
        if (v === 'J') return 11;
        return parseInt(v);
      }).sort((a, b) => a - b);
      
      if (numericValues[2] - numericValues[0] === 2) return 40;
    }
    
    // Check for three of a kind
    if (values[0] === values[1] && values[1] === values[2]) return 30;
    
    // Check for straight (similar to straight flush check but without suit requirement)
    const numericValues = values.map(v => {
      if (v === 'A') return 14;
      if (v === 'K') return 13;
      if (v === 'Q') return 12;
      if (v === 'J') return 11;
      return parseInt(v);
    }).sort((a, b) => a - b);
    
    if (numericValues[2] - numericValues[0] === 2) return 10;
    
    // Check for flush
    if (suits.every(s => s === suits[0])) return 5;
    
    return 0;
  }

  function validatePerfectPairs(cards: Card[]): number {
    if (cards.length !== 2 || cards[0].value !== cards[1].value) return 0;
    
    // Perfect pair (same suit)
    if (cards[0].suit === cards[1].suit) return 25;
    
    // Colored pair (same color)
    const suitColors: Record<string, 'red' | 'black'> = {
      hearts: 'red',
      diamonds: 'red',
      clubs: 'black',
      spades: 'black'
    };
    if (suitColors[cards[0].suit] === suitColors[cards[1].suit]) return 12;
    
    // Mixed pair
    return 5;
  }

  function validateLuckyLadies(playerCards: Card[], dealerHasBlackjack: boolean): number {
    if (playerCards.length !== 2) return 0;
    
    const isQueenOfHearts = (card: Card) => card.value === 'Q' && card.suit === 'hearts';
    const queenOfHeartsPair = playerCards.every(isQueenOfHearts);
    
    if (queenOfHeartsPair && dealerHasBlackjack) return 1000;
    if (queenOfHeartsPair) return 200;
    
    const total = calculateHandValue(playerCards);
    if (total !== 20) return 0;
    
    if (playerCards[0].value === playerCards[1].value && 
        playerCards[0].suit === playerCards[1].suit) return 25;
    if (playerCards[0].suit === playerCards[1].suit) return 10;
    return 4;
  }

  function calculateHandValue(cards: Card[]): number {
    let total = 0;
    let aces = 0;
    
    cards.forEach(card => {
      if (['K', 'Q', 'J'].includes(card.value)) total += 10;
      else if (card.value === 'A') {
        aces += 1;
        total += 11;
      }
      else total += parseInt(card.value);
    });
    
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    
    return total;
  }

  return {
    subscribe,
    reset: () => set(initialState),
    toggleSideBets: () => update(state => ({
      ...state,
      showSideBets: !state.showSideBets
    })),
    placeBet: (betType: keyof SideBetState['bets'], amount: number) => update(state => ({
      ...state,
      bets: {
        ...state.bets,
        [betType]: {
          ...state.bets[betType],
          amount: state.bets[betType].amount + amount
        }
      }
    })),
    clearBet: (betType: keyof SideBetState['bets']) => update(state => ({
      ...state,
      bets: {
        ...state.bets,
        [betType]: {
          ...state.bets[betType],
          amount: 0
        }
      }
    })),
    setAvailability: (betType: keyof SideBetState['bets'], isAvailable: boolean) => update(state => ({
      ...state,
      bets: {
        ...state.bets,
        [betType]: {
          ...state.bets[betType],
          isAvailable
        }
      }
    })),
    evaluateBets: (playerCards: Card[], dealerCards: Card[], mainBet: number) => update(state => {
      const results: SideBetHistory[] = [];
      let newState = { ...state };

      // Evaluate insurance
      if (state.bets.insurance.amount > 0) {
        const dealerHasBlackjack = dealerCards.length === 2 && 
          calculateHandValue(dealerCards) === 21;
        const payout = dealerHasBlackjack ? state.bets.insurance.amount * 2 : 0;
        results.push({
          betType: 'Insurance',
          amount: state.bets.insurance.amount,
          result: dealerHasBlackjack ? 'Won' : 'Lost',
          payout,
          timestamp: Date.now()
        });
      }

      // Evaluate perfect pairs
      if (state.bets.perfectPairs.amount > 0) {
        const multiplier = validatePerfectPairs(playerCards);
        const payout = state.bets.perfectPairs.amount * multiplier;
        results.push({
          betType: 'Perfect Pairs',
          amount: state.bets.perfectPairs.amount,
          result: multiplier > 0 ? 'Won' : 'Lost',
          payout,
          timestamp: Date.now()
        });
      }

      // Evaluate 21+3 poker
      if (state.bets.poker.amount > 0 && dealerCards.length > 0) {
        const multiplier = validatePokerHand(playerCards, dealerCards[0]);
        const payout = state.bets.poker.amount * multiplier;
        results.push({
          betType: '21+3',
          amount: state.bets.poker.amount,
          result: multiplier > 0 ? 'Won' : 'Lost',
          payout,
          timestamp: Date.now()
        });
      }

      // Evaluate Lucky Ladies
      if (state.bets.luckyLadies.amount > 0) {
        const dealerHasBlackjack = dealerCards.length === 2 && 
          calculateHandValue(dealerCards) === 21;
        const multiplier = validateLuckyLadies(playerCards, dealerHasBlackjack);
        const payout = state.bets.luckyLadies.amount * multiplier;
        results.push({
          betType: 'Lucky Ladies',
          amount: state.bets.luckyLadies.amount,
          result: multiplier > 0 ? 'Won' : 'Lost',
          payout,
          timestamp: Date.now()
        });
      }

      // Reset all bet amounts
      (Object.keys(state.bets) as Array<keyof typeof state.bets>).forEach(betType => {
        newState.bets[betType].amount = 0;
      });

      return {
        ...newState,
        history: [...results, ...state.history].slice(0, 50) // Keep last 50 entries
      };
    })
  };
}

export const sideBetStore = createSideBetStore(); 