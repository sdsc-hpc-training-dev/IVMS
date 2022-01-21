const mg = require('mongoose');
const { genToken } = require('../util/provision');

/** @type {mg.Schema<OAuth2StateEntry>} */
const OAuth2StateSchema = new mg.Schema(
    {
        id: { type: String, default: _ => genToken(16) },
        ip: { type: String },
        redirect: { type: String },
        expire: { type: Date },
        provider: {
            type: String,
            enum: ['google'],
        },
    },
    {
        versionKey: false,
    },
);

OAuth2StateSchema.index({ id: 1 }, { unique: true });

const OAuth2StateModel = mg.model('oauth2-state', OAuth2StateSchema);

module.exports = class OAuth2StateCollection {
    // TODO: create state
    // TODO: get & remove state
    // TODO: remove expired state

    /**
     *
     * @param {string} ip
     * @param {OAuth2Provider} provider
     * @param {string?} redirect
     */
    static async push(ip, provider, redirect) {
        const doc = await OAuth2StateModel.create({
            ip,
            provider,
            redirect,
            expire: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        });
        return String(doc.id);
    }

    /**
     *
     * @param {string} id
     */
    static pull(id) {
        return OAuth2StateModel.findOneAndDelete({ id }).lean().exec();
    }

    // Test only
    static getAll() {
        return OAuth2StateModel.find(
            {},
            {
                _id: 0,
            },
        )
            .lean()
            .exec();
    }

    // Test only
    static clear() {
        return OAuth2StateModel.deleteMany({}).exec();
    }
};
