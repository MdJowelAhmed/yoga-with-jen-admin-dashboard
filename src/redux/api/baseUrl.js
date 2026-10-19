export const getBaseUrl = (production = false) => {
    const liveUrl =
        import.meta.env.VITE_BASE_LIVE_URL ||
        import.meta.env.NEXT_PUBLIC_API_URL ||
        import.meta.env.VITE_API_URL 

    const devUrl =
        import.meta.env.VITE_BASE_URL ||
        liveUrl;

    return production ? liveUrl : devUrl;
};

export const getConfigUrl = (production) => {
    return production ? '69.62.67.86' : "10.10.26.174";
}