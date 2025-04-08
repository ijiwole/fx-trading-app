import { FxService } from './fx.service';
export declare class FxController {
    private readonly fxService;
    constructor(fxService: FxService);
    getAllRates(): Promise<{
        rates: Record<string, Record<string, number>>;
    }>;
    getRate(from: string, to: string): Promise<{
        from: string;
        to: string;
        rate: number;
    }>;
}
