var _ = require('lodash');

module.exports.uppercase = function (value) {
    return value.toString().toUpperCase();
};

module.exports.lowercase = function (value) {
    return value.toString().toLowerCase();
};

module.exports.camelcase = function (value) {
    return _.reduce(value.toString().split('-'), function (prev, field) {
        return prev + field[0].toUpperCase() + field.slice(1).toLowerCase();
    }, '');
};

module.exports.capitalize = function (value) {
    value = value.toString();
    return value[0].toUpperCase() + value.slice(1);
};

module.exports.rightalign = function (value, length) {
    value = value.toString().split('').reverse();
    while (value.length < length) {
        value.push(' ');
    }
    return value.reverse().join('');
};

module.exports.fixedlength = function (value, length) {
    value = value.toString().split('');
    while (value.length < length) {
        value.push(' ');
    }
    return value.join('');
};
