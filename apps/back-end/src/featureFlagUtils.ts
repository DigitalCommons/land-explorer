

export function useBetterAuth() {
    return process.env.FEATURE_USE_BETTERAUTH === "true";
}