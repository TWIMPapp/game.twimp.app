import { TaskUnion } from './Task';
import { Theme } from './Theme.enum';

export interface QueryParams {
  user_id?: string;
  trail_ref?: string;
  theme?: Theme;
  task?: TaskUnion;
}
