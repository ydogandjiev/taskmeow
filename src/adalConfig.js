import { AuthenticationContext, adalFetch } from "react-adal";

export const adalConfig = {
  clientId: "ab93102c-869b-4d34-a921-a31d3e7f76ef",
  endpoints: {
    api: "ab93102c-869b-4d34-a921-a31d3e7f76ef"
  },
  cacheLocation: "localStorage"
};

export const authContext = new AuthenticationContext(adalConfig);

export const adalApiFetch = (fetch, url, options) =>
  adalFetch(authContext, adalConfig.endpoints.api, fetch, url, options);
