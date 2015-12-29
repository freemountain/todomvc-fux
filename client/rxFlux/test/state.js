var expect = require('chai').expect;
var  t = require('tcomb');
var state = require('./../state.js');
describe('Array', function() {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      var State = t.struct({
        n:t.Number,
        s: t.String,
        l: t.list(t.Number)
      });

      var initialState = {
        n: 4,
        s: 'foo',
        l: [1,2,3,4,5]
      };

    });
  });
});
