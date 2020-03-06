/**
 * Created by yangyxu on 8/20/14.
 */
var node_fs = require('fs');
var node_path = require('path');
var Application = require('./Application.js');
var ServerController = require('./controller/ServerController.js');

var VARS = require('./static/VARS.js');

module.exports = zn.Class({
    methods: {
        __deploy: function (){
            this.__loadDefault();
            this.__loadAppsByConfig();
        },
        __loadDefault: function (){
            this.__loadDefaultControllers();
            this.__loadDefaultApps();
        },
        __loadDefaultControllers: function (){
            return zn.extend(this._routers, this.__convertControllerToRouters(ServerController)), this;
        },
        __loadDefaultApps: function (){
            this.__loadDirectory(node_path.join(__dirname, 'www'));
        },
        __loadDirectory: function (directory){
            var _files = node_fs.readdirSync(directory, {
                encoding: 'utf8',
                withFileTypes: true
            });
            _files.forEach(function (file){
                if(file.isDirectory() && node_fs.existsSync(node_path.join(directory, file.name, this._config.app_config || VARS.CONFIG.app))){
                    this.__createApplication(node_path.join(directory, file.name));
                }
            }.bind(this));
        },
        __createApplication: function (configPath){
            var _fstat = node_fs.statSync(configPath),
                _configFileName = this._config.app_config || VARS.CONFIG.app;
            if(_fstat.isDirectory()){
                if(!node_fs.existsSync(node_path.resolve(configPath, _configFileName))){
                    return this.__loadDirectory(configPath);
                }
                configPath = node_path.resolve(configPath, _configFileName);
            }

            if(!node_fs.existsSync(configPath)){  
                return false;
            }
            var _config = require(configPath),
                _path = configPath.replace(_configFileName, '');
            
            return this.createApplicaton(_config, _path);
        },
        createApplicaton: function (_config, _path){
            if(_config && _path){
                if(!_config.root) {
                    _config.root = _path
                }
                if(!_config.deploy){
                    var _temps = _path.split(node_path.sep).reverse(),
                        _i = 0,
                        _deploy = _temps[_i];
                    while(!_deploy) {
                        _i = _i + 1;
                        _deploy = _temps[_i];
                    }

                    _config.deploy = _deploy;
                }
            }

            return new Application(_config, this);
        },
        __loadAppsByConfig: function (){
            var _config = this._config,
                _appConfigFileName = _config.app_config || VARS.CONFIG.app;

            _config.node_modules && _config.node_modules.forEach(function (name, index){
                this.__createApplication(require.resolve(node_path.join(name, _appConfigFileName)));
            }.bind(this));
            
            _config.paths && _config.paths.forEach(function (path){
                this.__createApplication(node_path.resolve(node_path.join(this.root, path, _appConfigFileName)));
            }.bind(this));

            
            if(_config.app){
                this.createApplicaton(app, this.root);
            } 
            
            if(_config.apps && zn.is(_config.apps, 'array')){
                _config.apps.forEach((app)=> this.createApplicaton(app, this.root));
            }
            
            return this.__createApplication(this.root), this;
        }
    }
});