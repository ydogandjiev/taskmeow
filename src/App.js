import React, { Component } from "react";
import { DefaultButton } from "office-ui-fabric-react";
import "./App.css";
import logo from "./logo.svg";
import background from "./background.svg";
import microsoftLogo from "./microsoft.png";
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
      .catch(err => {
        this.setState({ loading: false });
      });
  }

  logout = () => {
    authService.logout();
    this.setState({ user: null });
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
        <div className="App" style={{ backgroundImage: `url(${background})` }}>
          {this.state.user ? (
            <div className="App-content">
              <div className="App-header">
                <h1 className="App-header-title">Tasks</h1>
                <UserTile user={this.state.user} onLogout={this.logout} />
              </div>
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
                  className="App-login-button"
                  primary="true"
                  onClick={this.login}
                >
                  <img
                    className="App-login-button-image"
                    alt="Microsoft logo"
                    src={microsoftLogo}
                  />
                  <span className="ms-Button-label label-42">Sign in</span>
                </DefaultButton>
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
