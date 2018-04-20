import React, { Component } from "react";
// import Persona from "office-ui-fabric-react";
import { DefaultButton } from "office-ui-fabric-react";
import "./App.css";
import Tasks from "./components/Tasks";
import authService from "./services/auth.service";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import UserTile from "./components/UserTile";
initializeIcons();

class App extends Component {
  constructor() {
    super();
    this.state = {
      persona: {}
    };
  }

  logout = () => {
    authService.logout();
  };

  login = () => {
    this.setState({ loginFailed: false });
    authService
      .login()
      .then(user => {
        if (user) {
          this.setState({ user });
        } else {
          this.setState({ loginFailed: true });
        }
      })
      .catch(err => {
        console.error(err);
        this.setState({ loginFailed: true });
      });
  };

  render() {
    return (
      <div>
        {this.state.user ? (
          <div>
            <UserTile user={this.state.user} />
            <h1>Tasks</h1>
            <Tasks />
            <DefaultButton text="Logout" onClick={this.logout} />
          </div>
        ) : (
          <DefaultButton text="Login" onClick={this.login} />
        )}
      </div>
    );
  }
}

export default App;
