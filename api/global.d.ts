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

type uWSRes = import('uWebSockets.js').HttpResponse & { aborted: boolean };
type uWSReq = import('uWebSockets.js').HttpRequest;
type uWSCxt = import('uWebSockets.js').us_socket_context_t;

type APIEndpoint = {
    method?: 'get' | 'post' | 'patch' | 'put' | 'del' | 'any';
    path: string;
    handle: (
        this: App,
        res: import('uWebSockets.js').HttpResponse,
        req: import('uWebSockets.js').HttpRequest,
    ) => void;
};

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
}

interface UserEntry {
    name: string;
    about: string;
    token: string;
    oauth2ID: string;
    oauth2Token: string;
    oauth2Refresh: string;
    role: UserRole;
}
