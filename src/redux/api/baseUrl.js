export const getBaseUrl = (production = false) => {
    return production
        ? import.meta.env.VITE_BASE_LIVE_URL
        : import.meta.env.VITE_BASE_URL;
};

export const getConfigUrl = (production) => {
    return production ? '69.62.67.86' : "10.10.26.174";
}