import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
export declare class FxService {
    private readonly configService;
    private cacheManager;
    private readonly logger;
    private readonly supportedCurrencies;
    private readonly cacheTtl;
    private readonly fallbackRates;
    constructor(configService: ConfigService, cacheManager: Cache);
    getRate(from: string, to: string): Promise<number>;
    getAllRates(): Promise<Record<string, Record<string, number>>>;
    invalidateRatesCache(): Promise<void>;
    private fetchRateFromApi;
}
