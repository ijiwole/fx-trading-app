export default () => ({
  port: parseInt((process.env.PORT as string) || '3000', 10),
  database: {
    host: (process.env.DB_HOST as string) || 'localhost',
    port: parseInt((process.env.DB_PORT as string) || '5432', 10),
    username: (process.env.DB_USERNAME as string) || 'postgres',
    password: (process.env.DB_PASSWORD as string) || 'postgres',
    database: (process.env.DB_NAME as string) || 'fx_trading',
  },
  jwt: {
    secret:
      (process.env.JWT_SECRET as string) ||
      'jwt-secret-key-change-in-production',
    expiresIn: (process.env.JWT_EXPIRES_IN as string) || '1d',
  },
  mail: {
    host: (process.env.MAIL_HOST as string) || 'smtp.example.com',
    port: parseInt((process.env.MAIL_PORT as string) || '465', 10),
    secure: ((process.env.MAIL_SECURE as string) || 'false') === 'true',
    auth: {
      user: (process.env.MAIL_USER as string) || 'user@example.com',
      pass: (process.env.MAIL_PASS as string) || 'password',
    },
    from: (process.env.MAIL_FROM as string) || 'noreply@fxtrading.com',
  },
  fxApi: {
    baseUrl:
      (process.env.FX_API_BASE_URL as string) ||
      'https://v6.api.exchangerate-api.com/v6',
    apiKey: (process.env.FX_API_KEY as string) || 'api-key',
    cacheTtl: parseInt((process.env.FX_CACHE_TTL as string) || '300', 10),
  },
  admin: {
    secretKey:
      (process.env.ADMIN_SECRET_KEY as string) ||
      'admin-secret-key-change-in-production',
  },
  redis: {
    host: (process.env.REDIS_HOST as string) || 'localhost',
    port: parseInt((process.env.REDIS_PORT as string) || '6379', 10),
    ttl: parseInt((process.env.REDIS_TTL as string) || '3600', 10),
    max: parseInt((process.env.REDIS_MAX_ITEMS as string) || '1000', 10),
  },
  supportedCurrencies: ['NGN', 'USD', 'EUR', 'GBP'],
  defaultCurrency: 'NGN',
});
