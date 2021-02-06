import React, { Component } from "react";
import { Spinner, TextField } from "office-ui-fabric-react";
import UserTile from "./UserTile";
import authService from "../services/auth.service";
import { ConsentConsumer } from "./ConsentContext";

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
      .then((user) => {
        this.setState({ user, loading: false });
      })
      .catch((err) => {
        this.setState({ loading: false });
      });
  }

  render() {
    return (
      <div className="App-content">
        <div className="App-header">
          <h1 className="App-header-title">Profile</h1>
          <ConsentConsumer>
            {({ setConsentRequired }) => (
              <UserTile
                history={this.props.history}
                setConsentRequired={setConsentRequired}
              />
            )}
          </ConsentConsumer>
        </div>
        <div>
          {this.state.user ? (
            <div>
              {this.state.user.name ? (
                <TextField
                  label="Name"
                  value={this.state.user.name}
                  readyOnly={true}
                />
              ) : (
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
                </div>
              )}
              <TextField
                label="E-mail"
                value={
                  this.state.user.displayableId ||
                  this.state.user.upn ||
                  this.state.user.username
                }
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
