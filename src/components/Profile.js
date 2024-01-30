import React, { Component } from "react";
import {
  Spinner,
  TextField,
  Separator,
  PrimaryButton,
  Stack,
  Label,
  Text,
} from "office-ui-fabric-react";
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
    this.setState({
      loading: true,
      tokenLoading: false,
      token: null,
      tokenError: null,
    });
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

  fetchNAAToken = () => {
    this.setState({ tokenLoading: true });
    try {
      authService
        .getTokenWithNAA()
        .then((token) => {
          this.setState({ token });
        })
        .catch((err) => {
          const message =
            err?.message || err?.toString() || "Unknown error with NAA";
          console.warn(`Error getting NAA token: ${message}`);
          this.setState({ tokenError: message });
        })
        .finally(() => {
          this.setState({ tokenLoading: false });
        });
    } catch (e) {
      const message = e?.message || e?.toString() || "Unknown error with NAA";
      console.warn(`Error getting NAA token: ${message}`);
      this.setState({ tokenLoading: false, tokenError: message });
    }
  };

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
        <Separator />
        <Stack tokens={{ childrenGap: 20 }}>
          <Label block nowrap variant="large">
            Nested app auth
          </Label>
          <Stack horizontal tokens={{ childrenGap: 10 }}>
            <PrimaryButton
              disabled={this.state.tokenLoading}
              onClick={this.fetchNAAToken}
            >
              Acquire token
            </PrimaryButton>
            {this.state.tokenLoading && <Spinner />}
          </Stack>
          <TextField
            value={this.state.token}
            label="Token"
            readOnly
            multiline
          />
          {this.state.tokenError && <Text block>{this.state.tokenError}</Text>}
        </Stack>
        <Separator />
      </div>
    );
  }
}

export default Profile;
