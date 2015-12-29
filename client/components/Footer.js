import element from 'magic-virtual-element';

import { dom } from 'deku';
import bus from 'bus';
import Immutable from 'immutable';

import rxComponent from './../rxComponent';

function render(component) {
  let {props, state, id} = component
  let { dispatcher } = props;
console.log('s2', state);
  let show = state.get('show');
  let remaining = 4;
  let clear = () => dispatcher.onNext(['clearTodos']);
  return (
    <footer class="footer">
      <span class="todo-count">
        <strong>{remaining}</strong>
        {remaining === 1 ? ' item' : ' items'} left
      </span>
      <ul class="filters">
        <li><a class={ { selected: show === 'all' } } href="#/all">All</a></li>
        <li><a class={ { selected: show === 'active' } } href="#/active">Active</a></li>
        <li><a class={ { selected: show === 'completed' } } href="#/completed">Completed</a></li>
      </ul>
      <button class="clear-completed" onClick={clear}>Clear completed</button>
    </footer>
  );
}

export default rxComponent({ render });
