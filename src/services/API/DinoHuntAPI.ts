import { APIService } from './API';
import { Endpoint } from '@/typings/Endpoint.enum';

export class DinoHuntAPI {
    private static playAPI = new APIService('play' as Endpoint);
    private static awtyAPI = new APIService('awty' as Endpoint);
    private static nextAPI = new APIService('next' as Endpoint);

    static async start(userId: string, lat: number, lng: number) {
        return this.playAPI.post({ game_ref: 'dino-hunt', user_id: userId, lat, lng }, {});
    }

    static async awty(userId: string, lat: number, lng: number) {
        return this.awtyAPI.post({ game_ref: 'dino-hunt', user_id: userId, lat, lng }, {});
    }

    static async chooseDino(userId: string, dinoId: string) {
        return this.nextAPI.post({
            game_ref: 'dino-hunt', user_id: userId,
            action: 'choose-dino', dino_id: dinoId
        }, {});
    }

    static async answerQuestion(userId: string, answerIndex: number, optionRarities: string[]) {
        return this.nextAPI.post({
            game_ref: 'dino-hunt', user_id: userId,
            action: 'answer-question', answer_index: answerIndex, option_rarities: optionRarities
        }, {});
    }

    static async nameDino(userId: string, nickname: string, dinoData: any) {
        return this.nextAPI.post({
            game_ref: 'dino-hunt', user_id: userId,
            action: 'name-dino', nickname, dino_data: dinoData
        }, {});
    }

    static async collectGoldenEgg(userId: string) {
        return this.nextAPI.post({
            game_ref: 'dino-hunt', user_id: userId,
            action: 'collect-golden-egg'
        }, {});
    }

    static async reportHazard(userId: string, eggIndex: number, category: string, lat: number, lng: number) {
        return this.nextAPI.post({
            game_ref: 'dino-hunt', user_id: userId,
            action: 'report-hazard', egg_index: eggIndex, hazard_category: category, lat, lng
        }, {});
    }

    static async restart(userId: string) {
        return this.nextAPI.post({
            game_ref: 'dino-hunt', user_id: userId,
            action: 'restart'
        }, {});
    }
}
