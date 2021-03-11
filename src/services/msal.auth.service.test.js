import * as Msal from "msal";
jest.mock("msal");

import MsalAuthService from "./msal.auth.service";

afterEach(() => {
  jest.resetAllMocks();
});

it("can be constructed", () => {
  const authService = new MsalAuthService();
  expect(authService).toBeDefined();
  expect(Msal.UserAgentApplication.mock.instances.length).toEqual(1);
});

it("can check for callback", () => {
  const authService = new MsalAuthService();
  const app = Msal.UserAgentApplication.mock.instances[0];
  app.isCallback.mockReturnValue(true);

  expect(authService.isCallback()).toEqual(true);
  expect(app.isCallback).toHaveBeenCalledTimes(1);
});

it("can initiate login", () => {
  const authService = new MsalAuthService();
  const app = Msal.UserAgentApplication.mock.instances[0];
  app.loginPopup.mockResolvedValue();

  authService.login();
  expect(app.loginPopup).toHaveBeenCalledTimes(1);
});

it("can initiate logout", () => {
  const authService = new MsalAuthService();
  const app = Msal.UserAgentApplication.mock.instances[0];

  authService.logout();
  expect(app.logout).toHaveBeenCalledTimes(1);
});

it("can get token", (done) => {
  const authService = new MsalAuthService();
  const app = Msal.UserAgentApplication.mock.instances[0];
  app.acquireTokenSilent.mockResolvedValue("fakeToken");

  authService.getToken().then((token) => {
    expect(token).toEqual("fakeToken");
    done();
  });

  expect(app.acquireTokenSilent).toHaveBeenCalledTimes(1);
});

it("can get user", (done) => {
  const mockUser = {
    name: "fakeFirst fakeLast",
    given_name: "fakeFirst",
    oid: "fakeOid",
  };

  const authService = new MsalAuthService();
  const app = Msal.UserAgentApplication.mock.instances[0];
  app.getAccount.mockResolvedValue(mockUser);

  authService.getUser().then((user) => {
    expect(user).toEqual(mockUser);
    done();
  });

  expect(app.getAccount).toHaveBeenCalledTimes(1);
});
