import { observer } from 'mobx-react-lite';
import { CSSTransition } from 'react-transition-group';

import { RootStore } from '../stores/store';

import './header.css';
import { useState } from 'react';

export const Header = observer(() => {
    const me = RootStore.me;

    const [showMenu, setShowMenu] = useState(false);
    const [timer, setTimer] = useState(null);

    return (
        <div className="site-header">
            <h1>Interactive Video</h1>
            <div
                className="site-header-icon"
                onMouseEnter={() => {
                    if (!me) return;
                    setShowMenu(true);

                    if (timer) {
                        clearTimeout(timer);
                        setTimer(null);
                    }
                }}
                onMouseLeave={() => {
                    if (!me) return;
                    if (timer) clearTimeout(timer);
                    setTimer(setTimeout(() => setShowMenu(false), 1500));
                }}
            >
                {me?.profile ? (
                    <>
                        <img src={me.profile} onError={() => me.clearProfile()} />
                        <CSSTransition
                            classNames="fade"
                            in={showMenu}
                            unmountOnExit
                            timeout={500}
                        >
                            <div className="menu-dropdown">
                                <div onClick={() => RootStore.startEdit()}>
                                    <i className="fas fa-user"></i> Profile
                                </div>
                                <div
                                    className="danger"
                                    onClick={() => {
                                        setShowMenu(false);
                                        RootStore.logout();
                                    }}
                                >
                                    <i className="fas fa-sign-out-alt"></i>Sign out
                                </div>
                            </div>
                        </CSSTransition>
                    </>
                ) : (
                    <button onClick={() => RootStore.login('google')}>
                        Sign in <i className="fab fa-google"></i>
                    </button>
                )}
            </div>
        </div>
    );
});
