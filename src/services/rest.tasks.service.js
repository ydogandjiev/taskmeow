import authService from "./auth.service";

// Parses a fetch response body as a stream of SSE `data:` frames and invokes
// onEvent with the parsed JSON payload of each one.
function readEventStream(body, onEvent) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const pump = () =>
    reader.read().then(({ done, value }) => {
      if (done) {
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const messages = buffer.split("\n\n");
      buffer = messages.pop();

      messages.forEach((message) => {
        const dataLine = message
          .split("\n")
          .find((line) => line.startsWith("data:"));
        if (dataLine) {
          try {
            onEvent(JSON.parse(dataLine.slice(5).trim()));
          } catch (error) {
            // Ignore malformed events.
          }
        }
      });

      return pump();
    });

  return pump();
}

class RestTasksService {
  get(threadId, options) {
    let route;
    if (options) {
      route = `/api/tasks/${options.taskId}?shareTag=${options.shareTag}`;
    } else {
      route = threadId ? `/api/groups/${threadId}/tasks` : "/api/tasks";
    }

    return authService
      .fetch(route, { method: "GET" })
      .then((result) => result.json());
  }

  getShareUrl(taskId) {
    const route = `/api/tasks/${taskId}/share`;
    return authService
      .fetch(route, { method: "GET" })
      .then((result) => result.json());
  }

  create(task, threadId) {
    const route = threadId ? `/api/groups/${threadId}/tasks` : "/api/tasks";

    return authService
      .fetch(route, {
        method: "POST",
        body: JSON.stringify(task),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then((result) => result.json());
  }

  update(task, threadId) {
    const route = threadId
      ? `/api/groups/${threadId}/tasks/${task._id}`
      : `/api/tasks/${task._id}`;

    return authService
      .fetch(route, {
        method: "PUT",
        body: JSON.stringify(task),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then((result) => result.json());
  }

  destroy(taskId, threadId) {
    const route = threadId
      ? `/api/groups/${threadId}/tasks/${taskId}`
      : `/api/tasks/${taskId}`;

    return authService
      .fetch(route, {
        method: "DELETE",
      })
      .then((result) => result.json());
  }

  // Subscribes to a live stream of task changes (from any client) via SSE,
  // instead of having callers poll for updates. `onEvent` is invoked with
  // `{ type: "created" | "updated" | "deleted", task }` for every change.
  // `onResync` is invoked whenever the stream (re)connects, so the caller can
  // refetch the full list to cover anything missed while disconnected.
  // Returns a function that stops the subscription.
  subscribe(threadId, onEvent, onResync) {
    const route = threadId
      ? `/api/groups/${threadId}/tasks/stream`
      : "/api/tasks/stream";

    let stopped = false;
    let controller;
    let retryDelay = 1000;

    const connect = () => {
      if (stopped) {
        return;
      }

      controller = new AbortController();

      authService
        .fetch(route, {
          headers: { Accept: "text/event-stream" },
          signal: controller.signal,
        })
        .then((response) => {
          if (!response.body || typeof response.body.getReader !== "function") {
            // Streaming isn't supported in this environment (e.g. an older
            // browser, or a test runner without ReadableStream support).
            // Give up instead of retrying forever.
            stopped = true;
            return;
          }

          if (!response.ok) {
            // Let the retry loop below back off and try again.
            return;
          }

          retryDelay = 1000;
          if (onResync) {
            onResync();
          }

          return readEventStream(response.body, onEvent);
        })
        .catch(() => {
          // Connection dropped or was aborted; fall through to retry.
        })
        .then(() => {
          if (!stopped) {
            setTimeout(connect, retryDelay);
            retryDelay = Math.min(retryDelay * 2, 30000);
          }
        });
    };

    connect();

    return () => {
      stopped = true;
      if (controller) {
        controller.abort();
      }
    };
  }
}

export default RestTasksService;
