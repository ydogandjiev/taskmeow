import React, { Component } from "react";
import { Routes, Route } from "react-router-dom";
import {
  DefaultButton,
  Spinner,
  MessageBar,
  MessageBarButton,
  MessageBarType,
} from "office-ui-fabric-react";
import * as microsoftTeams from "@microsoft/teams-js";
import Profile from "./components/Profile";
import Tasks from "./components/Tasks";
import Config from "./components/Config";
import Remove from "./components/Remove";
import Debug from "./components/Debug";
import authService from "./services/auth.service";
import microsoftLogo from "./microsoft.png";
import background from "./background.png";
import logo from "./logo.svg";
import "./App.css";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "@uifabric/icons";
import { ConsentConsumer } from "./components/ConsentContext";
initializeIcons();

class App extends Component {
  constructor(props) {
    super(props);

    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);

    this.state = {
      loading: true,
      inTeams: !!params.get("inTeams") || !!params.get("inTeamsSSO") || !!params.get("inTeamsMSAL"),
      taskId: params.get("task"),
      shareTag: params.get("shareTag"),
    };
  }

  async componentDidMount() {
    await authService.tryInitializeMSAL();

    authService
      .isCallback()
      .then((isCallback) => {
        if (!isCallback) {
          authService
            .getUser()
            .then((user) => {
              // Signed in the user automatically; we're ready to go
              this.setState({
                user: user,
                loading: false,
              });
            })
            .catch(() => {
              // Failed to sign in the user automatically; show login screen
              this.setState({
                loading: false,
              });
            });
        }
      })
      .catch((error) => {
        // Encountered error during redirect login flow; show error screen
        this.setState({
          error: error,
          loading: false,
        });
      });

    if (this.state.inTeams) {
      microsoftTeams.app.initialize().then(() => {
        authService.tryInitializeMSALNAA();
      });
    }
  }

  login = () => {
    this.setState({ loading: true });
    authService
      .login()
      .then((user) => {
        if (user) {
          this.setState({ user, loading: false });
        } else {
          this.setState({ loading: false });
        }
      })
      .catch((err) => {
        console.error(err);
        this.setState({ loading: false });
      });
  };

  render() {
    const { inTeams, taskId, shareTag, user, loading, error } = this.state;
    return (
      <div className="App" style={{ backgroundImage: `url(${background})` }}>
        {inTeams && <Debug />}
        {!loading && !error ? (
          <div>
            <ConsentConsumer>
              {({ consentRequired, requestConsent }) =>
                consentRequired && (
                  <MessageBar
                    messageBarType={MessageBarType.warning}
                    isMultiline={false}
                    dismissButtonAriaLabel="Close"
                    actions={
                      <div>
                        <MessageBarButton onClick={requestConsent}>
                          Go
                        </MessageBarButton>
                      </div>
                    }
                  >
                    TaskMeow needs your consent in order to do its work.
                  </MessageBar>
                )
              }
            </ConsentConsumer>
            {user ? (
              <Routes>
                <Route
                  path="/group"
                  element={
                    <Tasks
                      isGroup={true}
                      inTeams={inTeams}
                      taskId={taskId}
                      shareTag={shareTag}
                    />
                  }
                />
                <Route path="/profile" element={<Profile />} />
                <Route path="/config" element={<Config />} />
                <Route path="/remove" element={<Remove />} />
                <Route
                  path="/"
                  element={
                    <Tasks
                      inTeams={inTeams}
                      taskId={taskId}
                      shareTag={shareTag}
                    />
                  }
                />
              </Routes>
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
                  {!this.state.inTeams && (
                    <a
                      className="App-slack-link"
                      href="https://slack.com/oauth/v2/authorize?scope=chat%3Awrite&client_id=1034113915760.1024551480609"
                    >
                      <img
                        className="App-slack-img"
                        alt="Add to Slack"
                        src="https://platform.slack-edge.com/img/add_to_slack.png"
                        srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                      />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {!this.state.error ? (
              <Spinner label="Loading..." />
            ) : (
              <div className="App-error">
                {JSON.stringify(this.state.error)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default App;
