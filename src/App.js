import React, { Component } from "react";
import "./App.css";
import Tasks from "./components/Tasks";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
initializeIcons();

class App extends Component {
  render() {
    return (
      <div className="ms-Grid">
        <h1 className="ms-Grid-row">Tasks</h1>
        <Tasks />
      </div>
    );
  }
}

export default App;
