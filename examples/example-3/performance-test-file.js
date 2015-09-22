if (!Meteor.isClient)
  return false;

TestConstructor = new ReactiveConstructor('TestConstructor', function() {
  return {
    typeStructure: [{
      type: 'first',
      fields: {
        string: String,
        number: Number,
        bool:   Boolean
      }
    }]
  };
});

HasNested = new ReactiveConstructor('HasNested', function() {
  return {
    typeStructure: [{
      type: 'first',
      fields: {
        nested: [ HasNested ],
        testConstructor: TestConstructor,
        number: Number,
        string: String
      }
    }]
  };
});

var temp = false;
var execBigBoys = true;

(function() {
  // Test the Match.test method
  console.time(   'checkMatchTest');
  for (var i = 100 - 1; i >= 0; i--) {

    var toTest = 'a string';
    var matchResult = false;

    if (i % 4 === 0)
      toTest = ['ä'];
    if (i % 4 === 1)
      toTest = [{}];
    if (i % 4 === 2)
      toTest = { object: true };
    if (i % 4 === 3)
      toTest = 234234;

    if (i % 3 === 0)
      matchResult = Match.test(toTest, Array );
    if (i % 3 === 1)
      matchResult = Match.test(toTest, Object );
    if (i % 3 === 2)
      matchResult = Match.test(toTest, String );
  }
  console.timeEnd('checkMatchTest');
})();

(function() {
  // Test the Match.test method
  console.time(   'checkMatchTestNotMatch');
  for (var i = 100 - 1; i >= 0; i--) {
    
    var toTest = 'a string';
    var matchResult = false;

    if (i % 4 === 0)
      toTest = ['ä'];
    if (i % 4 === 1)
      toTest = [{}];
    if (i % 4 === 2)
      toTest = { object: true };
    if (i % 4 === 3)
      toTest = 234234;

    if (i % 3 === 0)
      matchResult = (toTest.constructor === Array);
    if (i % 3 === 1)
      matchResult = (toTest.constructor === Object);
    if (i % 3 === 2)
      matchResult = (toTest.constructor === String);
  }
  console.timeEnd('checkMatchTestNotMatch');
})();

(function() {
  // Test an object
  console.time(   'createPureObject');
  temp = new Object({ string: 'hej', number: 123, bool: true });
  console.timeEnd('createPureObject');
})();

(function() {
  // Let's create a couple of these
  console.time(   'createOne');
  temp = new TestConstructor({ string: 'hej', number: 123, bool: true, keyWhichDoesNotExist: true });
  console.timeEnd('createOne');
})();

(function() {
  // Let's create 10
  console.time(   'createTen');
  for (var i = 10; i >= 0; i--)
    temp = new TestConstructor({ string: 'hej', number: i, bool: i % 2 === 0 });
  console.timeEnd('createTen');
})();

(function() {
  if (!execBigBoys)
    return ;
  // Let's create 100
  console.time(   'createHundred');
  for (var i = 100; i >= 0; i--)
    temp = new TestConstructor({ string: 'hej', number: i, bool: i % 2 === 0 });
  console.timeEnd('createHundred');
})();

(function() {
  // Let's create 100 objects
  console.time(   'createHundredObjects');
  for (var i = 100; i >= 0; i--)
    temp = new Object({ string: 'hej', number: i, bool: i % 2 === 0 });
  console.timeEnd('createHundredObjects');
})();

(function() {
  // Let's create some nested ones as well
  console.time(   'createOneOneLevelNest');
  temp = new HasNested({ number: 551135121, nested: [{ number: 551135121 }] });
  console.timeEnd('createOneOneLevelNest');
})();

(function() {
  console.time(   'createOneThreeLevelNest');
  temp = new HasNested({
    number: 123,
    nested: [{
      number: 4565641234564,
      nested: [{
        number: 456897,
        nested: [{
          nested: [{
            number: 123456
          }]
        }]
      }]
    }]
  });
  console.timeEnd('createOneThreeLevelNest');
})();

(function() {
  console.time(   'createTenThreeLevelNest');
  for (var i = 10; i >= 0; i--){
    temp = new HasNested({
      number: i * 10,
      testConstructor: new TestConstructor(),
      nested: [{
        number: i * 100,
        string: 'WHO!',
        nested: [{
          number: i * 1000,
          string: 'What?',
          testConstructor: new TestConstructor(),
          nested: [{
            nested: [{
              number: i * 100000
            }]
          }]
        }]
      }]
    });
  }
  console.timeEnd('createTenThreeLevelNest');
})();

(function() {
  if (!execBigBoys)
    return ;
  console.time(   'createFivehundredThreeLevelNest');
  for (var i = 500; i >= 0; i--){
    temp = new HasNested({
      number: i * 10,
      testConstructor: new TestConstructor(),
      string: 'cool',
      nested: [{
        number: i * 100,
        nested: [{
          number: i * 1000,
          string: 'NICE!',
          testConstructor: new TestConstructor(),
          nested: [{
            nested: [{
              number: i * 100000
            }]
          }]
        }]
      }]
    });
  }
  console.timeEnd('createFivehundredThreeLevelNest');
})();

(function() {
  console.time(   'createFivehundredThreeLevelNestedOrdinaryObjects');
  for (var i = 500; i >= 0; i--){
    temp = new Object({
      number: i * 10,
      testConstructor: {},
      string: 'cool',
      nested: [{
        number: i * 100,
        nested: [{
          number: i * 1000,
          string: 'NICE!',
          testConstructor: {},
          nested: [{
            nested: [{
              number: i * 100000
            }]
          }]
        }]
      }]
    });
  }
  console.timeEnd('createFivehundredThreeLevelNestedOrdinaryObjects');
})();

(function() {
  console.time(   'createFivethousandThreeLevelNestedOrdinaryObjects');
  for (var i = 5000; i >= 0; i--){
    temp = new Object({
      number: i * 10,
      testConstructor: {},
      string: 'cool',
      keyWhichDoesNotExist: true,
      nested: [{
        number: i * 100,
        nested: [{
          number: i * 1000,
          string: 'NICE!',
          testConstructor: {},
          nested: [{
            nested: [{
              number: i * 100000
            }]
          }]
        }]
      }]
    });
  }
  console.timeEnd('createFivethousandThreeLevelNestedOrdinaryObjects');
})();