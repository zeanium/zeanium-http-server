/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var node_fs = require('fs');
var FileWriter = require('./FileWriter');
var _slice = Array.prototype.slice;

module.exports = zn.Class(FileWriter, {
    events: [ 'error', 'route', 'request', 'requestcount', 'requeststatus' ],
    properties: {
        paths: null
    },
    methods: {
        init: function (argv, events){
            this.super(argv);
            this._paths = zn.extend({
                error: 'zeanium.error.log',
                route: 'zeanium.route.log',
                request: 'zeanium.request.log',
                requestcount: 'zeanium.requestcount.json',
                requeststatus: 'zeanium.requeststatus.json'
            }, argv.paths);
            if(events && zn.is(events, 'object')){
                for(var key in events) {
                    this.on(key, events[key]);
                }
            }
        },
        resolveDirPath: function (year, month, date){
            var _paths = [];
            if(year){
                _paths.push(year);
            }
            if(month){
                _paths.push(month);
            }
            if(date){
                _paths.push(date);
            }

            var _path = node_path.join(this.dir, '/' + _paths.join(this.separator || '/') + '/');
            if(node_fs.existsSync(_path)){
                return _path;
            }

            return '';
        },
        resolveModuleDirPath: function (year, month, date, module){
            var _paths = [];
            if(year){
                _paths.push(year);
            }
            if(month){
                _paths.push(month);
            }
            if(date){
                _paths.push(date);
            }

            var _path = node_path.join(this.dir, '/' + _paths.join(this.separator || '/') + '/', this._paths[module||'']);
            if(node_fs.existsSync(_path)){
                return _path;
            }

            return '';
        },
        writeError: function (){
            var _value = _slice.call(arguments).join(' ');
            this.fire('error', _value);
            return this.appendText(this._paths.error, _value, true), this;
        },
        writeRoute: function (){
            var _value = _slice.call(arguments).join(' ');
            this.fire('route', _value);
            return this.appendText(this._paths.route, _value, true), this;
        },
        writeRequest: function (){
            var _value = _slice.call(arguments).join(' ');
            this.fire('request', _value);
            return this.appendText(this._paths.request, _value, true), this;
        },
        requestCount: function (path){
            var _filePath = this.getFilePath(this._paths.requestcount), _json = {};
            if(node_fs.existsSync(_filePath)){
                _json = require(_filePath);
            }
            _json[path] = (_json[path] || 0) + 1;

            this.fire('requestcount', _json);
            return this.writeJSONFilePath(_filePath, _json), this;
        },
        requestStatus: function (path, status){
            var _filePath = this.getFilePath(this._paths.requeststatus), _json = {};
            if(node_fs.existsSync(_filePath)){
                _json = require(_filePath);
            }
            _json[path] = status;

            this.fire('requeststatus', _json);
            return this.writeJSONFilePath(_filePath, _json), this;
        }
    }
});
