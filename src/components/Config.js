import React, { Component } from "react";
import authService from "../services/auth.service";
import userService from "../services/user.service";
import * as microsoftTeams from "@microsoft/teams-js";
import {
  DefaultButton,
  Icon,
  Persona,
  PersonaSize,
} from "office-ui-fabric-react";
import "./Config.css";

class Config extends Component {
  constructor(props) {
    super(props);

    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);

    this.state = {
      inTeamsSSO: !!params.get("inTeamsSSO"),
      inTeamsMSAL: !!params.get("inTeamsMSAL"),
      status: "signing-in",
      theme: "default",
    };
  }

  componentDidMount() {
    this.active = true;
    this.signIn();
  }

  componentWillUnmount() {
    this.active = false;
  }

  signIn = async () => {
    this.setState({ status: "signing-in" });
    try {
      await microsoftTeams.app.initialize();
      if (!this.active) return;

      microsoftTeams.pages.config.setValidityState(false);
      microsoftTeams.pages.config.registerOnSaveHandler(this.save);
      const context = await microsoftTeams.app.getContext();
      if (!this.active) return;
      this.setState({ theme: context.app.theme });
      microsoftTeams.app.registerOnThemeChangeHandler((theme) => {
        if (this.active) this.setState({ theme });
      });

      await authService.tryInitializeMSAL();
      await authService.isCallback();
      if (!this.active) return;

      let user;
      try {
        user = await authService.getUser();
      } catch (error) {
        console.warn("Automatic sign-in failed:", error);
      }
      if (!this.active) return;
      if (!user) user = await authService.login();
      if (!user) throw new Error("Sign-in did not return a user.");
      if (!this.active) return;

      this.setState({ user, status: "ready" }, () => {
        if (this.active) microsoftTeams.pages.config.setValidityState(true);
      });
      this.loadUserImage();
    } catch (error) {
      console.warn("Error signing in to configure the tab:", error);
      if (this.active) this.setState({ status: "error" });
    }
  };

  loadUserImage = async () => {
    try {
      const userImage = await userService.getImage();
      if (this.active) this.setState({ userImage });
    } catch (error) {
      console.warn("Error loading the profile photo:", error);
    }
  };

  save = async (saveEvent) => {
    if (!this.active || this.state.status !== "ready") {
      saveEvent.notifyFailure(
        "Hold your paws! Please finish signing in before saving."
      );
      return;
    }

    const queryString = this.state.inTeamsMSAL
      ? "inTeamsMSAL=true"
      : `${this.state.inTeamsSSO ? "inTeamsSSO=true" : "inTeams=true"}`;
    try {
      await microsoftTeams.pages.config.setConfig({
        entityId: "meowTasks",
        suggestedDisplayName: "Meow Tasks",
        contentUrl: `${window.location.origin}/group/?${queryString}`,
        removeUrl: `${window.location.origin}/remove/?${queryString}`,
        websiteUrl: `${window.location.origin}/`,
      });
      saveEvent.notifySuccess();
    } catch (error) {
      console.error("Error saving the tab configuration:", error);
      saveEvent.notifyFailure(
        "We couldn't save your tab. Even cats miss a jump - please try saving again."
      );
    }
  };

  render() {
    const { status, theme, user, userImage } = this.state;
    const name =
      user &&
      (user.name ||
        [user.given_name, user.family_name].filter(Boolean).join(" ") ||
        user.username ||
        user.upn);

    return (
      <main className="Config-page" data-theme={theme}>
        <section className="Config-card" aria-labelledby="config-heading">
          <div className="Config-brand">
            <span className="Config-brand-mark" aria-hidden="true">
              <Icon iconName="CheckList" />
            </span>
            <span>Task Meow</span>
            <span className="Config-brand-caption">for Teams</span>
          </div>
          <div
            className="Config-stage"
            aria-live="polite"
            aria-atomic="true"
            aria-busy={status === "signing-in"}
          >
            <div className="Config-view" key={status}>
              {status === "signing-in" && (
                <>
                  <div className="Config-orbit" aria-hidden="true">
                    <Icon iconName="Lock" />
                  </div>
                  <p className="Config-eyebrow">Just a meowment</p>
                  <h1 id="config-heading">Signing you in...</h1>
                  <p className="Config-description">
                    Checking your Microsoft account. No catnip required.
                  </p>
                  <p className="Config-footnote">Getting our paws in order.</p>
                </>
              )}
              {status === "ready" && (
                <>
                  <div className="Config-avatar">
                    <Persona
                      text={name}
                      imageUrl={userImage}
                      imageAlt="Your profile photo"
                      size={PersonaSize.size72}
                      hidePersonaDetails={true}
                      imageShouldFadeIn={true}
                    />
                    <span className="Config-check" aria-hidden="true">
                      <Icon iconName="CheckMark" />
                    </span>
                  </div>
                  <p className="Config-eyebrow">Purrfect. You&apos;re in.</p>
                  <h1 id="config-heading">Meowcome{name ? `, ${name}` : ""}</h1>
                  <p className="Config-description">
                    Let&apos;s get those to-dos under claw.
                  </p>
                  <p className="Config-save-hint">
                    Select <strong>Save</strong> below to give your shared tasks
                    a home in this conversation.
                  </p>
                </>
              )}
              {status === "error" && (
                <>
                  <div className="Config-error-icon" aria-hidden="true">
                    <Icon iconName="Warning" />
                  </div>
                  <p className="Config-eyebrow">A tiny cat-astrophe</p>
                  <h1 id="config-heading">Let&apos;s try that again</h1>
                  <p className="Config-description" role="alert">
                    We couldn&apos;t sign you in. Even cats miss a jump. Please
                    try again.
                  </p>
                  <DefaultButton onClick={this.signIn}>Try again</DefaultButton>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }
}

export default Config;
