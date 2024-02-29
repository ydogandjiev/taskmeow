import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Fabric } from "office-ui-fabric-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./index.css";
import App from "./App";
import { ConsentProvider } from "./components/ConsentContext";
import { unregister } from "./registerServiceWorker";

const APP_ID = process.env.REACT_APP_APPID || window.APP_ID;

ReactDOM.render(
  <BrowserRouter>
    <Fabric>
      <ConsentProvider>
        <DndProvider backend={HTML5Backend}>
          <App appId={APP_ID} />
        </DndProvider>
      </ConsentProvider>
    </Fabric>
  </BrowserRouter>,
  document.getElementById("root")
);

unregister();
