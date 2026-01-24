import { APIService } from './API';
import { Endpoint } from '@/typings/Endpoint.enum';

export class UniversalAPI {
    private static startAPI = new APIService('universal/egg_hunt/start' as Endpoint);
    private static awtyAPI = new APIService('universal/egg_hunt/awty' as Endpoint);
    private static nextAPI = new APIService('universal/egg_hunt/next' as Endpoint);
    private static codexAPI = new APIService('universal/egg_hunt/codex' as Endpoint);
    private static restartAPI = new APIService('universal/egg_hunt/restart' as Endpoint);
    private static spawnRadiusAPI = new APIService('universal/egg_hunt/spawn-radius' as Endpoint);
    private static acknowledgeSafetyAPI = new APIService('universal/egg_hunt/acknowledge-safety' as Endpoint);
    private static reportHazardAPI = new APIService('universal/egg_hunt/report-hazard' as Endpoint);

    static async start(userId: string, lat: number, lng: number) {
        return this.startAPI.post({ user_id: userId, lat, lng }, {});
    }

    static async awty(userId: string, lat: number, lng: number) {
        return this.awtyAPI.post({ user_id: userId, lat, lng }, {});
    }

    static async answer(userId: string, answer: string) {
        return this.nextAPI.post({ user_id: userId, answer }, {});
    }

    static async getCodex(userId: string) {
        return this.codexAPI.get({ user_id: userId });
    }

    static async restart(userId: string) {
        return this.restartAPI.post({ user_id: userId }, {});
    }

    static async getSpawnRadius(userId: string) {
        return this.spawnRadiusAPI.get({ user_id: userId });
    }

    static async acknowledgeSafety(userId: string) {
        return this.acknowledgeSafetyAPI.post({ user_id: userId }, {});
    }

    static async reportHazard(userId: string) {
        return this.reportHazardAPI.post({ user_id: userId }, {});
    }
}
