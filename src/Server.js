/**
 * Created by yangyxu on 8/20/14.
 */
var node_cluster = require('cluster');
var node_os = require('os');
var node_fs = require('fs');
var node_http = require('http');
var node_https = require('https');
var node_path = require('path');
var ServerContext = require('./ServerContext._.js');
var ServerEventListener = require('./ServerEventListener.js');
var ServerWatcher = require('./Server.Watcher');
var CONFIG = require('./config/zn.server.config.js');
var Middleware = require('./Middleware');
module.exports = zn.Class({
    mixins: [ ServerWatcher ],
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
            var _config = zn.deepAssigns({}, CONFIG, args);
            this._config = _config;
            this.__init(_config);
            if(_config.auto){
                this.start();
            }
            this.watching();
            Middleware.callMiddlewareMethod(Middleware.TYPES.SERVER, "initial", [args, this]);
        },
        __init: function (_config){
            this._beginTimestamp = (new Date()).getTime();
            this.__initWatcher();
        },
        __loadServerMiddlewares: function (middlewares){
            var _middlewares = middlewares;
            if(_middlewares){
                if(typeof _middlewares == 'string'){
                    if(node_fs.existsSync(node_path.join(process.cwd(), _middlewares))){
                        _middlewares = require(node_path.join(process.cwd(), _middlewares));
                    }
                }
                this.__loadMiddlewares(_middlewares);
            }
        },
        watching: function (){
            if(this._config.mode != 'development') return;
            this.__watchingFileChangedByPath(function (){
                Middleware.reset();
                var _config = this._config;
                this.__init(_config);
                this.__createServerContext(_config);
            }.bind(this));
        },
        addListener: function(event, handler){
            return this._server.on(event, handler), this;
        },
        listen: function (listen){
            return this._server.listen(listen), this;
        },
        use: function (middleware){
            return Middleware.use(middleware), this;
        },
        uses: function (middlewares){
            return this.__loadMiddlewares(middlewares), this;
        },
        middleware: function (middleware){
            return Middleware.use(middleware), this;
        },
        start: function (config){
            var _config = zn.overwrite(config||{}, this._config);
            Middleware.callMiddlewareMethod(Middleware.TYPES.SERVER, "start", [_config, this]);
            this.__createServerContext(_config);
            this.__createHTTPServer(_config);
            Middleware.callMiddlewareMethod(Middleware.TYPES.SERVER, "started", [_config, this]);
        },
        close: function (){
            return this._server.close(), this;
        },
        __loadMiddlewares: function (middlewares){
            if(!middlewares) return;
            var _middlewares = null;
            if(typeof middlewares == 'string'){
                middlewares = [ middlewares ];
            }
            zn.each(middlewares, function (middleware){
                _middlewares = middleware;
                
                if(typeof _middlewares == 'string'){
                    if(node_fs.existsSync(node_path.resolve(_middlewares))){
                        _middlewares = require(node_path.resolve(_middlewares));
                    }
                }

                if(typeof _middlewares == 'function' && _middlewares.getMeta('TYPE') && Middleware.TYPES[_middlewares.getMeta('TYPE')]){
                    Middleware.use(_middlewares);
                } else if(_middlewares instanceof Middleware){
                    Middleware.use(_middlewares);
                } else if(zn.is(_middlewares, 'object')){
                    for(var key in _middlewares){
                        Middleware.use(_middlewares[key]);
                    }
                }
            });

            return this;
        },
        __createServerContext: function (config){
            this.__loadServerMiddlewares(config.middlewares);
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

            if(config.port && config.host) {
                _server.listen(config);
            }

            new ServerEventListener(_server, this);

            return _server;
        },
        __createClusterServer: function (config){
            if(node_cluster.isMaster){
                var _cpus = config.clusters;
                if(_cpus === true){
                    _cpus = node_os.cpus().length
                }
                zn.info("Master [" + process.pid + "]: ", _cpus, node_os.cpus().length);
                for(var i = 0; i < _cpus; i++){
                    node_cluster.fork();
                }
                node_cluster.on('exit', function (worker, code, signal){
                    zn.error("Work Process " + worker.process.pid + " Exited.");
                });
            } else {
                zn.info("Worker [" + process.pid + "]: " + node_cluster.worker.id);
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
