import React from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useAlgorithmStore } from '../../store/algorithmStore';
import { algorithms, categoryNames, isAlgorithmValidForGraph } from '../../algorithms';

export const AlgorithmPanel: React.FC = () => {
    const { graph } = useGraphStore();
    const {
        selectedAlgorithmId,
        algorithmParams,
        selectAlgorithm,
        setAlgorithmParams,
        runAlgorithm,
        resetExecution,
    } = useAlgorithmStore();

    const selectedAlgo = algorithms.find((a) => a.id === selectedAlgorithmId);

    const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value || null;
        selectAlgorithm(id);
    };

    const handleRun = () => {
        if (selectedAlgorithmId) {
            runAlgorithm(graph);
        }
    };

    const handleReset = () => {
        resetExecution();
    };

    const validation = selectedAlgorithmId
        ? isAlgorithmValidForGraph(selectedAlgorithmId, graph)
        : { valid: true };

    // Group algorithms by category
    const categories = Object.entries(categoryNames);

    return (
        <div className="panel">
            <div className="panel-title">Algorithm</div>
            <div className="panel-content">
                <div className="form-group">
                    <label className="form-label">Select Algorithm</label>
                    <select
                        className="form-select"
                        value={selectedAlgorithmId || ''}
                        onChange={handleAlgorithmChange}
                    >
                        <option value="">-- Choose Algorithm --</option>
                        {categories.map(([category, name]) => (
                            <optgroup key={category} label={name}>
                                {algorithms
                                    .filter((a) => a.category === category)
                                    .map((algo) => (
                                        <option key={algo.id} value={algo.id}>
                                            {algo.name}
                                        </option>
                                    ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {selectedAlgo && (
                    <>
                        {!validation.valid && (
                            <div
                                style={{
                                    padding: '8px 12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '6px',
                                    color: '#ef4444',
                                    fontSize: '0.875rem',
                                }}
                            >
                                ⚠️ {validation.reason}
                            </div>
                        )}

                        {selectedAlgo.requiresStartNode && (
                            <div className="form-group">
                                <label className="form-label">Start Node</label>
                                <select
                                    className="form-select"
                                    value={algorithmParams.startNodeId || ''}
                                    onChange={(e) =>
                                        setAlgorithmParams({ startNodeId: e.target.value || undefined })
                                    }
                                >
                                    <option value="">-- Select --</option>
                                    {graph.nodes.map((node) => (
                                        <option key={node.id} value={node.id}>
                                            {node.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {selectedAlgo.requiresEndNode && (
                            <div className="form-group">
                                <label className="form-label">End Node</label>
                                <select
                                    className="form-select"
                                    value={algorithmParams.endNodeId || ''}
                                    onChange={(e) =>
                                        setAlgorithmParams({ endNodeId: e.target.value || undefined })
                                    }
                                >
                                    <option value="">-- Select --</option>
                                    {graph.nodes.map((node) => (
                                        <option key={node.id} value={node.id}>
                                            {node.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {selectedAlgo.id === 'astar' && (
                            <div className="form-group">
                                <label className="form-label">Heuristic</label>
                                <select
                                    className="form-select"
                                    value={algorithmParams.heuristic || 'euclidean'}
                                    onChange={(e) =>
                                        setAlgorithmParams({
                                            heuristic: e.target.value as 'manhattan' | 'euclidean',
                                        })
                                    }
                                >
                                    <option value="euclidean">Euclidean</option>
                                    <option value="manhattan">Manhattan</option>
                                </select>
                            </div>
                        )}

                        <div className="btn-group" style={{ marginTop: '8px' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleRun}
                                disabled={
                                    !validation.valid ||
                                    (selectedAlgo.requiresStartNode && !algorithmParams.startNodeId) ||
                                    (selectedAlgo.requiresEndNode && !algorithmParams.endNodeId)
                                }
                                style={{ flex: 1 }}
                            >
                                ▶ Run
                            </button>
                            <button className="btn btn-secondary" onClick={handleReset}>
                                Reset
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
