import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import { ThemeProvider, StyleReset } from 'atomize';
import { Provider as StyletronProvider, DebugEngine } from "styletron-react";
import { Client as Styletron } from "styletron-engine-atomic";

const debug =
  process.env.NODE_ENV === "production" ? void 0 : new DebugEngine();
const engine = new Styletron();
const theme = {
  grid: {
    colCount: 10,
  }
};

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <StyleReset />
    <React.StrictMode>
      <StyletronProvider value={engine} debug={debug} debugAfterHydration>
        <App />
      </StyletronProvider>
    </React.StrictMode>
  </ThemeProvider>,
  document.getElementById('root')
);