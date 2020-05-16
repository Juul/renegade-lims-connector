'use strict';

const tls = require('tls');
const minimist = require('minimist');
const backoff = require('backoff');
const rpc = require('rpc-multistream');

function debug(str) {
  console.log('[debug] ', str);
}


function connectOnce(opts, cb) {
  console.log("Connecting to: "+opts.host+":"+opts.port);

  const clientRPC = opts.clientRPC || {};
  
  var connectOpts = {
    ca: opts.serverTLSCert,
    key: opts.tlsKey,
    cert: opts.tlsCert
  };

  if(opts.insecure) {
    connectOpts.rejectUnauthorized = false;
  }
  
  var socket = tls.connect(opts.port, opts.host, connectOpts)
 
  socket.on('secureConnect', function() {
    
    console.log("Connected!");
    const client = rpc(clientRPC, {
      heartbeat: opts.heartbeatRate || 3000, // send heartbeat every 3000 ms
      maxMissedBeats: 3.5 // die after 3.5 times the above timeout
    });
    
    // if heartbeat fails
    client.on('death', function() {
      if(opts.debug) {
        debug("heartbeat timeout. disconnecting");
        debug("will attempt reconnect in 3 seconds");
      }
      socket.end();
    });
    
    client.pipe(socket).pipe(client);
    
    client.on('methods', function(remote) {
      cb(null, remote);
    });
  });
  
  var lastError;
  
  socket.on('error', function(err) {
    lastError = err;
  });

  socket.on('close', function() {
    cb(lastError || true);
    console.log("socket closed");
  });
  
}

function connect(opts, cb) {

  // Retry with increasing back-off 
  var back = backoff.fibonacci({
    randomisationFactor: 0,
    initialDelay: 3 * 1000, // 3 seconds
    maxDelay: 30 * 1000
  });
  
  var count = 0;
  function tryConnect() {
    connectOnce(opts, function(err, remote) {
      if(err) {
        console.error(err);
        if(count > 0) {
          back.backoff();
          return;
        }
        process.nextTick(tryConnect);
        count++;
      } else {
        count = 0;
        back.reset();
        cb(null, remote);
      }
    });
  }
  
  tryConnect();
  
  back.on('backoff', function(number, delay) {
    console.log("Retrying in", Math.round(delay / 1000), "seconds");  
  });

  back.on('ready', function(number, delay) {
    tryConnect();
  });  
}

module.exports = connect;
