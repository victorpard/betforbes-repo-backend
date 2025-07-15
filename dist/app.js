"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use('/api', routes_1.default);
const frontendDist = path_1.default.resolve(__dirname, '../frontend/dist');
app.use(express_1.default.static(frontendDist, { maxAge: '1d' }));
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: `Rota não encontrada: ${req.originalUrl}` });
    }
    res.sendFile(path_1.default.join(frontendDist, 'index.html'));
});
exports.default = app;
//# sourceMappingURL=app.js.map