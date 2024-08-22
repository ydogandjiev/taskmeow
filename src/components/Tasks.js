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
  }

  componentDidMount() {
    this.setState({ loading: true });

    if (this.props.inTeams) {
      microsoftTeams.app.getContext().then((context) => {
        console.log(`>>>>> TaskMeow app contexxt = ${JSON.stringify(context)}`);
        const threadId = context.teamId || context.chatId;
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
          })
          .catch(() => {
            this.setState({
              threadId,
              loading: false,
              tasks: [],
            });
          });
      });
    } else {
      tasksService.get().then((tasks) => {
        this.setState({
          tasks: tasks.sort((a, b) => a.order - b.order),
          loading: false,
          taskId: this.state.taskId,
        });
      });
    }
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
    return tasksService.destroy(task._id).then(() => {
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
    return tasksService.update(task, threadId).then(() => {
      if (!skipStateUpdate) {
        this.setState({
          taskId: undefined,
          shareTag: undefined,
          tasks: updatedList,
        });
      }
    });
  }

  renderTaskList = () => {
    return (
      <div>
        <div className="App-header">
          <h1 className="App-header-title">
            {this.props.isGroup ? this.props.tabName : "My Tasks"}
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
