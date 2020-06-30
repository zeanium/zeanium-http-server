/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var node_fs = require('fs');
var ServerContextDeployer = require('./ServerContext.Deployer.js');
var ServerContextRequestDispatcher = require('./ServerContext.RequestDispatcher.js');
var ServerContextRequestRouter = require('./ServerContext.RequestRouter.js');
var MemorySessionContext = require('./session/MemorySessionContext');
var PathMatcher = require('./PathMatcher');
var Logger = require('./Logger');

module.exports = zn.Class({
    mixins: [ ServerContextDeployer, ServerContextRequestDispatcher, ServerContextRequestRouter ],
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
        sessionContext: null
    },
    methods: {
        init: function (config, server){
            this.super(config, server);
            this._config = config;
            this._server = server;
            this._path = __dirname;
            this._models = {};
            this._logger = new Logger(config.log, this);
            this._url = this.__parseURL(config.host, config.port);
            this._root = node_path.resolve(process.cwd(), (config.root || './'));
            this._webRoot = node_path.resolve(process.cwd(), (config.web_root || './'));
            this._pathMatcher = new PathMatcher({
                pathSeparator: config.pathSeparator,
                pathParameterSymbol: config.pathParameterSymbol
            });
            this.__initial(config);
            this.__initSessionContext();
            this.__deploy();
            this.__loadingCompleted();
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
        __initial: function (config){
            this._apps = {};
            this._routes = [];
            this._modules = this.__loadPackages(config.modules);
        },
        __initSessionContext: function (){
            var _config = this._config.session,
                _Context = _config.Context || MemorySessionContext;
            this._sessionContext = new _Context(_config, this);
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
            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.SERVER_CONTEXT, "loadCompleted", [_timestamp, _urls, this]);
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
        }
    }
});
