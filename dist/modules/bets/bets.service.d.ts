import { Order } from '@prisma/client';
declare class BetsService {
    fetchCurrentPrice(asset: string): Promise<number>;
    create(data: {
        userId: string;
        asset: string;
        type: string;
        amount: number;
        leverage: number;
        direction: string;
    }): Promise<Order>;
    list(userId: string): Promise<Order[]>;
    close(userId: string, orderId: string): Promise<Order>;
}
export declare const betsService: BetsService;
export {};
//# sourceMappingURL=bets.service.d.ts.map