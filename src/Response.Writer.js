/**
 * Created by yangyxu on 8/20/14.
 */
var VARS = require('./static/VARS');
var ERRORS = require('./static/ERRORS');
var MIMES = require('./static/MIMES');
var node_fs = require('fs');
var node_path = require('path');


module.exports = zn.Class({
    methods: {
        writeHead: function (statusCode, statusMessage, headers){
            if(this._serverResponse.finished || this._serverResponse.writableEnded || this._serverResponse.writableFinished) return this;
            return this._serverResponse.writeHead(statusCode, statusMessage, headers), this;
        },
        write: function (chunk, encoding, callback){
            if(this._serverResponse.finished || this._serverResponse.writableEnded || this._serverResponse.writableFinished) return this;
            return this._serverResponse.write(chunk, encoding, callback), this;
        },
        success: function (content, code, message){
            return this.JSONWrite(content, code || 200, message), this;
        },
        error: function (content, code, message){
            return this.JSONWrite(content, code || 500, message), this;
        },
        jsonp: function (){

        },
        send: function (){

        },
        serverError: function (){

        },
        JSONWrite: function (content, code, message){
            if(content instanceof Error) {
                content = {
                    message: content.message,
                    stack: content.stack
                };
            }
            var _data = {
                result: content
            };
            if(code){
                _data.code = code;
                message = VARS.HTTP_MESSAGE[code] || ERRORS[code].detail;
            }
            if(message){
                _data.message = message;
            }
            _data.timestamp = ((new Date()).getTime() - this._request._clientRequest.currentTimestamp) + 'ms';
            return this.HTTPSuccess(JSON.stringify(_data), "JSON"), false;
        },
        JSONSuccess: function (content, code, message){
            return this.JSONWrite(content, code || 200, message), this;
        },
        JSONError: function (content, message, code){
            return this.JSONWrite(content, code || 500, message), this;
        },
        HTTPWrite: function (content, code, message){
            if(this._serverResponse.finished) return this;
            this.setCommonHeaders();
            this.setStatus(code, VARS.HTTP_MESSAGE[code] || message);
            this.write(content);
            return this.end(), this;
        },
        HTTPSuccess: function (content, contentType, encoding){
            if(this._serverResponse.finished) return this;
            this.setCommonHeaders();
            if(contentType){
                this.setContentType(this.getContentType(contentType, encoding));
            }
            this.setStatus(VARS.HTTP_STATUS.SUCCESS.OK, VARS.HTTP_MESSAGE[VARS.HTTP_STATUS.SUCCESS.OK]);
            this.write(content, encoding);
            return this.end(), this;
        },
        HTTPError: function (code, detail, message, encoding){
            if(this._serverResponse.finished) return this;
            this.setCommonHeaders();
            if(code){
                var _error = ERRORS[code] | {};
                message = message || VARS.HTTP_MESSAGE[code] || _error.msg;
                detail = detail || _error.detail;
                this.setStatus(code, message);
            }
            if(detail){
                this.write(detail, encoding);
            }
            return this.end(), this;
        },
        downloadExcel: function (filename, xlsx){
            this.setCommonHeaders();
            this.writeHead(200, {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                'Content-disposition': 'attachment; filename=' + encodeURI(filename) + '.xlsx'
            });
            xlsx.generate(this._serverResponse);
        },
        downloadFile: function (filename, filepath){
            if(filepath.charAt(0) != '/'){
                filepath = node_path.resolve(process.cwd(), filepath);
            }
            if(!node_fs.existsSync(filepath)){
                var _errMsg = filepath + ' is not exist.';
                zn.error(_errMsg);
                return this.error(_errMsg), false;
            }
            var _rs = node_fs.createReadStream(filepath);
            this.setCommonHeaders();
            this._serverResponse.setHeader('Content-Type', "application/force-download;charset=binary");
            this._serverResponse.setHeader('Content-Disposition', "attachment; filename=" + filename);
            _rs.pipe(this._serverResponse);
        },
        readFile: function (filepath){
            if(filepath.charAt(0) != '/'){
                filepath = node_path.resolve(process.cwd(), filepath);
            }
            if(!node_fs.existsSync(filepath)){
                var _errMsg = filepath + ' is not exist.';
                zn.error(_errMsg);
                return this.error(_errMsg), false;
            }
            var _extname = node_path.extname(filepath).toLowerCase(),
                _mime = MIMES[_extname] || {
                    contentType: 'text/plain',
                    encoding: 'binary'
                };
            if(typeof _mime == 'string'){
                _mime = {
                    contentType: _mime,
                    encoding: 'binary'
                };
            }
            var _content = node_fs.readFileSync(filepath, {
                encoding: _mime.encoding,
                flag: 'r'
            });
            this.setCommonHeaders();
            this._serverResponse.setHeader('Content-Type', _mime.contentType + ";charset=" + _mime.encoding);
            this._serverResponse.setHeader('Content-Length', Buffer.byteLength(_content, _mime.encoding));
            this._serverResponse.writeHead(200, "OK");
            this._serverResponse.end(_content, _mime.encoding);
        }
    }
});
