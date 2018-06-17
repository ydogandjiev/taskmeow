import authService from "./auth.service";

class UserService {
  getImage(useV2) {
    if (!this.userImagePromise) {
      this.userImagePromise = authService
        .fetch(`/api/user/image?useV2=${useV2}`)
        .then(result => {
          if (result.status !== 200) {
            return Promise.reject(
              `Failed to fetch image; error code: ${result.status}`
            );
          } else {
            return result.blob();
          }
        })
        .then(blob => {
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
        .catch(error => {
          this.userImagePromise = null;
          return Promise.reject(error);
        });
    }
    return this.userImagePromise;
  }
}

export default new UserService();
