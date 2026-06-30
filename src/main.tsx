import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/index.css';
import '@/i18n';
import { App } from '@/App';
import { armAudioUnlock } from '@/shared/utils/audio-unlock';

// Unlock audio on the first user gesture so the first flashcard plays sound.
armAudioUnlock();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
