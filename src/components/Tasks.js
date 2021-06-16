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

    tasksService.get().then((tasks) => {
      this.setState({
        tasks: tasks.sort((a, b) => a.order - b.order),
        loading: false,
      });
    });

    if (this.state.inTeams) {
      microsoftTeams.initialize();
      microsoftTeams.getContext((context) => {
        this.setState({
          threadId: context.teamId || context.chatId,
        });

        tasksService.get(this.state.threadId).then((tasks) => {
          this.setState({
            tasks: tasks.sort((a, b) => a.order - b.order),
            loading: false,
            taskId: context.subEntityId || this.state.taskId
          });
        });
      });
    }
  }

  getActiveTask = (taskId, tasks) => {
    if (taskId) {
      return tasks.find(t => t._id === taskId);
    }
  };

  selectTask = (task) => {
    this.setState({
      taskId: task._id
    });
  };

  handleCloseTask = () => {
    this.setState({
      taskId: undefined
    });
  };

  share = (task) => {
    if (this.state.inTeams) {
      const href = `https://taskmeow.ngrok.io?task=${task._id}`;
      microsoftTeams.shareInTeams(href);
    }
  }

  shareKnownSite = () => {
    const href = 'https://www.dogonews.com/2019/6/12/gold-encrusted-fungi-discovered-in-australia';
    microsoftTeams.shareInTeams(href);
  }

  handleTaskCheckedChange = (task, isChecked) => {
    if (isChecked) {
      tasksService.destroy(task._id).then(() => {
        this.setState((prevState) => {
          return {
            tasks: prevState.tasks.filter((item) => item._id !== task._id),
          };
        });
      });
    }
  };

  handleTaskStarredChange = (task, isStarred) => {
    let newOrder = task.order;
    if (isStarred && this.state.tasks.length > 0) {
      newOrder = this.state.tasks[0].order - 100;
    }
    tasksService
      .update({ ...task, order: newOrder, starred: isStarred })
      .then((updatedTask) => {
        this.setState((prevState) => {
          return {
            tasks: prevState.tasks
              .map((t) => (t._id === updatedTask._id ? updatedTask : t))
              .sort((a, b) => a.order - b.order),
          };
        });
      });
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

      tasksService.update(task);

      this.setState({
        tasks,
      });
    }
  };

  requestDevicePermission = (deviceType, callback) => {
    microsoftTeams.checkDevicePermission(deviceType, callback);
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
                onCheckedChange={this.handleTaskCheckedChange}
                onStarredChange={this.handleTaskStarredChange}
                onMoveTask={this.handleMoveTask}
                selectTask={this.selectTask}
              />
            ))}
          </ul>
        )}
      </div>
    )
  }

  render() {
    const activeTask = this.state.taskId && this.getActiveTask(this.state.taskId, this.state.tasks);
    return (
      <div className="App-content">
        <div className="App-header">
          <h1 className="App-header-title">{activeTask ? activeTask.title : 'Tasks'}</h1>
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
            isOpen={activeTask}
            close={this.handleCloseTask}
            key={activeTask._id}
            task={activeTask}
            inTeams={this.state.inTeams}
            supportsConversation={true}
            conversationOpen={this.state.conversationOpen}
            onCheckedChange={this.handleTaskCheckedChange}
            onStarredChange={this.handleTaskStarredChange}
            openConversation={this.handleOpenConversation}
            closeConversation={this.handleCloseConversation}
            onDevicePermissionRequest={this.requestDevicePermission}
            share={this.share}
          />
        ) : this.renderTaskList()
        }
      </div>
    );
  }
}



export default Tasks;
