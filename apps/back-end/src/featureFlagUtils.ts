export function isBetterAuthEnabled() {
    return process.env.FEATURE_USE_BETTERAUTH === "true";
}