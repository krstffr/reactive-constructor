Package.describe({
	name: "krstffr:reactive-constructor",
  summary: "Create reactive objects.",
	version: "0.0.2"
});

Package.onUse(function (api) {

	api.versionsFrom("METEOR@0.9.0");

	api.use(["stevezhu:lodash@1.0.2", "reactive-var@1.0.4"], "client");

  api.addFiles("reactiveConstructor.js", "client");

  api.export("ReactiveConstructor", "client");

});

Package.on_test(function (api) {
  
  api.use("tinytest");

  api.use(["krstffr:reactive-constructor"], "client");

  api.addFiles("tests/reactiveConstructorTestConstructors.js", "client");
  api.export(["Person", "Client", "Invoice", "InvoiceListItem"], "client");
  
  api.addFiles("tests/reactiveConstructorTests.js", "client");

});