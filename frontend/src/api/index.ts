const ENDPOINT = 'http://localhost:8080/api';
const KEY = 'iv-token';

import { createState, State } from '@hookstate/core';

const API = new (class API {
    me: State<PrivateUserProfile>;

    constructor() {
        window.addEventListener('message', (e: MessageEvent<{ token?: string }>) => {
            if (e.data.token) {
                this.token = e.data.token;
                this.fetchMe();
            }
        });
        if (this.token) this.fetchMe();

        this.me = createState<PrivateUserProfile>(null);
    }

    private get token() {
        return localStorage.getItem(KEY);
    }

    private set token(t: string) {
        t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY);
    }

    promptLogin(provider: string) {
        window.open(`${ENDPOINT}/login/${provider}`, '_blank', 'width=400,height=600');
    }

    async logout() {
        const res = await fetch(`${ENDPOINT}/logout`, {
            headers: {
                Authorization: `IVMS ${this.token}`,
            },
            credentials: 'include',
        });

        if (!res.ok) console.log('Logout failed:', res.status);

        this.token = null;
        this.me.set(null);
    }

    async fetchMe() {
        const res = await fetch(`${ENDPOINT}/me`, {
            headers: {
                Authorization: `IVMS ${this.token}`,
            },
            credentials: 'include',
        });

        this.me.set(await res.json());
    }
})();

export default API;
