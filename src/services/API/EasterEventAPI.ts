import { APIService } from './API';
import { Endpoint } from '@/typings/Endpoint.enum';

export class EasterEventAPI {
    // Unified game endpoints
    private static playAPI = new APIService('play' as Endpoint);
    private static awtyAPI = new APIService('awty' as Endpoint);
    private static nextAPI = new APIService('next' as Endpoint);

    // Easter-specific read endpoints
    private static gameScreenAPI = new APIService('easter_event/game-screen' as Endpoint);

    private static action(name: string) {
        return new APIService(`easter_event/${name}` as Endpoint);
    }

    static async start(userId: string, lat: number, lng: number) {
        return this.playAPI.post({ game_ref: 'easter-event', user_id: userId, lat, lng }, {});
    }

    static async awty(userId: string, lat: number, lng: number) {
        return this.awtyAPI.post({ game_ref: 'easter-event', user_id: userId, lat, lng }, {});
    }

    static async getGameScreen(userId: string) {
        return this.gameScreenAPI.get({ user_id: userId });
    }

    static async getChapter(chapterId: number) {
        return this.action(`chapter/${chapterId}`).get({});
    }

    // Actions via unified /next endpoint
    static async collect(userId: string, answer: string = '') {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'collect', answer }, {});
    }

    static async submitPuzzleAnswer(userId: string, puzzleId: number, answer: string) {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'puzzle', puzzle_id: puzzleId, answer }, {});
    }

    static async acknowledgeSafety(userId: string) {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'acknowledge' }, {});
    }

    static async reportHazard(userId: string) {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'hazard' }, {});
    }

    static async restart(userId: string) {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'restart' }, {});
    }

    static async resetSpawnLocation(userId: string, lat: number, lng: number) {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'reset-spawn', lat, lng }, {});
    }

    static async setCustomTrail(userId: string, locations: Array<{ lat: number; lng: number }>) {
        return this.action('set-custom-trail').post({ user_id: userId, locations }, {});
    }

    static async clearCustomTrail(userId: string) {
        return this.action('clear-custom-trail').post({ user_id: userId }, {});
    }
}
