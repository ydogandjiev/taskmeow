import React from "react";
import ReactDOM from "react-dom";
import { runWithAdal } from "react-adal";
import "./index.css";
import App from "./App";
import { authContext } from "./adalConfig";
import registerServiceWorker from "./registerServiceWorker";

runWithAdal(authContext, () => {
  ReactDOM.render(<App />, document.getElementById("root"));
});

registerServiceWorker();
