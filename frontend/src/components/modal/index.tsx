export const ModalStyle: () => {
    overlay: React.CSSProperties;
    content: React.CSSProperties;
} = () => ({
    overlay: {
        backgroundColor: 'rgb(0,0,0,0.25)',
        // Hack to make it look good :/
        width: '200vw',
        height: '200vh',
        transform: 'translate(-25%, -25%)',
        zIndex: 3,
    },
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 3,
        border: 'none',
        minWidth: '500px',
        minHeight: '250px',
        maxWidth: '80vw',
        maxHeight: '80vh',
        padding: '0px',
        overflow: 'hidden',
    },
});
