import * as service from "./services/tasks.service";

var connections = [];
export default () => {
  self.addEventListener("connect", function (event) {
    const port = event.ports[0];
    port.start();
    connections.push(port);

    port.onmessage = function (e) {

      service[e.data.method](...e.data.args)
      .then(result => {
        if (['destroy', 'create', 'update'].includes(e.data.method)) {
          connections.postMessage(result);
        } else {
          port.postMessage(result);
        }
      });
      
      console.log(`Worker: ${e.data.method} called`);
      port.postMessage(`worker result for ${e.data.method}`);
    };

    console.log(`Worker: ${connections.length} connections`);
  });
};
