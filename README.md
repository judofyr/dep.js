# dep.js - a tiny dependency manager

dep.js strives to handle modularized JavaScript (mostly for the browser) in an
unobtrusive way. It's a perfect fit if you're already concatenating everything
into a single file, but it can easily be integrated with script loaders if you
want to organize modules into their own files.

```javascript
// This module is not executed until "module" is present.
dep.define('app', ['module'], function() {
  window.app = {mod: window.module};
});

dep.define('module', [], function() {
  window.module = {a: 1};
});
```

## API

### dep.define

```javascript
dep.define(name, dependencies, factory);
dep.define(name, dependencies);
```

Defines a module called `name` with an array of `dependencies` and
(optionally) a `factory` function that will be invoked when all the dependencies
have been declared. The return value of the factory function does not matter. 

### dep.load

```javascript
dep.load(name);
```

`dep.load` is null by default, but can be overridden by you. It will be
invoked every time a module is defined with a dependency that isn't already
loaded. You can use this to automatically load dependencies when they're
needed.

Here's a way to use this functionality to implement file-focused modules:

```javascript
var loading = {}

dep.load = function(name) { // We're already loading the file.
  if (loading[name]) return;
  loading[name] = true;

  // Load the file
  var el = document.createElement('script');
  el.src = name;
  el.async = true;
  document.body.appendChild(el);
};

// Kick everything off
dep.define('setup', ['app.js']);


// In app.js
dep.define('app.js', ['mod.js'], function() {
  mod.use();
});

// In mod.js
dep.define('mod.js', [], function() {
});
```

### dep()

Sometimes it's useful to have multiple, separate dependency chains. By calling
`dep(obj)` it will set up a separate dependency chain in the `obj`-object. The
`define`-function above will be defined and `load` will also be invoked when
needed. No other properties are touched.

```javascript
var App = {};
dep(App);

App.define(...);
App.load = function(name) {
  ...
};
```

