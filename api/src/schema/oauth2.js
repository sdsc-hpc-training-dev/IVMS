const mg = require('mongoose');

/** @type {mg.Schema<OAuth2StateEntry>} */
const OAuth2StateSchema = new mg.Schema(
    {
        id: { type: String },
        ip: { type: String },
        redirect: { type: String },
        expire: { type: Date },
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

    // Test only
    static getAll() {
        return OAuth2StateModel.find(
            {},
            {
                _id: 0,
            },
        ).exec();
    }

    // Test only
    static clear() {
        return OAuth2StateModel.deleteMany({}).exec();
    }
};
