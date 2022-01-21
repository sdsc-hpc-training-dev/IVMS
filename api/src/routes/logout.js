const logger = require('../modules/logger');

/** @type {APIEndpoint} */
module.exports = {
    auth: true,
    method: 'get',
    path: '/api/logout',
    handle: function (res, _) {
        res.userPromise.then(doc => {
            if (res.aborted) return;
            if (!doc || !this.oauth2.hasOwnProperty(doc.oauth2Info.provider)) {
                res.status('400 Bad Request');
                return;
            }
            const toRevoke = doc.oauth2Token;

            doc.token = null;
            doc.oauth2Token = null;
            doc.oauth2Refresh = null;

            Promise.allSettled([
                this.oauth2[doc.oauth2Info.provider].revoke(toRevoke),
                doc.save(),
            ]).then(([revoked, saved]) => {
                logger.debug(`Token revoked: `, revoked.value, `Saved doc: `, saved);
                res.status('200 OK');
            });
        });
    },
};
