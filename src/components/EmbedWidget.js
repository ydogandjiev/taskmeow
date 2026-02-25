import React, { Component } from "react";
import "./EmbedWidget.css";

class EmbedWidget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: [],
      loading: true,
      error: null,
      newTaskTitle: "",
    };
  }

  componentDidMount() {
    this.fetchTasks();
  }

  fetchTasks = async () => {
    try {
      // Simple direct fetch from the REST API (existing endpoint)
      const response = await fetch(`/api/tasks`, {
        headers: {
          // Use a simple header for widget authentication
          "X-Widget-Token": this.props.token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const tasks = await response.json();
      this.setState({
        tasks: tasks.sort((a, b) => b.order - a.order),
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      this.setState({
        error: error.message,
        loading: false,
      });
    }
  };

  handleCreateTask = async (e) => {
    e.preventDefault();
    const { newTaskTitle, tasks } = this.state;

    if (!newTaskTitle.trim()) {
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Widget-Token": this.props.token,
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const task = await response.json();
      this.setState({
        tasks: [
          {
            id: task._id,
            title: task.title,
            starred: task.starred,
            order: task.order,
            date: task.date,
          },
          ...tasks,
        ],
        newTaskTitle: "",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    }
  };

  handleToggleStar = async (task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Widget-Token": this.props.token,
        },
        body: JSON.stringify({
          starred: !task.starred,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();
      this.setState({
        tasks: this.state.tasks.map((t) =>
          t.id === task.id
            ? {
                id: updatedTask._id,
                title: updatedTask.title,
                starred: updatedTask.starred,
                order: updatedTask.order,
                date: updatedTask.date,
              }
            : t
        ),
      });
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task");
    }
  };

  handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          "X-Widget-Token": this.props.token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      this.setState({
        tasks: this.state.tasks.filter((t) => t.id !== taskId),
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task");
    }
  };

  render() {
    const { tasks, loading, error, newTaskTitle } = this.state;

    if (loading) {
      return (
        <div className="embed-widget">
          <div className="loading">Loading tasks...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="embed-widget">
          <div className="error">Error: {error}</div>
        </div>
      );
    }

    return (
      <div className="embed-widget">
        <div className="header">
          <h1>🐱 TaskMeow</h1>
        </div>

        <form className="new-task-form" onSubmit={this.handleCreateTask}>
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => this.setState({ newTaskTitle: e.target.value })}
            className="new-task-input"
          />
          <button type="submit" className="add-button">
            +
          </button>
        </form>

        <div className="tasks-list">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks yet! Add one above to get started.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="task-item">
                <button
                  className={`star-button ${task.starred ? "starred" : ""}`}
                  onClick={() => this.handleToggleStar(task)}
                  title={task.starred ? "Unstar" : "Star"}
                >
                  {task.starred ? "⭐" : "☆"}
                </button>
                <div className="task-content">
                  <span className="task-title">{task.title}</span>
                </div>
                <button
                  className="delete-button"
                  onClick={() => this.handleDeleteTask(task.id)}
                  title="Delete task"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
}

export default EmbedWidget;
