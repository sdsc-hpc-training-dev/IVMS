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
        handle: function (proxy, req) {
            const provider = req.getParameter(0);

            if (!this.oauth2.hasOwnProperty(provider)) {
                proxy.status('404 Not Found');
            } else {
                const redirect = this.oauth2[provider].redirect;

                OAuth2StateCollection.push(proxy.ip, provider, null).then(state => {
                    proxy.redirect(`${redirect}&state=${state}`);
                });
            }
        },
    },
    {
        method: 'get',
        path: '/api/login/callback/:provider',
        defaultResType: 'text/html; charset=utf-8',
        handle: function (proxy, req) {
            const providerName = req.getParameter(0);

            if (!this.oauth2.hasOwnProperty(providerName)) {
                proxy.status('404 Not Found');
            } else {
                const ip = proxy.ip;
                const code = req.getQuery('code');
                const provider = this.oauth2[providerName];

                OAuth2StateCollection.pull(req.getQuery('state'))
                    .then(async state => {
                        if (!state) {
                            return proxy.buffer(
                                ABORT_SCRIPT('unknown state'),
                                '400 Bad Request',
                            );
                        }

                        if (state.expire <= new Date()) {
                            return proxy.buffer(
                                ABORT_SCRIPT('login timeout'),
                                '400 Bad Request',
                            );
                        }

                        if (state.provider !== providerName) {
                            return proxy.buffer(
                                ABORT_SCRIPT('provider mismatch'),
                                '400 Bad Request',
                            );
                        }

                        if (state.ip !== ip) {
                            return proxy.buffer(
                                ABORT_SCRIPT('ip mismatch'),
                                '400 Bad Request',
                            );
                        }

                        const cred = await provider.exchange(code, false);
                        const info = await provider.fetchUser(cred.oauth2Token);

                        info.ip = ip;

                        const doc = await UserCollection.auth(
                            cred.oauth2Token,
                            cred.oauth2Refresh,
                            info,
                        );

                        proxy.buffer(SUCCESS_SCRIPT(doc.token, state.redirect));
                    })
                    .catch(e => {
                        logger.error(`LoginCallbackError(provider=${provider})`, e);
                        proxy.status('500 Internal Error');
                    });
            }
        },
    },
];
