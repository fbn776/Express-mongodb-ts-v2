declare namespace NodeJS {
    interface ProcessEnv {
        JWT_SECRET?: string;
        MONGODB_URL?: string;
        PORT?: string;
        ENVIRONMENT?: 'development' | 'production' | 'test';

        NODE_PORT: string;
        PRIVATE_KEY: string;
        MONGODB_URI: string;
        MONGODB_NAME: string;
        EMAIL_USER: string;
        EMAIL_USERNAME: string;
        EMAIL_PASSWORD: string;
        EMAIL_HOST: string;
        EMAIL_PORT: string;
        FRONTEND_DOMAIN: string;
        FRONTEND_URL: string;
        S3_ACCESS_KEY_ID: string;
        S3_SECRET_ACCESS_KEY: string;
        S3_BUCKET_NAME: string;
        S3_REGION: string;
        S3_ENDPOINT: string;
        S3_FORCE_PATH_STYLE: string;
        S3_SIGNATURE_VERSION: string;
        SMS_SID: string;
        SMS_AUTH_TOKEN: string;

        BACKEND_URL: string;
    }
}
