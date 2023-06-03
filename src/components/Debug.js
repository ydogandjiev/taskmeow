import React, { Component } from "react";
import { DefaultButton, IconButton } from "office-ui-fabric-react";
import * as microsoftTeams from "@microsoft/teams-js";
import JsonViewer from "react-json-view";

/**
 * This component is responsible for:
 * 1. Fetching and displaying the user's profile information
 */
class Debug extends Component {
  constructor(props) {
    super(props);

    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);

    this.state = {
      debug: false,
      context: {},
      inTeams: !!params.get("inTeams") || !!params.get("inTeamsSSO"),
      url,
      settings: {},
      settingsLoading: false,
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
    microsoftTeams.getSettings();
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
      height: 800,
      width: 800,
      url: this.state.url.href,
    });
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
          </div>
        )}
      </div>
    );
  }
}

export default Debug;
