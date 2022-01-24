interface PublicUserProfile {
    id: string;
    public: boolean;
    name: string;
    profile: string;
    about: string;
}

type PrivateUserProfile = {
    email: string;
} & PublicUserProfile;

declare module '*.svg';

declare module '*.css';
