import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  isPremium: boolean;
  gamesPlayedToday: number;
  lastPlayedDate: string;

  // Actions
  unlockPremium: () => void;
  resetPremium: () => void;
  incrementGamesPlayed: () => void;
  canPlayGame: () => boolean;
}

const FREE_GAMES_PER_DAY = 5;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isPremium: false,
      gamesPlayedToday: 0,
      lastPlayedDate: new Date().toDateString(),

      unlockPremium: () => {
        set({ isPremium: true });
      },

      resetPremium: () => {
        set({ isPremium: false });
      },

      incrementGamesPlayed: () => {
        const today = new Date().toDateString();
        const { lastPlayedDate, gamesPlayedToday } = get();

        // Reset count if it's a new day
        if (lastPlayedDate !== today) {
          set({ gamesPlayedToday: 1, lastPlayedDate: today });
        } else {
          set({ gamesPlayedToday: gamesPlayedToday + 1 });
        }
      },

      canPlayGame: () => {
        const { isPremium, gamesPlayedToday, lastPlayedDate } = get();
        const today = new Date().toDateString();

        // Premium users can always play
        if (isPremium) return true;

        // Reset count if new day
        if (lastPlayedDate !== today) {
          set({ gamesPlayedToday: 0, lastPlayedDate: today });
          return true;
        }

        // Free users limited to 5 games per day
        return gamesPlayedToday < FREE_GAMES_PER_DAY;
      },
    }),
    {
      name: 'chess-trainer-user',
    }
  )
);
