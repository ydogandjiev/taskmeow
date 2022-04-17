import SSOAuthService from "./sso.auth.service";
import * as microsoftTeams from "@microsoft/teams-js";

jest.mock("@microsoft/teams-js");

afterEach(() => {
  jest.resetAllMocks();
});

it("can be constructed", () => {
  const authService = new SSOAuthService();
  expect(authService).toBeDefined();
});

it("can get token", done => {
  const mockToken = "fakeToken";
  const authService = new SSOAuthService();
  microsoftTeams.authentication.getAuthToken.mockImplementationOnce(request => {
    request.successCallback(mockToken);
  });

  authService.getToken().then(token => {
    expect(token).toEqual(mockToken);
    expect(token).toEqual(authService.authToken);
    done();
  });

  expect(microsoftTeams.authentication.getAuthToken).toHaveBeenCalledTimes(1);
});

it("can get user", done => {
  const mockToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSm9obiBEb2UifQ.DjwRE2jZhren2Wt37t5hlVru6Myq4AhpGLiiefF69u8";

  const mockUser = {
    name: "John Doe",
    upn: undefined
  };

  const authService = new SSOAuthService();
  authService.authToken = mockToken;
  microsoftTeams.authentication.getUser.mockImplementationOnce(request => {
    request.successCallback(mockUser);
  });

  authService.getUser().then(user => {
    expect(user).toEqual(mockUser);
    done();
  });
});
