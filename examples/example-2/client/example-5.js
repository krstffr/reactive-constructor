Person = new ReactiveConstructor('Person', function() {
  return {
    typeStructure: [{
      type: 'parentInstance',
      fields: {
        name: String,
        child: Person,
        friends: [ Person ]
      }
    }]
  };
});

var grandParentInstance = new Person({
  name: 'Super old Grandpa (so old he dead!!)',
  child: new Person({
    name: 'Old man Kristoffer',
    child: new Person({
      name: 'Papa Kristoffer',
      child: new Person({
        name: 'Baby Boy Stoffe'
      })
    })
  }),
  friends: [ new Person({ name: 'Friend' })]
});

var childInstance = grandParentInstance.getReactiveValue('child').getReactiveValue('child').getReactiveValue('child');

var testTemplate = Template.testTemplate;
var friend = grandParentInstance.getReactiveValue('friends')[0];

console.log( childInstance.getParentData(2).getReactiveValue('name') );
console.log( childInstance.getParentData(3).getReactiveValue('name') );
console.log( childInstance.getParentData(3) );
console.log( childInstance.getParentData(10) );

console.log( friend.getParentData(1) );

testTemplate.helpers({
  childInstance: function() {
    return childInstance;
  }
});