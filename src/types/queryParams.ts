import { TaskUnion } from './Task';
import { ThemeStyle } from './ThemeStyle.enum';

export interface QueryParams {
  user_id: string;
  trail_ref: string;
  theme?: ThemeStyle;
  task?: TaskUnion;
}
