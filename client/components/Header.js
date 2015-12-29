import element from 'magic-virtual-element';

import { dom } from 'deku';
import { ENTER } from '../keycodes';
import bus from 'bus';
import rxComponent from './../rxComponent';

var Immutable = require('immutable');
var c = 1;

const addTodo = function(title, id) {
  return Immutable.fromJS([
    {op: 'add', path: '/todos/-', value: {
      completed: false,
      editing: false,
      id: (id * c++)%999,
      title
    }}
  ]);
};


function render(component) {
  console.log('render header', component);
  let {props, id} = component;
  let state = props.fux;

  function onKeyUp(e) {
    if (e.keyCode === ENTER) {
      var title = e.target.value;
      state.patch.onNext(addTodo(title, id));
      e.target.value = '';
    }
  }

  return (
    <header class="header">
      <h1>todos</h1>
      <input class="new-todo" placeholder="What needs to be done?" autofocus onKeyUp={onKeyUp} />
    </header>
  );
}

export default rxComponent({ render });
