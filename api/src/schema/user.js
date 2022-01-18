const mg = require('mongoose');

/** @type {mg.Schema<UserEntry>} */
const UserSchema = new mg.Schema(
    {
        name: { type: String },
        about: { type: String },
        token: { type: String },
        oauth2ID: { type: String },
        oauth2Token: { type: String },
        oauth2Refresh: { type: String },
        oauth2Provider: {
            type: String,
            default: 'google',
            enum: ['google'],
        },
        role: {
            type: String,
            default: 'user',
            enum: ['admin', 'manager', 'moderator', 'user'],
        },
    },
    {
        versionKey: false,
    },
);

const UserModel = mg.model('users', UserSchema);

class UserCollection {
    // TODO: authenticate
    // TODO: basic update functions
    // TODO: permission management
}
