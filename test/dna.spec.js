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

    it('should iterate an array', function () {
        var template = '{{repeat item in array}}Hello {{item}}!{{#repeat}}';
        expect(dna.render(template, {array: ['world', 'dna']})).to.be.equal('Hello world!Hello dna!');
    });

    it('should iterate an array of objects', function () {
        var template = '{{repeat item in array}}Hello {{item.name}}!{{#repeat}}';
        expect(dna.render(template, {
            array: [
                {name: 'world'},
                {name: 'dna'}
            ]
        })).to.be.equal('Hello world!Hello dna!');
    });

    it('should iterate an object', function () {
        var template = '{{repeat item in object}}Hello {{item}}!{{#repeat}}';
        expect(dna.render(template, {object: {to: 'world', name: 'dna'}})).to.be.equal('Hello world!Hello dna!');
    });

    it('should render a conditional', function () {
        var template = '{{if value === 27}}Hello dna!{{#if}}';
        expect(dna.render(template, {value: 27})).to.be.equal('Hello dna!');
        expect(dna.render(template, {value: 43})).to.be.equal('');
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
