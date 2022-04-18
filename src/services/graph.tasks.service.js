import authService from "./auth.service";

class GraphTasksService {
  get() {
    return authService
      .fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "query { tasks { _id title starred order conversationId } }",
        }),
      })
      .then((result) => result.json())
      .then((result) => {
        return result.errors
          ? Promise.reject(result.errors[0].message)
          : result.data.tasks;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  create(task) {
    return authService
      .fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `mutation { createTask(title: "${task.title}", order: ${
            task.order
          }, starred: ${!!task.starred}) { _id title starred order conversationId } }`,
        }),
      })
      .then((result) => result.json())
      .then((result) => {
        return result.errors
          ? Promise.reject(result.errors[0].message)
          : result.data.createTask;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  update(task) {
    return authService
      .fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `mutation { updateTask(id: "${task._id}", title: "${
            task.title
          }", order: ${
            task.order
          }, starred: ${!!task.starred}) { _id title starred order conversationId } }`,
        }),
      })
      .then((result) => result.json())
      .then((result) => {
        return result.errors
          ? Promise.reject(result.errors[0].message)
          : result.data.updateTask;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  destroy(id) {
    return authService
      .fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `mutation { deleteTask(id: "${id}") { _id title starred order conversationId } }`,
        }),
      })
      .then((result) => result.json())
      .then((result) => {
        return result.errors
          ? Promise.reject(result.errors[0].message)
          : result.data.deleteTask;
      })
      .catch((error) => {
        console.error(error);
      });
  }
}

export default GraphTasksService;
