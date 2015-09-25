Person = new ReactiveConstructor('Person', function() {
  return {
    cmsOptions: {
      collection: Persons
    },
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
