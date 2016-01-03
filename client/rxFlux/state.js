import  t from 'tcomb';
import Rx from 'rx';
import Immutable from 'immutable';
import patch from 'immutablepatch';
import diff from 'immutablediff';

import JSONPointer from './JSONPointer';
import {isValidType, validCheck, derriveStructure, getSubValue} from './types';
import * as meta from './meta';

import stateView from './stateView';

function state(T, init) {
  if(!isValidType(T) || !meta.isStruct(T))
    throw new Error('T is not a valid root type');

  var state = derriveStructure(T, init);

  var view = {
    patch: new Rx.Subject(),
    diff: new Rx.Subject(),
    log: new Rx.Subject(),
    type: T,
    get: (pointer, toJS) => getSubValue(T, state, pointer || [], toJS),
    sub: (spec) => stateView(view, spec)
  };

  view.patch.subscribe(function(p) {
    p = Immutable
      .fromJS(p.map(x => Immutable.Map(x)))
      .map(function(patch) {
        // pointer /- to last index is broken in immutablediff
        // replace /foo/bar/- with /foo/bar/{sizeof(bar)}
        var path = patch.get('path');
        if(!path.endsWith('/-')) return patch;
        var pointer = JSONPointer.create(path);
        var base = pointer.slice(0,-1);
        var size = ''+state.get(base.toImmutable()).size;
        return patch.set('path', base.concat([size]).toRFC());
      });

    var _state = patch(state, p);
    if(!validCheck(T, _state)) {
      console.log('patch returned wrong type, val:', _state.toJS(), p.toJS());
      return;
    }
    var delta = diff(state, _state);
    state = _state;
    view.diff.onNext(delta);
  });

  return view;
}

export default state;
