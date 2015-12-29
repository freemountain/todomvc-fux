import element from 'magic-virtual-element';

import bus from 'bus';
import { dom } from 'deku';
import Footer from './Footer';
import Header from './Header';
import TodoList from './TodoList';
import {rxStateView} from './../rxFlux';

var propTypes = {
  fux: { source: 'fux' },
  filter: { source: 'filter' },
  todos: { source: 'todos' },
  dispatcher: { source: 'dispatcher'},
  state: { source: 'state'},
};

function shouldUpdate (component, nextProps, nextState) {
  let {props, state, id} = component;
  return true;
}

function render({ props }) {
  let { filter, todos, state, dispatcher, fux} = props;

  let toggle = e => true;

  if (filter === 'active') todos = todos.filter(todo => !todo.completed);
  else if (filter === 'completed') todos = todos.filter(todo => todo.completed);

  return (
    <section class="todoapp">
      <Header fux={fux} />
      <section class="main">
        <input class="toggle-all" type="checkbox" onChange={toggle} />
        <label for="toggle-all">Mark all as complete</label>
        <TodoList fux={fux}/>
      </section>
      <Footer fux={fux} />
    </section>
  );
}

export default { propTypes, render, shouldUpdate };
