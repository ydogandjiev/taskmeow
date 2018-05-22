// A mock authentication service used for testing
class MockAuthService {
  isCallback = () => {
    return false;
  };

  login = () => {
    let mockUser = localStorage.getItem("mock.user");
    if (!mockUser) {
      mockUser = {
        name: "Mock User",
        objectId: "mock.user.id"
      };
      localStorage.setItem("mock.user", JSON.stringify(mockUser));
    }

    return Promise.resolve(mockUser);
  };

  logout = () => {
    localStorage.removeItem("mock.user");
  };

  getUser = () => {
    const mockUser = localStorage.getItem("mock.user");
    if (mockUser) {
      return Promise.resolve(JSON.parse(mockUser));
    } else {
      return Promise.reject("User information is not available");
    }
  };

  getToken = () => {
    const mockUser = localStorage.getItem("mock.user");
    if (mockUser) {
      return Promise.resolve("mock.token");
    } else {
      return Promise.reject("User information is not available");
    }
  };
}

export default MockAuthService;
