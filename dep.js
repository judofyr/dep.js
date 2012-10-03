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

  // Already loaded modules.
  var loaded = {};

  // Factories.
  var factories = {};

  // This is called after a module has been loaded/invoked.
  function resolve(name) {
    var children = graph[name], i, child, cb;

    // If there's nothing that dependens on this module, there's nothing for
    // us to do either
    if (!children) return;

    // Reset graph
    graph[name] = 0;

    for (i = 0; i < children.length; i++) {
      child = children[i];
      if (--count[child] == 0 && !loaded[child]) {
        // This was the final dependency for this child.
        loaded[child] = 1;
        cb = factories[child];
        if (cb) cb();
        resolve(child);
      }
    }
  }

  ctx.define = function(name, deps, cb) {
    var i, dep, currentDeps = [];

    // Remove dependencies that has already been loaded
    for (i = 0; deps && i < deps.length; i++) {
      if (!loaded[deps[i]]) currentDeps.push(deps[i]);
    }
    
    // No dependencies == load straight away
    if (!currentDeps.length) {
      loaded[name] = 1;
      if (cb) cb();
      resolve(name);
      return;
    }

    factories[name] = cb;
    count[name] = currentDeps.length;

    // Build graph
    for (i = 0; i < currentDeps.length; i++) {
      dep = currentDeps[i];
      (graph[dep] || (graph[dep] = [])).push(name);
    }

    // Call .load
    if (ctx.load) {
      for (i = 0; i < currentDeps.length; i++) {
        ctx.load(currentDeps[i]);
      }
    }

  };

  return ctx;
})(dep);

// Only used for the tests. It's not present in dep.min.js
if (typeof module == "object") module.exports = dep;

