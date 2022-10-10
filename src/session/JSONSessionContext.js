var node_fs = require('fs');
var node_path = require('path');

module.exports = zn.SessionContext('ZNSession-JSON', {
    properties: {
        path: null
    },
    methods: {
        init: function (config, serverContext){
            var _path = config.path || './session.data/';
            this._path = this.resolvePath(_path);
            this.super(config, serverContext);
        },
        resolvePath: function (path){
            var _session_path = node_path.join(process.cwd(), path);
            if(!node_fs.existsSync(_session_path)) {
                node_fs.mkdirSync(_session_path, { recursive: true });
            }

            return _session_path;
        },
        getJSONFilePath: function (filename){
            return node_path.join(this._path, filename + '.json');
        },
        cleanUp: function (success, error){
            success && success();

            return this;
        },
        removeSession: function (session){
            if(!session) return this;
            var _sessionKey = session.getKey(), _file_path = this.getJSONFilePath(_sessionKey);
            if(node_fs.existsSync(_file_path)){
                zxnz.file.unlinkSync(_file_path);
            }
        },
        saveSession: function (session){
            if(!session) return this;
            var _sessionKey = session.getKey(), _file_path = this.getJSONFilePath(_sessionKey);
            console.log('[session file]: ', _file_path);
            return node_fs.writeFileSync(_file_path, JSON.stringify(session.getProps(), null, 4)), this;
        },
        getIds: function (success, error){
            var _ids = [];
            zxnz.file.eachdir(this.path, (dirent, filepath)=>{
                if(dirent.isFile){
                    var _data = require(filepath);
                    _ids.push(_data.id);
                }
            });

            return success && success(_ids), _ids;
        },
        getKeys: function (success, error){
            var _keys = [];
            zxnz.file.eachdir(this.path, (dirent, filepath)=>{
                if(dirent.isFile){
                    var _data = require(filepath);
                    _keys.push(_data.key);
                }
            });
            
            return success && success(_keys), _keys;
        },
        getSession: function (sessionKey){
            return this.getSessionByKey(sessionKey, success, error);
        },
        getSessionByKey: function (sessionKey, success, error){
            var _file_path = this.getJSONFilePath(sessionKey);
            if(!node_fs.existsSync(_file_path)) {
                return error && error(new Error('session key : ' + sessionKey + ' is not exist!'));
            }

            var _props = require(_file_path);
            if(_props && zn.is(_props, 'object')){
                var _session = this.newSession(_props);
                _session.updateExpiresTime();
                _session.isNew = false;
                _session.save();
                return success && success(_session);
            }

            return error && error(new zn.ERROR.HttpRequestError({
                code: 401,
                message: "401.1 Token失效",
                detail: "登录Token已经过期失效。"
            }));
        },
        getSessionById: function (sessionId, success, error){
            
        },
        validateSession: function (sessionId){
            throw new Error("The Method Has's Implement.");
        },
        empty: function (){
            return zxnz.file.unlinkFolder(this.path), this;
        },
        size: function (success, error){
            var _dir = node_fs.readdirSync(this.path, { withFileTypes: true });
            return success && success(_dir.length), this;
        }
    }
});