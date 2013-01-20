(dep = function(ctx){
  // Already loaded modules.
  var loaded = ctx.loaded = {};

  // Factories.
  var factory = {};

  // List of Functions that want to use a module.
  // This can also be an empty array if there's a dependency.
  // If "app" depends on "a" and "b", and someone uses "app":
  //    uses["app"] = [function() { app }]
  //    uses["a"]   = []
  //    uses["b"]   = []
  var uses = {};

  // Attempt to the load a module.
  function load(name) {
    var fact = factory[name];
    if (fact) {
      // Only invoke the factory once
      factory[name] = 0;
      fact();
    } else if (ctx.load) {
      ctx.load(name);
    }
  }

  ctx.use = function(deps, cb) {
    if (typeof deps == "string") deps = [deps];

    var left = deps.length+1, dep
      , done = function() {
        if (--left == 0) cb && cb();
      }

    // Make sure we handle when deps is empty
    done();

    while (dep = deps.shift()) {
      if (loaded[dep]) {
        done();
      } else {
        (uses[dep] || (uses[dep] = [])).push(done);
        load(dep);
      }
    }
  }

  ctx.define = function(name, deps, cb) {
    factory[name] = function() {
      ctx.use(deps || [], function() {
        var f, use = uses[name];
        loaded[name] = 1;
        if (cb) cb();
        while (f = use && use.shift()) f();
      });
    };

    if (uses[name]) {
      load(name);
    }
  };

  return ctx;
})(dep);

// Only used for the tests. It's not present in dep.min.js
if (typeof module == "object") module.exports = dep;

