import SSOAuthService from "./sso.auth.service";
import * as microsoftTeams from "@microsoft/teams-js";
import { resolve } from "any-promise";

jest.mock("@microsoft/teams-js");

afterEach(() => {
  jest.resetAllMocks();
});

it("can be constructed", () => {
  const authService = new SSOAuthService();
  expect(authService).toBeDefined();
  expect(authService.isSSO).toBeTruthy();
});

it("can get token", done => {
  const tokenValue = "faketoken";

  const authService = new SSOAuthService();
  microsoftTeams.authentication.getAuthToken.mockImplementationOnce(request => {
    request.successCallback(tokenValue);
  });

  authService.getToken().then(token => {
    expect(token).toEqual(tokenValue);
    done();
  });

  expect(microsoftTeams.authentication.getAuthToken).toHaveBeenCalledTimes(1);
});

it("can get user", done => {
  const mockUser = {
    name: "fakeFirst fakeLast",
    given_name: "fakeFirst",
    oid: "fakeOid"
  };

  const authService = new SSOAuthService();
  microsoftTeams.authentication.getUser.mockImplementationOnce(request => {
    request.successCallback(mockUser);
  });

  authService.getUser().then(user => {
    expect(user).toEqual(mockUser);
    done();
  });

  expect(microsoftTeams.authentication.getUser).toHaveBeenCalledTimes(1);
});

