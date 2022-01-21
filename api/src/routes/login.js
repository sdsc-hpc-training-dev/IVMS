const logger = require('../modules/logger');
const UserCollection = require('../schema/user');
const OAuth2StateCollection = require('../schema/oauth2');

// Dumb SSR
const ABORT_SCRIPT = (error = 'Unknown Error', origin = '*') => `
<!DOCTYPE html>
<head>
    <script>
        if (window.opener) window.opener.postMessage({ error: "${error}" }, "${origin}");
        window.close();
    </script>
</head>
<body>
<h1>${error}</h1>
</body>
</html>`;

const SUCCESS_SCRIPT = (token = '', redirect = '', origin = '*') => `
<!DOCTYPE html>
<head>
    <script>
        if (window.opener)
            window.opener.postMessage({ token: "${token}" }, "${origin}");
        else
            localStorage.setItem("iv-token", "${token}");
        window.close();
        ${redirect ? `window.location.href = "${redirect}";` : ''}
    </script>
</head>
<body>
<h1>Logged In</h1>
</body>
</html>`;

/** @type {APIEndpoint[]} */
module.exports = [
    {
        method: 'get',
        path: '/api/login/:provider',
        handle: function (res, req) {
            const provider = req.getParameter(0);

            if (!this.oauth2.hasOwnProperty(provider)) {
                res.writeStatus('404').end();
            } else {
                const ip = this.server.ip(res, req);
                const redirect = this.oauth2[provider].redirect;

                OAuth2StateCollection.push(ip, provider, null).then(state => {
                    if (res.aborted) return;
                    res.cork(() => {
                        this.server.redirect(res, `${redirect}&state=${state}`);
                    });
                });
            }
        },
    },
    {
        method: 'get',
        path: '/api/login/callback/:provider',
        handle: function (res, req) {
            const providerName = req.getParameter(0);

            if (!this.oauth2.hasOwnProperty(providerName)) {
                res.writeStatus('404').end();
            } else {
                const ip = this.server.ip(res, req);
                const code = req.getQuery('code');
                const provider = this.oauth2[providerName];

                OAuth2StateCollection.pull(req.getQuery('state'))
                    .then(async state => {
                        if (res.aborted) return;

                        if (!state) {
                            res.cork(() => {
                                res.writeStatus('400').end(ABORT_SCRIPT('unknown state'));
                            });
                            return;
                        }

                        if (state.expire <= new Date()) {
                            res.cork(() => {
                                res.writeStatus('400').end(ABORT_SCRIPT('login timeout'));
                            });
                            return;
                        }

                        if (state.provider !== providerName) {
                            res.cork(() => {
                                res.writeStatus('400').end(
                                    ABORT_SCRIPT('provider mismatch'),
                                );
                            });
                            return;
                        }

                        if (state.ip !== ip) {
                            res.cork(() => {
                                res.writeStatus('400').end(ABORT_SCRIPT('ip mismatch'));
                            });
                            return;
                        }

                        const cred = await provider.exchange(code, false);
                        const info = await provider.fetchUser(cred.oauth2Token);

                        info.ip = ip;

                        const doc = await UserCollection.auth(
                            cred.oauth2Token,
                            cred.oauth2Refresh,
                            info,
                        );

                        if (res.aborted) return;

                        res.cork(() => {
                            res.writeStatus('200').end(
                                SUCCESS_SCRIPT(doc.token, res.redirect),
                            );
                        });
                    })
                    .catch(e => {
                        if (res.aborted) return;
                        logger.error(`LoginCallbackError(provider=${provider})`, e);
                        res.writeStatus('500').end();
                    });
            }
        },
    },
];
