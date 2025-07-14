declare class AffiliateService {
    getEarnings(affiliateId: string): Promise<{
        total: string;
        commissions: {
            id: string;
            revenueType: import(".prisma/client").$Enums.RevenueType;
            revenueAmount: string;
            commissionAmount: string;
            createdAt: Date;
        }[];
    }>;
}
declare const _default: AffiliateService;
export default _default;
//# sourceMappingURL=affiliate.service.d.ts.map