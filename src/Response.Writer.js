/**
 * Created by yangyxu on 8/20/14.
 */
var VARS = require('./static/VARS');
var ERRORS = require('./static/ERRORS');

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
            this.setHeaders(this.getResponseHTTPHeaders());
            this.setStatus(code, VARS.HTTP_MESSAGE[code] || message);
            this.write(content);
            return this.end(), this;
        },
        HTTPSuccess: function (content, contentType, encoding){
            if(this._serverResponse.finished) return this;
            this.setHeaders(this.getResponseHTTPHeaders());
            if(contentType){
                this.setContentType(this.getContentType(contentType, encoding));
            }
            this.setStatus(VARS.HTTP_STATUS.SUCCESS.OK, VARS.HTTP_MESSAGE[VARS.HTTP_STATUS.SUCCESS.OK]);
            this.write(content, encoding);
            return this.end(), this;
        },
        HTTPError: function (code, detail, message, encoding){
            if(this._serverResponse.finished) return this;
            this.setHeaders(this.getResponseHTTPHeaders());
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
        }
    }
});
