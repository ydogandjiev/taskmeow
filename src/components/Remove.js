import React, { Component } from "react";
import Config from "./Config";

class Remove extends Component {
  render() {
    return <Config isRemoval={true} />;
  }
}

export default Remove;
