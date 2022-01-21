interface PublicUserProfile {
    public: boolean;
    name: string;
    profile: string;
    about: string;
}

type PrivateUserProfile = {
    email: string;
} & PublicUserProfile;
