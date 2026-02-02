import { APIService } from './API';
import { Endpoint } from '@/typings/Endpoint.enum';

export class CustomTrailAPI {
    // Unified game endpoints
    private static playAPI = new APIService('play' as Endpoint);
    private static awtyAPI = new APIService('awty' as Endpoint);
    private static nextAPI = new APIService('next' as Endpoint);

    // Custom trail specific endpoints
    private static createAPI = new APIService('custom-trail/create' as Endpoint);
    private static trailAPI(id: string) {
        return new APIService(`custom-trail/${id}` as Endpoint);
    }

    // ===== Creation =====

    static async create(params: {
        creator_id: string;
        theme: string;
        name?: string;
        start_location: { lat: number; lng: number };
        pins?: any[];
        mode: 'random' | 'custom';
        competitive?: boolean;
        count?: number;
        has_questions?: boolean;
    }) {
        return this.createAPI.post(params, {});
    }

    static async getTrail(id: string) {
        return this.trailAPI(id).get({});
    }

    static async getCreatorView(id: string, creatorId: string) {
        return this.trailAPI(id).get({ creator_id: creatorId });
    }

    // ===== Playing =====

    static async start(userId: string, trailId: string, lat: number, lng: number) {
        return this.playAPI.post({ game_ref: `custom-trail-${trailId}`, user_id: userId, lat, lng }, {});
    }

    static async awty(userId: string, trailId: string, lat: number, lng: number) {
        return this.awtyAPI.post({ game_ref: `custom-trail-${trailId}`, user_id: userId, lat, lng }, {});
    }

    static async collect(userId: string, trailId: string, answer?: string, pinIndex?: number) {
        return this.nextAPI.post({
            game_ref: `custom-trail-${trailId}`,
            user_id: userId,
            action: 'collect',
            answer,
            ...(pinIndex !== undefined && { pin_index: pinIndex })
        }, {});
    }

    static async restart(userId: string, trailId: string) {
        return this.nextAPI.post({ game_ref: `custom-trail-${trailId}`, user_id: userId, action: 'restart' }, {});
    }
}
