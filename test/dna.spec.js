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

    it('should render an empty string, if value is undefined', function () {
        expect(dna.render('{{value}}', {})).to.be.equal('');
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

    it('should use a filter as starting point', function () {
        function author(firstname, lastname) {
            return lastname[0].toUpperCase().concat(lastname.slice(1)).concat(', ')
            .concat(firstname[0].toUpperCase()).concat(firstname.slice(1));
        }

        var spy = chai.spy(author);
        dna.use('author', spy);
        expect(dna.render('{{author:christian:rädel}}')).to.be.equal('Rädel, Christian');
        expect(spy).to.have.been.called.once;
    });
});

describe('DNA#events', function () {
    var dna = null;

    beforeEach(function () {
        dna = new engine();
    });

    it('should use callbacks', function () {
        function callback(value) {
            return (parseInt(value) + 1).toString();
        }

        var spy = chai.spy(callback);
        dna.onexpression = spy;
        dna.oncomplete = spy;
        expect(dna.render('{{value}}', {value: 25})).to.be.equal('27');
        expect(spy).to.have.been.called.twice;
    });
});

describe('DNA#plugins#colorize', function () {
    var dna = null;

    beforeEach(function () {
        dna = engine.createDNA().use(engine.colorize);
    });

    it('should print a string in a given color', function () {
        var template = '\t{{value|colorize:rainbow:underline}}';
        console.log(dna.render(template, {value: 'What is the meaning of Life?'}));
    });

    it('should print a string using themed color', function () {
        var template = '\t{{value|colorize}}';
        console.log(dna.render(template, {value: 'info', theme: {'info': 'rainbow'}}));
    });
});

describe('DNA#plugins#datetime', function () {
    var dna = null;

    beforeEach(function () {
        dna = engine.createDNA().use(engine.datetime);
    });

    it('should render current datetime without given format', function () {
        var template = '\t{{datetime}}';
        console.log(dna.render(template));
    });

    it('should render current datetime with given format', function () {
        var template = '\t{{datetime:YYYY-MM-DD HH\\:mm\\:ss}}';
        console.log(dna.render(template));
    });

    it('should render datetime without given format', function () {
        var template = '\t{{value|datetime}}';
        console.log(dna.render(template, {value: new Date('1988-06-24 05:23:43')}));
    });

    it('should render datetime with given format', function () {
        var template = '\t{{value|datetime:YYYY-MM-DD HH\\:mm\\:ss}}';
        console.log(dna.render(template, {value: 0}));
    });
});

describe('DNA#plugins#strings', function () {
    var dna = null;

    beforeEach(function () {
        dna = engine.createDNA().use(engine.strings);
    });

    it('should render a string in uppercase', function () {
        expect(dna.render('{{value|uppercase}}', {value: 'dna'})).to.be.equal('DNA');
    });

    it('should render a string in lowercase', function () {
        expect(dna.render('{{value|lowercase}}', {value: 'DNA'})).to.be.equal('dna');
    });

    it('should render a string in camelcase', function () {
        expect(dna.render('{{value|camelcase}}', {value: 'hello-world!'})).to.be.equal('HelloWorld!');
    });

    it('should render a string capitalized', function () {
        expect(dna.render('{{value|capitalize}}', {value: 'dna'})).to.be.equal('Dna');
    });

    it('should render a string rightaligned', function () {
        expect(dna.render('{{value|rightalign:5}}', {value: 'dna'})).to.be.equal('  dna');
    });

    it('should render a string in fixedlength', function () {
        expect(dna.render('{{value|fixedlength:5}}', {value: 'dna'})).to.be.equal('dna  ');
    });
});
