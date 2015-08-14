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
  friends: [ new Person({ name: 'Friend 1' }), new Person({ name: 'Friend 2' })]
});

var childInstance = grandParentInstance.getReactiveValue('child').getReactiveValue('child').getReactiveValue('child');

var testTemplate = Template.testTemplate;

testTemplate.helpers({
  childInstance: function() {
    return childInstance;
  }
});

testTemplate.events({
  'click .add-friend': function () {
    var friends = this.getReactiveValue('friends');
    var newFriend = new Person({ name: 'Friend ' + (friends.length+1) });
    friends.push( newFriend );
    return this.setReactiveValue('friends', friends );
  }
});