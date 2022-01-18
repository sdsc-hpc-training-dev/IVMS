const logger = require('./modules/logger');
const OAuth2Provider = require('./modules/oauth2');
const WebServer = require('./web/server');

module.exports = class IVMSApp {
    /** @param {AppConfig} config */
    constructor(config) {
        this.config = config;

        this.server = new WebServer(this);

        /** @type {{ [key: string]: OAuth2Provider }} */
        this.oauth2 = {};
    }

    registerOAuth2Providers() {
        for (const [key, option] of Object.entries(this.config.oauth2 || {})) {
            try {
                /** @type {typeof OAuth2Provider} */
                const Provider = require(`./modules/oauth2/${key}`);
                this.oauth2[key] = new Provider(this, option);
                logger.debug(`Registered OAuth2Provider(${Provider.name})`);
            } catch (e) {
                logger.error(`Failed to register OAuth2Provider(${key})`, e);
            }
        }
    }

    async init() {
        await logger.init(this);
        this.registerOAuth2Providers();
        await this.server.init();
    }

    async stop() {
        await this.server.close();
    }
};
