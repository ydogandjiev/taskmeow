import authService from "./auth.service";

class UserService {
  getImage() {
    if (!this.userImagePromise) {
      this.userImagePromise = authService
        .fetch(`/api/user/image`)
        .then((result) => {
          if (result.status !== 200) {
            return Promise.reject({
              statusCode: result.status,
              statusMessage: result.statusText,
            });
          } else {
            return result.blob();
          }
        })
        .then((blob) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (reader.error) {
                reject(reader.error);
              } else {
                resolve(reader.result);
              }
            };
            reader.readAsDataURL(blob);
          });
        })
        .catch((error) => {
          this.userImagePromise = null;
          return Promise.reject(error);
        });
    }
    return this.userImagePromise;
  }
}

export default new UserService();
