import { InventoryItem } from '../../../types/InventoryItem';

export interface MultiQuestionResponse {
  correct: boolean;
  message: string;
  items: InventoryItem[];
}
