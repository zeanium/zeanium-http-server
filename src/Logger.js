/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var node_fs = require('fs');

var _slice = Array.prototype.slice;

module.exports = zn.Class({
    properties: {
        config: null,
        context: null
    },
    methods: {
        init: function (config, context){
            this._config = zn.extend({ 
                dir: './log/',
                request: 'request.log',
                error: 'error.log',
                route: 'route.log'
            }, config);
            this._context = context;
            this._dir = node_path.resolve(process.cwd(), this._config.dir);
            if(!node_fs.existsSync(this._dir)){
                node_fs.mkdirSync(this._dir, { recursive: true });
            }
        },
        __getNowDayString__: function (){
            var _now = new Date();
            return (_now.getFullYear() + '_' + (_now.getMonth() + 1) + '_' + _now.getDate());
        },
        writeRequest: function (){
            var _path = node_path.join(this._dir, '/' + this.__getNowDayString__() + '/'),
                _file = node_path.join(_path, (this._config.request || 'request.log')),
                _content = _slice.call(arguments).join(' ') + '\n';
            if(!node_fs.existsSync(_path)){
                node_fs.mkdirSync(_path, { recursive: true });
            }
            if(!node_fs.existsSync(_file)){
                node_fs.writeFileSync(_file, _content);
            }else{
                node_fs.appendFileSync(_file, _content);
            }

            return this;
        },
        writeError: function (){
            var _path = node_path.join(this._dir, '/' + this.__getNowDayString__() + '/'),
                _file = node_path.join(_path, (this._config.error || 'error.log')),
                _content = _slice.call(arguments).join(' ') + '\n';
            if(!node_fs.existsSync(_path)){
                node_fs.mkdirSync(_path, { recursive: true });
            }
            if(!node_fs.existsSync(_file)){
                node_fs.writeFileSync(_file, _content);
            }else{
                node_fs.appendFileSync(_file, _content);
            }

            return this;
        },
        writeRoute: function (){
            var _path = node_path.join(this._dir, '/' + this.__getNowDayString__() + '/'),
                _file = node_path.join(_path, (this._config.route || 'route.log')),
                _content = _slice.call(arguments).join(' ') + '\n';
            if(!node_fs.existsSync(_path)){
                node_fs.mkdirSync(_path, { recursive: true });
            }
            if(!node_fs.existsSync(_file)){
                node_fs.writeFileSync(_file, _content);
            }else{
                node_fs.appendFileSync(_file, _content);
            }

            return this;
        },
        requestCount: function (path){
            var _path = node_path.join(this._dir, '/' + this.__getNowDayString__() + '/'),
                _file = node_path.join(_path, 'request.count.json'),
                _content = {};
            if(!node_fs.existsSync(_path)){
                node_fs.mkdirSync(_path, { recursive: true });
            }
            if(node_fs.existsSync(_file)){
                _content = require(_file);
            }

            _content[path] = (_content[path] || 0) + 1;
            node_fs.writeFileSync(_file, JSON.stringify(_content, null, 4));
            return this;
        },
        requestStatus: function (path, status){
            var _path = node_path.join(this._dir, '/' + this.__getNowDayString__() + '/'),
                _file = node_path.join(_path, 'request.status.json'),
                _content = {};
            if(!node_fs.existsSync(_path)){
                node_fs.mkdirSync(_path, { recursive: true });
            }
            if(node_fs.existsSync(_file)){
                _content = require(_file);
            }

            _content[path] = status;
            node_fs.writeFileSync(_file, JSON.stringify(_content, null, 4));
            return this;
        }
    }
});
