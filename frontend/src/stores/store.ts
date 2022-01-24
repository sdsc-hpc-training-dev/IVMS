import { types as T, clone } from 'mobx-state-tree';
import API from '../api';

const UserProfileStore = T.model('UserProfileStore', {
    id: T.identifier,
    public: T.boolean,
    name: T.string,
    profile: T.string,
    about: T.string,
    email: T.maybeNull(T.string),
}).actions(self => ({
    clearProfile() {
        self.profile = '';
    },
}));

export const RootStore = T.model('RootStore', {
    guest: T.boolean,
    me: T.maybeNull(UserProfileStore),
    editing: T.maybeNull(UserProfileStore),
})
    .actions(self => ({
        onLogin(me: PrivateUserProfile) {
            self.me = UserProfileStore.create(me);
        },
        onLogout() {
            self.me = null;
        },
        login(provider: string) {
            API.promptLogin(provider);
        },
        logout() {
            API.logout();
        },
        startEdit() {
            self.editing = clone(self.me);
        },
        stopEdit() {
            self.editing = null;
        },
        edit(fields: Partial<PrivateUserProfile>) {
            Object.assign(self.editing, fields);
        },
    }))
    .create({
        guest: true,
        me: null,
        editing: null,
    });
