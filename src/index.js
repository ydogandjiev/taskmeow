import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Fabric } from "office-ui-fabric-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./index.css";
import App from "./App";
import EmbedApp from "./EmbedApp";
import { ConsentProvider } from "./components/ConsentContext";
import { unregister } from "./registerServiceWorker";

// Check if we're in embed mode (based on URL path)
const isEmbedMode = window.location.pathname.startsWith("/embed");

if (isEmbedMode) {
  // Render the embed widget (no Teams, no Fabric, no routing)
  ReactDOM.render(<EmbedApp />, document.getElementById("root"));
} else {
  // Render the full app
  ReactDOM.render(
    <BrowserRouter>
      <Fabric>
        <ConsentProvider>
          <DndProvider backend={HTML5Backend}>
            <App />
          </DndProvider>
        </ConsentProvider>
      </Fabric>
    </BrowserRouter>,
    document.getElementById("root")
  );
}

unregister();
