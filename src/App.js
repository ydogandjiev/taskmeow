import React, { Component } from "react";
import { Switch, Route } from "react-router-dom";
import { DefaultButton, Spinner } from "office-ui-fabric-react";
import GroupTasks from "./components/GroupTasks";
import Profile from "./components/Profile";
import Tasks from "./components/Tasks";
import Config from "./components/Config";
import Remove from "./components/Remove";
import authService from "./services/auth.service";
import microsoftLogo from "./microsoft.png";
import background from "./background.png";
import logo from "./logo.svg";
import "./App.css";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "@uifabric/icons";
initializeIcons();

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };
  }

  componentDidMount() {
    authService
      .getToken()
      .then(token => {
        return authService.getUser().then(user => {
          this.setState({
            user: user,
            loading: false,
            error: null
          });
        });
      })
      .catch(error => {
        this.setState({
          user: null,
          loading: false,
          error: error
        });
      });
  }

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
    if (
      (!authService.useSSO() && !authService.isCallback()) ||
      (authService.useSSO() && this.state.user)
    ) {
      return (
        <div className="App" style={{ backgroundImage: `url(${background})` }}>
          {this.state.user ? (
            <Switch>
              <Route path="/group" component={GroupTasks} />
              <Route path="/profile" component={Profile} />
              <Route path="/config" component={Config} />
              <Route path="/remove" component={Remove} />
              <Route path="/" component={Tasks} />
            </Switch>
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
                  <span className="ms-Button-label label-46">Sign in</span>
                </DefaultButton>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="App" style={{ backgroundImage: `url(${background})` }}>
          {this.state.error ? (
            <div className="App-error">{JSON.stringify(this.state.error)}</div>
          ) : (
            <Spinner label="Signing in..." />
          )}
        </div>
      );
    }
  }
}

export default App;
