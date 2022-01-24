// Wrap uWS http response into a proxy
// so it has express-like API while keeping high performance

const UserCollection = require('../schema/user');
const { validateToken } = require('../util/provision');

/**
 * @template T
 * @param {APIEndpoint<T>} route
 */
module.exports = route => {
    const { auth, body, defaultResType, handle } = route;

    /**
     * @this {import("../web/server")}
     * @param {uWSRes} res
     * @param {uWSReq} req
     */
    return function (res, req) {
        const origin = req.getHeader('origin');

        res.onAborted(() => (res.aborted = true));

        const status = status => {
            res.cork(() => {
                res.writeStatus(status);
                this.cors(res, origin);
                res.end();
            });
            res.aborted = true;
        };

        const buffer = (
            buf,
            status = '200 OK',
            type = defaultResType || 'application/text',
        ) => {
            if (res.aborted) return;
            res.cork(() => {
                res.writeStatus(status);
                this.cors(res, origin);
                res.writeHeader('Content-Type', type);
                res.end(buf);
            });
            res.aborted = true;
        };

        const json = (data, status = '200 OK') => {
            if (res.aborted) return;
            res.cork(() => {
                res.writeStatus(status);
                this.cors(res, origin);
                res.writeHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
            });
            res.aborted = true;
        };

        const redirect = (to = '/') => {
            if (res.aborted) return;
            res.cork(() => {
                res.writeStatus('302');
                res.writeHeader('location', to);
                res.end();
            });
            res.aborted = true;
        };

        /** @type {ResProxy<T>} */
        const proxy = { ip: this.ip(res, req), status, buffer, json, redirect };

        if (auth) {
            const token = req.getHeader('authorization');

            proxy.userPromise = validateToken(token)
                ? UserCollection.findByToken(token)
                : Promise.resolve(null);
        }

        if (body) {
            const { limit, optional, jsonSchema, timeout } = body;

            const lenMatch = /^\d+$/.exec(req.getHeader('content-length'));

            if (!lenMatch && !optional) {
                return status('411 Length Required');
            }
            const contentLength = parseInt(lenMatch?.[0]);
            if (isNaN(contentLength) || contentLength < 0) {
                return status('400 Bad Request');
            }
            if (!contentLength && !optional) {
                return status('400 Bad Request');
            }
            if (contentLength > limit) {
                return status('413 Payload Too Large');
            }

            let cb = null;
            let offset = 0;
            const pool = new Uint8Array(contentLength);
            proxy.bodyPromise = new Promise(resolve => (cb = resolve));

            res.onData((chunk, isLast) => {
                if (res.aborted || offset + chunk.byteLength > contentLength)
                    return cb(null);

                pool.set(new Uint8Array(chunk), offset);
                offset += chunk.byteLength;

                if (isLast) {
                    if (jsonSchema) {
                        const str = Buffer.from(pool).toString('utf8');
                        const json = JSON.parse(str);
                        const { error, value } = jsonSchema.validate(json, {
                            stripUnknown: true,
                        });

                        if (error) {
                            status('400 Validation Error');
                        } else {
                            cb(value);
                        }
                    } else cb(pool);
                }
            });
        }

        handle.bind(this.app)(proxy, req);
    };
};
