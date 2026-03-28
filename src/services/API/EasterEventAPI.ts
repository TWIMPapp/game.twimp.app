import { APIService } from './API';
import { Endpoint } from '@/typings/Endpoint.enum';


export class EasterEventAPI {
    // Unified game endpoints
    private static playAPI = new APIService('play' as Endpoint);
    private static awtyAPI = new APIService('awty' as Endpoint);
    private static nextAPI = new APIService('next' as Endpoint);

    // Easter-specific read endpoints
    private static gameScreenAPI = new APIService('easter_event/game-screen' as Endpoint);

    // Test mode context — set by testing page, automatically included in all calls
    private static _testDay: number | undefined;
    static setTestDay(day: number | undefined) { this._testDay = day; }

    private static testParams() {
        if (this._testDay === undefined) return {};
        return { test_day: this._testDay, tk: 'eggstra26' };
    }

    private static action(name: string) {
        return new APIService(`easter_event/${name}` as Endpoint);
    }

    static async start(userId: string, lat: number, lng: number) {
        return this.playAPI.post({ game_ref: 'easter-event', user_id: userId, lat, lng, ...this.testParams() }, {});
    }

    static async awty(userId: string, lat: number, lng: number) {
        return this.awtyAPI.post({ game_ref: 'easter-event', user_id: userId, lat, lng, ...this.testParams() }, {});
    }

    static async getGameScreen(userId: string) {
        return this.gameScreenAPI.get({ user_id: userId, ...this.testParams() });
    }

    static async getChapter(chapterId: number) {
        return this.action(`chapter/${chapterId}`).get({ ...this.testParams() });
    }

    // Actions via unified /next endpoint
    static async collect(userId: string, answer: string = '') {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'collect', answer, ...this.testParams() }, {});
    }

    static async submitPuzzleAnswer(userId: string, puzzleId: number, answer: string) {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'puzzle', puzzle_id: puzzleId, answer, ...this.testParams() }, {});
    }

    static async acknowledgeSafety(userId: string) {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'acknowledge', ...this.testParams() }, {});
    }

    static async reportHazard(userId: string) {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'hazard', ...this.testParams() }, {});
    }

    static async restart(userId: string) {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'restart', ...this.testParams() }, {});
    }

    static async resetSpawnLocation(userId: string, lat: number, lng: number) {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'reset-spawn', lat, lng, ...this.testParams() }, {});
    }

    static async setCustomTrail(userId: string, locations: Array<{ lat: number; lng: number }>) {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'set-custom-trail', locations, ...this.testParams() }, {});
    }

    static async clearCustomTrail(userId: string) {
        return this.nextAPI.post({ game_ref: 'easter-event', user_id: userId, action: 'clear-custom-trail', ...this.testParams() }, {});
    }

    static async registerInterest(town: string) {
        return this.action('register-interest').post({ town }, {});
    }
}
