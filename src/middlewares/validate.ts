import { Request, Response, NextFunction } from 'express';
import { AnySchema } from 'joi';
import { createError } from './errorHandler';

/**
 * Middleware para validar o corpo da requisição usando Joi.
 * @param schema - o schema Joi a ser aplicado.
 */
export function validateRequest(schema: AnySchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      // Agrupa todas as mensagens de erro
      const messages = error.details.map((d) => d.message);
      next(createError(messages.join(', '), 400, 'VALIDATION_ERROR'));
    } else {
      // Substitui o body pelos valores validados (e filtrados)
      req.body = value;
      next();
    }
  };
}
