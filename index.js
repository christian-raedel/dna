var DNA = require('./lib/dna');

module.exports = DNA;

var dna = null;

module.exports.createDNA = function (opts) {
    if (!(dna instanceof DNA)) {
        dna = new DNA(opts);
    }

    return dna;
};

module.exports.colorize = require('./lib/plugins/colorize');

module.exports.datetime = require('./lib/plugins/datetime');

module.exports.strings  = require('./lib/plugins/strings');
