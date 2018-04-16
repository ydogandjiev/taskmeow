import { adalApiFetch } from "./adalConfig";

const heroesApi = {
  get() {
    return adalApiFetch(fetch, "/api/heroes", { method: "GET" }).then(result =>
      result.json()
    );
  },
  create(hero) {
    return adalApiFetch(fetch, "/api/hero", {
      method: "POST",
      body: JSON.stringify(hero),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    }).then(result => result.json());
  },
  update(hero) {
    return adalApiFetch(fetch, "/api/hero", {
      method: "PUT",
      body: JSON.stringify(hero),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    }).then(result => result.json());
  },
  destroy(id) {
    return adalApiFetch(fetch, `/api/hero/${id}`, {
      method: "DELETE"
    });
  }
};

export default heroesApi;
