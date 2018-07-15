import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Fabric } from "office-ui-fabric-react";
import "./index.css";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";

ReactDOM.render(
  <BrowserRouter>
    <Fabric>
      <App />
    </Fabric>
  </BrowserRouter>,
  document.getElementById("root")
);

registerServiceWorker();
