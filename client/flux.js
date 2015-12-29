import t from 'tcomb';
import {state, stateView} from './rxFlux';
var Immutable = require('immutable');

var State = t.struct({
  show: t.enums({'all':1,'active':2, 'completed':3}),
  todos: t.list(t.struct({
    id: t.Number,
    title: t.String,
    completed: t.Boolean,
    editing: t.Boolean,
  })),
  editing: t.dict(t.String, t.String)
});

var initialState = {
  show: 'all',
  todos: [
    {
      id: 324,
      title: 'make a unicorn',
      completed: false,
      editing: false,
    },
    {
      id: 32674,
      title: 'buy a horse',
      completed: true,
      editing: false,
    }
  ]
};

export default function plugin() {
  return function (app) {
    var fux = state(State, initialState);

    app.set('fux', fux);
    window.stateView = stateView;
    window.__spec = {
      'propNameA': '/show',
      'propNameB': '/todos/-',
      'two': '/todos/1'
    };
    window.__fux = fux;
    window.__view = stateView(fux, window.__spec);
    var p = Immutable.fromJS([
      {op: 'replace', path: '/propNameA', value: 'active'}
    ]);
    setTimeout(() => window.__view.patch.onNext(p), 1000);
  };
};
