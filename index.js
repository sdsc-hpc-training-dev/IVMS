const { existsSync } = require('fs');
const IVMSApp = require('./api/src/app');
const logger = require('./api/src/modules/logger');

const LogCollection = require('./api/src/schema/log');
const UserCollection = require('./api/src/schema/user');

const RL = require('readline').createInterface(process.stdin);

if (!existsSync('config.json')) {
    console.log('Can not find config.json');
    process.exit(1);
}

(async () => {
    const app = new IVMSApp(require('./config.json'));
    await app.init();

    RL.on('line', async line => {
        try {
            logger.repl(line);
            const result = eval(line);
            if (result instanceof Promise) logger.debug(await result);
            else logger.debug(result);
        } catch (e) {
            console.error(e);
        }
    });

    process.once('SIGINT', async () => {
        try {
            await app.stop();
            process.exit(0);
        } catch (e) {
            logger.error(e);
            process.exit(1);
        }
    });
})();
