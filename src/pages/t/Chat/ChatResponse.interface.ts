import { Message } from '@/typings/Task';
import { InventoryItem } from '@/typings/inventoryItem';

export interface ChatResponse {
  ok: boolean;
  message: Message;
  items: InventoryItem[];
  energy: number;
}
