import { Header } from './header';
import { ProfileModal } from './modal/profile';

import './app.css';

export const App = () => {
    return (
        <div>
            <Header />
            <ProfileModal />
        </div>
    );
};
