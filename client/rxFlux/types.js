import t from 'tcomb';
import Immutable from 'immutable';

import JSONPointer from './JSONPointer';
import * as meta from './meta';

export const Type = t.irreducible('Type', t.isType);
export const specificString = s => t.irreducible('String: ' + s, x => s == x);
export const Record = t.irreducible('Record', x => !t.Function.is(x));

const maybeToUnion = T => t.union([t.Nil, T.meta.type]);
const maybe = T => t.union([t.Nil, T]);

function nullError(f) {
  var result = null;
  try {
    result = f();
  } catch(e) {
    result = null;
  }
  return result;
}

export function isValidType(T) {
  if(meta.isIrreducible(T)) return true;

  if(meta.isSubtype(T) || meta.isList(T)) return isValidType(T.meta.type);
  if(meta.isDict(T)) return isValidType(T.meta.codomain);
  if(meta.isStruct(T)) return Object.keys(T.meta.props).every(k => isValidType(T.meta.props[k]));
  if(meta.isUnion(T)) return T.meta.types.every(k => isValidType(k));

  return false;
}

export function getSubType(T, pointer) {
  pointer = JSONPointer.create(pointer);
  if(pointer.path.length === 0) return T;

  if(meta.isIrreducible(T))
    throw new Error('path is not empty and next type is irreducible');

  var next = pointer.slice(1);
  if(meta.isUnion(T)) {
    var types = T.meta.types
      .map(Type  => nullError(() => getSubType(Type, next)))
      .filter(x => x !== null);
    if(types.length === 0) throw new Error('path dosent fit on any union subtype');
    if(types.length === 1) return types[0];
    return t.union(types);
  }

  if(meta.isSubtype(T)) return getSubType(T.meta.type, next);
  if(meta.isList(T)) return maybe(getSubType(T.meta.type, next));
  if(meta.isDict(T)) return maybe(getSubType(T.meta.codomain, next));
  if(meta.isStruct(T)) return getSubType(T.meta.props[pointer.path[0]], next);

  throw new Error('T is not a Valid Type');
}

export function derriveStructure(T, init) {
  if(!t.Nil.is(init) && !validCheck(T, init))
    throw new Error('init value must be of Type T');

  if(meta.isIrreducible(T) && t.Nil.is(init))
    throw new Error('irreducibles need init value');

  if(meta.isIrreducible(T)) return init;

  if(meta.isUnion(T)) {
    var values = T.meta.types
      .map(Type => nullError(() => derriveStructure(Type, init)))
      .filter(x => x !== null);
    if(values.length === 0) throw new Error('init dosent fit on any union subtype');
    return values[0];
  }

  if(meta.isSubtype(T)) return derriveStructure(T.meta.type, init);

  if(meta.isList(T))
    return Immutable.List((init || []).map( e => derriveStructure(T.meta.type, e)));

  if(meta.isDict(T)) {
    var o = init || {};
    var keys = Object.keys(o);
    return Immutable.Map(keys.map(p => [p, derriveStructure(T.meta.codomain, o[p])]))
  }

  if(meta.isStruct(T)) {
    var keys = Object.keys(T.meta.props);
    var o = init || {};
    return Immutable.Map(keys.map(p => [p, derriveStructure(T.meta.props[p], o[p])]))
  }

  throw new Error('T is not a Valid Type');
}

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

export function validCheck(T, x) {
  if(!isValidType(T)) throw Error('validCheck can only check valid Types');
  if(!t.Nil.is(x) && t.Function.is(x.toJS)) x = x.toJS();
  if(meta.isIrreducible(T)) return T.is(x);

  if(meta.isUnion(T))
    return T.meta.types.some(T => validCheck(T, x));

  if(meta.isSubtype(T))
    return validCheck(T.meta.type, x) && T.meta.predicate(x);

  if(meta.isList(T))
    return t.Array.is(x) && x.every(y => validCheck(T.meta.type, y));

  if(meta.isDict(T))
    return t.dict(t.String, t.Any).is(x) && Object.keys(x).every(k => validCheck(T.meta.codomain, x[k]));

  if(meta.isStruct(T))
    return t.dict(t.String, t.Any).is(x) && Object.keys(x).every(k => validCheck(T.meta.props[k], x[k]));

  throw new Error('Uppsss');
}

export function unbox(T, v) {// TODO: Handle union
  if(!isValidType(T)) throw Error('unbox can only unbox valid Types');
  if(!validCheck(T, v)) throw Error('v must be of Type T');
  if(meta.isIrreducible(T)) return v;
  return v.toJS(); // we dont need recursion here, toJS is recursive
}

export function getSubValue(T, v, pointer, toJS) {
  //console.log('##getSubValue', T.displayName,(v && v.toJS ? v.toJS() : v),pointer);
  if(!isValidType(T)) throw Error('getSubValue can only get from valid Types');
  if(!validCheck(T, v)) throw Error('v must be of Type T');
  pointer = JSONPointer.create(pointer);
  if(pointer.path.length === 0) return toJS === true ? unbox(T,v) : v;
  if(meta.isIrreducible(T)) throw Error('T is irreducible and path is not empty');
  if(meta.isSubtype(T)) return getSubValue(T.meta.type, v, pointer, toJS);

  if(meta.isUnion(T)) {
    var values = T.meta.types
      .map(Type => nullError(() => getSubValue(Type, v, pointer, toJS)))
      .filter(x => x !== null);
    if(values.length === 0) throw new Error('pointer dosent fit on any union subtype');
    return values[0];
  }

  var nextKey = pointer.path[0];
  var nextPointer = pointer.slice(1);

  if(nextKey === '-' && !meta.isList(T))
    throw new Error('next prop is "-"(last item) and T is not list');

  const getLength = l => l.size ? l.size : (l.length ? l.length : null); // TODO: Refactor!

  if(nextKey === '-') nextKey = '' + getLength(v) - 1;//(v.size === 0 ? 0 : v.size - 1);

  if(meta.isList(T))
    return getSubValue(T.meta.type, v.get(nextKey), nextPointer, toJS);

  if(meta.isDict(T))
    return getSubValue(T.meta.codomain, v.get(nextKey), nextPointer, toJS);

  if(meta.isStruct(T))
    return getSubValue(T.meta.props[nextKey], v.get(nextKey), nextPointer, toJS);

  throw new Error(pointer.path + ' is invalid for ', T);
}
