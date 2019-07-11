/**
 * Created by yangyxu on 7/14/15.
 */
module.exports = zn.Class({
    properties: {
        cookie: null
    },
    methods: {
        init: function (config){
            this.sets(config);
        },
        __createSession: function (cookie){
            return new Session(this.name, zn.overwrite(cookie||{}, this.cookie));
        }
    }
});
