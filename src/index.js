import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Fabric } from "office-ui-fabric-react";
import "./index.css";
import App from "./App";
import { ConsentProvider } from "./components/ConsentContext";
import { unregister } from "./registerServiceWorker";

ReactDOM.render(
  <BrowserRouter>
    <Fabric>
      <ConsentProvider>
        <App />
      </ConsentProvider>
    </Fabric>
  </BrowserRouter>,
  document.getElementById("root")
);

unregister();
