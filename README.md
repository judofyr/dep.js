# dep.js - a tiny dependency manager

dep.js strives to handle modularized JavaScript (mostly for the browser) in an
unobtrusive way. It's a perfect fit if you're already concatenating everything
into a single file, but it can easily be integrated with script loaders if you
want to organize modules into their own files.

```javascript
dep.define('app', ['module'], function() {
  window.app = {mod: window.module};
});

dep.define('module', [], function() {
  window.module = {a: 1};
});

// This will invoke the the functions above in the correct order:
dep.use('app', function() {
  alert(window.app);
});
```

**Table of Contents:**

* [Why?](#why)
* [Examples](#examples)
* [API](#api)

<a name='why'></a>
## Why?

Dependency managers bring several advantages to your JavaScript:

* You can stop worrying about the order of your code.
* Concatinating becomes a breeze (because the order doesn't matter).
* Loading scripts async becomes a breeze (because the order doesn't matter).

dep.js the simplest possible dependency manager. It only does one thing:
Managing the dependencies of your code. You should find it very easy to
integrate dep.js into an exisiting code base, regardless of how you structure
your code on the file system or to the browser.

See the next section for how you can accomplish various tasks with dep.js.

<a name='examples'></a>
## Examples

### Internal dependencies inside a single file

Do you want to modularize a single file? Or maybe you automatically
concatenate all the sources into one big file when you deploy?

```javascript
var App = {};

dep.define('Task', [], function() {
  App.Task = Backbone.Model.extend({...});
  App.Tasks = new Backbone.Collection;
});

dep.define('TaskView', [], function() {
  App.TaskView = Backbone.View.extend({...});
});

dep.define('AppView', ['TaskView', 'Task'], function() {
  App.AppView = Backbone.View.extend({...});
  new App.AppView
});

dep.use('AppView', function() {
  new App.AppView(…);
});
```

Notice that regardless of the order of the modules, the AppView-model will
only be loaded until both TaskView and Task are present.

### Handling onload

Often you have modules that depends on the page being fully loaded. You can
create a load-module which doesn't actually define anything, but isn't defined
until after the DOM is ready:

```javascript
$(function() {
  dep.define('dom');
});

dep.define('setup', ['dom', 'AppView'], function() {
  App.mainView = new App.AppView({el: $('#app')});
});

// Kick it off!
dep.use('setup');
```

### Loading modules asynchronously

`dep.load` is invoked every time a module is defined with a dependency that
isn't already loaded. We can override this to automatically load other modules
asynchronously:

```javascript
var loading = {}

dep.load = function(name) {
  // We're already loading the file.
  if (loading[name]) return;
  loading[name] = true;

  // Load the file
  var el = document.createElement('script');
  el.src = name;
  el.async = true;
  document.body.appendChild(el);
};

// Kick everything off:
dep.use('app.js');
```

In app.js:

```javascript
dep.define('app.js', ['mod.js'], function() {
  mod.use();
});
```

In mod.js:

```javascript
dep.define('mod.js', [], function() {
  window.mod = {};
});
```

### Loading other scripts asynchronously

Things are going to be a little more tricky (but only a little) if you want to
asynchronously load scripts that don't define dep.js modules. First of all we
need a cross-browser way to load a script with a callback:

```javascript
// https://gist.github.com/3633336
function loadScript(path, fn) {
  var el = document.createElement('script')
    , loaded = 0
    , onreadystatechange = 'onreadystatechange'
    , readyState = 'readyState';

  el.onload = el.onerror = el[onreadystatechange] = function () {
    if (loaded || (el[readyState] && !(/^c|loade/.test(el[readyState])))) return;
    el.onload = el.onerror = el[onreadystatechange] = null;
    loaded = 1;
    fn();
  };

  el.async = 1;
  el.src = path;
  document.getElementsByTagName('head')[0].appendChild(el);
}
```

Then we can hook up `dep.load` as we did in the last section:

```javascript
var loading = {};
var scripts = {
  jquery: "//ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"
};

dep.load = function(name) {
  var url = scripts[name];
  if (!url) return

  // We're already loading the file.
  if (loading[name]) return;
  loading[name] = true;

  loadScript(url, function() {
    dep.define(name);
  });
};

dep.define('app', ['jquery'], function() {
  window.app = $('#app');
});
```

### Synchronize inline script-tags

A common pattern in JavaScript heavy web sites is to bootstrap data using an
inline script-tag. This avoids firing an extra AJAX call to the server for the
initial data.

```html
<script>
  var Accounts = new Backbone.Collection;
  Accounts.reset(<%= @accounts.to_json %>);
  var Projects = new Backbone.Collection;
  Projects.reset(<%= @projects.to_json(:collaborators => true) %>);
</script>
```

This doesn't work so well when you're loading your JavaScript asynchronously.
You don't know what will execute first: the inline script-tag or your
application code. By placing the inline script-tag in a module, you can let
dep.js handle this dependency issue for you:

```html
<script>
  dep.define('initial-data', ['account', 'project'], function() {
    var Accounts = new Backbone.Collection;
    Accounts.reset(<%= @accounts.to_json %>);
    var Projects = new Backbone.Collection;
    Projects.reset(<%= @projects.to_json(:collaborators => true) %>);
  });
</script>
```

app.js:

```javascript
dep.use('initial-data', function() {
  // Use the data!
});
```

### Multiple dependency chains

`dep` happens to also be a factory function which can be used to create
separate depdency chains:

```javascript
var App = {};
dep(App);

App.define('...', [], function() { ... });
```

<a name='api'></a>
## API

### dep.define

```javascript
dep.define(name, dependencies, factory);
dep.define(name, dependencies);
dep.define(name);
```

Defines a module called `name` with an (optional) array of
`dependencies` and (optionally) a `factory` function. The return value
of the factory function does not matter.

### dep.use

```javascript
dep.use(names);
dep.use(names, callback);
```

`names` must either be a string or an array of strings.

Attemps to load the modules in `names`. The (optional) callback will be
invoked when the modules and all of their dependencies are present.

### dep.load

```javascript
dep.load(name);
```

`dep.load` is null by default, but can be overridden by you. It will be
invoked when there's a module that blocking another module from being
loaded.

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

