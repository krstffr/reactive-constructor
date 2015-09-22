Package.describe({
	name: "krstffr:reactive-constructor",
  summary: "Create reactive objects from these constructors.",
	version: "1.2.5"
});

Package.onUse(function (api) {

	api.versionsFrom("METEOR@0.9.0");

	api.use(["reactive-var@1.0.5"], "client");

  api.use(["check@1.0.5", "stevezhu:lodash@3.10.1"], ["client", "server"]);

  api.addFiles([
    "ie9-type-check-monkey-patch.js",
    "reactiveConstructorPlugins.js"
    ], "client");

  api.addFiles(["reactiveConstructor.js"], ["client", "server"]);

  api.export([
    "ReactiveConstructor",
    "ReactiveConstructors",
    "ReactiveConstructorPlugin"
    ], ["client", "server"]);

});

Package.on_test(function (api) {

  api.use(["tinytest", "krstffr:reactive-constructor", "stevezhu:lodash@3.10.1", "check@1.0.5"], "client");

  api.addFiles("tests/reactiveConstructorTestConstructors.js", "client");
  api.export(["Person", "Client", "Invoice", "InvoiceListItem"], "client");

  api.addFiles("tests/reactiveConstructorTests.js", "client");

});
