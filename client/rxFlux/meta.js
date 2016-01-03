export const isString =
  ({meta}) => meta.kind === 'irreducible' && meta.name === 'String';

export const isNumber =
  ({meta}) => meta.kind === 'irreducible' && meta.name === 'Number';

export const isBoolean =
  ({meta}) => meta.kind === 'irreducible' && meta.name === 'Boolean';

export const isNil =
  ({meta}) => meta.kind === 'irreducible' && meta.name === 'Nil';

export const isRecord =
  ({meta}) => meta.kind === 'irreducible' && meta.name === 'Record';

export const isEnum = ({meta}) => meta.kind === 'enums';

export const isSubtype = ({meta}) => meta.kind === 'subtype';
export const isList = ({meta}) => meta.kind === 'list';
export const isDict = ({meta}) => meta.kind === 'dict' && isString(meta.domain);
export const isStruct = ({meta}) => meta.kind === 'struct';
export const isUnion = ({meta}) => meta.kind === 'union';


export const isIrreducible = function(T) {
  return (
    isString(T) ||
    isNumber(T) ||
    isBoolean(T) ||
    isNil(T) ||
    isRecord(T) ||
    isEnum(T)
  );
};

export const isCombined = function(T) {
  return (
    isSubtype(T) ||
    isList(T) ||
    isDict(T) ||
    isStruct(T) ||
    isUnion(T)
  );
};
