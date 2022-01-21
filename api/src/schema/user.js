const mg = require('mongoose');
const { genToken } = require('../util/provision');

/** @type {mg.Schema<UserEntry>} */
const UserSchema = new mg.Schema(
    {
        // First party info
        id: { type: String, default: _ => genToken(12) },
        name: { type: String, default: '' },
        about: { type: String, default: '' },
        token: { type: String, default: _ => genToken() },
        role: {
            type: String,
            default: 'user',
            enum: ['admin', 'manager', 'moderator', 'user'],
        },

        // Third party info
        oauth2Token: { type: String },
        oauth2Refresh: { type: String },
        oauth2Info: {
            id: { type: String, required: true },
            ip: { type: String, required: true },
            public: { type: Boolean, default: true },
            email: { type: String, required: true },
            verified: { type: Boolean, default: false },
            org: { type: String, required: false },
            profile: { type: String, default: '' },
            provider: {
                type: String,
                enum: ['google'],
            },
            cacheTime: { type: Date, default: _ => new Date() },
        },
    },
    {
        versionKey: false,
    },
);

UserSchema.index({ id: 1 }, { unique: true });
UserSchema.index({ token: 1 }, { unique: true });
UserSchema.index({ 'oauth2Info.id': 1, 'oauth2Info.provider': 1 }, { unique: true });

const UserModel = mg.model('users', UserSchema);

class UserCollection {
    // TODO: basic update functions
    // TODO: permission management

    /**
     * @param {string} token
     */
    static findByToken(token) {
        return UserModel.findOne({ token });
    }

    /**
     * @param {string} id
     * @param {OAuth2Provider} provider
     */
    static findByOAuth2ID(id, provider) {
        return UserModel.findOne({
            'oauth2Info.id': id,
            'oauth2Info.provider': provider,
        }).exec();
    }

    /**
     *
     * @param {string} oauth2Token
     * @param {string} oauth2Refresh
     * @param {OAuth2Info & { name: string }} info info.name is only used for first time user
     */
    static async auth(oauth2Token, oauth2Refresh, info) {
        const doc = await UserModel.findOne({
            'oauth2Info.id': info.id,
            'oauth2Info.provider': info.provider,
        }).exec();

        if (doc) {
            doc.token = genToken();
            doc.oauth2Token = oauth2Token;
            doc.oauth2Refresh = oauth2Refresh;
            delete info.name;
            Object.assign(doc.oauth2Info, info);
            await doc.save();
            return doc;
        } else {
            const name = info.name;
            delete info.name;

            const doc = await UserModel.create({
                name,
                oauth2Token,
                oauth2Refresh,
                oauth2Info: info,
            });
            return doc;
        }
    }

    // Test only
    static getAll() {
        return UserModel.find({}).lean().exec();
    }

    // Test only
    static clear() {
        return UserModel.deleteMany({}).exec();
    }
}

module.exports = UserCollection;
