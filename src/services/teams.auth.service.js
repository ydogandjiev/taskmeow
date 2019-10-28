import AuthenticationContext from "adal-angular/lib/adal";
import * as microsoftTeams from "@microsoft/teams-js";

// An authentication service that uses the ADAL.js and Teams.js library to sign in users with
// their AAD account. This leverages the AAD v1 endpoint.
class TeamsAuthService {
  constructor() {
    // Initialize the Teams SDK
    microsoftTeams.initialize();

    // Check for any context information supplied via our QSPs
    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);
    const tenantId = params["tenantId"] || "common";

    // TODO: Clear sign in context on user mismatch
    // const userObjectId = params["userObjectId"];

    // Configure ADAL
    this.applicationConfig = {
      tenant: tenantId,
      clientId: "ab93102c-869b-4d34-a921-a31d3e7f76ef",
      endpoints: {
        api: "ab93102c-869b-4d34-a921-a31d3e7f76ef"
      },
      redirectUri: `${window.location.origin}/tab/silent-end`,
      cacheLocation: "localStorage",
      navigateToLoginRequestUrl: false
    };

    this.authContext = new AuthenticationContext(this.applicationConfig);
  }

  isCallback() {
    return this.authContext.isCallback(window.location.hash);
  }

  login() {
    if (!this.loginPromise) {
      this.loginPromise = new Promise((resolve, reject) => {
        this.ensureLoginHint().then(() => {
          // Start the login flow
          microsoftTeams.authentication.authenticate({
            url: `${window.location.origin}/tab/silent-start`,
            width: 600,
            height: 535,
            successCallback: result => {
              resolve(this.getUser());
            },
            failureCallback: reason => {
              reject(reason);
            }
          });
        });
      });
    }
    return this.loginPromise;
  }

  logout() {
    this.authContext.logOut();
  }

  getUser() {
    return new Promise((resolve, reject) => {
      this.authContext.getUser((error, user) => {
        if (!error) {
          resolve(user.profile);
        } else {
          reject(error);
        }
      });
    });
  }

  getToken() {
    return new Promise((resolve, reject) => {
      this.ensureLoginHint().then(() => {
        this.authContext.acquireToken(
          this.applicationConfig.endpoints.api,
          (reason, token, error) => {
            if (!error) {
              resolve(token);
            } else {
              reject({ error, reason });
            }
          }
        );
      });
    });
  }

  ensureLoginHint() {
    return new Promise((resolve, reject) => {
      microsoftTeams.getContext(context => {
        const scopes = encodeURIComponent(
          "email openid profile offline_access User.Read"
        );

        // Setup extra query parameters for ADAL
        // - openid and profile scope adds profile information to the id_token
        // - login_hint provides the expected user name
        if (context.loginHint) {
          this.authContext.config.extraQueryParameter = `prompt=consent&scope=${scopes}&login_hint=${encodeURIComponent(
            context.loginHint
          )}`;
        } else {
          this.authContext.config.extraQueryParameter = `prompt=consent&scope=${scopes}`;
        }
        resolve();
      });
    });
  }
}

export default TeamsAuthService;
