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
        routes: null,
        root: null,
        webRoot: null
    },
    methods: {
        init: function (config, serverContext){
            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.APPLICATION, "init", [this, config, serverContext]);
            zn.info("Loading Path: ", config.root);
            var _config = zn.deepAssigns({}, CONFIG, config);
            this._config = _config;
            this._root = _config.root || process.cwd();
            this._webRoot = node_path.join(this._root, (_config.webRoot||''));
            this._serverContext = serverContext;
            this._controllers = {
                '__$__': ApplicationController
            }
            this.__initial(_config, serverContext);
            serverContext.registerApplication(this);
            zn.info("Application[ ", config.deploy, " ] Loaded.");
            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.APPLICATION, "loaded", [this, config, serverContext]);
        },
        existPath: function (path){
            return node_fs.existsSync(node_path.join(this._webRoot, path));
        },
        resolvePath: function (path){
            return node_path.join(this._webRoot, path);
        },
        resolveModel: function (modelName){
            return this._models[modelName] || this._models[config.deploy + '.' + modelName];
        },
        __initial: function (config, serverContext){
            var _deploy = config.deploy;
            this.__initModules(config.modules);
            this.__loadMiddlewares(config.middlewares);
            this._models = {};
            this._modelArray = [];
            this.__loadPackages(config.models, function (key, model){
                model.setMeta('application', _deploy);
                if(config.table_prefix){
                    model.setMeta('tablePrefix', config.table_prefix);
                    this._models[_deploy + '.' + config.table_prefix + key] = this._serverContext._models[_deploy + '.' + config.table_prefix + key] = model;
                }
                if(model.getMeta('alias')){
                    this._models[_deploy + '.' + model.getMeta('alias')] = this._serverContext._models[_deploy + '.' + model.getMeta('alias')] = model;
                }
                this._modelArray.push(model);
                this._models[_deploy + '.' + key] = this._serverContext._models[_deploy + '.' + key] = model;
            }.bind(this));
            zn.extend(this._controllers,  this.__loadPackages(config.controllers));
            this._routes = this.__initRoutes(this._controllers);
            this._formidable = this._serverContext.__initFileUploadConfig(this._config);

            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.APPLICATION, "initial", [this, config, serverContext]);
        },
        __initModules: function (modules){
            if(zn.is(modules, 'array')) {
                this._modules = this.__requires(modules, function (md, path){
                    zn.debug('Loaded Module: ', { name: md, path: path });
                }.bind(this));
            } else if(zn.is(modules, 'object')){
                this._modules = {};
                for(var key in modules) {
                    this._modules[key] = this.__require(modules[key], function (md, path){
                        zn.debug('Loaded Module: ', { key: key, name: md, path: path });
                    }.bind(this));
                    zn.path(global, key, this._modules[key]);
                }
            }
        },
        __initRoutes: function (controllers){
            var _routes = [];
            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.APPLICATION, "initControllers", [this, controllers]);
            
            if(controllers){
                zn.each(controllers, function (Controller, name){
                    Controller.name = name;
                    _routes = _routes.concat(this._serverContext.__convertControllerToRouters(Controller, this));
                }.bind(this));
            }
            
            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.APPLICATION, "initRoutes", [this, _routes]);
            
            return _routes;
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
        __resolve: function (path){
            var _paths = process.env.NODE_PATH.split(':');
            for(var i = 0, _len = _paths.length; i < _len; i++){
                if(node_fs.existsSync(node_path.join(_paths[i], path))){
                    return node_path.join(_paths[i], path);
                }
            }
        },
        __requires: function (paths, callback){
            var _exports = {},
                _temp = null;

            if(!paths){
                return _exports;
            }

            if(typeof paths == 'string'){
                paths = [paths];
            }
            
            paths.forEach(function (path){
                _temp = this.__require(path, callback);
                if(_temp) {
                    _exports[_temp.__exports__ || path] = _temp; 
                }
            }.bind(this));

            return _exports;
        },
        __require: function (path, callback){
            var _path = node_path.resolve(path);
            if(!node_fs.existsSync(_path)){
                _path = this.__resolve(path);
            }

            if(node_fs.existsSync(_path)){
                callback && callback(path, _path);
                return require(path);
            }
        }
    }
});