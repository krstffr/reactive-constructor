var testTemplate = Template.testTemplate;
var childInstance = new ReactiveVar( false );

testTemplate.onCreated(function() {

  // Let's use the new Person( new Person() ) as well just to make sure it works!

  var grandParentInstance = new Person(
    new Person({
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
    })
    );

  childInstance.set( grandParentInstance.getReactiveValue('child').getReactiveValue('child').getReactiveValue('child') );

});

testTemplate.helpers({
  childInstance() {
    return childInstance.get();
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