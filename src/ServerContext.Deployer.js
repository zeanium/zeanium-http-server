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
                if(file.isDirectory() && node_fs.existsSync(node_path.join(directory, file.name, VARS.CONFIG.app))){
                    this.__createApplication(node_path.join(directory, file.name));
                }
            }.bind(this));
        },
        __createApplication: function (path){
            var _configPath = node_path.join(path, VARS.CONFIG.app);
            if(!node_fs.existsSync(_configPath)){ return this.__loadDirectory(path); }
            var _config = require(_configPath);
            if(!_config.deploy){
                var _deploy = null,
                    _temps = path.split(node_path.sep).reverse();
                _temps.map(function (item){
                    if(item && !_deploy){ _deploy = item; }
                });
                _config.deploy = _deploy;
            }
            _config.root = path;
            return new Application(_config, this);
        },
        __loadAppsByConfig: function (){
            var _config = this._config;

            _config.node_modules && _config.node_modules.forEach(function (name, index){
                this.__createApplication(require.resolve(name));
            }.bind(this));
            
            _config.paths && _config.paths.forEach(function (path){
                this.__createApplication(node_path.resolve(this.root, path));
            }.bind(this));

            return this.__createApplication(this.root), this;
        }
    }
});