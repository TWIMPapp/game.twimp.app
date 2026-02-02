export interface Game {
    ref: string;
    name: string;
    description: string;
    image_url: string;
    audio_url?: string;
    lat: number | null;
    lng: number | null;
    isFree: boolean;
    distanceInMiles?: number | null;
    hasSession?: boolean;
    type?: 'WALK' | 'EVENT';
    gradient?: string;
    content_pack?: boolean;
    status?: 'active' | 'featured' | 'pending' | 'inactive';
}

export interface User {
    id: string; // email or UUID
    email?: string;
}

export interface Location {
    type: 'Point';
    coordinates: [number, number];
}

export interface TrailTask {
    type: string;
    content?: string;
    hint?: string;
    answer?: string[];
    answerChoices?: string[];
    required?: boolean;
    id?: string | number;
    image?: string;
    image_url?: string;
    audio_url?: string;
    markers?: any[] | string[];
    options?: any[];
    on_arrival?: string[];
    theme?: string;
    options_randomised?: boolean;
}

export interface Step {
    location?: Location;
    locationId?: string;
    type?: string;
    name: string;
    hidden?: boolean;
    tasks: TrailTask[];
    id?: string;
    state?: string;
    on_search?: any;
    can_revisit?: boolean;
    trackingEnabled?: boolean;
    index?: number;
}

export interface Trail {
    ref: string;
    name: string;
    type: string; // e.g., 'WALK'
    description?: string;
    ownerId: string | null;
    ageSuitability: string;
    attributes: string[];
    image_url?: string;
    audio_url?: string;
    items?: any[];
    steps: Step[];
    locations?: { id: string; lat: number; lng: number; name?: string; index?: number }[];
    price?: number;
    isFree?: boolean;
    content_pack?: boolean;
    region?: string;
    tags?: string[];
    partner?: string;
    energy_expires?: number;
    tester?: boolean;
    isValidating?: boolean;
    start_node_caption?: string;
}
