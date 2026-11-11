import type { GameState, NewsItem } from './types';
import { newId } from './people';

/** Keep the news feed short: it is saved with the game. */
export const NEWS_CAP = 40;

export function addNews(state: GameState, text: string, tone: NewsItem['tone'] = 'neutral'): void {
  state.news.unshift({ id: newId(state, 'n'), week: state.week, year: state.year, text, tone });
  if (state.news.length > NEWS_CAP) state.news.length = NEWS_CAP;
}

export const round1 = (v: number) => Math.round(v * 10) / 10;
