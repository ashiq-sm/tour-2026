import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/tour-2026/sw.js').catch(() => {});
  });
}

const app = mount(App, {
  target: document.getElementById('app')
});

export default app;
