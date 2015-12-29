var Immutable = require('immutable');
import hashchange from 'hashchange';
import t from 'tcomb';

function patch(state, show) {
  if(t.Nil.is(show) || show === '') return;
  state.patch.onNext(Immutable.fromJS([
    {op: 'replace', path: '/show', value: show}
  ]))
}

export default function plugin() {
  return function (app) {
    var state = app.sources.fux;
    patch(state, window.location.hash.slice(2));

    state.diff.subscribe(function(patch) {
      var filter = state.get('/show', true);
      if(filter === window.location.hash.slice(2)) return;
      window.location.hash = '#/' + filter;
    });

    hashchange.update(fragment => patch(state, fragment.slice(1)));
  };
};
