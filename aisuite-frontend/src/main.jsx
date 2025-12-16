// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import DialogProvider from './components/UI/DialogProvider';
import { BrowserRouter } from 'react-router-dom';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <DialogProvider>
      <App />
    </DialogProvider>
  </BrowserRouter>
);
