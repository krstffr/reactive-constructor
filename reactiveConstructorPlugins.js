// Holder for all plugins
ReactiveConstructorPlugins = [];

// Plugin constructor
ReactiveConstructorPlugin = function ( options ) {

	// Make sure options are passed
	check( options, Object );

	// Make sure initClass is a function
	if (options.initClass)
		check( options.initClass, Function );

	// Make sure initInstance is a function
	if (options.initInstance)
		check( options.initInstance, Function );
	
	// Bind the passed options to the options object
	this.options = options;

	// Append this plugin to all the plugins
	ReactiveConstructorPlugins.push( this );

};