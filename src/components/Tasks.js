import React, { Component } from "react";
import { TextField } from "office-ui-fabric-react";
import Task from "./Task";
import tasksApi from "../tasksApi";
import { Icon } from "office-ui-fabric-react/lib/Icon";

class Tasks extends Component {
  state = {
    newTask: { title: "" },
    tasks: []
  };

  componentDidMount() {
    tasksApi.get().then(tasks => {
      this.setState({ tasks });
    });
  }

  handleTaskChange = (task, isChecked) => {
    if (isChecked) {
      tasksApi.destroy(task._id).then(() => {
        this.setState(prevState => {
          return {
            tasks: prevState.tasks.filter(item => item._id !== task._id)
          };
        });
      });
    }
  };

  handleTextChanged = value => {
    this.setState({ newTask: { title: value } });
  };

  handleKeyDown = event => {
    if (event.key === "Enter") {
      tasksApi.create(this.state.newTask).then(task => {
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
            <li key={task._id} className="Tasks-listitem">
              <Task task={task} onChange={this.handleTaskChange} />
            </li>
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
