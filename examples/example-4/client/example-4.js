// Create a reactive constructor which can be used in tests.
Person = new ReactiveConstructor(function Person( initData ) {

  this.initData = initData || {};

  this.typeStructure = [{
    type: 'worker',
    fields: {
      name: String,
      title: String,
      age: Number,
      children: [ Person ]
    },
    defaultData: {
      name: 'Kristoffer Klintberg',
      title: 'Designer',
      age: 30,
      children: []
    }
  }, {
    type: 'husband',
    fields: {
      age: Number,
      wife: Person
    },
    defaultData: {
      age: 49
    }
  }, {
    type: 'wife',
    fields: {
      age: Number,
      happy: Boolean
    },
    defaultData: {
      age: 54
    }
  }, {
    type: 'child',
    fields: {
      age: Number,
      parents: [ Person ]
    },
    methods: {
      isTeenager: function () {
        var age = this.getReactiveValue('age');
        return age > 12 && age < 20;
      },
      getAgePlus: function ( years ) {
        check( years, Number );
        return this.getReactiveValue('age') + years;
      },
      addYears: function ( years ) {
        check( years, Number );
        var age = this.getReactiveValue('age');
        return this.setReactiveValue('age', age + years );
      }
    }
  }];

  this.initReactiveValues();

});

wife = new Person({
  rcType: 'wife',
  happy: true
});

husband = new Person({
  rcType: 'husband',
  wife: wife
});

child = new Person({
  rcType: 'child',
  age: 10,
  parents: [ wife, husband ]
});

persons = [ child, husband, wife ];

Template.exampleTemplate.helpers({
  persons: function () {
    return persons;
  }
});

Template.exampleTemplate.events({
  'click button': function () {
    var newAge = this.getReactiveValue('age') + 1;
    return this.setReactiveValue('age', newAge );
  }
});