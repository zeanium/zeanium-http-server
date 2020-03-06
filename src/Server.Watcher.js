/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var chokidar = require('chokidar');
module.exports = zn.Class({
    methods: {
        __initWatcher: function (){
            this._changedFiles = [];
            this._isWatching = false;
        },
        initWatchCwd: function (){
            var _config = this._config;
            return node_path.resolve(process.cwd(), _config.catalog, _config.watcher.cwd);
        },
        __watchingFileChangedByPath: function (callback){
            if(this._isWatching) return false;
            this._isWatching = true;
            var _watcher = this._config.watcher;
            _watcher.cwd = this.initWatchCwd();
            zn.info('Watching Path: ', _watcher.cwd);
            chokidar.watch('.', _watcher)
            .on('raw', function(event, path, details) {
                var _return = zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.SERVER_CONTEXT, "fileChanged", [event, path, details]);
                if(_return === false) return _return;
                var _path = path || details.path || details.watchedPath;
                if(_path.substr(-3, 3)=='.js'){
                    if(this._changedFiles.indexOf(_path)==-1 && event!=='unknown'){
                        this._changedFiles.push(_path);
                        this.unload(_path);
                        zn.info(event, ' : ', _path);
                        this.__doFileChanged(callback, event, _path, details);
                        
                    }
                }
            }.bind(this));
        },
        __doFileChanged: function (callback, event, path, details){
            var _delay = this._delay || this._config.delay || 3000;
            if(_delay > 0){
                this._delay = _delay;
                if(!this._interval){
                    this._interval = setInterval(function (){
                        if(this._delay > 0){
                            this._delay = this._delay - 1000;
                        }else {
                            this._delay = null;
                            if(this._interval) {
                                clearInterval(this._interval);
                                this._interval = null;
                            }
                            callback && callback.call(this, event, path, details);
                        }
                    }.bind(this), 1000);
                }
            }
        },
        unload: function (path){
            path = require.resolve(path);
            var module = require.cache[path];
            require.cache[path] = null;
            delete require.cache[path];
            
            // remove reference in module.parent
            if (module && module.parent) {
                module.parent.children.splice(module.parent.children.indexOf(module), 1);
                this.unload(module.parent.filename);
            }

            module = null;
        }
    }
});
