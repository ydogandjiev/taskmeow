import MockAuthService from "./mock.auth.service";

it("can be constructed", () => {
  const authService = new MockAuthService();
  expect(authService).toBeDefined();
});

it("can check for callback", (done) => {
  const authService = new MockAuthService();
  authService.isCallback().then((isCallback) => {
    expect(isCallback).toEqual(false);
    done();
  });
});

it("can initiate login", (done) => {
  const authService = new MockAuthService();
  authService.login().then((user) => {
    expect(user).toEqual({
      name: "Mock User",
      objectId: "mock.user.id",
    });
    done();
  });
});

it("can initiate logout", (done) => {
  const authService = new MockAuthService();
  authService.logout();

  authService
    .getUser()
    .then(() => {
      done.fail();
    })
    .catch((error) => {
      expect(error).toEqual("User information is not available");
      done();
    });
});

it("can get token", (done) => {
  const authService = new MockAuthService();
  authService.login();
  authService.getToken().then((token) => {
    expect(token).toEqual("mock.token");
    done();
  });
});

it("can't get token if not logged in", (done) => {
  const authService = new MockAuthService();
  authService.logout();
  authService
    .getToken()
    .then(() => {
      done.fail();
    })
    .catch((error) => {
      expect(error).toEqual("User information is not available");
      done();
    });
});

it("can get user", (done) => {
  const authService = new MockAuthService();
  authService.login();
  authService.getUser().then((user) => {
    expect(user).toEqual({
      name: "Mock User",
      objectId: "mock.user.id",
    });
    done();
  });
});

it("can't get user if not logged in", (done) => {
  const authService = new MockAuthService();
  authService.logout();
  authService
    .getUser()
    .then(() => {
      done.fail();
    })
    .catch((error) => {
      expect(error).toEqual("User information is not available");
      done();
    });
});
