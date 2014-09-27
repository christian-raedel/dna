var colors = require('colors')
    , _    = require('lodash');

var theme = null;

module.exports.colorize = function (value, color) {
    var self = this
        , args = _.toArray(arguments).slice(2);

    if (_.isPlainObject(self.theme) && !(_.isEqual(self.theme, theme))) {
        theme = self.theme;
        colors.setTheme(theme);
    }

    if (_.isString(color)) {
        return _.reduce(args, function (prev, color) {
            return prev[color];
        }, value.toString()[color]);
    } else if (_.isUndefined(color) && _.has(theme, value)) {
        return value.toString()[value];
    } else {
        throw new TypeError('Colorize was called with invalid arguments!');
    }
};
