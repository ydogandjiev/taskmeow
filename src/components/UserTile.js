import React, { Component } from "react";
import { Navigate } from "react-router-dom";
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

    this.state = {};
  }

  componentDidMount() {
    authService.getUser().then((user) => {
      this.setState({ user });
    });

    userService
      .getImage()
      .then((userImage) => {
        this.setState({ userImage });
      })
      .catch((error) => {
        console.error(error);
        if (
          error.statusCode === 403 &&
          error.statusMessage === "ConsentRequired"
        ) {
          this.props.setConsentRequired && this.props.setConsentRequired(true);
        }
      });
  }

  viewTasks = () => {
    if(window.location.pathname !== "/") {
      this.setState({ route: "/" });
    }
    // this.props.history.push("/");
  };

  viewProfile = () => {
    if (window.location.pathname.indexOf("/profile") == -1) {
      this.setState({ route: "/profile" });
    }
    // this.props.history.push("/profile");
  };

  logout = () => {
    authService.logout();
  };

  render() {
    if (this.state.route) {
      return <Navigate to={this.state.route} replace={true} />;
    } else if (!this.state.user) {
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
            isBeakVisible: false,
            gapSpace: 10,
            items: [
              {
                key: "tasks",
                name: "Tasks",
                onClick: this.viewTasks,
              },
              {
                key: "profile",
                name: "Profile",
                onClick: this.viewProfile,
              },
              {
                key: "logout",
                name: "Logout",
                onClick: this.logout,
              },
            ],
          }}
        >
          <span className="ms-Persona-primaryText primaryText-63">
            {this.state.user.name}
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
