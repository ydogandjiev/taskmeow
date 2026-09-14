import { EventEmitter } from "events";

// A process-local pub/sub bus that lets SSE routes push task changes to
// connected clients instead of having clients poll for them. All task
// mutations funnel through task-service.js (REST, GraphQL, MCP, and the
// Teams bot all call it), so emitting from there is enough to cover every
// surface that can change a task.
const emitter = new EventEmitter();
// An unbounded number of SSE connections may subscribe to the same channel.
emitter.setMaxListeners(0);

function userChannel(userId) {
  return `user:${String(userId)}`;
}

function groupChannel(groupId) {
  return `group:${String(groupId)}`;
}

function emitUserTaskChange(userId, type, task) {
  emitter.emit(userChannel(userId), { type, task });
}

function emitGroupTaskChange(groupId, type, task) {
  emitter.emit(groupChannel(groupId), { type, task });
}

// Returns an unsubscribe function.
function subscribeUser(userId, listener) {
  const channel = userChannel(userId);
  emitter.on(channel, listener);
  return () => emitter.off(channel, listener);
}

// Returns an unsubscribe function.
function subscribeGroup(groupId, listener) {
  const channel = groupChannel(groupId);
  emitter.on(channel, listener);
  return () => emitter.off(channel, listener);
}

export default {
  emitUserTaskChange,
  emitGroupTaskChange,
  subscribeUser,
  subscribeGroup,
};
