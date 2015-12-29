var expect = require('chai').expect;
var  t = require('tcomb');
var types = require('../types');

describe('types', function () {
  describe('isValidType()', function () {
    var irreducibles = [t.String, t.Number, t.Boolean, types.Record, t.enums.of(['foo', 'bar'])];

    it('validates irreducibles', function () {
      irreducibles.forEach(i => expect(types.isValidType(i)).to.equal(true));
    });

    it('validates refinement of irreducibles', function () {
      var refinements = irreducibles.map(i => t.refinement(i, ()=>true));
      refinements.forEach(i => expect(types.isValidType(i)).to.equal(true));
    });

    it('validates list of irreducibles', function () {
      var lists = irreducibles.map(i => t.list(i));
      lists.forEach(i => expect(types.isValidType(i)).to.equal(true));
    });

    it('validates string dict of irreducibles', function () {
      var dicts = irreducibles.map(i => t.dict(t.String, i));
      dicts.forEach(i => expect(types.isValidType(i)).to.equal(true));
    });

    it('validates structs of irreducibles', function () {
      var A  = t.struct({
        s: t.String,
        n: t.Number
      });
      var B = t.struct({
        b: t.Boolean,
        a: A
      });
      expect(types.isValidType(A)).to.equal(true);
      expect(types.isValidType(B)).to.equal(true);
    });

    it('validates todo example', function () {
      var State  = t.struct({
        show: t.enums({'all':1,'active':2, 'completed':3}),
        todos: t.list(t.struct({
          id: t.Number,
          title: t.String,
          completed: t.Boolean,
          editing: t.Boolean,
        })),
        editing: t.dict(t.String, t.String)
      });
      expect(types.isValidType(State)).to.equal(true);
    });
    it('invalidates sometimes...', function () {
      expect(types.isValidType(t.Function)).to.equal(false);
    });
  });

  describe('getSubType', function() {
    it('testA', function() {
      var A  = t.struct({
        s: t.String,
        n: t.Number
      });
      var B = t.struct({
        b: t.Boolean,
        a: A
      });
      //console.log('####', types.getSubType(B, '/a/n'));
    })
  });

  describe('derriveStructure', function() {
    it('test structure', function() {
      var A  = t.struct({
        s: t.String,
        n: t.Number,
        d: t.dict(t.String, t.Number),
        l: t.list(t.String),
        r: t.struct({
          b: t.Boolean,
          l: t.list(t.Number)
        })
      });
      var init = {
        s: 'foo',
        n: 23,
        r: {
          b: false
        }
      }
      var structure = types.derriveStructure(A, init);
      var structureJS = structure.toJS();
      var fixture = { s: 'foo', n: 23, d: {}, l: [], r: { b: false, l: [] } };
      expect(() => types.ImmutableList(structure.get('l')) ).not.to.throw(Error);
      expect(() => types.ImmutableMap(structure.get('d')) ).not.to.throw(Error);
      expect(() => types.ImmutableMap(structure.get('r')) ).not.to.throw(Error);
      expect(() => types.ImmutableList(structure.get('r').get('l')) ).not.to.throw(Error);
      expect(structure.get('s')).to.equal('foo');
      expect(structure.get('n')).to.equal(23);
      expect(structure.get('r').get('b')).to.equal(false);
    });
  });
});
