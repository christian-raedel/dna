var CConf   = require('node-cconf')
    , deep  = require('node-cconf').util.deep
    , debug = require('debug')('dna')
    , q     = require('q')
    , fs    = require('fs')
    , _     = require('lodash');

function DNA(opts) {
    var self = this;

    var config = new CConf('dna', ['delimiters'], {
        'delimiters': '\\{\\{ : \\| \\}\\} \\~',
        'list': /\{\{\s*repeat\s+([\s\S]+?)\s+in\s+([\s\S]+?)\s*\}\}([\s\S]+?)\{\{\s*#\s*repeat\s*\}\}(?=[^\{\{\s*#\s*repeat\s*\}\}]*$)/g,
        'conditional': /\{\{\s*if\s+([\s\S]+?)\s*([=<>]{2,3}?)\s*([\s\S]+?)\}\}([\s\S]+?)\{\{\s*#\s*if\s*\}\}(?=[^\{\{\s*#\s*if\s*\}\}]*$)/g
    })
    .load(opts || {});

    self.config = config;
    self.filter = {};
    self.cache = {};
}

DNA.prototype.onexpression = function(value) {
    return value;
};

DNA.prototype.oncomplete = function(value) {
    return value;
};

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
        // {{expr}}
        var re = new RegExp(dels[0] + '([\\s\\S]+?)' + dels[3], 'g');
        _.forEach(text.match(re), function (expr) {
            re = new RegExp(dels[0] + '|' + dels[3], 'g');
            // expr|filter
            var value = _.reduce(expr.replace(re, '').split(new RegExp(dels[2], 'g')), function (prev, field) {
                // filter:param (reverse string to create a pseudo lookbehind to make it possible to escape the colon...)
                var params = field.split('').reverse().join('')
                    .split(new RegExp(dels[1] + '(?!\\\\)', 'g')).reverse().map(function (value) {
                    value = value.replace(/\\/g, '').split('').reverse().join('');
                    var int = _.parseInt(value);
                    if (_.isNaN(int)) {
                        return value.trim();
                    } else {
                        return int;
                    }
                });

                var result = null;
                if (_.isFunction(self.filter[params[0]])) {
                    result = self.filter[params[0]].apply(args, _.isUndefined(prev) ? params.slice(1) : [prev].concat(params.slice(1)));
                } else {
                    result = deep.get(args, params[0]);
                }

                debug('filter: %j = %j', params, result);
                return result;
            }, undefined);

            text = text.replace(expr, self.onexpression(value === undefined ? '' : value));
        });

        return self.oncomplete(text);
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
        var re = self.config.getValue('list');
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
        re = self.config.getValue('conditional');
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
