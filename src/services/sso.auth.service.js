import * as microsoftTeams from "@microsoft/teams-js";

// An authentication that will only request an access token for the logged in user.
// This token can then be used to request other resources.
class SSOAuthService {
  constructor() {
    // Initialize the Teams SDK
    microsoftTeams.initialize();

    // Flag that this service assumes using Teams SSO
    this.isSSO = true;
    this.authToken = null;
  }

  parseTokenToUser(token) {
    // parse JWT token to object
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var parsedToken = JSON.parse(window.atob(base64));
    var nameParts = parsedToken.name.split(" ");
    return {
      family_name: nameParts.length > 0 ? nameParts[0] : "n/a",
      given_name: nameParts.length > 1 ? nameParts[1] : "n/a",
      upn: parsedToken.preferred_username,
      name: parsedToken.name
    };
  }

  getUser() {
    return new Promise((resolve, reject) => {
      if (this.authToken) {
        resolve(this.parseTokenToUser(this.authToken));
      } else {
        this.getToken().resolve(token => {
          resolve(this.parseTokenToUser(token));
        })
          .reject(reason => {
            reject(reason);
          });
      }
    });
  }

  getToken() {
    return new Promise((resolve, reject) => {
      microsoftTeams.authentication.getAuthToken({
        successCallback: result => {
          this.authToken = result;
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
