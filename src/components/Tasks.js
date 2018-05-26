import React, { Component } from "react";
import { Icon, Spinner, TextField } from "office-ui-fabric-react";
import { Droppable, DragDropContext } from "react-beautiful-dnd";
import Task from "./Task";
import tasksService from "../services/tasks.service";

// A little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

class Tasks extends Component {
  state = {
    newTask: { title: "" },
    tasks: []
  };

  componentDidMount() {
    this.setState({ loading: true });
    tasksService.get().then(tasks => {
      this.setState({
        tasks: tasks.sort((a, b) => a.order - b.order),
        loading: false
      });
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

  onDragEnd = result => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const tasks = reorder(
      this.state.tasks,
      result.source.index,
      result.destination.index
    );

    if (tasks.length > 1) {
      const index = result.destination.index;
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
        tasks
      });
    }
  };

  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <div className="Tasks">
          {this.state.loading ? (
            <Spinner label="Loading tasks..." />
          ) : (
            <Droppable droppableId="tasksDroppable" type="TASK">
              {(provided, snapshot) => (
                <ul
                  className="Tasks-list"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {this.state.tasks.map((task, index) => (
                    <Task
                      key={task._id}
                      index={index}
                      task={task}
                      onCheckedChange={this.handleTaskCheckedChange}
                      onStarredChange={this.handleTaskStarredChange}
                    />
                  ))}
                </ul>
              )}
            </Droppable>
          )}
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
      </DragDropContext>
    );
  }
}

export default Tasks;
