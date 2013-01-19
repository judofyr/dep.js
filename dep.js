(dep = function(ctx){
  // Inverse graph between dependencies.
  // If "app" depends on "a" and "b":
  //   graph["a"] == ["app"]
  //   graph["b"] == ["app"]
  var graph = {};

  // Number of pending dependencies.
  // If "app" depends on two other modules:
  //   count["app"] == 2
  var count = {};

  // List of dependencies per module
  //    dependencies["app"] = ["a", "b"]
  var dependencies = {};

  // Already loaded modules.
  var loaded = {};

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
  function load(name, cb) {
    var deps, dep
      // Setup the the `uses`-array
      , use = (uses[name] || (uses[name] = []))

    if (cb) use.push(cb);

    if (deps = dependencies[name]) {
      // This module has already been defined somewhere elase.

      dependencies[name] = 0;

      // If there's no dependencies, we can set it up right away.
      if (!deps.length) setup(name);

      // Otherwise, recursively try to load its dependencies.
      while (dep = deps.shift()) load(dep);

    } else if (ctx.load) {
      ctx.load(name);
    }
  }

  // This is called whenever we want to setup a module.
  function setup(name) {
    var children = graph[name]
      , use = uses[name]
      , x

    if (!loaded[name]) {
      loaded[name] = 1;
      // Invoke factory (if any)
      if (x = factory[name]) x();
      // Invoke any users
      while (x = use.shift()) x()

      // Iterate over the graph and figure out if we can now invoke any
      // other modules.
      while (x = children && children.shift()) {
        if (--count[x] == 0) {
          // This was the final dependency for this child.
          setup(x);
        }
      }
    }
  }

  ctx.use = function(dep, cb) {
    if (loaded[dep]) {
      cb();
    } else {
      load(dep, cb);
    }
  }

  ctx.define = function(name, deps, cb) {
    var i, dep, currentDeps = [];

    while (dep = deps && deps.shift()) {
      // We don't care about dependencies that has already been loaded
      if (!loaded[dep]) {
        currentDeps.push(dep);
        (graph[dep] || (graph[dep] = [])).push(name);
      }
    }

    dependencies[name] = currentDeps;
    count[name] = currentDeps.length;
    factory[name] = cb;

    if (uses[name]) load(name);
  };

  return ctx;
})(dep);

// Only used for the tests. It's not present in dep.min.js
if (typeof module == "object") module.exports = dep;

