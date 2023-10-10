export interface Task {
  type: string;
  content: string;
  required: boolean;
  image?: string;
  audio_url?: string;
}
