import { Sentiment } from './Sentiment.enum';

export interface InventoryItem {
  title: string;
  subtitle?: string;
  image_url: string;
  sentiment?: Sentiment;
}
