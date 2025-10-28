import { mount, unmount } from 'svelte';
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
  return hash in apps ? hash : 'dash';  // Default to 'dash' instead of 'vanilla'
};

// Keep track of currently mounted component
let currentApp = null;

// Update navigation active state
function updateNavigation() {
  const currentRoute = getAppType();
  document.querySelectorAll('.dev-nav a').forEach(link => {
    const route = link.getAttribute('data-route');
    if (route === currentRoute) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

async function loadApp() {
  const appType = getAppType();
  const AppComponent = await apps[appType]();

  // Unmount previous component if it exists
  if (currentApp) {
    unmount(currentApp);
  }

  // Clear the container
  const container = document.getElementById('app');
  container.innerHTML = '';

  // Mount new component
  currentApp = mount(AppComponent.default, {
    target: container
  });

  // Update navigation
  updateNavigation();
}

// Initial load
loadApp();

// Handle hash changes
window.addEventListener('hashchange', () => {
  loadApp();
});