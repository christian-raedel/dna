[![Build Status](https://travis-ci.org/christian-raedel/dna.svg)](https://travis-ci.org/christian-raedel/dna)

#DNA#

A template engine for [node.js](http://nodejs.org) with basic configurable templating-syntax
and freely pluggable filter function support.

##Installation##

```
npm install --save git+https://github.com/christian-raedel/dna
```

##Usage example##

``` Javascript
var engine = require('dna');

var dna = engine.createDNA().use(engine.colorize).use(engine.datetime).use(engine.strings);

function rainbowLogger(level, message) {
    var str = '{{datetime|colorize:blue}} - {{level|colorize|uppercase}} : {{message|capitalize|colorize:rainbow}}';
    console.log(dna.render(str, {
        level: level,
        message: message,
        theme: {
            'info': 'grey',
            'warn': 'yellow',
            'debug': 'green',
            'error': 'red'
        }
    }));
};

rainbowLogger('info', 'under the rainbow');
```

##Api docs##

coming soon...
