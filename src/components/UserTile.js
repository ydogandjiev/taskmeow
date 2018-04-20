import React, { Component } from "react";
import { Persona } from "office-ui-fabric-react";
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
      .fetch("/api/user")
      .then(result => {
        if (result.status !== 200) {
          return new Promise((resolve, reject) => {
            result.json().then(json => reject(JSON.stringify(json)));
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
      <Persona
        imageUrl={this.state.userImage}
        primaryText={this.state.userName}
      />
    );
  }
}

export default UserTile;
