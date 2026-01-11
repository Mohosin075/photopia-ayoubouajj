"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("./app/modules/auth/passport.auth/config/passport"));
const routes_1 = __importDefault(require("./routes"));
const globalErrorHandler_1 = __importDefault(require("./app/middleware/globalErrorHandler"));
const config_1 = __importDefault(require("./config"));
const webhook_1 = __importDefault(require("./webhook"));
const sendResponse_1 = __importDefault(require("./shared/sendResponse"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const app = (0, express_1.default)();
// Security headers
app.use((0, helmet_1.default)());
// ⚠️ CRITICAL: Webhook MUST be before body parsers to receive raw body
app.use(webhook_1.default);
// -------------------- Middleware --------------------
// Body parsers must come after webhook
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Session must come before passport
app.use((0, express_session_1.default)({
    secret: config_1.default.jwt.jwt_secret || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // true if using HTTPS
}));
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// CORS
app.use((0, cors_1.default)({
    origin: [
        '*',
        'http://10.10.7.13:3001',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:3005',
        'http://10.10.7.11:5173'
    ],
    credentials: true,
}));
// Cookie parser
app.use((0, cookie_parser_1.default)());
// Logging enabled for troubleshooting
app.use((0, morgan_1.default)('dev'));
// -------------------- Static Files --------------------
app.use(express_1.default.static('uploads'));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// -------------------- API Routes --------------------
app.use('/api/v1', routes_1.default);
// -------------------- Privacy Policy --------------------
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'privacy-policy.html'));
});
routes_1.default.get('/status', (req, res) => {
    try {
        // You can add more health checks here like:
        // - Database connection status
        // - Memory usage
        // - Other service dependencies
        const healthCheck = {
            success: true,
            message: 'Server is running smoothly',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            environment: process.env.NODE_ENV,
        };
        res.status(http_status_codes_1.StatusCodes.OK).json(healthCheck);
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Server is experiencing issues',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// -------------------- Root / Live Response --------------------
app.get('/', (req, res) => {
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Welcome to the Photopia API',
        data: {
            timestamp: new Date().toISOString(),
            projectName: 'Photopia',
        },
    });
});
// -------------------- Global Error Handler --------------------
app.use(globalErrorHandler_1.default);
// -------------------- 404 Handler --------------------
app.use((req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Lost, are we?',
        errorMessages: [
            {
                path: req.originalUrl,
                message: "Congratulations, you've reached a completely useless API endpoint 👏",
            },
            {
                path: '/docs',
                message: 'Hint: Maybe try reading the docs next time? 📚',
            },
        ],
        roast: '404 brain cells not found. Try harder. 🧠❌',
        timestamp: new Date().toISOString(),
    });
});
exports.default = app;
