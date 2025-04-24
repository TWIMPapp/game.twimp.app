import { Colour } from './Colour.enum';
import { Sentiment } from './Sentiment.enum';
import { Status } from './Status.enum';
import { TaskType } from './TaskType.enum';
import { ThemeStyle } from './ThemeStyle.enum';
import { InventoryItem } from './inventoryItem';
import { Position } from '@/hooks/useGeolocation';

export interface Task {
  ok: boolean;
  id: number;
  type: TaskType;
  content: string;
  required: boolean;
  image_url?: string;
  audio_url?: string;
  video_url?: string;
  audio_autoplay?: boolean;
  audio_autonext?: boolean;
  theme?: ThemeStyle;
}

// Task sub properties
export interface Outcome {
  sentiment: Sentiment;
  title: string;
  subtitle: string;
  items?: InventoryItem[];
}

export interface Option {
  content: string;
  colour?: Colour;
  status?: Status;
}

export interface Marker {
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  image_url?: string;
  colour?: Colour;
  status?: Status;
}

export interface Character {
  name: string;
  image_url?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created: Date;
  character_id: string;
}

// Task varieties
export interface QuestionMultiTask extends Task {
  type: TaskType.Question_multi;
  hint?: string;
  options: Option[];
}

export interface QuestionSingleTask extends Task {
  type: TaskType.Question_single;
  hint?: string;
}

export interface MapTask extends Task {
  type: TaskType.Map;
  markers: Marker[];
}
export interface InformationTask extends Task {
  type: TaskType.Information;
}

export interface EvadeTask extends Task {
  type: TaskType.Evade;
}

export interface ChatTask extends Task {
  type: TaskType.Chat;
  character: Character[];
  messages: Message[];
}

export interface FinishTask extends Task {
  type: TaskType.Finish;
}

export interface MetalDetectorTask extends Task {
  type: TaskType.MetalDetector;
}

export interface HuntTask extends Task {
  type: TaskType.Hunt;
}

export interface AdventureAntsTask extends Task {
  type: TaskType.AdventureAnts;
  colonyPosition: Position;
  obstacles: Position[];
}

export type TaskUnion =
  | QuestionMultiTask
  | QuestionSingleTask
  | MapTask
  | InformationTask
  | ChatTask
  | FinishTask
  | EvadeTask
  | MetalDetectorTask
  | HuntTask
  | AdventureAntsTask;