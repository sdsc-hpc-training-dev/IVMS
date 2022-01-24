import { RootStore } from '../stores/store';

const ENDPOINT = 'http://localhost:8080/api';
const KEY = 'iv-token';

const API = new (class API {
    private prompt: Window = null;

    constructor() {
        window.addEventListener('message', (e: MessageEvent<{ token?: string }>) => {
            if (e.data.token) {
                this.token = e.data.token;
                this.fetchMe();
            }
        });

        this.autoLogin();
    }

    private get token() {
        return localStorage.getItem(KEY);
    }

    private set token(t: string) {
        t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY);
    }

    private autoLogin() {
        return this.token && this.fetchMe();
    }

    promptLogin(provider: string) {
        if (this.prompt && !this.prompt.closed) {
            this.prompt.focus();
            return;
        }
        this.prompt = window.open(
            `${ENDPOINT}/login/${provider}`,
            '_blank',
            'width=400,height=600',
        );
    }

    async logout() {
        const res = await fetch(`${ENDPOINT}/logout`, {
            headers: {
                Authorization: this.token,
            },
        });

        if (!res.ok) console.log('Logout failed:', res.status);

        this.token = null;
        RootStore.onLogout();
    }

    async fetchMe() {
        const res = await fetch(`${ENDPOINT}/me`, {
            headers: {
                Authorization: this.token,
            },
        });

        if (res.ok) {
            RootStore.onLogin((await res.json()) as PrivateUserProfile);
        } else {
            this.token = null;
            RootStore.onLogout();
        }
    }
})();

export default API;
