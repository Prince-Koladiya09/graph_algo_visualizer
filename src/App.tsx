import { useEffect } from 'react';
import { GraphCanvas } from './components/Canvas/GraphCanvas';
import { Graph3DCanvas } from './components/Canvas/Graph3DCanvas';
import { PlaybackControls } from './components/Controls/PlaybackControls';
import { AlgorithmPanel } from './components/Panels/AlgorithmPanel';
import { PseudocodePanel } from './components/Panels/PseudocodePanel';
import { InfoPanel } from './components/Panels/InfoPanel';
import { DataStructuresPanel } from './components/Panels/DataStructuresPanel';
import { SettingsPanel } from './components/Panels/SettingsPanel';
import { ExamplesPanel } from './components/Panels/ExamplesPanel';
import { ImportExportPanel } from './components/Panels/ImportExportPanel';
import { RandomGraphPanel } from './components/Panels/RandomGraphPanel';
import { ComparisonPanel } from './components/Panels/ComparisonPanel';
import { QuizPanel } from './components/Panels/QuizPanel';
import { Toolbar } from './components/common/Toolbar';
import { useGraphStore } from './store/graphStore';
import { useAlgorithmStore } from './store/algorithmStore';
import { parseGraphFromURL } from './utils/importExport';

function App() {
  const { theme, viewMode, deleteSelected, loadGraph, undo, redo, setCurrentTool } = useGraphStore();
  const { steps, currentStepIndex } = useAlgorithmStore();
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load graph from URL if present
  useEffect(() => {
    const graphFromURL = parseGraphFromURL();
    if (graphFromURL) {
      loadGraph(graphFromURL);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [loadGraph]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Delete selected items
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') {
        setCurrentTool('select');
      }
      if (e.key === 'n' || e.key === 'N') {
        setCurrentTool('addNode');
      }
      if (e.key === 'e' || e.key === 'E') {
        setCurrentTool('addEdge');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, undo, redo, setCurrentTool]);

  return (
    <div className="app" role="application" aria-label="Graph Algorithm Visualizer">
      {/* Header */}
      <header className="app-header" role="banner">
        <div className="app-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="url(#logo-gradient)" strokeWidth="2" aria-hidden="true">
            <defs>
              <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <circle cx="5" cy="12" r="3" />
            <circle cx="19" cy="5" r="3" />
            <circle cx="19" cy="19" r="3" />
            <line x1="7.5" y1="10.5" x2="16.5" y2="6.5" />
            <line x1="7.5" y1="13.5" x2="16.5" y2="17.5" />
          </svg>
          <span>Graph Algorithm Visualizer</span>
        </div>
        <Toolbar />
        <div style={{ width: '200px' }} aria-hidden="true" /> {/* Spacer for balance */}
      </header>

      {/* Main Content */}
      <main className="app-main" id="main-content" role="main">
        {/* Left Panel */}
        <aside className="side-panel" role="complementary" aria-label="Graph controls">
          <AlgorithmPanel />
          <SettingsPanel />
          <ExamplesPanel />
          <RandomGraphPanel />
          <ImportExportPanel />
        </aside>

        {/* Canvas */}
        {viewMode === '2d' ? <GraphCanvas /> : <Graph3DCanvas />}

        {/* Right Panel */}
        <aside className="side-panel right-panel" role="complementary" aria-label="Algorithm information">
          <PseudocodePanel />
          <DataStructuresPanel />
          <InfoPanel />
          <QuizPanel />
          <ComparisonPanel />
        </aside>
      </main>

      {/* Current Step Explanation Banner */}
      {currentStep && (
        <div className="explanation-banner" role="status" aria-live="polite">
          {currentStep.description}
        </div>
      )}

      {/* Playback Controls */}
      <PlaybackControls />
    </div>
  );
}

export default App;
