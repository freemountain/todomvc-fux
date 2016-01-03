import  t from 'tcomb';
import Rx from 'rx';
import Immutable from 'immutable';
import diff from 'immutablediff';

import JSONPointer from './JSONPointer';
import {Patch} from './Patch';
import {getSubType, getSubValue, check,  unboxState} from './types';


function mapPatch(spec, patch) {
  patch = Patch(patch);
  if(patch.path === '/')
    throw new Error('Patching root node from StateView is not implemented');
  var target = JSONPointer.create(patch.path);
  var destination = spec.get(target.path[0], null);
  var newPath = destination.concat(target.path.slice(1)).toRFC();
  if(t.Nil.is(destination))
    throw new Error('StateView patch: unkonwn path ', target.toRFC());
  return Patch.update(patch, {path:{'$set': newPath}});
}

function _log(v) {
  console.log('_log: ', v);
  return v;
}
function rxStateView(rootState, spec) {
  spec = Immutable
    .Map(spec)
    .map(prop => JSONPointer.create(prop));

  var typeDescription = spec.map(pointer => getSubType(rootState.type, pointer.path));
  var T = t.struct(typeDescription.toJS());
  //var getStateFromParent = () => spec.map(p => JSONPointer.apply(rootState.get(), p));

  var getStateFromParent = () => spec.map(p => rootState.get(_log(p)));

  var _state = getStateFromParent(); //initialState

  var view = {
    patch: new Rx.Subject(),
    diff: new Rx.Subject(),
    log: new Rx.Subject(),
    type: T,
    get: (pointer, toJS) => getSubValue(T, _state, pointer || [], toJS),
    sub: (spec) => rxStateView(view, spec)
  };

  view.log.subscribe(msg => rootState.log.onNext(msg));

  rootState.diff.subscribe(function() {
    var newState = getStateFromParent();
    var delta = diff(_state, newState);
    if(delta.size === 0) return;
    _state = newState;
    view.diff.onNext(delta);
  });

  view.patch.subscribe(function(patch) {
    patch = patch
      .toJS()
      .map( p => mapPatch(spec, p) );

    rootState.patch.onNext(Immutable.List(patch));
  });

  return view;
}

export default rxStateView;
