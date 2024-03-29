/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var node_fs = require('fs');
var ServerContextDeployer = require('./ServerContext.Deployer.js');
var ServerContextRequestDispatcher = require('./ServerContext.RequestDispatcher.js');
var ServerContextRequestRouter = require('./ServerContext.RequestRouter.js');
var JSONSessionContext = require('./session/JSONSessionContext');
var PathMatcher = require('./PathMatcher');
var Middleware = require('./Middleware');
var Logger = require('./Logger');
var PACKAGE = require("../package.json");

module.exports = zn.Class({
    mixins: [ 
        ServerContextDeployer, 
        ServerContextRequestDispatcher, 
        ServerContextRequestRouter 
    ],
    properties: {
        config: null,
        server: null,
        path: null,
        pathMatcher: null,
        root: './',
        webRoot: './',
        logger: null,
        url: null,
        apps: null,
        routes: null,
        models: null,
        modules: null,
        formidable: null,
        sessionContext: null
    },
    methods: {
        init: function (config, server){
            config.root = config.root || './';
            config.web_root = config.web_root || './';
            this.super(config, server);
            this._config = config;
            this._server = server;
            this._path = __dirname;
            this._models = {};
            this.initLogger(config.log);
            this._url = this.__parseURL(config.host, config.port);
            this._root = node_path.resolve(process.cwd(), config.root);
            this._webRoot = node_path.resolve(process.cwd(), config.web_root);
            this._pathMatcher = new PathMatcher({
                pathSeparator: config.pathSeparator,
                pathParameterSymbol: config.pathParameterSymbol
            });
            this._formidable = this.__initFileUploadConfig();
            this.__initial(config);
            this.__initSessionContext();
            this.__deploy();
            this.__loadingCompleted();
            Middleware.callMiddlewareMethod(Middleware.TYPES.SERVER_CONTEXT, "loaded", [config, server, this]);
        },
        initLogger: function (logConfig){
            this._logger = new Logger(logConfig, {
                error: function (sender, value){
                    Middleware.callMiddlewareMethod(Middleware.TYPES.LOGGER, "error", [value, sender, this]);
                },
                route: function (sender, value){
                    Middleware.callMiddlewareMethod(Middleware.TYPES.LOGGER, "route", [value, sender, this]);
                },
                request: function (sender, value){
                    Middleware.callMiddlewareMethod(Middleware.TYPES.LOGGER, "request", [value, sender, this]);
                },
                requestcount: function (sender, value){
                    Middleware.callMiddlewareMethod(Middleware.TYPES.LOGGER, "requestcount", [value, sender, this]);
                },
                requeststatus: function (sender, value){
                    Middleware.callMiddlewareMethod(Middleware.TYPES.LOGGER, "requeststatus", [value, sender, this]);
                }
            });
        },
        resolveModel: function (modelName){
            return this._models[modelName];
        },
        formatToAbsolutePath: function (path){
            return node_path.join(this._webRoot, path);
        },
        registerApplication: function (application){
            this._apps[application.config.deploy] = application;
            return this._routes = this._routes.concat(application.routes), this;
        },
        __initSessionContext: function (){
            this.registerSessionContext();
        },
        registerSessionContext: function (sessionContext){
            if(sessionContext){
                this._sessionContext = sessionContext;
                this._sessionContext.setServerContext(this);
                return this;
            }
            var _sessionContext = Middleware.callMiddlewareMethod(Middleware.TYPES.SERVER_CONTEXT, "registerSessionContext", [this]);
            if(!_sessionContext) {
                var _config = this._config.session || {};
                var _Context = _config.context || JSONSessionContext;
                _sessionContext = new _Context(_config, this);
            }
            if(_sessionContext) {
                this._sessionContext = _sessionContext;
                this._sessionContext.setServerContext(this);
            }
            
            return this;
        },
        __initial: function (config){
            this._apps = {};
            this._routes = [];
            this._modules = this.__loadPackages(config.modules);
            Middleware.callMiddlewareMethod(Middleware.TYPES.SERVER_CONTEXT, "initial", [config, this]);
        },
        __loadingCompleted: function (){
            var _timestamp = (new Date()).getTime() - this._server._beginTimestamp,
                _urls = [];
            this._server.__forEachNetworkInterfaces(function (value, index){
                if(value.family == 'IPv4'){
                    var _address = this.__parseURL(value.address);
                    _urls.push(_address);
                    zn.info(_address);
                }
            }.bind(this));
            Middleware.callMiddlewareMethod(Middleware.TYPES.SERVER_CONTEXT, "loadCompleted", [_timestamp, _urls, this]);
            zn.info('[ ',_timestamp, 's ] Loading Completed.')
        },
        __parseURL: function (host){
            return (this._config.https?'https':'http') + '://' + host + ":" + this._config.port;
        },
        __convertControllerToRouters: function (Controller, application){
            var _deploy = application ? application._config.deploy : '',
                _routes = [],
                _route = null,
                _member = null;

            var _key = Controller.getMeta('controller') || Controller.name;
            var _validate = (Controller.getMeta('validate') !== undefined) ? Controller.getMeta('validate') : false;
            var _controller = new Controller(this, application);
            Controller._methods_.forEach(function (method){
                if(method!="init"){
                    _member = Controller.member(method);
                    _route = _member.meta.route || _member.name;
                    switch(typeof _route){
                        case 'string':
                            _route = {
                                path: _route
                            };
                            break;
                        case 'function':
                            _route = _route.call(_controller, method, _member);
                            break;
                        case 'object':
                            break;
                        default :
                            return;
                    }
                    _route.path = node_path.join(node_path.sep, _deploy, _key, _route.path);
                    _route.paths = this._pathMatcher.parseRoutePath(_route.path);
                    _route = zn.deepAssign({
                        action: method,
                        application: application,
                        controller: _controller,
                        handler: _member,
                        meta: {
                            deploy: _deploy,
                            controller: _key
                        },
                        validate: (_member.meta.validate !== undefined) ? _member.meta.validate : _validate
                    }, _route);
                    _routes.push(_route);
                }
            }.bind(this));

            return _routes;
        },
        __loadPackages: function (paths){
            var _exports = {};
            if(!paths){
                return _exports;
            }
            if(typeof paths == 'string'){
                paths = [paths];
            }
            paths.forEach(function (path){
                path = node_path.join(this._config.root, path);
                if(node_fs.existsSync(path)){
                    zn.extend(_exports, require(path));
                }
            }.bind(this));

            return _exports;
        },
        __initPath: function (path){
            if(!node_path.isAbsolute(path) || node_fs.existsSync(path)){
                return path;
            }
            node_fs.mkdirSync(path, {
                recursive: true,
                mode: 0o777
            });

            /*
            var _paths = path.split(node_path.sep),
                _path;
            _paths.map(function (value){
                if(value){
                    _path = _path ? node_path.join(_path, value) : node_path.sep + value;
                    if(!node_fs.existsSync(_path)){
                        node_fs.mkdirSync(_path, 0766);
                    }
                }
            });*/
        },
        getFileUploadConfig: function (config){
            return this.__initFileUploadConfig(config);
        },
        __initFileUploadConfig: function (config){
            var _formidable = zn.overwrite({}, this._config.formidable, config);
            var _webRoot = _formidable.webRoot || _formidable.root;
            if(_webRoot){
                _webRoot = node_path.resolve(process.cwd(), _webRoot);
            }else{
                _webRoot = this._webRoot || this._root;
            }

            if(!node_path.isAbsolute(_formidable.uploadDir) && _webRoot){
                _formidable.uploadDir = node_path.join(_webRoot, _formidable.uploadDir);
            }
            if(!node_path.isAbsolute(_formidable.savedDir) && _webRoot){
                _formidable.savedDir = node_path.join(_webRoot, _formidable.savedDir);
            }
            
            _formidable.webRoot = _webRoot;
            this.__initPath(_formidable.uploadDir);
            this.__initPath(_formidable.savedDir);
            
            return _formidable;
        },
        getClientIp: function (clientRequest){
            var _clientRequest = clientRequest;
            if (!_clientRequest) {
                return null;
            }
            if (_clientRequest.headers) {
                if (_clientRequest.headers['x-client-ip']) {
                    return _clientRequest.headers['x-client-ip'];
                }

                var xForwardedFor = this.getClientIpFromXForwardedFor(_clientRequest.headers['x-forwarded-for']);
                if (xForwardedFor) {
                    return xForwardedFor;
                }

                if (_clientRequest.headers['cf-connecting-ip']) {
                    return _clientRequest.headers['cf-connecting-ip'];
                }

                if (_clientRequest.headers['fastly-client-ip']) {
                    return _clientRequest.headers['fastly-client-ip'];
                }

                if (_clientRequest.headers['true-client-ip']) {
                    return _clientRequest.headers['true-client-ip'];
                }

                if (_clientRequest.headers['x-real-ip']) {
                    return _clientRequest.headers['x-real-ip'];
                }

                if (_clientRequest.headers['x-cluster-client-ip']) {
                    return _clientRequest.headers['x-cluster-client-ip'];
                }

                if (_clientRequest.headers['x-forwarded']) {
                    return _clientRequest.headers['x-forwarded'];
                }

                if (_clientRequest.headers['forwarded-for']) {
                    return _clientRequest.headers['forwarded-for'];
                }

                if (_clientRequest.headers.forwarded) {
                    return _clientRequest.headers.forwarded;
                }
            }

            if (_clientRequest.connection) {
                if (_clientRequest.connection.remoteAddress) {
                    return _clientRequest.connection.remoteAddress;
                }
                if (_clientRequest.connection.socket && _clientRequest.connection.socket.remoteAddress) {
                    return _clientRequest.connection.socket.remoteAddress;
                }
            }

            if (_clientRequest.socket && _clientRequest.socket.remoteAddress) {
                return _clientRequest.socket.remoteAddress;
            }

            if (_clientRequest.info && _clientRequest.info.remoteAddress) {
                return _clientRequest.info.remoteAddress;
            }

            if (_clientRequest.requestContext && _clientRequest.requestContext.identity && _clientRequest.requestContext.identity.sourceIp) {
                return _clientRequest.requestContext.identity.sourceIp;
            }

            return null;
        },
        initHttpHeaderCommonSetting: function (clientRequest, serverResponse){
            if(serverResponse.finished) return this;
            var _headers = clientRequest.headers,
                _origin = _headers.origin || _headers.host || _headers.Host,
                _basic = {
                    'X-Powered-By': PACKAGE.name,
                    'Server': PACKAGE.name,
                    'Server-Version': PACKAGE.version,
                    'Content-Type': (_headers["Content-Type"] || "application/json") + ';charset=' + (_headers["encoding"]||"utf-8")
                };
            var _cors = this._config.cors, _cors_type = zn.type(_cors);
            if(_cors_type == 'function') {
                _cors = _cors.call(null, clientRequest, serverResponse, this);
            }
            _cors_type = zn.type(_cors);
            switch(_cors_type) {
                case 'object':
                    _basic = zn.overwrite(_basic, _cors);
                    break;
                case 'boolean':
                    _basic = zn.overwrite(_basic, {
                        'Access-Control-Allow-Origin': _origin,
                        //'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
                        'Access-Control-Allow-Headers': 'Accept,Accept-Charset,Accept-Encoding,Accept-Language,Connection,Content-Type,Cookie,DNT,Host,Keep-Alive,Origin,Referer,User-Agent,X-CSRF-Token,X-Requested-With',
                        "Access-Control-Allow-Credentials": true,
                        'Access-Control-Max-Age': '3600',
                    });
                    if(this._config.cors_origin && typeof this._config.cors_origin == 'string') {
                        if(this._config.cors_origin == '*') {
                            _basic['Access-Control-Allow-Origin'] = '*';
                        }else if (this._config.cors_origin.length > 10 ){
                            _basic['Access-Control-Allow-Origin'] = this._config.cors_origin;
                        }
                    }
                    break;
            }

            //zn.info('【headers】：', _basic);
            for(var key in _basic){
                serverResponse.setHeader(key, _basic[key]);
            }

            return this;
        },
        getClientIpFromXForwardedFor: function (value){
            if (!value) {
                return null;
            }
        
            if (typeof value != 'string') {
                throw new TypeError(`Expected a string, got "${typeof value}"`);
            }

            var _values = value.split(',');
            for(var ip of _values){
                ip = ip.trim();
                if(ip.includes(':')) {
                    var splitted = ip.split(':');
                    if (splitted.length === 2) {
                        return splitted[0];
                    }
                }

                if(ip){
                    return ip;
                }
            }
        },
        formatSpecialCharacter: function (str){
            /*if(typeof str == 'string'){
                return str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, '&apos;');
            }*/

            if(typeof str == 'string'){
                return str.toString().replace(/&/g, "&amp;").replace(/'/g, '&apos;');
            }
            /*
            if(typeof str == 'string'){
                return str.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, '&quot;').replace(/'/g, '&apos;');
            }*/

            if(typeof str == 'object'){
                for(var key in str){
                    str[key] = this.formatSpecialCharacter(str[key]);
                }
            }

            return str;
        },
        unFormatSpecialCharacter: function (str){
            return str.toString().replace(/&amp;/g, "&").replace(/&apos;/g, "'");
            //return str.toString().replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        }
    }
});
