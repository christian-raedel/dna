var CConf   = require('node-cconf')
    , deep  = require('node-cconf').util.deep
    , debug = require('debug')('dna')
    , q     = require('q')
    , fs    = require('fs')
    , _     = require('lodash');

function DNA(opts) {
    var self = this;

    var config = new CConf('dna', ['delimiters'], {
        'delimiters': '\\{\\{ : \\| \\}\\} \\~'
    })
    .load(opts || {});

    self.config = config;
    self.filter = {};
    self.cache = {};
}

DNA.prototype.use = function(name, filter) {
    var self = this;

    if (_.isString(name) && _.isFunction(filter)) {
        self.filter[name] = filter;
    } else if (_.isObject(name) && _.isUndefined(filter)) {
        _.forOwn(name, function (filter, name) {
            if (_.isFunction(filter)) {
                self.filter[name] = filter;
            }
        });
    } else if (_.isString(name) && _.isUndefined(filter)) {
        self.use(require(name));
    } else {
        throw new TypeError('DNA.use() was called with invalid arguments!');
    }

    return self;
};

DNA.prototype.miss = function(name) {
    var self = this;

    if (_.isString(name)) {
        delete self.filter[name];
    } else if (_.isArray(name)) {
        _.forEach(name, function (name) {
            self.miss(name);
        });
    } else {
        throw new TypeError('DNA.forget() was called with invalid arguments!');
    }

    return self;
};

DNA.prototype.format = function(text, args) {
    args = args || {};

    var self   = this
        , dels = self.config.getValue('delimiters').split(' ');

    if (_.isString(text) && _.isObject(args)) {
        var re = new RegExp(dels[0].concat('([\\s\\S]+?)').concat(dels[3]), 'g');
        _.forEach(text.match(re), function (expr) {
            re = new RegExp(dels[0].concat('|').concat(dels[3]), 'g');
            var value = _.reduce(expr.replace(re, '').split(new RegExp(dels[2], 'g')), function (prev, field) {
                var params = field.split(new RegExp(dels[1], 'g')).map(function (value) {
                    var int = _.parseInt(value);
                    if (_.isNaN(int)) {
                        return value.trim();
                    } else {
                        return int;
                    }
                });

                if (_.isFunction(self.filter[params[0]])) {
                    return self.filter[params[0]].apply(args, [prev].concat(params.slice(1)));
                } else {
                    return deep.get(args, params[0]);
                }
            }, null);

            text = text.replace(expr, value);
        });

        return text;
    } else {
        throw new TypeError('DNA.format() was called with invalid arguments!');
    }
};

DNA.prototype.render = function(text, args) {
    args = args || {};

    var self = this
        , dels = self.config.getValue('delimiters').split(' ');

    if (_.isString(text) && _.isObject(args)) {
        // Array
        var re = /\{\{\s*repeat\s+([\s\S]+?)\s+in\s+([\s\S]+?)\s*\}\}([\s\S]+?)\{\{\s*#\s*repeat\s*\}\}(?=[^\{\{\s*#\s*repeat\s*\}\}]*$)/g;
        text = text.replace(re, function (match, item, list, str) {
            list = _.toArray(deep.get(args, list));
            if (_.isArray(list)) {
                return _.reduce(list, function (prev, field) {
                    var obj = {};
                    obj[item] = field;
                    return prev.concat(self.render(str, obj));
                }, '');
            } else {
                throw new TypeError('List argument must be an array or an object!');
            }
        });

        // If
        re = /\{\{\s*if\s+([\s\S]+?)\s*([=<>]{2,3}?)\s*([\s\S]+?)\}\}([\s\S]+?)\{\{\s*#\s*if\s*\}\}(?=[^\{\{\s*#\s*if\s*\}\}]*$)/g;
        text = text.replace(re, function (match, field, comp, value, str) {
            if (_.indexOf(['==', '===', '<', '<=', '>', '>='], comp) > -1) {
                field = deep.get(args, field).toString();
                /* jshint -W061 */
                if (eval(field.concat(comp).concat(value))) {
                    return self.render(str, args);
                } else {
                    return '';
                }
            } else {
                throw new TypeError('Cannot compare field with value!');
            }
        });

        return self.format(text, args);
    } else {
        throw new TypeError('DNA.render() was called with invalid arguments!');
    }
};

DNA.prototype.renderFile = function(filename, args) {
    var self = this;

    if (_.isString(filename)) {
        if (self.cache[filename]) {
            return q.fcall(function () {
                return self.render(self.cache[filename], args);
            });
        } else {
            return q.nfcall(fs.readFile, filename, 'utf-8')
            .then(function (content) {
                self.cache[filename] = content;
                return self.render(content, args);
            });
        }
    } else {
        throw new TypeError('DNA.renderFile() was called with invalid arguments!');
    }
};

DNA.prototype.clearCache = function(filename) {
    var self = this;

    if (_.isString(filename)) {
        delete self.cache[filename];
    } else {
        self.cache = {};
    }

    return self;
};

module.exports = DNA;
