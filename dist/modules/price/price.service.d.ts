import { AxiosInstance } from 'axios';
export declare const getTickerUrl: (pair: string) => string;
export declare const getInfoUrl: () => string;
export declare class PriceService {
    private rest;
    constructor(axiosInstance?: AxiosInstance);
    fetchCurrentPrice(asset: string): Promise<number>;
}
//# sourceMappingURL=price.service.d.ts.map