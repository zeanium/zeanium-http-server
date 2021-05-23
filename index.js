if(!global.zn){
    require('@zeanium/core');
}

var node_path = require('path');
var node_fs = require('fs');
var _version = '';
if(node_fs.existsSync(node_path.join(__dirname, './package.json'))){
    _version = require(node_path.join(__dirname, './package.json')).version;
}
zn.info('server_path', (_version?'[ ' + _version + ' ]':''), ': ', __dirname);

module.exports = require('./src/_index.js');