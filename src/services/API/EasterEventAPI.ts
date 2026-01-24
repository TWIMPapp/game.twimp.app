import { APIService } from './API';
import { Endpoint } from '@/typings/Endpoint.enum';

export class EasterEventAPI {
    // Core game endpoints
    private static startAPI = new APIService('easter_event/start' as Endpoint);
    private static awtyAPI = new APIService('easter_event/awty' as Endpoint);
    private static confirmArrivalAPI = new APIService('easter_event/confirm-arrival' as Endpoint);
    private static collectAPI = new APIService('easter_event/collect' as Endpoint);
    private static gameScreenAPI = new APIService('easter_event/game-screen' as Endpoint);
    private static puzzleAPI = new APIService('easter_event/puzzle' as Endpoint);
    private static safetyAPI = new APIService('easter_event/safety' as Endpoint);
    private static sessionAPI = new APIService('easter_event/session' as Endpoint);

    static async start(userId: string, lat: number, lng: number) {
        return this.startAPI.post({ user_id: userId, lat, lng }, {});
    }

    static async awty(userId: string, lat: number, lng: number) {
        return this.awtyAPI.post({ user_id: userId, lat, lng }, {});
    }

    static async confirmArrival(userId: string) {
        return this.confirmArrivalAPI.post({ user_id: userId }, {});
    }

    static async collect(userId: string, answer: string, isGolden: boolean = false) {
        return this.collectAPI.post({ user_id: userId, answer, is_golden: isGolden }, {});
    }

    static async collectGolden(userId: string) {
        return this.collectAPI.post({ user_id: userId, is_golden: true }, {});
    }

    static async getGameScreen(userId: string) {
        return this.gameScreenAPI.get({ user_id: userId });
    }

    static async getChapter(chapterId: number) {
        const api = new APIService(`easter_event/chapter/${chapterId}` as Endpoint);
        return api.get({});
    }

    static async submitPuzzleAnswer(userId: string, puzzleId: number, answer: string) {
        return this.puzzleAPI.post({ user_id: userId, puzzle_id: puzzleId, answer }, {});
    }

    // Consolidated safety endpoint
    static async acknowledgeSafety(userId: string) {
        return this.safetyAPI.post({ user_id: userId, action: 'acknowledge' }, {});
    }

    static async reportHazard(userId: string) {
        return this.safetyAPI.post({ user_id: userId, action: 'report-hazard' }, {});
    }

    // Consolidated session endpoint
    static async restart(userId: string) {
        return this.sessionAPI.post({ user_id: userId, action: 'restart' }, {});
    }

    static async resetSpawnLocation(userId: string, lat: number, lng: number) {
        return this.sessionAPI.post({ user_id: userId, action: 'reset-spawn', lat, lng }, {});
    }
}
