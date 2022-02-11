/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var node_fs = require('fs');
var ApplicationController = require('./controller/ApplicationController');
var CONFIG = require('./config/zn.app.config.js');
var Middleware = require('./Middleware');

module.exports = zn.Class({
    properties: {
        config: null,
        serverContext: null,
        formidable: null,
        controllers: null,
        R: null,
        Sql: null,
        services: null,
        models: null,
        modules: null,
        routes: null,
        root: null,
        webRoot: null
    },
    methods: {
        init: function (config, serverContext){
            Middleware.callMiddlewareMethod(Middleware.TYPES.APPLICATION, "init", [this, config, serverContext]);
            zn.info("Loading Path: ", config.root);
            var _config = zn.deepAssigns({}, CONFIG, config);
            this._config = _config;
            this._root = _config.root || process.cwd();
            this._webRoot = node_path.join(this._root, (_config.webRoot||''));
            this._serverContext = serverContext;
            this._controllers = {
                '__$__': ApplicationController
            }

            if(config.deploy){
                zn.path(zn.GLOBAL, config.deploy, {
                    deploy: config.deploy,
                    config: this._config,
                    root: this._root,
                    webRoot: this._webRoot
                });
            }

            this.__initial(_config, serverContext);
            serverContext.registerApplication(this);

            var _version = '';
            if(node_fs.existsSync(node_path.join(config.root, './package.json'))){
                this._package = require(node_path.join(config.root, './package.json'));
                _version = this._package.version;
            }
            zn.info("Application[ ", config.deploy, ':', _version, " ] Loaded.");
            Middleware.callMiddlewareMethod(Middleware.TYPES.APPLICATION, "loaded", [this, config, serverContext]);
        },
        setGlobalValue: function (key, value){
            return zn.path(zn.GLOBAL, this._config.deploy + '.' + key, value), this;
        },
        existPath: function (path){
            return node_fs.existsSync(node_path.join(this._webRoot, path));
        },
        resolvePath: function (path){
            return node_path.join(this._webRoot, path);
        },
        resolveModel: function (modelName){
            return this._models[modelName] || this._models[this._config.deploy + '.' + modelName];
        },
        registerModelSql: function (key, modelSql){
            if(!this._Sql) {
                this._Sql = {};
            }

            return this._Sql[key] = modelSql, modelSql;
        },
        resolveModelSql: function (key){
            return this._Sql[key];
        },
        __initial: function (config, serverContext){
            var _deploy = config.deploy;
            this._Sql = {};
            this._models = {};
            this._modelArray = [];
            if(config.modules) {
                this.__initModules(config.modules);
            }

            if(config.middlewares) {
                this.__loadMiddlewares(config.middlewares);
            }

            if(config.models) {
                this.__loadPackages(config.models, function (key, model){
                    model = Middleware.callMiddlewareMethod(Middleware.TYPES.MODEL, "load", [key, model, this, serverContext]) || model;
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
                    this.setGlobalValue('models', this._models);
                    Middleware.callMiddlewareMethod(Middleware.TYPES.APPLICATION, "modelLoaded", [key, model, this, serverContext]);
                    Middleware.callMiddlewareMethod(Middleware.TYPES.MODEL, "loaded", [key, model, this, serverContext]);
                }.bind(this));
            }

            if(config.R){
                this._R = this.__loadPackages(config.R);
                this.setGlobalValue('R', this._R);
            }

            if(config.controllers) {
                zn.extend(this._controllers,  this.__loadPackages(config.controllers));
                this.setGlobalValue('controllers', this._controllers);
            }
            
            if(config.services){
                this._services = this.__loadServices(config.services);
                this.setGlobalValue('services', this._services);
            }

            this._routes = this.__initRoutes(this._controllers);
            this.setGlobalValue('routes', this._routes);
            this._formidable = this._serverContext.__initFileUploadConfig(this._config.formidable);

            Middleware.callMiddlewareMethod(Middleware.TYPES.APPLICATION, "initial", [this, config, serverContext]);
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
            this.setGlobalValue('modules', this._modules);
        },
        __initRoutes: function (controllers){
            var _routes = [];
            Middleware.callMiddlewareMethod(Middleware.TYPES.APPLICATION, "initControllers", [this, controllers]);
            
            if(controllers){
                zn.each(controllers, function (Controller, name){
                    Controller.name = name;
                    _routes = _routes.concat(this._serverContext.__convertControllerToRouters(Controller, this));
                }.bind(this));
            }
            
            Middleware.callMiddlewareMethod(Middleware.TYPES.APPLICATION, "initRoutes", [this, _routes]);
            
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
        __loadServices: function (paths){
            var _services = {}, _this = this;
            if(paths){
                var _root = this._config.root;

                if(typeof paths == 'string'){
                    paths = [paths];
                }

                paths.forEach(function (path){
                    if(node_fs.existsSync(node_path.join(_root, path))) {
                        var _name = null;
                        var _Service = null;
                        var _Services = require(node_path.join(_root, path));
                        for(var key in _Services){
                            _Service = _Services[key];
                            _name = _Service.getMeta('service') || key;
                            if(_name){
                                zn.path(_services, _name, new _Service(_this._serverContext, _this));
                            }
                        }
                    }
                });
            }

            return _services;
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