SomeConstructor = new ReactiveConstructor( function SomeConstructor ( initData ) {
  
  // Bind the passed initData to this
  this.initData = initData;
  
  // Here you define the structure of the reactive data (and their types!)
  this.typeStructure = [{
    type: 'aCoolType',
    fields: {
      name: String,
      age: Number,
      salary: Number
    }
  }];
  
  // For now this method needs to get called in order for the instance
  // to get setup correctly. This will hopefully not be needed in the future.
  this.initReactiveValues();
  
});

// Here we create a new instance from the constructor
instance1 = new SomeConstructor({ name: 'Kristoffer' });

// We can use the getReactiveValue( key ) method for example in templates
// to get the current value of name, which will auto update whenever a
// new value gets set using setReactiveValue( key, value ).
console.log( instance1.getReactiveValue('name') );

// Any templates which uses instance1.getReactiveValue('name') will now
// display "Bertil" instead of "Kristoffer", and this is changed automatically.
instance1.setReactiveValue('name', 'Bertil');

console.log( instance1.getReactiveValue('name') );

Template.exampleTemplate.helpers({
  name: function () {
    return instance1.getReactiveValue('name');
  }
});