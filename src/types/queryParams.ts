import { Theme } from './theme.enum';

export interface QueryParams {
  user_id: string;
  user_full_name: string;
  user_image_url: string;
  trail_ref: string;
  trail_sequence: string;
  path: string;
  lat: string;
  lng: string;
  theme: Theme;
}
