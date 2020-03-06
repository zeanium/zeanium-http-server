if(!global.zn){
    require('@zeanium/core');
}

if(process.env.NODE_ENV == 'development'){
    zn.debug('server_path: ', __dirname);
}
module.exports = require('./src/_index.js');