Package.describe({
	name: "krstffr:reactive-constructor",
  summary: "Create reactive objects from these constructors.",
	version: "1.2.1"
});

Package.onUse(function (api) {

	api.versionsFrom("METEOR@0.9.0");

	api.use([
    "stevezhu:lodash@3.10.1",
    "reactive-var@1.0.4",
    "check@1.0.0"], "client");

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

  api.use(["tinytest", "krstffr:reactive-constructor"], "client");

  api.addFiles("tests/reactiveConstructorTestConstructors.js", "client");
  api.export(["Person", "Client", "Invoice", "InvoiceListItem"], "client");

  api.addFiles("tests/reactiveConstructorTests.js", "client");

});
