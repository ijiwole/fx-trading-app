"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FxService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FxService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const cache_manager_1 = require("@nestjs/cache-manager");
let FxService = FxService_1 = class FxService {
    configService;
    cacheManager;
    logger = new common_1.Logger(FxService_1.name);
    supportedCurrencies;
    cacheTtl;
    fallbackRates = {
        USD: { NGN: 1200, EUR: 0.85, GBP: 0.76, USD: 1 },
        NGN: { USD: 1 / 1200, EUR: 0.85 / 1200, GBP: 0.76 / 1200, NGN: 1 },
        EUR: { USD: 1 / 0.85, NGN: 1200 / 0.85, GBP: 0.76 / 0.85, EUR: 1 },
        GBP: { USD: 1 / 0.76, NGN: 1200 / 0.76, EUR: 0.85 / 0.76, GBP: 1 },
    };
    constructor(configService, cacheManager) {
        this.configService = configService;
        this.cacheManager = cacheManager;
        this.cacheTtl = this.configService.get('fxApi.cacheTtl', 300);
        this.supportedCurrencies = this.configService.get('supportedCurrencies', ['NGN', 'USD', 'EUR', 'GBP']);
    }
    async getRate(from, to) {
        if (from === to) {
            return 1;
        }
        if (!this.supportedCurrencies.includes(from) ||
            !this.supportedCurrencies.includes(to)) {
            throw new common_1.InternalServerErrorException(`Unsupported currency pair: ${from}/${to}`);
        }
        const cacheKey = `fx:rate:${from}:${to}`;
        const cachedRate = await this.cacheManager.get(cacheKey);
        if (cachedRate !== undefined && cachedRate !== null) {
            this.logger.debug(`Cache hit for ${cacheKey}: ${cachedRate}`);
            return cachedRate;
        }
        try {
            const rate = await this.fetchRateFromApi(from, to);
            await this.cacheManager.set(cacheKey, rate, this.cacheTtl * 1000);
            this.logger.debug(`Cached ${cacheKey}: ${rate} for ${this.cacheTtl}s`);
            return rate;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : '';
            this.logger.error(`Error fetching exchange rate: ${errorMessage}`, errorStack);
            throw new common_1.InternalServerErrorException('Failed to fetch exchange rate');
        }
    }
    async getAllRates() {
        const cacheKey = 'fx:allRates';
        const cachedRates = await this.cacheManager.get(cacheKey);
        if (cachedRates !== undefined && cachedRates !== null) {
            this.logger.debug(`Cache hit for ${cacheKey}`);
            return cachedRates;
        }
        const result = {};
        for (const base of this.supportedCurrencies) {
            result[base] = {};
            for (const target of this.supportedCurrencies) {
                try {
                    result[base][target] = await this.getRate(base, target);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    this.logger.error(`Error fetching ${base}/${target} rate: ${errorMessage}`);
                    result[base][target] = 0;
                }
            }
        }
        await this.cacheManager.set(cacheKey, result, this.cacheTtl * 1000);
        return result;
    }
    async invalidateRatesCache() {
        const allRatesCacheKey = 'fx:allRates';
        await this.cacheManager.del(allRatesCacheKey);
        for (const from of this.supportedCurrencies) {
            for (const to of this.supportedCurrencies) {
                const rateKey = `fx:rate:${from}:${to}`;
                await this.cacheManager.del(rateKey);
            }
        }
        this.logger.log('FX rates cache invalidated');
    }
    async fetchRateFromApi(from, to) {
        const baseUrl = this.configService.get('fxApi.baseUrl');
        const apiKey = this.configService.get('fxApi.apiKey');
        try {
            const url = `${baseUrl}/${apiKey}/latest/USD`;
            const response = await axios_1.default.get(url, {
                params: {
                    symbols: this.supportedCurrencies.join(','),
                },
            });
            this.logger.debug(`API response for ${url}: ${JSON.stringify(response.data)}`);
            if (!response.data || !response.data.conversion_rates) {
                throw new Error('API response missing rates data');
            }
            if (from !== 'USD' && !response.data.conversion_rates[from]) {
                throw new Error(`API response missing rate for ${from}`);
            }
            if (to !== 'USD' && !response.data.conversion_rates[to]) {
                throw new Error(`API response missing rate for ${to}`);
            }
            if (from === 'USD') {
                return response.data.conversion_rates[to];
            }
            else if (to === 'USD') {
                return 1 / response.data.conversion_rates[from];
            }
            else {
                const usdToFrom = response.data.conversion_rates[from];
                const usdToTo = response.data.conversion_rates[to];
                return usdToTo / usdToFrom;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`API error: ${errorMessage}`);
            this.logger.warn('Using fallback exchange rates due to API failure');
            const fallbackRate = this.fallbackRates[from]?.[to];
            if (fallbackRate !== undefined) {
                return fallbackRate;
            }
            throw new common_1.InternalServerErrorException(`No fallback rate available for ${from}/${to}`);
        }
    }
};
exports.FxService = FxService;
exports.FxService = FxService = FxService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [config_1.ConfigService, Object])
], FxService);
//# sourceMappingURL=fx.service.js.map