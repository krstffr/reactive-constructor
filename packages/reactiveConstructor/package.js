Package.describe({
	name: "krstffr:reactive-constructor",
  summary: "Create reactive objects.",
	version: "0.0.1"
});

Package.onUse(function (api) {

	api.versionsFrom("METEOR@0.9.0");

	api.use(['stevezhu:lodash@1.0.2', 'underscore', 'reactive-var@1.0.4'], 'client');

  api.addFiles('reactiveConstructor.js', 'client');

  api.export('ReactiveConstructor', 'client');

});

Package.on_test(function (api) {
  
  api.use('tinytest');

  api.use(['krstffr:reactive-constructor'], 'client');

  api.add_files('tests/reactiveConstructorTestConstructors.js', 'client');
  api.add_files('tests/reactiveConstructorTests.js', 'client');

});