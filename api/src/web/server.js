const uWS = require('uWebSockets.js');
const fsp = require('fs/promises');
const path = require('path');
const mime = require('mime-types');
const logger = require('../modules/logger');
const mg = require('mongoose');
const UserCollection = require('../schema/user');
const { validateToken } = require('../util/provision');

/** @param {string} dir */
const walkDir = async dir => {
    /** @type {string[]} */
    const results = [];
    const list = await fsp.readdir(dir);
    await Promise.all(
        list.map(async file => {
            file = path.join(dir, file);
            const stat = await fsp.stat(file);
            if (stat && stat.isDirectory()) {
                /* Recurse into a subdirectory */
                results.push(...(await walkDir(file)));
            } else {
                /* Is a file */
                results.push(file);
            }
        }),
    );
    return results;
};

module.exports = class WebServer {
    /** @param {App} app */
    constructor(app) {
        this.app = app;

        /** @type {Map<string, { mime: string, buffer: Buffer }>} */
        this.buffers = new Map();
    }

    /** @returns {WebServerOptions} */
    get options() {
        return this.app.config.web || {};
    }

    async reloadStaticFiles() {
        this.buffers.clear();

        const publicRoot = path.resolve(__dirname, '..', '..', '..', 'frontend', 'build');

        const dir = (await walkDir(publicRoot)).map(f =>
            f.replace(publicRoot, '').replace(/\\/g, '/'),
        );

        await Promise.all(
            dir.map(async f => {
                this.buffers.set(
                    f.replace(/\.html$/, '').replace(/\/index$/, '') || '/',
                    {
                        mime: mime.lookup(f),
                        buffer: await fsp.readFile(
                            path.resolve(publicRoot, ...f.split('/')),
                        ),
                    },
                );
            }),
        );

        if (!this.buffers.has('/')) {
            logger.warn('Main page NOT FOUND');
            this.buffers.set('/', { buffer: 'hello world' });
        }
    }

    /**
     * @param {uWSRes} res
     * @param {uWSReq} req
     */
    serveStaticFiles(res, req) {
        const url = req.getUrl();

        if (this.buffers.has(url)) {
            const { mime, buffer } = this.buffers.get(url);
            if (mime) res.writeHeader('content-type', mime);

            // res.writeHeader(
            //     'Access-Control-Allow-Origin',
            //     this.getCORSHeader(req.getHeader('origin')),
            // );
            // res.writeHeader('Cross-Origin-Opener-Policy', 'same-origin');
            // res.writeHeader('Cross-Origin-Embedder-Policy', 'require-corp');

            if (mime === 'text/html') {
                res.writeHeader('cache-control', 's-maxage=0,max-age=60');
            } else {
                res.writeHeader('cache-control', 's-maxage=86400,max-age=86400');
            }
            res.end(buffer);
        } else this.redirect(res);
    }

    /** @param {uWSRes} res */
    redirect(res, to = '/') {
        res.writeStatus('302');
        res.writeHeader('location', to);
        res.end();
    }

    /**
     * @param {uWSRes} res
     * @param {uWSReq} req
     */
    ip(res, req) {
        return (
            req.getHeader('cf-connecting-ip') ||
            Buffer.from(res.getRemoteAddressAsText()).toString()
        );
    }

    async init() {
        await this.reloadStaticFiles();

        /** @type {uWS.AppOptions} */
        const ssl_options = {
            key_file_name: this.options.ssl_key,
            cert_file_name: this.options.ssl_cert,
        };

        /** @type {import("mongoose").ConnectOptions} */
        const db_options = {
            autoIndex: false,
        };

        if (this.app.config.db.auth)
            db_options.auth = Object.assign({}, this.app.config.db.auth);

        const db_url = `${this.app.config.db.host}/${this.app.config.db.name}`;
        logger.debug(`MongoDB URL: ${db_url}`);

        await mg.connect(db_url, db_options);
        logger.info(`Connected to MongoDB`);

        await new Promise(async (resolve, reject) => {
            this.listener =
                this.options.ssl_key && this.options.ssl_cert
                    ? uWS.SSLApp(ssl_options)
                    : uWS.App();

            for (const file of await walkDir(path.resolve(__dirname, '..', 'routes'))) {
                try {
                    /** @type {APIEndpoint | APIEndpoint[]} */
                    const m = require(file);
                    const routes = Array.isArray(m) ? m : [m];
                    for (const route of routes) {
                        if (route.auth) {
                            this.listener.options(route.path, (res, req) => {
                                this.cors(res, req.getHeader('origin'));
                                this.preflight(res);
                            });
                        }

                        this.listener[route.method || 'get'](route.path, (res, req) => {
                            const origin = req.getHeader('origin');
                            res.onAborted(() => (res.aborted = true));

                            res.status = status => {
                                this.cors(res, origin);
                                res.cork(() => res.writeStatus(status).end());
                            };

                            res.json = data => {
                                if (res.aborted) return;
                                this.cors(res, origin);
                                res.cork(() =>
                                    res
                                        .writeHeader('Content-Type', 'application/json')
                                        .end(JSON.stringify(data)),
                                );
                            };

                            if (route.auth) {
                                const token = req
                                    .getHeader('authorization')
                                    .split(' ')?.[1];
                                res.userPromise = validateToken(token)
                                    ? UserCollection.findByToken(token)
                                    : Promise.resolve(null);
                            }

                            route.handle.bind(this.app)(res, req);
                        });
                    }
                } catch (e) {
                    logger.error(`Failed to bind route module at "${file}"`);
                }
            }

            this.listener.get('/*', this.serveStaticFiles.bind(this));

            this.listener.listen(this.options.host, this.options.port, sock => {
                this.sock = sock;
                sock
                    ? resolve()
                    : reject(
                          `Webserver failed to open on ${
                              this.options.host || 'undefined_host'
                          }:${this.options.port || 'undefined_port'}`,
                      );
            });
        });

        logger.info(`Webserver listening on ${this.options.host}:${this.options.port}`);
    }

    /** @param {uWSRes} res */
    cors(res, origin = '') {
        const value = origin.startsWith('http://localhost')
            ? origin
            : this.options.domain || origin;

        res.writeHeader('Access-Control-Allow-Origin', value);
        res.writeHeader('Access-Control-Allow-Credentials', 'true');
    }

    /** @param {uWSRes} res */
    preflight(res, options = 'GET, OPTIONS') {
        res.writeHeader('Access-Control-Allow-Methods', options);
        res.writeHeader('Access-Control-Allow-Headers', 'Authorization');
        res.end();
    }

    async close() {
        // TODO: close all ws connection?
        if (!this.sock) return logger.warn('Webserver is not open');
        uWS.us_listen_socket_close(this.sock);

        logger.info('Webserver closed');
        this.sock = null;

        await mg.disconnect();
        logger.info('Disconnected from MongoDB');
    }
};
