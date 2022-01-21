import { useHookstate } from '@hookstate/core';
import API from '../api';

export const App = () => {
    const me = useHookstate(API.me).value;

    return (
        <div>
            {me ? (
                <div>
                    <p>{me.public ? 'Public' : 'Private'} Profile</p>
                    <img src={me.profile} />
                    <p>
                        {me.name} {me.email}
                    </p>
                    <p>{me.about}</p>
                    <button onClick={() => API.logout()}>Logout</button>
                </div>
            ) : (
                <button onClick={() => API.promptLogin('google')}>
                    Login with Google
                </button>
            )}
        </div>
    );
};
