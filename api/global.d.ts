interface WebServerOptions {
    host: string;
    port: number;
    domain?: string;
    ssl_key: string;
    ssl_cert: string;
    access_log: boolean;
}

interface OAuth2Options {
    app_id: string;
    secret: string;
    redirect: string;
}

interface GoogleAnalyticsOptions {}

interface ZoomOptions {}

interface VideoStreamOptions {}

interface MongoDBOptions {
    host: string;
    name: string;
    auth?: {
        username: string;
        password: string;
    };
}

interface AppConfig {
    production?: boolean;
    web: WebServerOptions;
    oauth2: { [key: string]: OAuth2Options };
    db: MongoDBOptions;
    ga: GoogleAnalyticsOptions;
    zoom: ZoomOptions;
    video: VideoStreamOptions;
}

type App = import('./src/app');

type uWSRes = import('uWebSockets.js').HttpResponse & {
    aborted: boolean;
};

type ResProxy<T = Uint8Array> = {
    ip: string;
    userPromise?: Promise<import('mongoose').Document<{}, {}, UserEntry> & UserEntry>;
    bodyPromise?: Promise<T>;
    status: (status: string) => void;
    buffer: (
        data: import('uWebSockets.js').RecognizedString,
        status?: string,
        type?: string,
    ) => void;
    json: (data, status: string) => void;
    redirect: (to: string) => void;
    streamFrom: (file: string, stard: number, end: number, total: number) => void;
};

type uWSReq = import('uWebSockets.js').HttpRequest;
type uWSCxt = import('uWebSockets.js').us_socket_context_t;

type APIEndpoint<T = Uint8Array> = {
    auth?: boolean;
    method?: 'get' | 'post' | 'patch' | 'put' | 'del' | 'any' | 'options';
    path: string;
    defaultResType?: string;
    body?: {
        limit: number;
        optional?: boolean;
        timeout?: number;
        jsonSchema?: import('joi').Schema<T>;
    };
    handle: (this: App, proxy: ResProxy<T>, req: uWSReq) => void;
};

type OAuth2Provider = 'google';
type UserRole = 'admin' | 'manager' | 'moderator' | 'user';

interface LogEntry {
    data: string;
    level: number;
    timestamp: Date;
}

interface OAuth2StateEntry {
    id: string;
    ip: string;
    redirect: string;
    expire: Date;
    provider: OAuth2Provider;
}

interface OAuth2Info {
    id: string;
    ip: string;
    public: boolean;
    email: string;
    verified: string;
    org: string;
    profile: string;
    provider: OAuth2Provider;
    cacheTime: Date;
}

interface OAuth2Cred {
    oauth2Token: string;
    oauth2Refresh: string;
}

type UserEntry = {
    token: string;
    // First party info
    name: string;
    about: string;
    role: UserRole;

    // Third party info
    oauth2Info: OAuth2Info;
} & OAuth2Cred;
