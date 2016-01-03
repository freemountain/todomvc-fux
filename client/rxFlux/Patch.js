import t from 'tcomb';
import Immutable from 'immutable';

import {specificString, check} from './types';

const _Patch = t.struct({
  path: t.String,
});

export const AddPatch = _Patch.extend({
  op: specificString('add'),
  value: t.Any
}, 'AddPatch');

export const RemovePatch = _Patch.extend({
  op: specificString('remove')
}, 'RemovePatch');

export const ReplacePatch = _Patch.extend({
  op: specificString('replace'),
  value: t.Any
}, 'ReplacePatch');

export var Patch = t.union([AddPatch, RemovePatch, ReplacePatch], 'Patch');

Patch.dispatch = function(x) {
  if(check(AddPatch, x)) return AddPatch;
  if(check(RemovePatch, x)) return RemovePatch;
  if(check(ReplacePatch, x)) return ReplacePatch;
};

const _Irreducible = t.union([t.String, t.Number, t.Boolean, t.Array], '_Irreducible');

function fromReact(spec, prefix) {
  if(t.Nil.is(prefix)) prefix = '';
  return Immutable.Map(spec)
    .entrySeq()
    .map(function([prop, val]) {
      var path = prefix + '/' + prop;
      if(_Irreducible.is(val)) return [ReplacePatch({
        op: 'replace',
        path,
        value: val
      })];

      return fromReact(spec[prop], path);
    })
    .reduce((prev, curr) => prev.concat(curr), []);
}

export const PatchList = t.list(Patch);
PatchList.fromReact = spec => PatchList(fromReact(spec));
