import AdalAuthService from "./adal.auth.service";
import MsalAuthService from "./msal.auth.service";

class AuthService {
  constructor() {
    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);
    this.useV2 = params.get("useV2") === "true";
    this.authService = this.useV2
      ? new MsalAuthService()
      : new AdalAuthService();
  }

  isCallback = () => {
    return this.authService.isCallback(window.location.hash);
  };

  login = () => {
    return this.authService.login();
  };

  logout = () => {
    this.authService.logout();
  };

  getToken = () => {
    return this.authService.getToken();
  };

  // Does an authenticated fetch by acquiring and appending the Bearer token for our backend
  fetch = (url, options) => {
    return this.getToken().then(token => {
      options = options || {};
      options.headers = options.headers || {};
      options.headers.Authorization = `Bearer ${token}`;
      return fetch(url, options);
    });
  };
}

export default new AuthService();
