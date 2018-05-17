import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";
import "./App.css";
import logo from "./logo.svg";
import Tasks from "./components/Tasks";
import UserTile from "./components/UserTile";
import authService from "./services/auth.service";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
initializeIcons();

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };
  }

  componentDidMount() {
    Promise.all([authService.getUser(), authService.getToken()])
      .then(([user, token]) => {
        if (user && token) {
          this.setState({ user, loading: false });
        }
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  }

  logout = () => {
    authService.logout().then(() => {
      this.setState({ user: null });
    });
  };

  login = () => {
    this.setState({ loading: true });
    authService
      .login()
      .then(user => {
        if (user) {
          this.setState({ user, loading: false });
        } else {
          this.setState({ loading: false });
        }
      })
      .catch(err => {
        console.error(err);
        this.setState({ loading: false });
      });
  };

  render() {
    if (!authService.isCallback()) {
      return (
        <div>
          {this.state.user ? (
            <div>
              <UserTile user={this.state.user} onLogout={this.logout} />
              <h1>Tasks</h1>
              <Tasks testing={this.state.testing} />
            </div>
          ) : (
            <div className="App-login">
              <div className="App-login-image-container">
                <img
                  className="App-login-image"
                  alt="Taskmeow logo"
                  src={logo}
                />
              </div>
              <div className="App-login-button-container">
                <DefaultButton
                  text="Login"
                  primary="true"
                  onClick={this.login}
                />
              </div>
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
