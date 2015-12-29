import { getSubType, unboxState } from './rxFlux';
import t from 'tcomb';
import Immutable from 'immutable';
import diff from 'immutablediff';
var deepAssign = require('deep-assign');

import {PatchList} from './rxFlux/Patch';

function normalizePatch(patch) {
  if(patch.path !== '/' || !t.Object.is(patch.value)) return [patch];
  var _patch = [];
  console.log(patch.value);
  Object.keys(patch.value).forEach(function(key) {
    var _p = Object.assign({}, patch);
    _p.path = '/'+key;
    _p.value = patch.value[key];
    _patch.push(_p);
  });
  return _patch;
}

function _set(state) {
  return function(spec) {
    var patch = PatchList.fromReact(spec);
    state.patch.onNext(Immutable.fromJS(patch));
  }
}

function _component(component) {
  return {
    id: component.id,
    props: component.props,
    state: component.props.fux.get([])
  };
}


module.exports = function(component) {
  let _propTypes = component.propTypes || {};
  let _beforeMount =  component.beforeMount; // component -> _
  let _shouldUpdate =  component.shouldUpdate; // component, nextProps, nextState -> bool
  let _beforeRender =  component.beforeRender; // component -> _
  let _beforeUpdate =  component.beforeUpdate; // component, nextProps, nextState -> _
  let _render =  component.render; // component, setState -> vdom
  let _afterRender =  component.afterRender; // component, el -> _
  let _afterUpdate =  component.afterUpdate; // component, prevProps, prevState, setState -> _
  let _afterMount = component.afterMount; // component, el, setState -> _
  let _beforeUnmount =  component.beforeMount; // component, el -> _


  component.propTypes = Object.assign({}, _propTypes, {
    fux: {type: 'any'},
  });

  component.initialState = props => props.fux.get([], true);


  component.render = function(component, setState) {
    return _render(_component(component), _set(component.props.fux));
  };

  component.afterMount = function(component, el, setState) {
    let {props, id} = component;
    let state = props.fux;

    state.diff.subscribe(function(event) {
      setState({}); // trigger rerender
    });

    if(!_afterMount) return;
    _afterMount(_component(component), el, setState);
  };



  return component;
};
