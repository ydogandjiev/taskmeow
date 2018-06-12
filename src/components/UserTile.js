import React, { Component } from "react";
import { Persona, ActionButton } from "office-ui-fabric-react";
import authService from "../services/auth.service";

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
      userName: props.user.name,
      userFirstName: props.user.given_name,
      userObjectId: props.user.oid,
      useV2: !!params.get("useV2")
    };
  }

  componentDidMount() {
    this.loadUserImage();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.userImage === null) {
      this.loadUserImage();
    }
  }

  loadUserImage() {
    authService
      .fetch(`/api/user/image?useV2=${this.state.useV2}`)
      .then(result => {
        if (result.status !== 200) {
          return new Promise((resolve, reject) => {
            // TODO: Figure out how to reliably log fetch errors
            // result.json().then(json => reject(JSON.stringify(json)));
            reject(`Failed to fetch image; error code: ${result.status}`);
          });
        } else {
          return result.blob();
        }
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onload = () => {
          this.setState({ userImage: reader.result });
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error(error);
      });
  }

  render() {
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
              key: "logout",
              name: "Logout",
              onClick: this.props.onLogout
            }
          ]
        }}
      >
        <span className="ms-Persona-primaryText primaryText-58">
          {this.state.userFirstName}
        </span>
        <Persona
          imageUrl={this.state.userImage}
          text={this.state.userName}
          imageShouldFadeIn={true}
          hidePersonaDetails={true}
        />
      </ActionButton>
    );
  }
}

export default UserTile;
