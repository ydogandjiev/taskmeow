import AuthenticationContext from "adal-angular/lib/adal";

// An authentication service that uses the ADAL.js library to sign in users with
// an AAD account. This leverages the AAD v1 endpoint.
class AdalAuthService {
  constructor() {
    this.applicationConfig = {
      clientId: "36b1586d-b1da-45d2-9b32-899c3757b6f8",
      endpoints: {
        api: "36b1586d-b1da-45d2-9b32-899c3757b6f8"
      },
      redirectUri: `${window.location.origin}/callback/v1`,
      cacheLocation: "localStorage",
      callback: this.loginCallback,
      popUp: !window.navigator.standalone
    };

    this.authContext = new AuthenticationContext(this.applicationConfig);
  }

  isCallback = () => {
    return this.authContext.isCallback(window.location.hash);
  };

  loginCallback = (reason, token, error) => {
    if (this.loginPromise) {
      if (!error) {
        this.getUser()
          .then(user => this.loginPromiseResolve(user))
          .catch(error => {
            this.loginPromiseReject(error);
          });
      } else {
        this.loginPromiseReject(`${error}: ${reason}`);
      }
    }
  };

  login = () => {
    if (!this.loginPromise) {
      this.loginPromise = new Promise((resolve, reject) => {
        // Allow the promise to be resolved/rejected from the loginCallback above
        this.loginPromiseResolve = resolve;
        this.loginPromiseReject = reject;

        // Start the login flow
        this.authContext.login();
      });
    }
    return this.loginPromise;
  };

  logout = () => {
    this.authContext.logOut();
  };

  getUser = () => {
    return new Promise((resolve, reject) => {
      this.authContext.getUser((error, user) => {
        if (!error) {
          resolve(user.profile);
        } else {
          reject(error);
        }
      });
    });
  };

  getToken = () => {
    return new Promise((resolve, reject) => {
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
  };
}

export default AdalAuthService;
