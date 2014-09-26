var engine     = require('../index')
    , chai     = require('chai')
    , expect   = chai.expect
    , promised = require('chai-as-promised')
    , spies    = require('chai-spies')
    , fs       = require('fs');

chai.use(promised).use(spies);

describe('DNA#constructor', function () {
    it('should create a new instance', function () {
        expect(engine.createDNA()).to.be.an.instanceof(engine);
    });
});

describe('DNA#render', function () {
    var dna = null;

    beforeEach(function () {
        dna = engine.createDNA();
    });

    it('should render a string', function () {
        expect(dna.render('{{value}}', {value: 27})).to.be.equal('27');
    });

    it('should render a file', function (done) {
        var filename = __dirname + '/test.tmp.tpl';
        fs.writeFileSync(filename, '{{value}}', 'utf-8');

        dna.renderFile(filename, {value: 27})
        .then(function (text) {
            expect(text).to.be.equal('27');
        })
        .catch(function (err) {
            done(new Error(err));
        })
        .finally(function () {
            fs.unlinkSync(filename);
            done();
        })
        .done();
    });
});

describe('DNA#use', function () {
    var dna = null;

    beforeEach(function () {
        dna = engine.createDNA();
    });

    it('should use a filter function', function () {
        function reverse(value) {
            expect(value).to.be.a('number');
            expect(value).to.be.equal(27);
            return value.toString().split('').reverse().join('');
        }

        var spy = chai.spy(reverse);
        dna.use('reverse', spy);
        expect(dna.filter['reverse']).to.be.equal(spy);
        expect(dna.render('{{value|reverse}}', {value: 27})).to.be.equal('72');
        expect(spy).to.have.been.called.once;
    });
});
