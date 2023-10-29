import { MessageItem } from '../../../types/MessageItem';
import { InventoryItem } from '../../../types/InventoryItem';

export interface ChatResponse {
  ok: boolean;
  message: MessageItem;
  items: InventoryItem[];
  energy: number;
}
