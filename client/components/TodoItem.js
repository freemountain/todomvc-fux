import element from 'magic-virtual-element';

import bus from 'bus';
import { dom } from 'deku';
import { ENTER, ESCAPE } from '../keycodes';

import rxComponent from './../rxComponent';

function afterRender({ state }, el) {
  console.log(state);
  if (state.todo.editing && !state.todo.title) {
    var input = el.querySelector('input.edit');
    input.focus();
    input.select();
  }
}

function render({ props, state }, setState) {
  let { fux } = props;

  let { id, completed, title, editing } = fux.get([], true).todo;
  var classes = { completed, editing };

  function destroy() {
    bus.emit('todo:remove', id);
  }

  function edit() {
    setState({todo:{ editing: true }});
  }

  function cancel() {
    return;
    setState({
      editing: false,
      //title: null
    });
  }

  function save() {
    return;
    bus.emit('todo:title', id, state.title);

    setState({
      editing: false,
      //title: null
    });
  }

  function toggle() {
    bus.emit('todo:toggle', id);
  }

  function onKeyUp(e) {
    return;
    if (e.keyCode === ESCAPE) {
      cancel();
    } else if (e.keyCode === ENTER) {
      save();
    } else {
      setState({ title: e.target.value });
    }
  }

  return (
    <li class={classes}>
      <div class="view" onDoubleClick={edit}>
        <input class="toggle" type="checkbox" checked={completed} onChange={toggle} />
        <label>{title}</label>
        <button class="destroy" onClick={destroy}></button>
      </div>
      <input class="edit" value={title} onKeyUp={onKeyUp} />
    </li>
  );
}

export default rxComponent({ afterRender, render });
