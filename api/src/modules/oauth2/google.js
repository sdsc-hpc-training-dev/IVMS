const OAuth2Provider = require('.');

module.exports = class GoogleOAuth2 extends OAuth2Provider {
    get redirect() {
        return 'hello-world';
    }

    /**
     * @param {String} token
     * @param {Boolean} refresh
     */
    async exchange(token, refresh) {}

    /**
     * @param {String} token
     */
    async fetchUser(token) {}

    /**
     * @param {String} token
     */
    async revoke(token) {}
};
