// Passenger startup file for cPanel "Setup Node.js App".
process.env.NODE_ENV = process.env.NODE_ENV || "production";
// cPanel sets HOSTNAME to the machine name, which Next would try to bind to.
process.env.HOSTNAME = "0.0.0.0";
require("./server.js");
