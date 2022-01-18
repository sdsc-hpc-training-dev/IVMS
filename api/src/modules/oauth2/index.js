module.exports = class OAuth2Provider {
    /**
     * @param {App} app
     * @param {OAuth2Options} options
     */
    constructor(app, options) {
        this.app = app;
        this.options = options;
    }

    /* @abstract */
    get redirect() {
        return '/';
    }

    /**
     * @abstract
     * @param {String} token
     * @param {Boolean} refresh
     */
    async exchange(token, refresh) {}

    /**
     * @abstract
     * @param {String} token
     */
    async fetchUser(token) {}

    /**
     * @abstract
     * @param {String} token
     */
    async revoke(token) {}
};
