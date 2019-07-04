/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var chokidar = require('chokidar');
module.exports = zn.Class({
    methods: {
        init: function (){
            this._changedFiles = [];
            this._isWatching = false;
        },
        initWatchCwd: function (){
            var _config = this._config;
            return node_path.join(process.cwd(), _config.catalog, _config.watcher.cwd);
        },
        watchingFileChangedByPath: function (callback){
            if(this._isWatching) return false;
            this._isWatching = true;
            var _watcher = this._config.watcher;
            _watcher.cwd = this.initWatchCwd();
            
            chokidar.watch('.', _watcher)
            .on('raw', function(event, path, details) {
                var _return = this.server.callMiddlewareMethod("ServerContent", "fileChanged", [event, path, details]);
                if(_return === false) return _return;
                var _path = path || details.path || details.watchedPath;
                if(_path.substr(-3, 3)=='.js'){
                    if(this._changedFiles.indexOf(_path)==-1 && event!=='unknown'){
                        this._changedFiles.push(_path);
                        zn.info(event, ' : ', _path);
                        callback && callback.call(this, event, _path, details);
                    }
                }
            }.bind(this));

            zn.info('Watching Path: ', _watcher.cwd);
        },
        __doFileChanged: function (){
            
        }
    }
});
