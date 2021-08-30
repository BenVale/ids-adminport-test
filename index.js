var {Socket} = require('net');
var Promise = require("bluebird");

var send = function(options, callback) {
    var attempts = 0;
    var result = null;
    options.address = options.address || 'localhost';
    options.port = options.port || 80;
    options.attempts = options.attempts || 5;
    options.timeout = options.timeout || 10000;
    
    var write = function(socket, options, callback) {
      socket.on('data', (data) => {
        result = data;        
        socket.end();
      });
      socket.on('close', () => {
        destroy(socket);
        callback(undefined, result);
      });
      socket.on('end', () => {
        destroy(socket);
        callback(undefined, result);
      });

      socket.write(options.message);
      // socket.end();
    }

    var retry = function(err, options, callback) {
      console.log(`retry socket ${options.address}:${options.port} err: ${err} attempt ${attempts}/${options.attempts}`)
      if(attempts < options.attempts) {
        connect(options, callback);
        return;
      }
      callback(err, undefined);
    }

    var destroy = function(socket){
      socket.removeAllListeners('data');
      socket.removeAllListeners('timeout');
      socket.removeAllListeners('close');
      socket.removeAllListeners('end');
      socket.removeAllListeners('error');     
      socket.end();
      socket.destroy();
    }

    var connect = function(options, callback) {
      var socket = new Socket();
      // socket.setKeepAlive(true);

      socket.connect(options.port, options.address, function() {
        attempts++;
        write(socket, options, callback);
      });
      socket.on('error', function(err) {
        attempts++;
        destroy(socket);
        retry(err, options, callback);
      });
      socket.setTimeout(options.timeout, function() {
        attempts++;
        destroy(socket);
        retry(new Error('Request timeout'), options, callback);
      });
    };
    connect(options, callback);
};


var sendAsync = async function(options){
  return new Promise((resolve, reject) => {
    send(options, (err, result) => {
      if(err){
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}
const wait = ms => new Promise((resolve) => {
  let wait = setTimeout(() => {
    clearTimeout(wait);
    resolve();
  }, ms)  
});

var ping = async function({host, adminport}){
  var result = await sendAsync({address: host, port: adminport, message: 'ping'});
  if(result != null){
    result = result.toString() + ' UTC';
    result = new Date(Date.parse(result));    
  } 
  console.log(`${host}:${adminport} = ${result}`);
  return result;    
}

//TODO: Add IDS here, they must be setup with the adminport flag when launched
var servers = [
  {host: '34.87.222.129', port: '1234', adminport: '1111'},
  {host: '34.87.222.129', port: '1235', adminport: '2222'}
];

async function pingServers() {
  while (true) {
    try {
      await Promise.map(servers, item => ping(item));         
      await wait(5000);
    } catch(err){
      console.log(err);
    }    
  }    
}

pingServers()
.then(result => {
  console.log(result);
}).catch(err => {
  console.log(err);
});