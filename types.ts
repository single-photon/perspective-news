export enum NewsStyle {
  LEFT = 'Left Wing',
  NEUTRAL = 'Neutral',
  RIGHT = 'Right Wing',
  SATIRE = 'Satire',
  ELI12 = '12-Year-Old',
  FICTION = 'Micro Fiction'
}

export interface NewsItem {
  id: string;
  headline: string;
  content: string;
  originalSource: string;
  sourceUrl?: string;
  publishedTime?: string;
}

export interface NewsResponse {
  stories: NewsItem[];
}

export type LoadingState = 'idle' | 'fetching-news' | 'rewriting' | 'error' | 'success';