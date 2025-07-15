"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app_1 = __importDefault(require("./app"));
async function bootstrap() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: 'http://localhost:3000',
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use('/api', app_1.default);
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`⚡️ Server running on http://localhost:${port}`);
}
bootstrap().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map