const { constants, createWriteStream, WriteStream } = require('fs');
const fsp = require('fs/promises');
const { EOL } = require('os');
const path = require('path');
const util = require('util');
const LogCollection = require('../schema/log');

const LOG_FOLDER = path.resolve(__dirname, '..', '..', '..', 'data', 'logs');
const LOG_FILE = path.join(LOG_FOLDER, 'latest.log');
const ARCH_FOLDER = path.resolve(LOG_FOLDER, 'archive');

const time = (date = new Date()) => {
    const dy = date.getFullYear();
    const dm = ('00' + (date.getMonth() + 1)).slice(-2);
    const dd = ('00' + date.getDate()).slice(-2);
    const th = ('00' + date.getHours()).slice(-2);
    const tm = ('00' + date.getMinutes()).slice(-2);
    const ts = ('00' + date.getSeconds()).slice(-2);
    const tz = ('000' + date.getMilliseconds()).slice(-3);
    return `${dy}-${dm}-${dd} ${th}:${tm}:${ts}.${tz}`;
};

const file = (date = new Date()) => {
    const dy = date.getFullYear();
    const dm = ('00' + (date.getMonth() + 1)).slice(-2);
    const dd = ('00' + date.getDate()).slice(-2);
    const th = ('00' + date.getHours()).slice(-2);
    const tm = ('00' + date.getMinutes()).slice(-2);
    const ts = ('00' + date.getSeconds()).slice(-2);
    return `${dy}-${dm}-${dd}T${th}-${tm}-${ts}.log`;
};

/**
 * @param {Date} date
 * @param {number} level
 * @param {string} message
 */
const format = (date, level, message) => {
    const levels = {
        0: '\x1b[90m DEBUG\x1b[0m',
        1: '\x1b[92m  INFO\x1b[0m',
        2: '\x1b[93m  WARN\x1b[0m',
        3: '\x1b[91m ERROR\x1b[0m',
        4: '\x1b[31m FATAL\x1b[0m',
        5: '\x1b[36m  TEST\x1b[0m',
    };

    return levels[level]
        ? `\x1b[90m${time(date)}\x1b[0m ${levels[level]} ${message}`
        : message;
};

/** @type {WriteStream} */
let fstream = null;

/**
 * @param {Date} date
 * @param {number} level
 * @param {string} message
 */
const write = (date, level, message) => {
    if (level >= logger.level) console.log(format(date, level, message));

    const levels = {
        0: 'DEBUG',
        1: 'INFO',
        2: 'WARN',
        3: 'ERROR',
        4: 'FATAL',
    };

    fstream.write(`${time(date)} [${levels[level]}] ${message}\n`);

    if (level > DEBUG) LogCollection.add(message, level, date);
};

const DEBUG = 0;
const INFO = 1;
const WARN = 2;
const ERROR = 3;
const FATAL = 4;

class logger {
    static LEVELS = {
        DEBUG,
        INFO,
        WARN,
        ERROR,
        FATAL,
    };

    static level = DEBUG;

    /** @param {App} app */
    static async init(app) {
        this.app = app;

        await fsp.mkdir(ARCH_FOLDER, { recursive: true });

        const exists = await fsp
            .access(LOG_FILE, constants.F_OK)
            .then(_ => true)
            .catch(_ => false);

        if (exists) {
            const moved = path.join(ARCH_FOLDER, file((await fsp.stat(LOG_FILE)).ctime));
            await fsp.rename(LOG_FILE, moved);
        }

        fstream = createWriteStream(LOG_FILE, { flags: 'wx' });

        if (this.app.config.production) {
            this.level = INFO;
            process.on('uncaughtException', e => {
                write(new Date(), this.ERROR, String(e));
            });
        } else {
            process.once('uncaughtException', e => {
                console.log(e);
                write(new Date(), this.FATAL, String(e));
                process.exit(1);
            });
        }

        process.on('exit', code => {
            write(
                new Date(),
                code ? this.ERROR : this.DEBUG,
                `process exiting with code ${code}`,
            );
        });

        this.debug('Logger ready');
    }

    static debug(...args) {
        write(new Date(), DEBUG, util.format(...args));
    }

    static info(...args) {
        write(new Date(), INFO, util.format(...args));
    }

    static warn(...args) {
        write(new Date(), WARN, util.format(...args));
    }

    static error(...args) {
        write(new Date(), ERROR, util.format(...args));
    }

    static fatal(...args) {
        write(new Date(), FATAL, util.format(...args));
    }

    static repl(line = '') {
        fstream.write(`${time()} [REPL] ${line}\n`);
    }
}

module.exports = logger;
