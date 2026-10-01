import { EnvironmentType } from "../enums";

export function getEnvironmentType(): EnvironmentType {
    const value = process.env.ENVIRONMENT_TYPE;
    if (!Object.values(EnvironmentType).includes(value as EnvironmentType)) {
        throw new Error(
            `ENVIRONMENT_TYPE must be one of ${Object.values(EnvironmentType).join(", ")}, got "${value}"`
        );
    }
    return value as EnvironmentType;
}
