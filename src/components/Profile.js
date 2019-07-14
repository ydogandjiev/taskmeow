import React, { Component } from "react";
import { Spinner, TextField } from "office-ui-fabric-react";
import UserTile from "./UserTile";
import authService from "../services/auth.service";

/**
 * This component is responsible for:
 * 1. Fetching and displaying the user's profile information
 */
class Profile extends Component {
  state = {};

  componentDidMount() {
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

  render() {
    return (
      <div className="App-content">
        <div className="App-header">
          <h1 className="App-header-title">Profile</h1>
          <UserTile history={this.props.history} />
        </div>
        <div>
          {this.state.user ? (
            <div>
              <TextField
                label="First name"
                value={this.state.user.given_name}
                readOnly={true}
              />
              <TextField
                label="Last name"
                value={this.state.user.family_name}
                readOnly={true}
              />
              <TextField
                label="E-mail"
                value={this.state.user.upn}
                readOnly={true}
              />
            </div>
          ) : (
            <Spinner label="Loading profile..." />
          )}
        </div>
      </div>
    );
  }
}

export default Profile;
