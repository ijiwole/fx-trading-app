"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'fx_trading',
    },
    jwt: {
        secret: process.env.JWT_SECRET ||
            'jwt-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
    mail: {
        host: process.env.MAIL_HOST || 'smtp.example.com',
        port: parseInt(process.env.MAIL_PORT || '465', 10),
        secure: (process.env.MAIL_SECURE || 'false') === 'true',
        auth: {
            user: process.env.MAIL_USER || 'user@example.com',
            pass: process.env.MAIL_PASS || 'password',
        },
        from: process.env.MAIL_FROM || 'noreply@fxtrading.com',
    },
    fxApi: {
        baseUrl: process.env.FX_API_BASE_URL ||
            'https://v6.api.exchangerate-api.com/v6',
        apiKey: process.env.FX_API_KEY || 'api-key',
        cacheTtl: parseInt(process.env.FX_CACHE_TTL || '300', 10),
    },
    admin: {
        secretKey: process.env.ADMIN_SECRET_KEY ||
            'admin-secret-key-change-in-production',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
        max: parseInt(process.env.REDIS_MAX_ITEMS || '1000', 10),
    },
    supportedCurrencies: ['NGN', 'USD', 'EUR', 'GBP'],
    defaultCurrency: 'NGN',
});
//# sourceMappingURL=app.config.js.map