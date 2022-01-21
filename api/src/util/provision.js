const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
const TOKEN_LEN = 64;

const genToken = (length = TOKEN_LEN) => {
    return Array.from(
        { length },
        _ => ALPHABET[~~(Math.random() * ALPHABET.length)],
    ).join('');
};

const validateToken = (str = '', length = TOKEN_LEN) =>
    new RegExp(`[a-zA-Z0-9]{${length},${length}}`).test(str);

const parseJwt = (token = '') => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(''),
    );

    return JSON.parse(jsonPayload);
};

module.exports = { genToken, parseJwt, validateToken };
