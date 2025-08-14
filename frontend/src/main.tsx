import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Set initial theme class to prevent flash - must be synchronous
const savedTheme = localStorage.getItem('taskpro-theme');
const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';

// Apply theme immediately to prevent any flash
document.documentElement.classList.remove('light', 'dark');
document.documentElement.classList.add(initialTheme);
document.documentElement.style.colorScheme = initialTheme;

createRoot(document.getElementById("root")!).render(<App />);
