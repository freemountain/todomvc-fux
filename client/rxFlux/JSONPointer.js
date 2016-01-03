import t from 'tcomb';
import {check} from './types';

const JSONPointer = t.struct({
  path: t.list(t.String)
}, 'JSONPointer');

JSONPointer.prototype.toRFC = function() {
  return '/' + this.path.join('/');
};

JSONPointer.prototype.toImmutable = function() {
  return this.path.join('.');
};

JSONPointer.prototype.head = function() {
  return this.path[0];
};

JSONPointer.prototype.concat = function(x) {
  if(check(JSONPointer, x)) return JSONPointer({
    path: this.path.concat(x.path)
  });

  if(t.list(t.String).is(x)) return JSONPointer({
    path: this.path.concat(x)
  });

  throw new Error('JSONPointer#concat argument should be JSONPointer or Array<String>');
};

JSONPointer.prototype.slice = function() {
  return JSONPointer({
    path: Array.prototype.slice.apply(this.path, arguments)
  });
};

JSONPointer.apply = function(im, pointer, notSetValue) {
  pointer = JSONPointer.create(pointer);
  if(pointer.path.length === 0) return im;
  var next = pointer.path[0];
  if(next === null || (next === '-' && im.size === 0)) return notSetValue;
  if(next === '-') next = im.size - 1;
  return JSONPointer.apply(im.get(next), pointer.slice(1), notSetValue);
};

JSONPointer.create = function(s) {
  if(t.list(t.String).is(s)) return JSONPointer({
    path: s
  });

  if(check(JSONPointer, s)) return JSONPointer(s);

  if(!t.String.is(s))
    throw new Error('JSONPointer::create argument should be JSONPointer, Array<String> or String' + s);

  if(s === '') return JSONPointer({
    path: [] //pointer to root (rfc)
  });

  if(s === '/') return JSONPointer({
    path: [''] //pointer to key "" (rfc)
  });

  if(s.startsWith('/')) return JSONPointer({
    path: s.split('/').slice(1)
  });

  return JSONPointer({
    path: s.split('.')
  });
};

export default JSONPointer;
