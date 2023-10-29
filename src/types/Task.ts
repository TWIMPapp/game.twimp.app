import { type } from 'os';
import { Colour } from './Colour.enum';
import { SentimentType } from './SentimentType.enum';
import { Status } from './Status.enum';
import { TaskType } from './TaskType.enum';

export interface Task {
  ok: boolean;
  type: TaskType;
  content: string;
  required: boolean;
  image_url?: string;
  audio_url?: string;
  sentiment?: Sentiment;
}

// Task sub properties

export interface Sentiment {
  type: SentimentType;
  title: string;
  subtitle: string;
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

export interface InstructionTask extends Task {
  type: TaskType.Instruction;
}

export interface ChatTask extends Task {
  type: TaskType.Chat;
  character: Character[];
  messages: Message[];
}

export type TaskUnion =
  | QuestionMultiTask
  | QuestionSingleTask
  | MapTask
  | InformationTask
  | InstructionTask
  | ChatTask;
