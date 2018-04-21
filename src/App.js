import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";
import "./App.css";
import Tasks from "./components/Tasks";
import UserTile from "./components/UserTile";
import authService from "./services/auth.service";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
initializeIcons();

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  logout = () => {
    authService.logout().then(() => {
      this.setState({ user: null });
    });
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
    if (!authService.isCallback()) {
      return (
        <div>
          {this.state.user ? (
            <div>
              <UserTile user={this.state.user} />
              <h1>Tasks</h1>
              <Tasks testing={this.state.testing} />
              <DefaultButton text="Logout" onClick={this.logout} />
            </div>
          ) : (
            <div>
              <DefaultButton text="Login" onClick={this.login} />
            </div>
          )}
        </div>
      );
    } else {
      return <div>Signing in...</div>;
    }
  }
}

export default App;
