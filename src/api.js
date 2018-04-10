const heroesApi = {
  get() {
    return fetch("/api/heroes").then(result => result.json());
  },
  create(hero) {
    return fetch("/api/hero", {
      method: "POST",
      body: JSON.stringify(hero),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    }).then(result => result.json());
  },
  update(hero) {
    return fetch("/api/hero", {
      method: "PUT",
      body: JSON.stringify(hero),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    }).then(result => result.json());
  },
  destroy(id) {
    return fetch(`/api/hero/${id}`, {
      method: "DELETE"
    });
  }
};

export default heroesApi;
