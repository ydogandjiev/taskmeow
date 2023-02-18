import React, { Component } from "react";
import { Icon, IconButton, Spinner, TextField } from "office-ui-fabric-react";
import Task from "./Task";
import TaskPane from "./TaskPane";
import UserTile from "./UserTile";
import tasksService from "../services/tasks.service";
import * as microsoftTeams from "@microsoft/teams-js";
import { ConsentConsumer } from "./ConsentContext";
import { baseUrl } from "./utils";

// A little function to help us with reordering the result
const reorder = (list, dragIndex, hoverIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(dragIndex, 1);
  result.splice(hoverIndex, 0, removed);
  return result;
};

class Tasks extends Component {
  constructor(props) {
    super(props);

    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);

    this.state = {
      conversationOpen: false,
      newTask: { title: "" },
      tasks: [],
      inTeams: !!params.get("inTeams") || !!params.get("inTeamsSSO"),
      taskId: params.get("task"),
    };
  }

  componentDidMount() {
    this.setState({ loading: true });

    if (this.state.inTeams) {
      microsoftTeams.initialize();
      microsoftTeams.getContext((context) => {
        const threadId = context.teamId || context.chatId;
        const fetchTaskPromise = this.props.isGroup
          ? tasksService.get(threadId)
          : tasksService.get();
        fetchTaskPromise.then((tasks) => {
          this.setState({
            threadId,
            tasks: tasks.sort((a, b) => a.order - b.order),
            loading: false,
            taskId: context.subEntityId || this.state.taskId,
          });
        });
      });
    } else {
      tasksService.get().then((tasks) => {
        this.setState({
          tasks: tasks.sort((a, b) => a.order - b.order),
          loading: false,
        });
      });
    }
  }

  getActiveTask = (taskId, tasks) => {
    if (taskId) {
      return tasks.find((t) => t._id === taskId);
    }
  };

  selectTask = (task) => {
    this.setState({
      taskId: task._id,
    });
  };

  handleCloseTask = () => {
    this.setState({
      taskId: undefined,
    });
  };

  share = (task) => {
    if (this.state.inTeams && this.props.isGroup) {
      const url = `${baseUrl}/group?task=${task._id}`;
      microsoftTeams.sharing.shareWebContent(
        {
          content: [
            {
              type: "URL",
              url,
              preview: true,
            },
          ],
        },
        (err) => {
          if (err) {
            console.error(err.message);
          }
        }
      );
    }
  };

  handleTextChanged = (event, value) => {
    this.setState({ newTask: { title: value } });
  };

  handleKeyDown = (event) => {
    if (event.key === "Enter") {
      const tasks = this.state.tasks;
      tasksService
        .create({
          ...this.state.newTask,
          order: tasks.length > 0 ? tasks[0].order + 100 : 100,
        })
        .then((task) => {
          this.setState((prevState) => {
            return {
              newTask: { title: "" },
              tasks: [task, ...prevState.tasks],
            };
          });
        });
    }
  };

  handleMoveTask = (dragIndex, hoverIndex) => {
    const tasks = reorder(this.state.tasks, dragIndex, hoverIndex);

    if (tasks.length > 1) {
      const index = hoverIndex;
      const task = tasks[index];
      if (index === 0) {
        task.order = tasks[1].order / 2;
      } else if (index === tasks.length - 1) {
        task.order = tasks[tasks.length - 2].order + 100;
      } else {
        task.order = (tasks[index - 1].order + tasks[index + 1].order) / 2;
      }

      this.saveUpdate(task, true).then(() => {
        this.setState({
          tasks,
        });
      });
    }
  };

  handleOpenConversation = (task) => {
    if (this.state.inTeams) {
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
    if (this.state.inTeams) {
      microsoftTeams.conversations.closeConversation();

      this.setState({
        tasks: this.state.tasks.map((t) => ({ ...t, conversationOpen: false })),
      });
    }
  };

  async onTaskComplete(task) {
    return tasksService.destroy(task._id).then(() => {
      this.setState({
        tasks: this.state.tasks.filter((item) => item._id !== task._id),
        taskId: undefined,
      });
    });
  }

  async onStarredChange(task, isStarred) {
    return this.saveUpdate({ ...task, starred: isStarred });
  }

  async saveUpdate(task, skipStateUpdate) {
    const threadId = this.props.isGroup ? this.state.threadId : undefined;
    const index = this.state.tasks.findIndex((item) => item._id === task._id);
    const updatedList = [...this.state.tasks];
    updatedList[index] = task;
    return tasksService.update(task, threadId).then(() => {
      if (!skipStateUpdate) {
        this.setState({
          taskId: undefined,
          tasks: updatedList,
        });
      }
    });
  }

  renderTaskList = () => {
    return (
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
                inTeams={this.state.inTeams}
                conversationOpen={this.state.conversationOpen}
                onMoveTask={(dragIndex, hoverIndex) =>
                  this.handleMoveTask(dragIndex, hoverIndex)
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
    );
  };

  render() {
    const activeTask =
      this.state.taskId &&
      this.getActiveTask(this.state.taskId, this.state.tasks);
    return (
      <div className="App-content">
        <div className="App-header">
          <h1 className="App-header-title">
            {activeTask ? (
              <span>
                <IconButton
                  onClick={() => this.handleCloseTask()}
                  title="Back to list"
                  iconProps={{
                    iconName: "DoubleChevronLeft8",
                  }}
                />{" "}
                Task
              </span>
            ) : (
              "Tasks"
            )}
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

        {activeTask ? (
          <TaskPane
            isGroupTask={this.props.isGroup}
            key={activeTask._id}
            task={activeTask}
            inTeams={this.state.inTeams}
            supportsConversation={true}
            conversationOpen={this.state.conversationOpen}
            openConversation={(task) => this.handleOpenConversation(task)}
            closeConversation={() => this.handleCloseConversation()}
            share={(task) => this.share(task)}
            saveEdit={(task) => this.saveUpdate(task)}
            onSaveTaskComplete={(task) => this.onTaskComplete(task)}
          />
        ) : (
          this.renderTaskList()
        )}
      </div>
    );
  }
}

export default Tasks;
