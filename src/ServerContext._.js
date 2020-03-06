/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var node_fs = require('fs');
var ServerContextDeployer = require('./ServerContext.Deployer.js');
var ServerContextRequestDispatcher = require('./ServerContext.RequestDispatcher.js');
var ServerContextRequestRouter = require('./ServerContext.RequestRouter.js');
var MemorySessionContext = require('./session/MemorySessionContext');

module.exports = zn.Class({
    mixins: [ ServerContextDeployer, ServerContextRequestDispatcher, ServerContextRequestRouter ],
    properties: {
        config: null,
        server: null,
        path: null,
        root: null,
        url: null,
        apps: null,
        routers: null,
        modules: null,
        sessionContext: null
    },
    methods: {
        init: function (config, server){
            this.super(config, server);
            this._config = config;
            this.sets({
                server: server,
                path: __dirname,
                url: this.__parseURL(config.host, config.port),
                root: node_path.join(process.cwd(), config.catalog)
            });
            this.__initial(config);
            this.__initSessionContext();
            this.__deploy();
            this.__loadingCompleted();
        },
        formatToAbsolutePath: function (path){
            return node_path.join(this._root, path);
        },
        registerApplication: function (application){
            this._apps[application.config.deploy] = application;
            return zn.extend(this._routers, application.routers), this;
        },
        __initial: function (config){
            this._apps = {};
            this._routers = {};
            this._modules = this.__loadPackages(config.modules);
        },
        __initSessionContext: function (){
            var _config = this._config.session,
                _Context = _config.Context || MemorySessionContext;
            this._sessionContext = new _Context(_config, this);
        },
        __loadingCompleted: function (){
            var _timestamp = (new Date()).getTime() - this._server._beginTimestamp;
            this._server.__forEachNetworkInterfaces(function (value, index){
                if(value.family == 'IPv4'){
                    zn.info(this.__parseURL(value.address));
                }
            }.bind(this));
            zn.info('[ ',_timestamp, 's ] Loading Completed.')
        },
        __parseURL: function (host){
            return (this._config.https?'https':'http') + '://' + host + ":" + this._config.port;
        },
        __convertControllerToRouters: function (Controller, application){
            var _deploy = application ? application._config.deploy : '',
                _routers = {},
                _router = null,
                _member = null;

            var _key = Controller.getMeta('controller') || Controller.name;
            var _validate = (Controller.getMeta('validate') !== undefined) ? Controller.getMeta('validate') : false;
            var _controller = new Controller(this, application);
            Controller._methods_.forEach(function (method){
                if(method!="init"){
                    _member = Controller.member(method);
                    if(_member.meta.router !== null){
                        _router = _member.meta.router || _member.name;
                        _router = node_path.join(node_path.sep, _deploy, _key, _router);
                        _routers[_router] = {
                            action: method,
                            application: application,
                            controller: _controller,
                            router: _router,
                            handler: _member,
                            meta: {
                                deploy: _deploy,
                                controller: _key,
                                router: _router
                            },
                            validate: (_member.meta.validate !== undefined) ? _member.meta.validate : _validate
                        };
                    }
                }
            });

            return _routers;
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
