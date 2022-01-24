const Joi = require('joi');

/** @type {APIEndpoint} */
const getProfile = {
    auth: true,
    method: 'get',
    path: '/api/me',
    handle: function (proxy, _) {
        proxy.userPromise.then(doc => {
            if (!doc) {
                proxy.status('401 Unauthorized');
                return;
            } else {
                proxy.json({
                    id: doc.id,
                    name: doc.name,
                    about: doc.about,
                    public: doc.oauth2Info.public,
                    profile: doc.oauth2Info.profile,
                    email: doc.oauth2Info.email,
                });
            }
        });
    },
};

/** @typedef {{ name: string, about: string }} ProfileUpdateData */

/** @type {Joi.Schema<ProfileUpdateData>} */
const ProfileSchema = Joi.object({
    name: Joi.string().min(2).max(64).required(),
    about: Joi.string().min(0).max(1024).required(),
});

/** @type {APIEndpoint<ProfileUpdateData>} */
const updateProfile = {
    auth: true,
    method: 'post',
    path: '/api/me',
    body: {
        limit: 2 * 1024, // 2kb
        jsonSchema: ProfileSchema,
    },
    handle: function (proxy, _) {
        proxy.bodyPromise.then(async data => {
            const user = await proxy.userPromise;
            if (!user) return proxy.status('401 Unauthorized');

            const result = await user.updateOne(data).exec();
            proxy.json(result);
        });
    },
};

module.exports = [getProfile, updateProfile];
