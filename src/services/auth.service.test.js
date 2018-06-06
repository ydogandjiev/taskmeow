afterEach(() => {
  jest.resetModules();
});

it("uses ADAL service by default", () => {
  const AdalAuthService = require("./adal.auth.service").default;
  const authService = require("./auth.service").default;
  jest.mock("./adal.auth.service");

  expect(AdalAuthService).toHaveBeenCalledTimes(1);
  const adalTasksServiceInstance = AdalAuthService.mock.instances[0];

  authService.isCallback();
  expect(adalTasksServiceInstance.isCallback).toHaveBeenCalledTimes(1);

  authService.login();
  expect(adalTasksServiceInstance.login).toHaveBeenCalledTimes(1);

  authService.logout();
  expect(adalTasksServiceInstance.logout).toHaveBeenCalledTimes(1);

  authService.getToken();
  expect(adalTasksServiceInstance.getToken).toHaveBeenCalledTimes(1);

  authService.getUser();
  expect(adalTasksServiceInstance.getUser).toHaveBeenCalledTimes(1);
});

it("uses MSAL service when useV2 QSP is set to true", () => {
  jsdom.reconfigure({ url: "https://taskmeow.com?useV2=true" });

  const MsalAuthService = require("./msal.auth.service").default;
  const authService = require("./auth.service").default;
  jest.mock("./msal.auth.service");

  expect(MsalAuthService).toHaveBeenCalledTimes(1);
  const msalAuthServiceInstance = MsalAuthService.mock.instances[0];

  authService.isCallback();
  expect(msalAuthServiceInstance.isCallback).toHaveBeenCalledTimes(1);

  authService.login();
  expect(msalAuthServiceInstance.login).toHaveBeenCalledTimes(1);

  authService.logout();
  expect(msalAuthServiceInstance.logout).toHaveBeenCalledTimes(1);

  authService.getToken();
  expect(msalAuthServiceInstance.getToken).toHaveBeenCalledTimes(1);

  authService.getUser();
  expect(msalAuthServiceInstance.getUser).toHaveBeenCalledTimes(1);
});
