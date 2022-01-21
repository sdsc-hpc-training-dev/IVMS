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
    userPromise?: Promise<import('mongoose').Document<{}, {}, UserEntry> & UserEntry>;
    status: (status: string) => void;
    json: (data) => void;
};

type uWSReq = import('uWebSockets.js').HttpRequest;
type uWSCxt = import('uWebSockets.js').us_socket_context_t;

type APIEndpoint = {
    auth?: boolean;
    method?: 'get' | 'post' | 'patch' | 'put' | 'del' | 'any';
    path: string;
    handle: (this: App, res: uWSRes, req: uWSReq) => void;
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
