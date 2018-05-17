import React, { Component } from "react";
import { Persona, ActionButton } from "office-ui-fabric-react";
import initials from "initials";
import authService from "../services/auth.service";

class UserTile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userName: props.user.name,
      userInitials: initials(props.user.name)
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.user.objectId !== this.state.user.objectId) {
      this.setState({
        userName: nextProps.user.profile.name,
        userInitials: initials(nextProps.user.profile.name),
        userImage: null
      });
    }
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
      .fetch("/api/user/image")
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
        <Persona
          imageUrl={this.state.userImage}
          primaryText={this.state.userName}
        />
      </ActionButton>
    );
  }
}

export default UserTile;
