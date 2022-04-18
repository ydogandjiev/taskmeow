import TeamsAuthService from "./teams.auth.service";

import * as microsoftTeams from "@microsoft/teams-js";
jest.mock("@microsoft/teams-js");

import * as msal from "@azure/msal-browser";
jest.mock("@azure/msal-browser");

afterEach(() => {
  jest.resetAllMocks();
});

it("can be constructed", () => {
  const authService = new TeamsAuthService();
  expect(authService).toBeDefined();
});

it("can check for callback", (done) => {
  const authService = new TeamsAuthService();
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
  const mockAuthResponse = {
    account: {
      name: "John Doe",
    },
  };

  const authService = new TeamsAuthService();
  const app = msal.PublicClientApplication.mock.instances[0];
  app.getActiveAccount.mockResolvedValue();

  microsoftTeams.getContext.mockImplementationOnce((callback) => {
    callback({ loginHint: "fakeUser" });
  });

  microsoftTeams.authentication.authenticate.mockImplementationOnce(
    (request) => {
      request.successCallback(mockAuthResponse);
    }
  );

  authService.login().then((user) => {
    expect(microsoftTeams.authentication.authenticate).toHaveBeenCalledTimes(1);
    expect(app.setActiveAccount).toHaveBeenCalledWith(mockAuthResponse.account);
    expect(user).toEqual(mockAuthResponse.account);
    done();
  });
});

it("can initiate logout", () => {
  const authService = new TeamsAuthService();
  const app = msal.PublicClientApplication.mock.instances[0];

  authService.logout();
  expect(app.logout).toHaveBeenCalledTimes(1);
});

it("can get token", (done) => {
  const authService = new TeamsAuthService();
  const app = msal.PublicClientApplication.mock.instances[0];
  const mockAuthResponse = {
    accessToken: "fakeToken",
  };
  app.acquireTokenSilent.mockResolvedValue(mockAuthResponse);

  microsoftTeams.getContext.mockImplementation((callback) => {
    callback({ loginHint: "fakeUser" });
  });

  authService.getToken().then((token) => {
    expect(app.acquireTokenSilent).toHaveBeenCalledTimes(1);
    expect(token).toEqual(mockAuthResponse.accessToken);
    done();
  });
});

it("can get user", (done) => {
  const authService = new TeamsAuthService();
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
