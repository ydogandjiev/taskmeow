import React, { Component } from "react";
import UserTile from "./UserTile";
import authService from "../services/auth.service";
import * as microsoftTeams from "@microsoft/teams-js";
import { DefaultButton } from "office-ui-fabric-react";

/**
 * This component is responsible for:
 * 1. Displaying remove settings
 */
class Remove extends Component {
  state = {};

  componentDidMount() {
    microsoftTeams.initialize();
    microsoftTeams.settings.registerOnSaveHandler(function(saveEvent) {
      microsoftTeams.settings.setSettings({
        entityId: "channelTasks",
        suggestedDisplayName: "Channel Tasks",
        contentUrl: `${window.location.origin}/?inTeams=true`,
        removeUrl: `${window.location.origin}/remove/?inTeams=true`,
        websiteUrl: `${window.location.origin}/`
      });

      saveEvent.notifySuccess();
    });

    this.setState({ loading: true });
    authService
      .getUser()
      .then(user => {
        this.setState({ user, loading: false });
      })
      .catch(err => {
        this.setState({ loading: false });
      });
  }

  validate = () => {
    microsoftTeams.settings.setValidityState(true);
  };

  render() {
    return (
      <div className="App-content">
        <div className="App-header">
          <h1 className="App-header-title">Remove</h1>
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

export default Remove;
