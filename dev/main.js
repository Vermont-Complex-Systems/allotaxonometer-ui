import { mount } from 'svelte';
import './src/app.css'; // Import Tailwind styles

// App registry
const apps = {
  vanilla: () => import('./apps/VanillaApp.svelte'),
  shadcn: () => import('./apps/ShadcnApp.svelte'),
  bitsui: () => import('./apps/BitsuiApp.svelte'),
  class: () => import('./apps/ClassApp.svelte'),
  dash: () => import('./apps/DashApp.svelte')
};

// Simple routing based on hash
const getAppType = () => {
  const hash = window.location.hash.slice(1);
  return hash in apps ? hash : 'vanilla';
};

async function loadApp() {
  const appType = getAppType();
  const AppComponent = await apps[appType]();
  
  mount(AppComponent.default, {
    target: document.getElementById('app')
  });
}

// Initial load
loadApp();

// Handle hash changes
window.addEventListener('hashchange', () => {
  // Clear the app container and reload
  document.getElementById('app').innerHTML = '';
  loadApp();
});