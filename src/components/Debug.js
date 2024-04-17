import React, { Component } from "react";
import {
  DefaultButton,
  IconButton,
  TextField,
  Dropdown,
} from "office-ui-fabric-react";
import * as microsoftTeams from "@microsoft/teams-js";
import JsonViewer from "react-json-view";
import {
  UNLOAD_TEST_MODE_STORAGE_KEY,
  UNLOAD_TIME_STORAGE_KEY,
} from "../services/constants";

/**
 * This component is responsible for:
 * 1. Fetching and displaying the user's profile information
 */
class Debug extends Component {
  cacheTestOptions = [
    { key: "slowUnload", text: "Long Unload Time" },
    { key: "reloadApp", text: "Reload App When Unloading" },
    { key: "normal", text: "Normal Unload" },
  ];

  constructor(props) {
    super(props);

    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);
    const unloadDelaySetting = localStorage.getItem(UNLOAD_TIME_STORAGE_KEY);
    const unloadTestMode = localStorage.getItem(UNLOAD_TEST_MODE_STORAGE_KEY);

    this.state = {
      debug: false,
      context: {},
      inTeams: !!params.get("inTeams") || !!params.get("inTeamsSSO"),
      url,
      settings: {},
      settingsLoading: false,
      unloadTestMode,
      unloadDelay: unloadDelaySetting || 0,
    };
  }

  componentDidMount() {
    if (this.state.inTeams) {
      microsoftTeams.app.initialize();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.debug && !prevState.debug) {
      microsoftTeams.app.getContext().then((context) => {
        console.log(`context is ${JSON.stringify(context)}`);
        this.setState({ context });
      });
    }
  }

  getSettings() {
    this.setState({ settingsLoading: true });
    microsoftTeams.pages
      .getConfig()
      .then((settings) => {
        console.log(`settings is ${JSON.stringify(settings)}`);
        this.setState({ settings, settingsLoading: false });
      })
      .catch((error) => {
        this.setState({ settings: error, settingsLoading: false });
      });
  }

  openTaskModule = () => {
    microsoftTeams.dialog.url.open({
      title: "New Task",
      size: {
        height: 600,
        width: 800,
      },
      url: this.state.url.href,
    });
  };

  handleDelayChange = (ev, value) => {
    this.setState({ unloadDelay: value });
  };

  setUnloadDelay = () => {
    const time = this.state.unloadDelay;
    if (!isNaN(time) && time >= 0) {
      localStorage.setItem(UNLOAD_TIME_STORAGE_KEY, time);
    }
  };

  setUnloadTestMode = (ev, value) => {
    localStorage.setItem(UNLOAD_TEST_MODE_STORAGE_KEY, value.key);
    this.setState({ unloadTestMode: value.key });
  };

  render() {
    return (
      <div>
        <IconButton
          style={{ position: "absolute", top: 10, right: 10 }}
          onClick={() => this.setState({ debug: !this.state.debug })}
          iconProps={{
            iconName: "Bug",
          }}
        />
        {this.state.debug && (
          <div
            className="debug-pane"
            style={{
              position: "absolute",
              top: 30,
              right: 0,
              width: 400,
              height: 800,
              background: "white",
              overflow: "scroll",
              margin: 20,
              zIndex: 100,
              padding: 20,
              border: "1px solid #dddddd",
            }}
          >
            <h3>Context</h3>
            <JsonViewer src={this.state.context} name="context" />

            <h3>URL</h3>
            <div>{this.state.url.href}</div>

            <h3>Settings</h3>
            <DefaultButton
              primary
              text="getSettings"
              onClick={() => this.getSettings()}
            />
            <div>
              {this.state.settingsLoading ? (
                <p>Loading...</p>
              ) : (
                <JsonViewer src={this.state.settings} name="settings" />
              )}
            </div>

            <h3>Task Module</h3>
            <DefaultButton
              primary
              text="startTask"
              onClick={() => this.openTaskModule()}
            />

            <h3>Caching</h3>
            <Dropdown
              label="Unload Test Option"
              selectedKey={this.state.unloadTestMode || "normal"}
              options={this.cacheTestOptions}
              onChange={this.setUnloadTestMode}
            />
            {this.state.unloadTestMode === "slowUnload" && (
              <div>
                <TextField
                  label="Slow unload (duration in ms)"
                  className="unload-time"
                  placeholder="Unload time in milliseconds"
                  value={this.state.unloadDelay}
                  onChange={this.handleDelayChange}
                />
                <DefaultButton
                  primary
                  text="Save"
                  onClick={() => this.setUnloadDelay()}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default Debug;
