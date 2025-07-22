import React from 'react';
import ReactDOM from 'react-dom/client';
import page from 'page';
import IndexPage from './pages/index';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

const params = ({ params, querystring }) => {
  return {
    ...params,
    ...querystring.split('&').reduce((acc, pair) => {
      const [key, value] = pair.split('=');
      acc[key] = value;
      return acc;
    }, params),
  };
};

const handle = (name) => {
  return (ctx /*, next*/) => {
    import(`./pages/${name}`).then((module) => {
      root.render(
        <React.StrictMode>
          <module.default {...params(ctx)} />
        </React.StrictMode>,
      );
    });
  };
};

page('/', handle('index'));
page('/completions', handle('completions'));
page('/chat', handle('chat'));
page('/streaming', handle('streaming'));
page('/canvas-search', handle('canvas-search'));
page('/canvas-courses', handle('canvas-courses'));
page('/health', handle('health'));

page();
