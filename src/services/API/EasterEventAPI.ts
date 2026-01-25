import { APIService } from './API';
import { Endpoint } from '@/typings/Endpoint.enum';

export class EasterEventAPI {
    // Core endpoints (not consolidated)
    private static startAPI = new APIService('easter_event/start' as Endpoint);
    private static awtyAPI = new APIService('easter_event/awty' as Endpoint);
    private static gameScreenAPI = new APIService('easter_event/game-screen' as Endpoint);

    // Helper to create action endpoint
    private static action(name: string) {
        return new APIService(`easter_event/${name}` as Endpoint);
    }

    static async start(userId: string, lat: number, lng: number) {
        return this.startAPI.post({ user_id: userId, lat, lng }, {});
    }

    static async awty(userId: string, lat: number, lng: number) {
        return this.awtyAPI.post({ user_id: userId, lat, lng }, {});
    }

    static async getGameScreen(userId: string) {
        return this.gameScreenAPI.get({ user_id: userId });
    }

    static async getChapter(chapterId: number) {
        return this.action(`chapter/${chapterId}`).get({});
    }

    // Consolidated action endpoints
    static async collect(userId: string, answer: string = '') {
        return this.action('collect').post({ user_id: userId, answer }, {});
    }

    static async submitPuzzleAnswer(userId: string, puzzleId: number, answer: string) {
        return this.action('puzzle').post({ user_id: userId, puzzle_id: puzzleId, answer }, {});
    }

    static async acknowledgeSafety(userId: string) {
        return this.action('acknowledge').post({ user_id: userId }, {});
    }

    static async reportHazard(userId: string) {
        return this.action('hazard').post({ user_id: userId }, {});
    }

    static async restart(userId: string) {
        return this.action('restart').post({ user_id: userId }, {});
    }

    static async resetSpawnLocation(userId: string, lat: number, lng: number) {
        return this.action('reset-spawn').post({ user_id: userId, lat, lng }, {});
    }
}
