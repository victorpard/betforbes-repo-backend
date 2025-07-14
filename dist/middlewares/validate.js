"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
const errorHandler_1 = require("./errorHandler");
function validateRequest(schema) {
    return (req, _res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const messages = error.details.map((d) => d.message);
            next((0, errorHandler_1.createError)(messages.join(', '), 400, 'VALIDATION_ERROR'));
        }
        else {
            req.body = value;
            next();
        }
    };
}
//# sourceMappingURL=validate.js.map