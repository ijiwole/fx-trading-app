import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface ExchangeRateResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

type FallbackRates = {
  [key: string]: {
    [key: string]: number;
  };
};

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);
  private readonly supportedCurrencies: string[];
  private readonly cacheTtl: number;
  private readonly fallbackRates: FallbackRates = {
    USD: { NGN: 1200, EUR: 0.85, GBP: 0.76, USD: 1 },
    NGN: { USD: 1 / 1200, EUR: 0.85 / 1200, GBP: 0.76 / 1200, NGN: 1 },
    EUR: { USD: 1 / 0.85, NGN: 1200 / 0.85, GBP: 0.76 / 0.85, EUR: 1 },
    GBP: { USD: 1 / 0.76, NGN: 1200 / 0.76, EUR: 0.85 / 0.76, GBP: 1 },
  };

  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.cacheTtl = this.configService.get<number>('fxApi.cacheTtl', 300);
    this.supportedCurrencies = this.configService.get<string[]>(
      'supportedCurrencies',
      ['NGN', 'USD', 'EUR', 'GBP'],
    );
  }

  async getRate(from: string, to: string): Promise<number> {
    if (from === to) {
      return 1;
    }

    if (
      !this.supportedCurrencies.includes(from) ||
      !this.supportedCurrencies.includes(to)
    ) {
      throw new InternalServerErrorException(
        `Unsupported currency pair: ${from}/${to}`,
      );
    }

    const cacheKey = `fx:rate:${from}:${to}`;
    const cachedRate = await this.cacheManager.get<number>(cacheKey);

    if (cachedRate !== undefined && cachedRate !== null) {
      this.logger.debug(`Cache hit for ${cacheKey}: ${cachedRate}`);
      return cachedRate;
    }

    try {
      const rate = await this.fetchRateFromApi(from, to);

      await this.cacheManager.set(cacheKey, rate, this.cacheTtl * 1000);
      this.logger.debug(`Cached ${cacheKey}: ${rate} for ${this.cacheTtl}s`);

      return rate;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(
        `Error fetching exchange rate: ${errorMessage}`,
        errorStack,
      );
      throw new InternalServerErrorException('Failed to fetch exchange rate');
    }
  }

  async getAllRates(): Promise<Record<string, Record<string, number>>> {
    const cacheKey = 'fx:allRates';
    const cachedRates =
      await this.cacheManager.get<Record<string, Record<string, number>>>(
        cacheKey,
      );

    if (cachedRates !== undefined && cachedRates !== null) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cachedRates;
    }

    const result: Record<string, Record<string, number>> = {};

    for (const base of this.supportedCurrencies) {
      result[base] = {};

      for (const target of this.supportedCurrencies) {
        try {
          result[base][target] = await this.getRate(base, target);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Error fetching ${base}/${target} rate: ${errorMessage}`,
          );
          result[base][target] = 0;
        }
      }
    }

    await this.cacheManager.set(cacheKey, result, this.cacheTtl * 1000);

    return result;
  }

  async invalidateRatesCache(): Promise<void> {
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

  private async fetchRateFromApi(from: string, to: string): Promise<number> {
    const baseUrl = this.configService.get<string>('fxApi.baseUrl');
    const apiKey = this.configService.get<string>('fxApi.apiKey');

    try {
      const url = `${baseUrl}/${apiKey}/latest/USD`;

      const response = await axios.get<ExchangeRateResponse>(url, {
        params: {
          symbols: this.supportedCurrencies.join(','),
        },
      });

      this.logger.debug(
        `API response for ${url}: ${JSON.stringify(response.data)}`,
      );

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
      } else if (to === 'USD') {
        return 1 / response.data.conversion_rates[from];
      } else {
        const usdToFrom = response.data.conversion_rates[from];
        const usdToTo = response.data.conversion_rates[to];
        return usdToTo / usdToFrom;
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`API error: ${errorMessage}`);

      this.logger.warn('Using fallback exchange rates due to API failure');

      const fallbackRate = this.fallbackRates[from]?.[to];
      if (fallbackRate !== undefined) {
        return fallbackRate;
      }

      throw new InternalServerErrorException(
        `No fallback rate available for ${from}/${to}`,
      );
    }
  }
}
