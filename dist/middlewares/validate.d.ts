import { Request, Response, NextFunction } from 'express';
import { AnySchema } from 'joi';
export declare function validateRequest(schema: AnySchema): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map