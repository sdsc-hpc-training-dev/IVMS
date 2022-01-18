/** @type {APIEndpoint} */
module.exports = {
    method: 'get',
    path: '/api/login/:provider',
    handle: function (res, req) {
        const provider = req.getParameter(0);

        if (!this.oauth2.hasOwnProperty(provider)) {
            res.writeStatus('404').end();
        } else {
            this.server.redirect(res, this.oauth2[provider].redirect);
        }
    },
};
