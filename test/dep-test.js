var dep = this.dep || require("../dep");

buster.testCase("dep setup", {
  "default dep": function() {
    assert(dep.define);
  },

  "factory": function() {
    var obj = dep({});
    assert(obj.define);
  }
});

buster.testCase("dep", {
  setUp: function() {
    this.dep = dep({});

    this.counter = 0;
    var me = this;
    this.incr = function() { me.counter++ }
    this.is = function(i)  { assert.equals(me.counter, i) }
  },

  "no dependencies": function() {
    this.dep.define('hello', [], this.incr);
    this.is(0);
    this.dep.use('hello', this.incr);
    this.is(2);
    this.dep.define('world', ['hello'], this.incr);
    this.is(2);
    this.dep.use('world', this.incr);
    this.is(4);
  },

  "reverse": function() {
    this.dep.define('world', ['hello']);
    this.dep.use('world', this.incr);
    this.is(0);
    this.dep.define('hello', []);
    this.dep.use('hello', this.incr);
    this.is(2);
  },

  "use before define": function() {
    this.dep.use('hello', this.incr);
    this.is(0);
    this.dep.define('hello', ['world'], this.incr);
    this.is(0);
    this.dep.define('world');
    this.is(2);
  },

  "cycle": function() {
    this.dep.define('a', ['b'], this.incr);
    this.dep.define('b', ['c'], this.incr);
    this.dep.define('c', ['a'], this.incr);
    this.is(0);
    this.dep.use('a');
    this.is(0);
  },

  "load": function() {
    var deps = [];
    this.dep.load = function(name) {
      deps.push(name);
    };

    this.dep.define('world', ['hello'], this.incr);
    assert.equals(deps, []);
    this.dep.use('world');
    assert.equals(deps, ['hello']);
  },

  "load + define": function() {
    this.dep.load = function(name) {
      this.define(name);
    }

    this.dep.define('world', ['hello'], this.incr);
    this.is(0);
    this.dep.use('world', this.incr);
    this.is(2);
  },

  "load + define other": function() {
    this.dep.load = function(name) {
      if (name == "b") {
        this.define(name);
        this.define(name + '2');
      }
    };

    this.dep.define('a', ['b', 'b2'], this.incr);
    this.dep.use('a', this.incr);
    this.is(2);
  }
});

