# ♟️ Chess Trainer - Web App

A professional chess training application with AI opponents at multiple difficulty levels and premium training modules.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (download from [nodejs.org](https://nodejs.org))
- npm (comes with Node.js)

### Installation

1. Open Command Prompt (cmd) in this folder
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## 🎮 Current Features (Phase 1)

✅ Beautiful chess board UI with coordinates
✅ Home screen with bot selection
✅ 5 bot difficulty levels (800-2400 ELO)
✅ Choose to play as White or Black
✅ Visual piece selection
✅ Responsive design (desktop & mobile)

## 📋 Upcoming Features

### Phase 2: Move System & Chess Logic (Next)
- Legal move validation
- Drag & drop pieces
- Special moves (castling, en passant, promotion)
- Check/checkmate detection
- Move history tracking

### Phase 3: Stockfish Integration
- AI bot opponents
- 5 difficulty levels with intelligent play
- Thinking indicator
- Bot move animations

### Phase 4: Game Features & Polish
- Undo/redo moves
- Resign option
- Game result modals
- Move sound effects
- Last move highlighting

### Phase 5: Premium Features
- Subscription system
- Tactics trainer (100+ puzzles)
- Opening trainer
- Endgame trainer
- Progress tracking

### Phase 6: PWA & Production
- Make app installable
- Offline support
- Performance optimization
- Production build

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **chess.js** - Chess logic (Phase 2)
- **Stockfish.js** - Chess engine (Phase 3)
- **Zustand** - State management (Phase 2+)

## 📁 Project Structure

```
src/
├── components/      # Reusable components
│   └── ChessBoard.tsx
├── screens/         # Main app screens
│   ├── HomeScreen.tsx
│   └── GameScreen.tsx
├── types/           # TypeScript types
├── utils/           # Utilities & constants
├── store/           # State management (Phase 2+)
├── engine/          # Chess engine integration (Phase 3+)
└── App.tsx          # Main app component
```

## 🎯 Development Phases

- ✅ **Phase 1**: Project setup & UI (COMPLETE)
- ⏳ **Phase 2**: Move logic (IN PROGRESS)
- 📝 **Phase 3**: Bot AI
- 📝 **Phase 4**: Polish & features
- 📝 **Phase 5**: Premium content
- 📝 **Phase 6**: PWA & launch

## 🐛 Troubleshooting

### npm install fails
- Make sure you're using Node.js 18 or higher
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

### Port 3000 already in use
- Change the port in `vite.config.ts`
- Or kill the process using port 3000

### TypeScript errors
- Run `npm install` to ensure all types are installed
- Restart your editor/IDE

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 📄 License

Private project - All rights reserved

---

**Ready to play chess?** Run `npm run dev` and start training! 🎮♟️
