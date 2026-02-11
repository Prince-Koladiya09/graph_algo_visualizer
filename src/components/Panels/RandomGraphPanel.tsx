import React, { useState } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useAlgorithmStore } from '../../store/algorithmStore';
import { generateRandomGraph, generateConnectedRandomGraph } from '../../utils/randomGraph';

export const RandomGraphPanel: React.FC = () => {
    const { graph, loadGraph } = useGraphStore();
    const { resetExecution } = useAlgorithmStore();

    const [nodeCount, setNodeCount] = useState(8);
    const [edgeDensity, setEdgeDensity] = useState(0.3);
    const [minWeight, setMinWeight] = useState(1);
    const [maxWeight, setMaxWeight] = useState(10);
    const [ensureConnected, setEnsureConnected] = useState(true);

    const handleGenerate = () => {
        if (!window.confirm('This will replace your current graph. Continue?')) {
            return;
        }

        const options = {
            nodeCount,
            edgeDensity,
            directed: graph.directed,
            weighted: graph.weighted,
            minWeight,
            maxWeight,
            canvasWidth: 800,
            canvasHeight: 600,
        };

        const newGraph = ensureConnected
            ? generateConnectedRandomGraph(options)
            : generateRandomGraph(options);

        loadGraph(newGraph);
        resetExecution();
    };

    return (
        <div className="panel">
            <div className="panel-title">Random Graph</div>
            <div className="panel-content">
                <div className="form-group">
                    <label className="form-label">
                        Nodes: {nodeCount}
                    </label>
                    <input
                        type="range"
                        min="3"
                        max="20"
                        value={nodeCount}
                        onChange={(e) => setNodeCount(parseInt(e.target.value))}
                        className="speed-slider"
                        style={{ width: '100%' }}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">
                        Edge Density: {Math.round(edgeDensity * 100)}%
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="80"
                        value={edgeDensity * 100}
                        onChange={(e) => setEdgeDensity(parseInt(e.target.value) / 100)}
                        className="speed-slider"
                        style={{ width: '100%' }}
                    />
                </div>

                {graph.weighted && (
                    <div className="form-group">
                        <label className="form-label">Weight Range</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="number"
                                className="form-input"
                                value={minWeight}
                                onChange={(e) => setMinWeight(parseInt(e.target.value) || 1)}
                                min="1"
                                style={{ width: '70px' }}
                            />
                            <span style={{ color: 'var(--text-muted)' }}>to</span>
                            <input
                                type="number"
                                className="form-input"
                                value={maxWeight}
                                onChange={(e) => setMaxWeight(parseInt(e.target.value) || 10)}
                                min="1"
                                style={{ width: '70px' }}
                            />
                        </div>
                    </div>
                )}

                <div className="toggle-group">
                    <span className="form-label">Ensure Connected</span>
                    <button
                        className={`toggle ${ensureConnected ? 'active' : ''}`}
                        onClick={() => setEnsureConnected(!ensureConnected)}
                        aria-label="Toggle ensure connected"
                    />
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleGenerate}
                    style={{ width: '100%', marginTop: '8px' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                    </svg>
                    Generate
                </button>
            </div>
        </div>
    );
};
