import React from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useAlgorithmStore } from '../../store/algorithmStore';
import { CanvasTool } from '../../types';

export const Toolbar: React.FC = () => {
    const {
        currentTool,
        setCurrentTool,
        viewMode,
        setViewMode,
        undo,
        redo,
        clearGraph,
        deleteSelected,
        selectedNodeIds,
        selectedEdgeIds,
        history,
        historyIndex,
    } = useGraphStore();

    const { resetExecution } = useAlgorithmStore();

    const tools: { id: CanvasTool; icon: React.ReactNode; label: string }[] = [
        {
            id: 'select',
            label: 'Select',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                </svg>
            ),
        },
        {
            id: 'addNode',
            label: 'Add Node',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
            ),
        },
        {
            id: 'addEdge',
            label: 'Add Edge',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="19" x2="19" y2="5" />
                    <circle cx="5" cy="19" r="3" />
                    <circle cx="19" cy="5" r="3" />
                </svg>
            ),
        },
    ];

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear the entire graph?')) {
            clearGraph();
            resetExecution();
        }
    };

    const hasSelection = selectedNodeIds.size > 0 || selectedEdgeIds.size > 0;
    const canUndo = historyIndex >= 0;
    const canRedo = historyIndex < history.length - 1;

    return (
        <div className="toolbar">
            <div className="toolbar-group">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        className={`btn btn-icon ${currentTool === tool.id ? 'active' : ''}`}
                        onClick={() => setCurrentTool(tool.id)}
                        title={tool.label}
                    >
                        {tool.icon}
                    </button>
                ))}
            </div>

            <div className="toolbar-group">
                <button
                    className="btn btn-icon"
                    onClick={undo}
                    disabled={!canUndo}
                    title="Undo (Ctrl+Z)"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 7v6h6" />
                        <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                    </svg>
                </button>
                <button
                    className="btn btn-icon"
                    onClick={redo}
                    disabled={!canRedo}
                    title="Redo (Ctrl+Y)"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 7v6h-6" />
                        <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
                    </svg>
                </button>
            </div>

            <div className="toolbar-group">
                <button
                    className={`btn btn-icon ${viewMode === '2d' ? 'active' : ''}`}
                    onClick={() => setViewMode('2d')}
                    title="2D View"
                    aria-label="Switch to 2D view"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="9" cy="9" r="2" />
                        <circle cx="15" cy="15" r="2" />
                        <line x1="11" y1="9" x2="13" y2="15" />
                    </svg>
                </button>
                <button
                    className={`btn btn-icon ${viewMode === '3d' ? 'active' : ''}`}
                    onClick={() => setViewMode('3d')}
                    title="3D View"
                    aria-label="Switch to 3D view"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l9 4.5v9L12 20l-9-4.5v-9L12 2z" />
                        <polyline points="12 2 12 20" />
                        <polyline points="3 6.5 12 11 21 6.5" />
                    </svg>
                </button>
            </div>

            <div className="toolbar-group">
                <button
                    className="btn btn-icon"
                    onClick={deleteSelected}
                    disabled={!hasSelection}
                    title="Delete Selected (Del)"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                </button>
                <button
                    className="btn btn-icon"
                    onClick={handleClear}
                    title="Clear Graph"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
