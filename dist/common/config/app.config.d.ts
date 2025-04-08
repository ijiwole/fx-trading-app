declare const _default: () => {
    port: number;
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    mail: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
        from: string;
    };
    fxApi: {
        baseUrl: string;
        apiKey: string;
        cacheTtl: number;
    };
    admin: {
        secretKey: string;
    };
    redis: {
        host: string;
        port: number;
        ttl: number;
        max: number;
    };
    supportedCurrencies: string[];
    defaultCurrency: string;
};
export default _default;
