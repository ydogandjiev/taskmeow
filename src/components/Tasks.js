import React, { Component } from "react";
import { Icon, Spinner, TextField } from "office-ui-fabric-react";
import Task from "./Task";
import TaskPane from "./TaskPane";
import UserTile from "./UserTile";
import tasksService from "../services/tasks.service";
import * as microsoftTeams from "@microsoft/teams-js";
import { ConsentConsumer } from "./ConsentContext";

// A little function to help us with reordering the result
const reorder = (list, dragIndex, hoverIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(dragIndex, 1);
  result.splice(hoverIndex, 0, removed);
  return result;
};

// How often to poll for changes as a fallback safety net. Only used when
// live push updates aren't supported by the active tasks service strategy
// (e.g. the mock/local-storage or Microsoft Graph strategies); the default
// REST strategy gets pushed updates instead and doesn't need this.
const FALLBACK_POLL_INTERVAL_MS = 60000;

class Tasks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      conversationOpen: false,
      newTask: { title: "" },
      tasks: [],
      taskId: props.taskId,
      shareTag: props.shareTag,
      loading: true,
    };
    // Tracks in-flight local mutations so a background refresh can't
    // clobber an optimistic update that hasn't been confirmed yet.
    this.pendingMutations = 0;
    this.unsubscribe = null;
    // Tracks whether a drag-and-drop reorder is in progress so remote
    // updates don't yank the list out from under the user's cursor.
    this.isDragging = false;
  }

  componentDidMount() {
    this.setState({ loading: true });

    if (this.props.inTeams) {
      microsoftTeams.app.getContext().then((context) => {
        const threadId = context.team?.internalId || context.chat?.id;
        const fetchTaskPromise = this.props.isGroup
          ? tasksService.get(threadId)
          : tasksService.get();
        fetchTaskPromise
          .then((tasks) => {
            this.setState({
              threadId,
              tasks: tasks.sort((a, b) => a.order - b.order),
              loading: false,
            });
            this.startLiveUpdates(this.props.isGroup ? threadId : undefined);
          })
          .catch(() => {
            this.setState({
              threadId,
              loading: false,
              tasks: [],
            });
            this.startLiveUpdates(this.props.isGroup ? threadId : undefined);
          });
      });
    } else {
      tasksService.get().then((tasks) => {
        this.setState({
          tasks: tasks.sort((a, b) => a.order - b.order),
          loading: false,
          taskId: this.state.taskId,
        });
        this.startLiveUpdates();
      });
    }
  }

  componentWillUnmount() {
    this.stopLiveUpdates();
  }

  // Starts receiving task changes made by other clients: a push-based
  // subscription where the active strategy supports it, otherwise falls
  // back to periodic polling.
  startLiveUpdates = (threadId) => {
    this.stopLiveUpdates();

    const unsubscribe = tasksService.subscribe(
      threadId,
      this.handleRemoteTaskEvent,
      this.refreshTasks
    );

    if (typeof unsubscribe === "function") {
      this.unsubscribe = unsubscribe;
    } else {
      // The active strategy doesn't support push updates (e.g. mock or
      // Graph); fall back to periodic polling so other clients' changes
      // still show up eventually.
      this.pollTimer = setInterval(
        this.refreshTasks,
        FALLBACK_POLL_INTERVAL_MS
      );
    }
  };

  stopLiveUpdates = () => {
    if (typeof this.unsubscribe === "function") {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  };

  // Applies a single task change pushed from the server (created by any
  // client, including this one) without needing to refetch the whole list.
  handleRemoteTaskEvent = ({ type, task } = {}) => {
    if (
      this.pendingMutations > 0 ||
      this.isDragging ||
      this.state.loading ||
      !task
    ) {
      return;
    }

    this.setState((prevState) => {
      const withoutTask = prevState.tasks.filter(
        (item) => item._id !== task._id
      );

      if (type === "deleted") {
        return { tasks: withoutTask };
      }

      const existing = prevState.tasks.find((item) => item._id === task._id);
      const nextTask = existing
        ? { ...task, conversationOpen: existing.conversationOpen }
        : task;

      return {
        tasks: [...withoutTask, nextTask].sort((a, b) => a.order - b.order),
      };
    });
  };

  // Refetches the full task list and merges it in, preserving local-only
  // state (like an open Teams conversation indicator) and skipping if a
  // mutation is still in flight. Used to resync after the push subscription
  // (re)connects, and as the fallback poll for strategies without push
  // support.
  refreshTasks = () => {
    if (this.pendingMutations > 0 || this.isDragging || this.state.loading) {
      return;
    }

    const threadId = this.props.isGroup ? this.state.threadId : undefined;
    const fetchTaskPromise = threadId
      ? tasksService.get(threadId)
      : tasksService.get();

    fetchTaskPromise
      .then((tasks) => {
        if (this.pendingMutations > 0 || this.isDragging) {
          return;
        }

        this.setState((prevState) => {
          const localById = new Map(
            prevState.tasks.map((task) => [task._id, task])
          );
          const merged = tasks
            .map((task) => {
              const local = localById.get(task._id);
              return local
                ? { ...task, conversationOpen: local.conversationOpen }
                : task;
            })
            .sort((a, b) => a.order - b.order);

          return { tasks: merged };
        });
      })
      .catch(() => {
        // Ignore transient failures; the next resync/poll will retry.
      });
  };

  // Wraps a mutation promise so background refreshes can't clobber it.
  withMutationGuard(promise) {
    this.pendingMutations += 1;
    return promise.finally(() => {
      this.pendingMutations -= 1;
    });
  }

  selectTask = (task) => {
    this.setState({
      taskId: task._id,
    });
  };

  onCloseTask = (taskComplete) => {
    if (taskComplete) {
      this.setState({
        tasks: this.state.tasks.filter(
          (item) => item._id !== this.state.taskId
        ),
        taskId: undefined,
        shareTag: undefined,
      });
    } else {
      this.setState({
        taskId: undefined,
        shareTag: undefined,
      });
    }
  };

  handleTextChanged = (event, value) => {
    this.setState({ newTask: { title: value } });
  };

  handleKeyDown = (event) => {
    if (event.key === "Enter") {
      const tasks = this.state.tasks;
      const threadId = this.props.isGroup ? this.state.threadId : undefined;
      this.withMutationGuard(
        tasksService.create(
          {
            ...this.state.newTask,
            order: tasks.length > 0 ? tasks[0].order + 100 : 100,
          },
          threadId
        )
      ).then((task) => {
        this.setState((prevState) => {
          return {
            newTask: { title: "" },
            tasks: [task, ...prevState.tasks],
          };
        });
      });
    }
  };

  // Reorders the list locally while the user is dragging, purely as a
  // visual preview. The new order isn't persisted (and other clients don't
  // hear about it) until the drag ends, in handleDropTask.
  handleMoveTask = (dragIndex, hoverIndex) => {
    this.setState((prevState) => ({
      tasks: reorder(prevState.tasks, dragIndex, hoverIndex),
    }));
  };

  // Called once, when a drag-and-drop reorder is dropped at a new position.
  // Computes the final order value from the task's neighbors and persists
  // just that one update, instead of one per hover event.
  handleDropTask = (taskId) => {
    const tasks = this.state.tasks;
    const index = tasks.findIndex((item) => item._id === taskId);

    if (index === -1 || tasks.length <= 1) {
      return;
    }

    let order;
    if (index === 0) {
      order = tasks[1].order / 2;
    } else if (index === tasks.length - 1) {
      order = tasks[tasks.length - 2].order + 100;
    } else {
      order = (tasks[index - 1].order + tasks[index + 1].order) / 2;
    }

    const task = { ...tasks[index], order };

    this.saveUpdate(task, true).then(() => {
      this.setState((prevState) => ({
        tasks: prevState.tasks.map((item) =>
          item._id === task._id ? task : item
        ),
      }));
    });
  };

  // Tracks whether a drag-and-drop reorder is currently in progress, so
  // remote updates can be held off until it's done.
  handleDragStateChange = (isDragging) => {
    this.isDragging = isDragging;
  };

  handleOpenConversation = (task) => {
    if (this.props.inTeams) {
      microsoftTeams.conversations.openConversation({
        conversationId: task.conversationId,
        subEntityId: task._id,
        title: task.title,
        onStartConversation: (conversation) => {
          if (task._id === conversation.subEntityId) {
            this.saveUpdate({
              ...task,
              conversationId: conversation.conversationId,
            }).then((updatedTask) => {
              this.setState((prevState) => {
                return {
                  tasks: prevState.tasks
                    .map((t) => (t._id === updatedTask._id ? updatedTask : t))
                    .sort((a, b) => a.order - b.order),
                };
              });
            });
          }
        },
        onCloseConversation: () => {
          this.setState({
            tasks: this.state.tasks.map((t) => ({
              ...t,
              conversationOpen: false,
            })),
          });
        },
      });

      this.setState({
        tasks: this.state.tasks.map((t) => ({
          ...t,
          conversationOpen: t._id === task._id,
        })),
      });
    }
  };

  handleCloseConversation = () => {
    if (this.props.inTeams) {
      microsoftTeams.conversations.closeConversation();

      this.setState({
        tasks: this.state.tasks.map((t) => ({ ...t, conversationOpen: false })),
      });
    }
  };

  onTaskComplete(task) {
    return this.withMutationGuard(tasksService.destroy(task._id)).then(() => {
      this.setState({
        tasks: this.state.tasks.filter((item) => item._id !== task._id),
        taskId: undefined,
        shareTag: undefined,
      });
    });
  }

  onStarredChange(task, isStarred) {
    return this.saveUpdate({ ...task, starred: isStarred });
  }

  saveUpdate(task, skipStateUpdate) {
    const threadId = this.props.isGroup ? this.state.threadId : undefined;
    const index = this.state.tasks.findIndex((item) => item._id === task._id);
    const updatedList = [...this.state.tasks];
    updatedList[index] = task;
    return this.withMutationGuard(tasksService.update(task, threadId)).then(
      () => {
        if (!skipStateUpdate) {
          this.setState({
            taskId: undefined,
            shareTag: undefined,
            tasks: updatedList,
          });
        }
      }
    );
  }

  renderTaskList = () => {
    return (
      <div>
        <div className="App-header">
          <h1 className="App-header-title">
            {this.props.isGroup ? "Our Tasks" : "My Tasks"}
          </h1>
          <ConsentConsumer>
            {({ setConsentRequired }) => (
              <UserTile
                history={this.props.history}
                setConsentRequired={setConsentRequired}
              />
            )}
          </ConsentConsumer>
        </div>
        <div className="Tasks">
          <div className="Tasks-add">
            <div>
              <Icon className="Tasks-add-icon" iconName="Add" />
            </div>
            <TextField
              className="Tasks-add-textfield"
              placeholder="New Task"
              value={this.state.newTask.title}
              onChange={this.handleTextChanged}
              onKeyDown={this.handleKeyDown}
            />
          </div>
          {this.state.loading ? (
            <Spinner label="Loading tasks..." />
          ) : (
            <ul className="Tasks-list">
              {this.state.tasks.map((task, index) => (
                <Task
                  key={task._id}
                  index={index}
                  task={task}
                  inTeams={this.props.inTeams}
                  conversationOpen={this.state.conversationOpen}
                  onMoveTask={(dragIndex, hoverIndex) =>
                    this.handleMoveTask(dragIndex, hoverIndex)
                  }
                  onDropTask={(taskId) => this.handleDropTask(taskId)}
                  onDragStateChange={(isDragging) =>
                    this.handleDragStateChange(isDragging)
                  }
                  selectTask={(task) => this.selectTask(task)}
                  onStarredChange={(task, isStarred) =>
                    this.onStarredChange(task, isStarred)
                  }
                  onCheckedChange={(task) => this.onTaskComplete(task)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  render() {
    const { taskId, shareTag } = this.state;

    return (
      <div className="App-content">
        {taskId ? (
          <TaskPane
            history={this.props.history}
            isGroupRoute={this.props.isGroup}
            key={taskId}
            taskId={taskId}
            shareTag={shareTag}
            taskList={this.state.tasks}
            isListLoading={this.state.loading}
            inTeams={this.props.inTeams}
            supportsConversation={true}
            conversationOpen={this.state.conversationOpen}
            openConversation={(task) => this.handleOpenConversation(task)}
            closeConversation={() => this.handleCloseConversation()}
            onCloseTask={(complete) => this.onCloseTask(complete)}
            saveEditToListItem={(task) => this.saveUpdate(task)}
          />
        ) : (
          this.renderTaskList()
        )}
      </div>
    );
  }
}

export default Tasks;
