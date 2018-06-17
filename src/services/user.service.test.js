import authService from "./auth.service";
jest.mock("./auth.service");

import userService from "./user.service";

it("can get image", done => {
  const result = {
    status: 200,
    blob: jest.fn(() => "mockBlob")
  };
  authService.fetch.mockResolvedValue(result);

  const mockFileReaderInstance = {
    result: "mockResult",
    readAsDataURL: blob => {
      expect(blob).toEqual("mockBlob");
      expect(mockFileReaderInstance.onloadend).toBeDefined();
      mockFileReaderInstance.onloadend();
    }
  };
  window.FileReader = jest.fn(() => mockFileReaderInstance);

  userService.getImage(false).then(userImage => {
    expect(userImage).toEqual("mockResult");
    done();
  });
});
