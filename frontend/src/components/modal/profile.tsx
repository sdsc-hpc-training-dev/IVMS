import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';
import { observer } from 'mobx-react-lite';
import { CSSTransition } from 'react-transition-group';

import { RootStore } from '../../stores/store';
import { ModalStyle } from '.';

import './profile.css';

const style = ModalStyle();

export const ProfileModal = observer(() => {
    const editing = RootStore.editing;
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (editing) setOpen(true);
    }, [editing]);

    return (
        <CSSTransition in={open} classNames="fade" timeout={500} unmountOnExit>
            <Modal
                style={style}
                isOpen={open}
                closeTimeoutMS={500}
                ariaHideApp={false}
                onAfterClose={() => RootStore.stopEdit()}
            >
                <div className="edit-profile">
                    <i onClick={() => setOpen(false)} className="far fa-window-close"></i>
                    <h3>Profile</h3>
                    {!!editing && (
                        <div className="edit-panel">
                            <img src={editing.profile}></img>
                            <div className="edit-inputs">
                                <label>Public </label>
                                <input
                                    type="checkbox"
                                    checked={editing.public}
                                    onChange={e =>
                                        RootStore.edit({ public: e.target.checked })
                                    }
                                ></input>
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={editing.name}
                                    onChange={e => {
                                        RootStore.edit({ name: e.target.value });
                                    }}
                                ></input>
                                <label>Email</label>
                                <input
                                    type="text"
                                    value={editing?.email}
                                    readOnly
                                ></input>
                                <label>Bio</label>
                                <textarea
                                    value={editing.about}
                                    onChange={e => {
                                        RootStore.edit({ about: e.target.value });
                                    }}
                                ></textarea>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </CSSTransition>
    );
});
