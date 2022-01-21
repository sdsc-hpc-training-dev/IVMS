const OAuth2Provider = require('.');
const fetch = require('node-fetch');
const logger = require('../logger');

const OAuth2 = 'https://www.googleapis.com/oauth2/v4/';
const RevokeEndpoint = 'https://accounts.google.com/o/oauth2/revoke';
const UserEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';
const Scope =
    'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile&access_type=offline&prompt=consent';

const redirect = 'http://localhost:8080/api/login/callback/google';

module.exports = class GoogleOAuth2 extends OAuth2Provider {
    postConstruct() {
        this.redirect =
            `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${this.options.app_id}&` +
            `redirect_uri=${redirect}&` +
            `response_type=code&` +
            `scope=${Scope}`;

        this.authURI =
            `client_id=${this.options.app_id}&` +
            `client_secret=${this.options.secret}&` +
            `redirect_uri=${redirect}`;
    }

    /**
     * @param {String} token
     * @param {Boolean} refresh
     * @returns {OAuth2Cred}
     */
    async exchange(token, refresh) {
        const type = refresh ? 'refresh_token' : 'authorization_code';
        const codeType = refresh ? 'refresh_token' : 'code';

        const url = `${OAuth2}token?grant_type=${type}&${codeType}=${token}&${this.authURI}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
        });

        const json = await response.json();

        if (json.error) {
            logger.error(`GoogleOAuth2Error ${json.error}: ${json.error_description}`);
            return null;
        }

        return {
            oauth2Token: json.access_token,
            oauth2Refresh: json.refresh_token,
        };
    }

    /**
     * @param {String} token
     * @returns {Promise<OAuth2Info & { name: string }>}
     */
    async fetchUser(token) {
        const response = await fetch(UserEndpoint, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();

        return {
            id: json.id,
            name: json.name,
            email: json.email,
            verified: json.verified_email,
            profile: json.picture,
            org: json.hd,
            provider: 'google',
        };
    }

    /**
     * @param {String} token
     */
    async revoke(token) {
        /** @type {Response} */
        const response = await fetch(`${RevokeEndpoint}?token=${token}`, {
            method: 'GET',
            headers: { 'Content-type': 'application/x-www-form-urlencoded' },
        });

        return response.status === 200;
    }
};
