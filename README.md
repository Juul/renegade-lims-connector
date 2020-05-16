
This library provides connection for [renegade-lims](https://github.com/renegadebio/renegade-lims) clients, meaning nodes that are not full peers and don't implement database replication.

# Usage

```
const limsConnect = require('renegade-lims-connector');

limsConnect({
    host: <String>, // Hostname or IP we're connecting to
    port: <Number>, // Port we're connecting to
    serverTLSCert: <Buffer>, // The server TLS certificate 
    tlsKey: <Buffer>, // The client TLS key
    tlsCert: <Buffer>, // The client TLS certificate
    clientRPC: {
       ... // Optional exported RPC functions
    },
    insecure: false, // If true, don't check server certificate
    heartbeatRate: 3000 // How often to send heartbeat/keepalive in ms
}, function(err, remote) {

   // 'remote' is returned by rpc-multistream on connect
   // and contains all rpc methods exported by the server as properties

   // If 'remote' is falsy then we were disconnected
   // after having been connected and err may be set

});
```

# Copyright and license

* Copyright 2020 renegade.bio
* License: AGPLv3

See the `LICENSE` file for full license.