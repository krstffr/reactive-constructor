// This is for <IE9
// To make String.name work basically, for type checking.
// I got this from:
// http://stackoverflow.com/questions/332422/how-do-i-get-the-name-of-an-objects-type-in-javascript
if (Function.prototype.name === undefined && Object.defineProperty !== undefined) {
	Object.defineProperty(Function.prototype, "name", {
		get: function() {
			var funcNameRegex = /function\s([^(]{1,})\(/;
			var results = (funcNameRegex).exec((this).toString());
			return (results && results.length > 1) ? results[1].trim() : "";
		},
		set: function() {}
	});
}