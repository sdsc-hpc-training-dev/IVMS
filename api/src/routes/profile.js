/** @type {APIEndpoint[]} */
module.exports = [
    {
        auth: true,
        method: 'get',
        path: '/api/me',
        handle: function (res, _) {
            res.userPromise.then(doc => {
                if (res.aborted) return;
                if (!doc) {
                    res.cork(() => res.writeStatus('401 Unauthorized').end());
                    return;
                } else {
                    res.cork(() =>
                        res.json({
                            name: doc.name,
                            about: doc.about,
                            public: doc.oauth2Info.public,
                            profile: doc.oauth2Info.profile,
                            email: doc.oauth2Info.email,
                        }),
                    );
                }
            });
        },
    },
];
