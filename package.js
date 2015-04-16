Package.describe({
	name: "krstffr:reactive-constructor",
  summary: "Create reactive objects.",
	version: "0.0.6"
});

Package.onUse(function (api) {

	api.versionsFrom("METEOR@0.9.0");

	api.use([
    "stevezhu:lodash@1.0.2",
    "reactive-var@1.0.4",
    "check@1.0.0"], "client");

  api.addFiles([
    "ie9-type-check-monkey-patch.js",
    "reactiveConstructorPlugins.js",
    "reactiveConstructor.js"
    ], "client");

  api.export([
    "ReactiveConstructor",
    "ReactiveConstructors",
    "ReactiveConstructorPlugin"
    ], "client");

});

Package.on_test(function (api) {
  
  api.use(["tinytest", "krstffr:reactive-constructor"], "client");

  api.addFiles("tests/reactiveConstructorTestConstructors.js", "client");
  api.export(["Person", "Client", "Invoice", "InvoiceListItem"], "client");
  
  api.addFiles("tests/reactiveConstructorTests.js", "client");

});