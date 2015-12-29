import t from 'tcomb';
import Immutable from 'immutable';

import JSONPointer from './JSONPointer';

export const ImmutableMap = t.irreducible('ImmutableMap', Immutable.Map.isMap);
export const ImmutableList = t.irreducible('ImmutableList', Immutable.List.isList);

export const Type = t.irreducible('Type', t.isType);

export const StringDict = t.dict(t.String, t.String);

export const TypedFunction = t.irreducible('Type', function(f) {
  return t.Function.is(f)
          && t.Object.is(f.instrumentation)
          && t.Array.is(f.instrumentation.domain)
          && Type.is(f.instrumentation.codomain);
});

export const codomainTypedFunction = function(codomain) {
  return t.subtype(TypedFunction, (x) => x.instrumentation.codomain === codomain);
};

export const matchString = s => t.irreducible('String: ' + s, x => s == x);


export const check = t.func([Type, t.Any], t.Bool).of(function(type, x) {
  var result;
  try{
    type(x);
    result = true;
  } catch(e) {
    result = false;
  }
  return result;
});

export function unboxState(State, state) {
  if( State.meta.kind === 'irreducible' ) return state;
  //if( State.meta.kind === 'struct') return state().toJS();
  return state.toJS();
}

export const Record = t.irreducible('Record', x => !t.Function.is(x));
export const ValidIrreducibles = t.union([t.String, t.Number, t.Boolean, Record], 'ValidIrreducibles');
export const ValidType = t.refinement(Type, isValidType, 'ValidType');
export const ValidRootType = t.refinement(ValidType, x => x.meta.kind === 'struct');

const isValidIrreducibleType =
  T => ValidIrreducibles.meta.types.some(x => x === T) || T.meta.kind === 'enums';

export function isValidType(T) {
  if(isValidIrreducibleType(T)) return true;

  if(T.meta.kind === 'subtype' || T.meta.kind === 'list') return isValidType(T.meta.type);
  if(T.meta.kind === 'dict') return T.meta.domain === t.String && isValidType(T.meta.codomain);
  if(T.meta.kind === 'struct') return Object.keys(T.meta.props).every(k => isValidType(T.meta.props[k]));

  return false;
}

export function getSubType(T, pointer) {
  pointer = JSONPointer.create(pointer);
  if(pointer.path.length === 0) return T;

  if(isValidIrreducibleType(T))
    throw new Error('path is not empty and next type is irreducible');

  if(T.meta.kind === 'subtype') return getSubType(T.meta.type, pointer);

  var nextType = null;
  if(T.meta.kind === 'list') nextType = T.meta.type;
  if(T.meta.kind === 'dict') nextType = T.meta.codomain;
  if(T.meta.kind === 'struct') nextType = T.meta.props[pointer.path[0]];

  if(nextType === null) throw new Error('T is not a Valid Type');
  return getSubType(nextType, pointer.slice(1));
}

export function derriveStructure(T, init) {
  if(!t.Nil.is(init) && !validCheck(T, init))
    throw new Error('init value must be of Type T');

  if(isValidIrreducibleType(T) && t.Nil.is(init))
    throw new Error('irreducibles need init value');

  if(isValidIrreducibleType(T)) return init;

  if(T.meta.kind === 'subtype') return derriveStructure(T.meta.type, init);

  if(T.meta.kind === 'list')
    return Immutable.List((init || []).map( e => derriveStructure(T.meta.type, e)));

  if(T.meta.kind === 'dict') {
    var o = init || {};
    var keys = Object.keys(o);
    return Immutable.Map(keys.map(p => [p, derriveStructure(T.meta.codomain, o[p])]))
  }

  if(T.meta.kind === 'struct') {
    var keys = Object.keys(T.meta.props);
    var o = init || {};
    return Immutable.Map(keys.map(p => [p, derriveStructure(T.meta.props[p], o[p])]))
  }

  throw new Error('T is not a Valid Type');
}

export function validCheck(T, x) {
  if(!isValidType(T)) throw Error('validCheck can only check valid Types');
  if(t.Function.is(x.toJS)) x = x.toJS();
  if(isValidIrreducibleType(T)) return T.is(x);

  if(T.meta.kind === 'subtype')
    return validCheck(T.meta.type, x) && T.meta.predicate(x);

  if(T.meta.kind === 'list')
    return t.Array.is(x) && x.every(y => validCheck(T.meta.type, y));

  if(T.meta.kind === 'dict')
    return t.dict(t.String, t.Any).is(x) && Object.keys(x).every(k => validCheck(T.meta.codomain, x[k]));

  if(T.meta.kind === 'struct')
    return t.dict(t.String, t.Any).is(x) && Object.keys(x).every(k => validCheck(T.meta.props[k], x[k]));

  throw new Error('Uppsss');
}

export function unbox(T, v) {
  if(!isValidType(T)) throw Error('unbox can only unbox valid Types');
  if(!validCheck(T, v)) throw Error('v must be of Type T');
  if(isValidIrreducibleType(T)) return v;
  return v.toJS(); // we dont need recursion here, toJS is recursive
}

export function getSubValue(T, v, pointer, toJS) {
  console.log('getSubValue!!', arguments);
  if(!isValidType(T)) throw Error('getSubValue can only get from valid Types');
  if(!validCheck(T, v)) throw Error('v must be of Type T');
  pointer = JSONPointer.create(pointer);
  if(pointer.path.length === 0) return toJS === true ? unbox(T,v) : v;
  if(isValidIrreducibleType(T)) throw Error('T is irreducible and path is not empty');
  if(T.meta.kind === 'subtype') return getSubValue(T.meta.type, v, pointer, toJS);

  var nextKey = pointer.path[0];
  var nextPointer = pointer.slice(1);

  if(nextPointer === '-' && T.meta.kind !== 'list')
    throw new Error('next prop is "-"(last item) and T is not list');

  if(nextPointer === '-') nextPointer = v.size === 0 ? 0 : v.size - 1;

  if(T.meta.kind === 'list')
    return getSubValue(T.meta.type, v.get(nextKey), nextPointer, toJS);

  if(T.meta.kind === 'dict')
    return getSubValue(T.meta.codomain, v.get(nextKey), nextPointer, toJS);

  if(T.meta.kind === 'struct')
    return getSubValue(T.meta.props[nextKey], v.get(nextKey), nextPointer, toJS);

  throw new Error(pointer.path + ' is invalid for ', T);
}
