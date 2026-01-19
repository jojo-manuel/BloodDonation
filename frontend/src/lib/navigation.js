export const redirectTo = (url) => {
    window.location.href = url;
};

export const getHostname = () => {
    return window.location.hostname;
};

export const getOrigin = () => {
    return window.location.origin;
};
