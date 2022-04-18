import * as msal from "@azure/msal-browser";
jest.mock("@azure/msal-browser");

import MsalAuthService from "./msal.auth.service";

afterEach(() => {
  jest.resetAllMocks();
});

it("can be constructed", () => {
  const authService = new MsalAuthService();
  expect(authService).toBeDefined();
  expect(msal.PublicClientApplication.mock.instances.length).toEqual(1);
});

it("can check for callback", (done) => {
  const authService = new MsalAuthService();
  const app = msal.PublicClientApplication.mock.instances[0];
  const mockAuthResponse = {
    account: {
      name: "John Doe",
    },
  };
  app.handleRedirectPromise.mockResolvedValue(mockAuthResponse);

  authService.isCallback().then((isCallback) => {
    expect(isCallback).toEqual(true);
    expect(app.handleRedirectPromise).toHaveBeenCalledTimes(1);
    expect(app.setActiveAccount).toHaveBeenCalledWith(mockAuthResponse.account);
    done();
  });
});

it("can initiate login", (done) => {
  const authService = new MsalAuthService();
  const app = msal.PublicClientApplication.mock.instances[0];
  const mockAuthResponse = {
    account: {
      name: "John Doe",
    },
  };
  app.loginPopup.mockResolvedValue(mockAuthResponse);

  authService.login().then((account) => {
    expect(account).toEqual(mockAuthResponse.account);
    expect(app.loginPopup).toHaveBeenCalledTimes(1);
    expect(app.setActiveAccount).toHaveBeenCalledWith(mockAuthResponse.account);
    done();
  });
});

it("can initiate logout", () => {
  const authService = new MsalAuthService();
  const app = msal.PublicClientApplication.mock.instances[0];

  authService.logout();
  expect(app.logout).toHaveBeenCalledTimes(1);
});

it("can get token", (done) => {
  const authService = new MsalAuthService();
  const app = msal.PublicClientApplication.mock.instances[0];
  const mockAuthResponse = {
    accessToken: "fakeToken",
  };
  app.acquireTokenSilent.mockResolvedValue(mockAuthResponse);

  authService.getToken().then((token) => {
    expect(app.acquireTokenSilent).toHaveBeenCalledTimes(1);
    expect(token).toEqual(mockAuthResponse.accessToken);
    done();
  });
});

it("can get user", (done) => {
  const authService = new MsalAuthService();
  const app = msal.PublicClientApplication.mock.instances[0];
  const mockAccount = {
    name: "fakeFirst fakeLast",
    oid: "fakeOid",
  };
  app.getActiveAccount.mockResolvedValue(mockAccount);

  authService.getUser().then((user) => {
    expect(app.getActiveAccount).toHaveBeenCalledTimes(1);
    expect(user).toEqual(mockAccount);
    done();
  });
});
