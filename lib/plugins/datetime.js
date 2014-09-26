var moment = require('moment')
    , _    = require('lodash');

module.exports.datetime = function (value, format) {
    var self = this;
    if (_.isDate(value) || _.isNumber(value)) {
        return moment(value).format(format || 'MMMM Do YYYY HH:mm:ss');
    } else if (_.isString(value) && _.isUndefined(format)) {
        return moment(new Date()).format(value);
    } else {
        return moment(new Date()).format('MMMM Do YYYY HH:mm:ss');
    }
};
