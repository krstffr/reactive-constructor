Package.describe({
	name: "krstffr:reactive-constructor",
  summary: "Create reactive objects.",
	version: "0.0.1"
});

Package.onUse(function (api) {

	api.versionsFrom("METEOR@0.9.0");

	api.use(['stevezhu:lodash@1.0.2', 'underscore'], 'client');

  api.addFiles('reactiveConstructor.js', 'client');

  // The main object.
  api.export('ReactiveConstructor', 'client');

});