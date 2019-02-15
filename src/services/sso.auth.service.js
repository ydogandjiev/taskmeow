import * as microsoftTeams from "@microsoft/teams-js";

// An authentication that will only request an access token for the logged in user.
// This token can then be used to request other resources.
class SSOAuthService {
  constructor() {
    // Initialize the Teams SDK
    microsoftTeams.initialize();

    // Flag that this service assumes using Teams SSO
    this.isSSO = true;
  }

  getUser() {
    return new Promise((resolve, reject) => {
      microsoftTeams.authentication.getUser({
        successCallback: (result) => {
          resolve(result);
        },
        failureCallback: (result) => {
          reject(result);
        }
      });
    });
  }

  getToken() {
    return new Promise((resolve, reject) => {
      microsoftTeams.authentication.getAuthToken({
        successCallback: result => {
          resolve(result);
        },
        failureCallback: reason => {
          reject(reason);
        }
      });
    });
  }
}

export default SSOAuthService;
