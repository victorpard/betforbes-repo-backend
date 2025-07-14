import { Request, Response } from 'express';
import affiliateService from './affiliate.service';
import { asyncHandler } from '../../middlewares/errorHandler';

class AffiliateController {
  getEarnings = asyncHandler(async (req: Request, res: Response) => {
    const affiliateId = req.user!.id;
    const data = await affiliateService.getEarnings(affiliateId);
    res.json({ success: true, data });
  });
}

export default new AffiliateController();
