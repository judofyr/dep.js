var config = module.exports;

config.dep = {
  rootPath: "..",
  tests: ["test/*-test.js"]
};

config.browser = {
  extends: "dep",
  environment: "browser",
  sources: ["dep.js"]
};

config.node = {
  extends: "dep",
  environment: "node"
};

