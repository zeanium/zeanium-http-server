# Zeanium HTTP Server

The simple pure http server base on zeanium.

[![npm](https://img.shields.io/npm/v/zeanium/zeanium-http-server.svg)](https://github.com/zeanium/zeanium-http-server)
[![npm](https://img.shields.io/npm/dm/zeanium/zeanium-http-server.svg)](https://github.com/zeanium/zeanium-http-server)


## Installation

```bash
npm install @zeanium/http-server
```

## Usage

```javascript

var httpserver = require('@zeanium/http-server');
var server = httpserver.Server.createServer({
    port: '',
    host: ''
});

server.uses(require('./src/middleware/index.js'));
server.start();
                

```



## License

MIT