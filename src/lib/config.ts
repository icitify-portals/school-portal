/**
 * Centralized Application Configuration
 * 
 * This file consolidates all environment variable lookups. 
 * Use this instead of process.env directly to ensure consistent defaults 
 * and easier cloud migration.
 */

const env = process.env.NODE_ENV || 'development';

export const config = {
    env,
    isDev: env === 'development',
    isProd: env === 'production',

    database: {
        url: process.env.DATABASE_URL,
    },

    auth: {
        secret: process.env.AUTH_SECRET,
        url: process.env.NEXTAUTH_URL,
    },

    storage: {
        // Defaults to 'local' for XAMPP development
        provider: (process.env.STORAGE_PROVIDER as 'local' | 's3') || 'local',

        local: {
            uploadDir: process.env.UPLOAD_DIR || 'public/uploads',
            baseUrl: process.env.UPLOAD_BASE_URL || '/uploads',
        },

        s3: {
            bucket: process.env.S3_BUCKET,
            region: process.env.S3_REGION,
            accessKey: process.env.S3_ACCESS_KEY,
            secretKey: process.env.S3_SECRET_KEY,
            endpoint: process.env.S3_ENDPOINT, // Optional for S3-compatible services
        }
    },

    mail: {
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT || '587'),
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
        from: process.env.MAIL_FROM || 'noreply@schoolportal.com',
    },

    redis: {
        enabled: !!(process.env.REDIS_URL || process.env.REDIS_HOST),
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
    },

    push: {
        publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
        subject: process.env.VAPID_SUBJECT || 'mailto:admin@schoolportal.com',
    },
    
    crossref: {
        loginId: process.env.CROSSREF_LOGIN_ID,
        password: process.env.CROSSREF_PASSWORD,
        prefix: process.env.CROSSREF_PREFIX || '10.xxxx',
        role: process.env.CROSSREF_ROLE || 'member'
    },
    
    altcha: {
        enabled: process.env.ALTCHA_ENABLED === 'true' || false, // disabled by default until explicitly enabled
        hmacKey: (() => {
            if (process.env.ALTCHA_ENABLED === 'true' && !process.env.ALTCHA_HMAC_KEY && env === 'production') {
                throw new Error("ALTCHA_HMAC_KEY environment variable is required in production when ALTCHA is enabled");
            }
            return process.env.ALTCHA_HMAC_KEY || 'ExampleHMACKeyForPoWSpamValidation12345';
        })(),
    },

    ojs: {
        repositoryId: process.env.OJS_REPOSITORY_ID || 'ojs2.localhost',
        maxRecords: parseInt(process.env.OJS_MAX_RECORDS || '100'),
    }
};

export default config;
