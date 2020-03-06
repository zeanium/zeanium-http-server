/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var node_fs = require('fs');
var ApplicationController = require('./controller/ApplicationController');
var CONFIG = require('./config/zn.app.config.js');


module.exports = zn.Class({
    properties: {
        config: null,
        serverContext: null,
        formidable: null,
        controllers: null,
        models: null,
        modules: null,
        routers: null
    },
    methods: {
        init: function (config, serverContext){
            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.APPLICATION, "init", [this, config, serverContext]);
            zn.info("Loading Path: ", config.root);
            var _config = zn.deepAssigns({}, CONFIG, config);
            this._config = _config;
            this._serverContext = serverContext;
            this._controllers = {
                '__$__': ApplicationController
            }
            this.__initial(_config, serverContext);
            serverContext.registerApplication(this);
            zn.info("Application[ ", config.deploy, " ] Loaded.");
            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.APPLICATION, "loaded", [this, config, serverContext]);
        },
        acceptRequest: function (clientRequest, serverResponse){
            var _fragments = clientRequest.meta.fragments;
            var _deploy = _fragments.shift();
            var _path = node_path.join(this.config.root, _fragments.join(node_path.sep));
            if(node_fs.existsSync(_path)){
                clientRequest.root = _path;
                return this._serverContext.doStatic(clientRequest, serverResponse), this;
            }
            var _router = this._routers[clientRequest.meta.pathname];
            if(_router){
                clientRequest.router = _router;
                return this._serverContext.doRequest(clientRequest, serverResponse), this;
            } else {
                return this._serverContext.doError(serverResponse, 404, "Not Found."), this;
            }
        },
        __initial: function (config, serverContext){
            this._modules = this.__require(config.modules, function (md, path){
                zn.debug('Loading Module: ', md, path);
            }.bind(this));
            this.__loadMiddlewares(config.middlewares);
            this._models = this.__loadPackages(config.models, function (key, model){
                if(config.table_prefix){
                    model.setMeta('table', config.table_prefix + model.getMeta('table'));
                }
            });
            zn.extend(this._controllers,  this.__loadPackages(config.controllers));
            this._routers = this.__initRouters(this._controllers);
            this._formidable = this.__initFileUploadConfig();

            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.APPLICATION, "initial", [this, config, serverContext]);
        },
        __initRouters: function (controllers){
            var _routers = {};
            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.APPLICATION, "initControllers", [this, controllers]);
            
            if(controllers){
                zn.each(controllers, function (Controller, name){
                    Controller.name = name;
                    zn.extend(_routers, this._serverContext.__convertControllerToRouters(Controller, this));
                }.bind(this));
            }
            
            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.APPLICATION, "initRouters", [this, _routers]);
            
            return _routers;
        },
        __initPath: function (path){
            if(node_path.isAbsolute(path)){
                return path;
            }
            var _paths = path.split(node_path.sep),
                _path;
            _paths.map(function (value){
                if(value){
                    _path = _path ? node_path.join(_path, value) : node_path.sep + value;
                    if(!node_fs.existsSync(_path)){
                        node_fs.mkdirSync(_path, 0766);
                    }
                }
            });
        },
        __initFileUploadConfig: function (config){
            var _formidable = zn.overwrite({}, this.serverContext.config.formidable, this.config.formidable, config);
            var _root = _formidable.root || this.serverContext.root;
            if(_root){
                _formidable.uploadDir = node_path.join(_root, _formidable.uploadDir);
                _formidable.savedDir = node_path.join(_root, _formidable.savedDir);
            }
            this.__initPath(_formidable.uploadDir);
            this.__initPath(_formidable.savedDir);

            return _formidable;
        },
        __loadMiddlewares: function (paths){
            if(paths){
                var _server = this._serverContext._server,
                    _root = this._config.root;

                if(typeof paths == 'string'){
                    paths = [paths];
                }

                paths.forEach(function (path){
                    if(node_fs.existsSync(node_path.join(_root, path))) {
                        _server.__loadMiddlewares(require(node_path.join(_root, path)));
                    }
                });
            }

            return this;
        },
        __loadPackages: function (paths, callback){
            var _exports = {},
                _path = null,
                _temps = {};

            if(!paths){
                return _exports;
            }

            if(typeof paths == 'string'){
                paths = [paths];
            }

            paths.forEach(function (path){
                _path = node_path.join(this._config.root, path);
                if(!node_fs.existsSync(_path)) {
                    return;
                }
                _temps = require(_path);
                for(var key in _temps){
                    callback && callback(key, _temps[key], path, _path);
                    _exports[key] = _temps[key];
                }
            }.bind(this));

            return _exports;
        },
        __require: function (paths, callback){
            var _exports = {},
                _path = null;

            if(!paths){
                return _exports;
            }

            if(typeof paths == 'string'){
                paths = [paths];
            }
            paths.forEach(function (path){
                _path = node_path.resolve(path);
                if(node_fs.existsSync(_path)){
                    callback && callback(path, _path);
                    zn.extend(_exports, require(path));
                }
            }.bind(this));

            return _exports;
        }
    }
});