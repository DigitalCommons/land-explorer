import axios, { InternalAxiosRequestConfig } from "axios";

/**
 * Add the PBS shared secret to every request's query params, alongside whatever params were
 * already set for that request.
 * Note: https://github.com/DigitalCommons/land-explorer/issues/83 We have a tech debt ticket to move the secret into the header rather than the query params
 */
export const addSecretParam = (config: InternalAxiosRequestConfig) => {
  config.params = {
    ...config.params,
    secret: process.env.BOUNDARY_SERVICE_SECRET,
  };
  return config;
};

/**
 * Shared axios client for calling the Property Boundaries Service (PBS).
 */
export const pbsClient = axios.create({
  baseURL: process.env.BOUNDARY_SERVICE_URL,
});

pbsClient.interceptors.request.use(addSecretParam);
