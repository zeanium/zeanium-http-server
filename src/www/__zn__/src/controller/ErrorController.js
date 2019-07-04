var ERROR_MESSAGE = require('../../../../static/ERRORS.js');
module.exports = zn.Controller('error', {
    properties: {

    },
    methods: {
        __404: function (request, response) {
            var _error = ERROR_MESSAGE['404'];
            _error.detail = request.getErrorMessage()||'';
            response.viewModel('_error', _error);
        },
        __405: function (request, response) {
            var _error = ERROR_MESSAGE['405'];
            _error.detail = request.getErrorMessage()||'';
            response.viewModel('_error', _error);
        }
    }
});
