import React, { Component } from "react";
import UserTile from "./UserTile";
import authService from "../services/auth.service";
import * as microsoftTeams from "@microsoft/teams-js";
import { DefaultButton } from "office-ui-fabric-react";

/**
 * This component is responsible for:
 * 1. Displaying configuration settings
 */
class Config extends Component {
  constructor(props) {
    super(props);

    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);

    this.state = {
      inTeamsSSO: !!params.get("inTeamsSSO"),
      inTeamsMSAL: !!params.get("inTeamsMSAL")
    };
  }

  componentDidMount() {
    microsoftTeams.app.initialize();
    const queryString = this.state.inTeamsMSAL ? "inTeamsMSAL=true" : `${
      this.state.inTeamsSSO ? "inTeamsSSO=true" : "inTeams=true"
    }`
    microsoftTeams.pages.config.registerOnSaveHandler((saveEvent) => {
      let contentUrl = `${window.location.origin}/group/?${
        queryString
      }`;
      let removeUrl = `${window.location.origin}/remove/?${
        queryString
      }`;

      microsoftTeams.pages.config.setConfig({
        entityId: "meowTasks",
        suggestedDisplayName: "Meow Tasks",
        contentUrl: contentUrl,
        removeUrl: removeUrl,
        websiteUrl: `${window.location.origin}/`,
      });

      saveEvent.notifySuccess();
    });

    this.setState({ loading: true });
    authService
      .getUser()
      .then((user) => {
        this.setState({ user, loading: false });
      })
      .catch((err) => {
        console.warn(`Error getting user: ${err}`);
        this.setState({ loading: false });
      });
  }

  validate = () => {
    microsoftTeams.pages.config.setValidityState(true);
  };

  render() {
    return (
      <div className="App-content">
        <div className="App-header">
          <h1 className="App-header-title">Config</h1>
          <UserTile history={this.props.history} />
        </div>
        <div>
          <DefaultButton primary="true" onClick={this.validate}>
            <span className="ms-Button-label label-46">Validate</span>
          </DefaultButton>
        </div>
      </div>
    );
  }
}

export default Config;
