var DNA = require('./lib/dna');

module.exports = DNA;

var dna = null;

module.exports.createDNA = function (opts) {
    if (!(dna instanceof DNA)) {
        dna = new DNA(opts);
    }

    return dna;
};
