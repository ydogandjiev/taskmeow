import React, { createContext } from "react";
import authService from "../services/auth.service";

const ConsentContext = createContext({
  consentRequired: "",
  setConsentRequired: () => {},
  requestConsent: () => {},
});

export class ConsentProvider extends React.Component {
  setConsentRequired = (consentRequired) => {
    this.setState({ consentRequired: consentRequired });
  };

  requestConsent = () => {
    authService.login().then(() => this.setState({ consentRequired: false }));
  };

  state = {
    consentRequired: false,
    setConsentRequired: this.setConsentRequired,
    requestConsent: this.requestConsent,
  };

  render() {
    return (
      <ConsentContext.Provider value={this.state}>
        {this.props.children}
      </ConsentContext.Provider>
    );
  }
}

export const ConsentConsumer = ConsentContext.Consumer;
