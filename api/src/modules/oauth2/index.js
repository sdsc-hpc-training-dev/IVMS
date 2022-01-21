module.exports = class OAuth2Provider {
    /**
     * @param {App} app
     * @param {OAuth2Options} options
     */
    constructor(app, options) {
        this.app = app;
        this.options = options;

        this.redirect = '';
        this.postConstruct();
    }

    postConstruct() {}

    /**
     * @abstract
     * @param {String} token
     * @param {Boolean} refresh
     * @returns {Promise<OAuth2Cred>}
     */
    async exchange(token, refresh) {}

    /**
     * @abstract
     * @param {String} token
     * @returns {Promise<OAuth2Info & { name: string }>}
     */
    async fetchUser(token) {}

    /**
     * @abstract
     * @param {String} token
     */
    async revoke(token) {}
};
