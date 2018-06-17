import React, { Component } from "react";
import { ActionButton, Persona, Spinner } from "office-ui-fabric-react";
import authService from "../services/auth.service";
import userService from "../services/user.service";

/**
 * This component is responsible for:
 * 1. Fetching the user's profile image via a call to /api/user/image
 * 2. Rendering the user's persona with their image or initials as well as full name
 * 3. Opening a context menu when the persona is clicked that allows the user to sign out
 */
class UserTile extends Component {
  constructor(props) {
    super(props);

    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);

    this.state = {
      useV2: !!params.get("useV2")
    };
  }

  componentDidMount() {
    authService.getUser(this.state.useV2).then(user => {
      this.setState({ user });
    });

    userService
      .getImage()
      .then(userImage => {
        this.setState({ userImage });
      })
      .catch(error => {
        console.error(error);
      });
  }

  viewTasks = () => {
    this.props.history.push("/");
  };

  viewProfile = () => {
    this.props.history.push("/profile");
  };

  logout = () => {
    authService.logout();
  };

  render() {
    if (!this.state.user) {
      return <Spinner label="Loading user..." />;
    } else {
      return (
        <ActionButton
          className="UserTile-button"
          split={false}
          onRenderMenuIcon={() => false}
          menuProps={{
            shouldFocusOnMount: true,
            useTargetWidth: true,
            items: [
              {
                key: "tasks",
                name: "Tasks",
                onClick: this.viewTasks
              },
              {
                key: "profile",
                name: "Profile",
                onClick: this.viewProfile
              },
              {
                key: "logout",
                name: "Logout",
                onClick: this.logout
              }
            ]
          }}
        >
          <span className="ms-Persona-primaryText primaryText-63">
            {this.state.user.given_name}
          </span>
          <Persona
            imageUrl={this.state.userImage}
            text={this.state.user.name}
            imageShouldFadeIn={true}
            hidePersonaDetails={true}
          />
        </ActionButton>
      );
    }
  }
}

export default UserTile;
