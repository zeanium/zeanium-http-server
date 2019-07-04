/**
 * Created by yangyxu on 8/20/14.
 */
var node_cluster = require('cluster');
var node_os = require('os');
var node_http = require('http');
var node_https = require('https');
var node_path = require('path');
var ServerContext = require('./ServerContext._.js');
var ServerEventListener = require('./ServerEventListener.js');
var CONFIG = require('./config/zn.server.config.js');
module.exports = zn.Class({
    statics: {
        createServer: function (inArgs) {
            return new this(inArgs);
        }
    },
    properties: {
        config: null,
        context: null,
        server: null
    },
    methods: {
        init: function (args){
            var _config = zn.overwrite(args, CONFIG);
            this._config = _config;
            this.__initNodePaths(_config);
            if(_config.auto){
                this.start();
            }
        },
        addListener: function(event, handler){
            return this._server.on(event, handler), this;
        },
        listen: function (listen){
            return this._server.listen(listen), this;
        },
        use: function (middleware){
            return zn.middleware.use(middleware), this;
        },
        middleware: function (middleware){
            return zn.middleware.use(middleware), this;
        },
        start: function (config){
            var _config = zn.overwrite(config||{}, this._config);
            this.__createServerContext(_config);
            this.__createHTTPServer(_config);
        },
        close: function (){
            return this._server.close(), this;
        },
        __initNodePaths: function (config){
            var paths = config.node_paths;
            if(!paths || !paths.forEach){
                return false;
            }
            /*Add current path to NODE_PATH*/
            var _cwd = process.cwd(),
                _path = null,
                _parentPaths = [];
            paths.forEach(function (path){
                _path = node_path.normalize(_cwd + node_path.sep + path);
                _parentPaths = _parentPaths.concat([_path]);
                if(config.includeParentPath){
                    _parentPaths = _parentPaths.concat(module.constructor._nodeModulePaths(_path));
                }
            });

            if(_parentPaths.length){
                process.env.NODE_PATH = _parentPaths.join(node_path.delimiter) + node_path.delimiter + process.env.NODE_PATH;
                module.constructor._initPaths();
                zn.NODE_PATHS = process.env.NODE_PATH.split(node_path.delimiter);
            }
        },
        __createServerContext: function (config){
            this._context = new ServerContext(config, this);
        },
        __createHTTPServer: function (config){
            if(config.clusters){
                this.__createClusterServer(config);
            }else{
                this._server = this.__createSimpleServer(config);
            }
        },
        __createSimpleServer: function (config){
            var _server = null;
            if(config.https){
                config.protocol = 'https';
                _server = new node_https.Server(config.https);
            }else {
                config.protocol = 'http';
                _server = new node_http.Server();
            }
            new ServerEventListener(_server, this);

            if(config.port && config.host) {
                _server.listen(config);
            }

            return _server;
        },
        __createClusterServer: function (config){
            if(node_cluster.isMaster){
                zn.info("Main Process " + process.pid + " Running ...");
                var _cpus = config.clusters || node_os.cpus().length;
                for(var i = 0; i < _cpus; i++){
                    node_cluster.fork();
                }
                node_cluster.on('exit', function (worker, code, signal){
                    zn.error("Work Process " + worker.process.pid + " Exited.");
                });
            } else {
                zn.info("Child Process " + process.pid + " Running ...");
                this._server = this.__createSimpleServer(config);
            }
        },
        __parseConfigPortToArray: function (config){
            var _port = config.port;
            if(zn.is(_port, 'number')){
                if(config.clusters){
                    var _min = _port, 
                        _count = zn.is(config.clusters, 'number')?config.clusters:node_os.cpus().length,
                        _max = _min + _count;
                    _port = [_min];
                    while(_min<_max-1){
                        _min++;
                        _port.push(_min);
                    }
                }else{
                    _port = [_port];
                }
            }

            return _port;
        },
        __forEachNetworkInterfaces: function (callback){
            var _interfaces = node_os.networkInterfaces(),
                _interface = null,
                _self = this;
            for(var key in _interfaces){
                _interface = _interfaces[key];
                _interface.forEach(function (value, index){
                    callback && callback.call(_self, value, index);
                });
            }
        }
    }
});
