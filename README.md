# Learn Blackjack

A modern, interactive Blackjack game built with SvelteKit. Play now at [https://jsteve1.github.io/blackjack](https://jsteve1.github.io/blackjack)

![Blackjack Game Screenshot](./screenshots/screenshot.png)

## Features

- 🎮 Full Blackjack gameplay with realistic card animations
- 💰 Betting system with chip-based interface
- 🎲 Side bets including:
  - Insurance
  - Perfect Pairs
  - 21+3 Poker
  - Lucky Ladies
- ✂️ Split hands functionality
- 💫 Smooth animations and transitions
- 🌓 Dark/Light mode support
- 📱 Fully responsive design for mobile and desktop
- 🎉 Win celebrations with confetti effects

## Technical Details

Built with:
- SvelteKit
- TypeScript
- Canvas Confetti
- Deck of Cards API (for card images)


## Game Rules

- Standard Blackjack rules apply
- Dealer must hit on soft 17
- Blackjack pays 3:2
- Double down available on any first two cards
- Split pairs allowed
- Insurance available when dealer shows Ace

### Side Bet Payouts

#### Perfect Pairs
- Mixed Pair (different colors): 5:1
- Colored Pair (same color): 12:1
- Perfect Pair (identical): 25:1

#### 21+3 Poker
- Flush: 5:1
- Straight: 10:1
- Three of a Kind: 30:1
- Straight Flush: 40:1
- Suited Three of a Kind: 100:1

#### Lucky Ladies
- Any 20: 4:1
- Suited 20: 10:1
- Matched 20: 25:1
- Queen of Hearts Pair: 200:1
- Queen of Hearts Pair + Dealer Blackjack: 1000:1

## License

MIT License - feel free to use this code for your own projects!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.