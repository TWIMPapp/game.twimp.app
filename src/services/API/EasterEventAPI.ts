import { APIService } from './API';
import { Endpoint } from '@/typings/Endpoint.enum';

export class EasterEventAPI {
    private static startAPI = new APIService('easter_event/start' as Endpoint);
    private static awtyAPI = new APIService('easter_event/awty' as Endpoint);
    private static confirmArrivalAPI = new APIService('easter_event/confirm-arrival' as Endpoint);
    private static collectAPI = new APIService('easter_event/collect' as Endpoint);
    private static collectGoldenAPI = new APIService('easter_event/collect-golden' as Endpoint);
    private static gameScreenAPI = new APIService('easter_event/game-screen' as Endpoint);
    private static chapterAPI = new APIService('easter_event/chapter' as Endpoint);
    private static puzzleAPI = new APIService('easter_event/puzzle' as Endpoint);
    private static puzzleSubmitAPI = new APIService('easter_event/puzzle/submit' as Endpoint);
    private static missionsAPI = new APIService('easter_event/missions' as Endpoint);
    private static cluesAPI = new APIService('easter_event/clues' as Endpoint);
    private static acknowledgeSafetyAPI = new APIService('easter_event/acknowledge-safety' as Endpoint);
    private static reportHazardAPI = new APIService('easter_event/report-hazard' as Endpoint);
    private static spawnRadiusAPI = new APIService('easter_event/spawn-radius' as Endpoint);
    private static restartAPI = new APIService('easter_event/restart' as Endpoint);

    static async start(userId: string, lat: number, lng: number) {
        return this.startAPI.post({ user_id: userId, lat, lng }, {});
    }

    static async awty(userId: string, lat: number, lng: number) {
        return this.awtyAPI.post({ user_id: userId, lat, lng }, {});
    }

    static async confirmArrival(userId: string) {
        return this.confirmArrivalAPI.post({ user_id: userId }, {});
    }

    static async collect(userId: string, answer: string) {
        return this.collectAPI.post({ user_id: userId, answer }, {});
    }

    static async collectGolden(userId: string) {
        return this.collectGoldenAPI.post({ user_id: userId }, {});
    }

    static async getGameScreen(userId: string) {
        return this.gameScreenAPI.get({ user_id: userId });
    }

    static async getChapter(chapterId: number) {
        // Use custom URL for chapter endpoint with ID
        const api = new APIService(`easter_event/chapter/${chapterId}` as Endpoint);
        return api.get({});
    }

    static async getPuzzleStatus(userId: string) {
        return this.puzzleAPI.get({ user_id: userId });
    }

    static async submitPuzzleAnswer(userId: string, puzzleId: number, answer: string) {
        return this.puzzleSubmitAPI.post({ user_id: userId, puzzle_id: puzzleId, answer }, {});
    }

    static async getMissions() {
        return this.missionsAPI.get({});
    }

    static async getClues(userId: string) {
        return this.cluesAPI.get({ user_id: userId });
    }

    static async acknowledgeSafety(userId: string) {
        return this.acknowledgeSafetyAPI.post({ user_id: userId }, {});
    }

    static async reportHazard(userId: string) {
        return this.reportHazardAPI.post({ user_id: userId }, {});
    }

    static async getSpawnRadius(userId: string) {
        return this.spawnRadiusAPI.get({ user_id: userId });
    }

    static async restart(userId: string) {
        return this.restartAPI.post({ user_id: userId }, {});
    }
}
