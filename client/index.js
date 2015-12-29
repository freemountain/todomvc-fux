import element from 'magic-virtual-element'
import { render, tree } from 'deku';
import App from './components/App';
import todos from './todos';
import filter from './filter';
import flux from './flux';

var app = tree(<App />);
app.use(flux());
app.use(filter());
app.use(todos());

render(app, document.querySelector('main'));

window.__app = app;
