import React, { Component } from "react";
import { Persona } from "office-ui-fabric-react";
import authService from "../services/auth.service";

class UserTile extends Component {
  state = {};

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.user.objectId !== prevState.user.objectId) {
      return {
        userName: nextProps.user.profile.name,
        userImage: null
      };
    }

    return null;
  }

  loadUserImage() {
    authService.fetch("/api/user").then(result => {
      const reader = new FileReader();
      reader.onload = () => {
        this.setState({ userImage: reader.result });
      };
      reader.readAsDataURL(result.blob());
    });
  }

  componentDidMount() {
    this.loadUserImage();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.userImage === null) {
      this.loadUserImage();
    }
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
