import React, { Component } from "react";
import { IconButton, Label } from "office-ui-fabric-react";
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
      settings: {},
      inTeams: !!params.get("inTeams") || !!params.get("inTeamsSSO"),
      url,
    };
  }

  componentDidMount() {
    if (this.state.inTeams) {
      microsoftTeams.initialize();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.debug && !prevState.debug) {
      microsoftTeams.getContext((context) => {
        console.log(`context is ${JSON.stringify(context)}`);
        this.setState({ context });
      });
    }
  }

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
            }}
          >
            <Label>Context</Label>
            <JsonViewer src={this.state.context} name="context" />
            <Label>URL</Label>
            <div>{this.state.url.href}</div>
          </div>
        )}
      </div>
    );
  }
}

export default Debug;
