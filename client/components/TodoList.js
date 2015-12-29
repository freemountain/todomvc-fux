import element from 'magic-virtual-element';

import { dom } from 'deku';
import TodoItem from './TodoItem';

import rxComponent from './../rxComponent';
import {stateView} from './../rxFlux';

const filter = {
  'all': () => true,
  'active': (todo) => !todo.completed,
  'completed': (todo) => todo.completed
};

function render(component) {
  let {props, state, id } = component;
  let {fux} = props;
  var _filter = filter[state.get('show') || 'all'];

  var children = state.get('todos')
    .toJS()
    .map((v, i) => [v,i])
    .filter( ([v]) => _filter(v))
    .map(([v,i]) => <TodoItem fux={fux.sub({
      todo: '/todos/' + i
    })} />);

  return (
    <ul class="todo-list">{children}</ul>
  );
}

export default rxComponent({ render });
