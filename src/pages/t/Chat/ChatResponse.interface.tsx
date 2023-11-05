import { Message } from '@/types/Task';
import { InventoryItem } from '@/types/inventoryItem';

export interface ChatResponse {
  ok: boolean;
  message: Message;
  items: InventoryItem[];
  energy: number;
}
