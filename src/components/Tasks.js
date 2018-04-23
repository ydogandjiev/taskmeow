import React, { Component } from "react";
import { Icon, TextField } from "office-ui-fabric-react";
import Task from "./Task";
import tasksService from "../services/tasks.service";

class Tasks extends Component {
  state = {
    newTask: { title: "" },
    tasks: []
  };

  componentDidMount() {
    tasksService.get().then(tasks => {
      this.setState({ tasks });
    });
  }

  handleTaskCheckedChange = (task, isChecked) => {
    if (isChecked) {
      tasksService.destroy(task._id).then(() => {
        this.setState(prevState => {
          return {
            tasks: prevState.tasks.filter(item => item._id !== task._id)
          };
        });
      });
    }
  };

  handleTaskStarredChange = (task, isStarred) => {
    tasksService.update({ ...task, starred: isStarred }).then(updatedTask => {
      this.setState(prevState => {
        return {
          tasks: prevState.tasks.map(
            t => (t._id === updatedTask._id ? updatedTask : t)
          )
        };
      });
    });
  };

  handleTextChanged = value => {
    this.setState({ newTask: { title: value } });
  };

  handleKeyDown = event => {
    if (event.key === "Enter") {
      tasksService.create(this.state.newTask).then(task => {
        this.setState(prevState => {
          return {
            newTask: { title: "" },
            tasks: [...prevState.tasks, task]
          };
        });
      });
    }
  };

  render() {
    return (
      <div className="Tasks">
        <ul className="Tasks-list">
          {this.state.tasks.map(task => (
            <Task
              key={task._id}
              task={task}
              onCheckedChange={this.handleTaskCheckedChange}
              onStarredChange={this.handleTaskStarredChange}
            />
          ))}
        </ul>
        <div className="Tasks-add">
          <div>
            <Icon className="Tasks-add-icon" iconName="Add" />
          </div>
          <TextField
            className="Tasks-add-textfield"
            placeholder="New Task"
            value={this.state.newTask.title}
            onChanged={this.handleTextChanged}
            onKeyDown={this.handleKeyDown}
          />
        </div>
      </div>
    );
  }
}

export default Tasks;
