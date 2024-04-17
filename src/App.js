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
import {
  UNLOAD_TIME_STORAGE_KEY,
  UNLOAD_TEST_MODE_STORAGE_KEY,
} from "./services/constants";
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
  isCachedPage;
  cacheUrl = `${window.location.href}&isCached=true`;

  constructor(props) {
    super(props);

    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);
    console.log(`>>>>> TaskMeow on page ${window.location.href}`);
    this.isCachedPage = !!params.get("isCached");
    console.log(`>>>>> TaskMeow isCached set to ${this.isCachedPage}.`);

    this.state = {
      loading: true,
      inTeams:
        !!params.get("inTeams") ||
        !!params.get("inTeamsSSO") ||
        !!params.get("inTeamsMSAL"),
      taskId: params.get("task"),
      shareTag: params.get("shareTag"),
      tabName: "",
      unloadDebugMode: "normal",
    };
  }

  async componentDidMount() {
    console.log(`>>>>> TaskMeow executing componentDidMount.`);

    // Initialize the Teams SDK
    await microsoftTeams.app.initialize();
    console.log(`>>>>> TaskMeow SDK initialized.`);
    microsoftTeams.teamsCore.registerOnLoadHandler(this.loadHandler);
    microsoftTeams.teamsCore.registerBeforeUnloadHandler(this.unloadHandler);

    // This is an experiment for the case when an app performs a reload at unload time
    const unloadTestMode = localStorage.getItem(UNLOAD_TEST_MODE_STORAGE_KEY);
    if (unloadTestMode === "reloadApp" && this.isCachedPage) {
      console.log(`>>>>> TaskMeow calling readyToUnload.`);
      microsoftTeams.sendCustomMessage("readyToUnload");
    }

    await authService.tryInitializeMSAL();

    authService
      .isCallback()
      .then((isCallback) => {
        if (!isCallback) {
          authService
            .getUser()
            .then((user) => {
              // Signed in the user automatically; we're ready to go
              console.log(`>>>>> TaskMeow authenticated.`);
              this.setState({
                user: user,
                loading: false,
              });
              this.initializePage();
            })
            .catch(() => {
              // Failed to sign in the user automatically; show login screen
              this.setState({
                loading: false,
              });
              microsoftTeams.app.notifyFailure();
            });
        }
      })
      .catch((error) => {
        // Encountered error during redirect login flow; show error screen
        this.setState({
          error: error,
          loading: false,
        });
        microsoftTeams.app.notifyFailure();
      });
  }

  login = () => {
    this.setState({ loading: true });
    authService
      .login()
      .then((user) => {
        if (user) {
          this.setState({ user, loading: false });
          this.initializePage();
        } else {
          this.setState({ loading: false });
          microsoftTeams.app.notifyFailure();
        }
      })
      .catch((err) => {
        console.error(err);
        this.setState({ loading: false });
        microsoftTeams.app.notifyFailure();
      });
  };

  initializePage = () => {
    if (!this.isCachedPage) {
      microsoftTeams.pages.getConfig().then((config) => {
        console.log(
          `>>>>> TaskMeow page initialized for ${config?.suggestedDisplayName}`
        );
        if (config?.suggestedDisplayName) {
          this.setState({ tabName: config?.suggestedDisplayName });
        }
        console.log(
          `>>>>> TaskMeow notified success for ${config?.suggestedDisplayName}.`
        );
        microsoftTeams.app.notifySuccess();
      });
    }
  };

  loadHandler = (data) => {
    console.log(`>>>>> TaskMeow loading from cache. ${JSON.stringify(data)}`);
    window.location.replace(data.contentUrl);
  };

  unloadHandler = (readyToUnload) => {
    const unloadTestMode = localStorage.getItem(UNLOAD_TEST_MODE_STORAGE_KEY);

    if (unloadTestMode === "slowUnload") {
      const unloadTime = localStorage.getItem(UNLOAD_TIME_STORAGE_KEY);
      setTimeout(() => {
        console.log(`>>>>> TaskMeow unloaded after ${unloadTime} ms`);
        readyToUnload();
      }, unloadTime);
    } else if (unloadTestMode === "reloadApp") {
      setTimeout(() => {
        console.log(
          `>>>>> TaskMeow unloading with a reload location set to ${this.cacheUrl}...`
        );
        window.location.replace(this.cacheUrl);
      }, 1);
    } else {
      console.log(`>>>>> TaskMeow unloaded`);
      readyToUnload();
    }

    return true;
  };

  render() {
    const { inTeams, taskId, shareTag, user, tabName, loading, error } =
      this.state;
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
                      tabName={tabName}
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
                      tabName={tabName}
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
