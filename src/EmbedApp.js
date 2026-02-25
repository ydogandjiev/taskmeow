import React, { Component } from "react";
import EmbedWidget from "./components/EmbedWidget";
import "./EmbedApp.css";

class EmbedApp extends Component {
  constructor(props) {
    super(props);

    // Extract token from URL query parameters
    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);
    const token = params.get("token");

    this.state = {
      token,
      error: null,
    };
  }

  render() {
    const { token, error } = this.state;

    if (error) {
      return (
        <div className="embed-app-error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      );
    }

    if (!token) {
      return (
        <div className="embed-app-error">
          <h2>Authentication Required</h2>
          <p>No access token provided. Please authenticate via ChatGPT.</p>
        </div>
      );
    }

    return (
      <div className="embed-app">
        <EmbedWidget token={token} />
      </div>
    );
  }
}

export default EmbedApp;
