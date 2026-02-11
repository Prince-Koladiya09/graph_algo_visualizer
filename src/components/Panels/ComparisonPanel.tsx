import React, { useEffect, useRef } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useComparisonStore } from '../../store/comparisonStore';
import { algorithms, categoryNames } from '../../algorithms';

export const ComparisonPanel: React.FC = () => {
    const { graph } = useGraphStore();
    const {
        isComparisonMode,
        algorithm1Id,
        algorithm2Id,
        steps1,
        steps2,
        currentStep1,
        currentStep2,
        isPlaying,
        speed,
        startNodeId,
        endNodeId,
        enableComparisonMode,
        disableComparisonMode,
        selectAlgorithm1,
        selectAlgorithm2,
        setStartNode,
        setEndNode,
        runComparison,
        resetComparison,
        play,
        pause,
        stepForward,
        stepBackward,
        jumpToStart,
        jumpToEnd,
    } = useComparisonStore();

    const timerRef = useRef<number | null>(null);

    const algo1 = algorithms.find(a => a.id === algorithm1Id);
    const algo2 = algorithms.find(a => a.id === algorithm2Id);

    // Auto-step when playing
    useEffect(() => {
        if (isPlaying && steps1.length > 0) {
            timerRef.current = window.setInterval(() => {
                stepForward();
            }, 1000 / speed);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isPlaying, speed, stepForward, steps1.length]);

    const handleRun = () => {
        runComparison(graph);
    };

    const handleReset = () => {
        resetComparison();
    };

    const needsStartNode = algo1?.requiresStartNode || algo2?.requiresStartNode;
    const needsEndNode = algo1?.requiresEndNode || algo2?.requiresEndNode;
    const canRun = algorithm1Id && algorithm2Id &&
        (!needsStartNode || startNodeId) &&
        (!needsEndNode || endNodeId);

    const categories = Object.entries(categoryNames);

    // Get metrics for comparison
    const metrics1 = steps1[currentStep1]?.metrics;
    const metrics2 = steps2[currentStep2]?.metrics;

    if (!isComparisonMode) {
        return (
            <div className="panel">
                <div className="panel-title">Comparison Mode</div>
                <div className="panel-content">
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        Compare two algorithms side-by-side on the same graph.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={enableComparisonMode}
                        style={{ width: '100%' }}
                    >
                        Enable Comparison Mode
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="panel">
            <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Comparison Mode
                <button
                    className="btn btn-secondary"
                    onClick={disableComparisonMode}
                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                >
                    Exit
                </button>
            </div>
            <div className="panel-content">
                {/* Algorithm 1 */}
                <div className="form-group">
                    <label className="form-label" style={{ color: '#60a5fa' }}>Algorithm 1</label>
                    <select
                        className="form-select"
                        value={algorithm1Id || ''}
                        onChange={(e) => selectAlgorithm1(e.target.value || null)}
                    >
                        <option value="">-- Select --</option>
                        {categories.map(([category, name]) => (
                            <optgroup key={category} label={name}>
                                {algorithms
                                    .filter((a) => a.category === category)
                                    .map((algo) => (
                                        <option key={algo.id} value={algo.id} disabled={algo.id === algorithm2Id}>
                                            {algo.name}
                                        </option>
                                    ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {/* Algorithm 2 */}
                <div className="form-group">
                    <label className="form-label" style={{ color: '#f472b6' }}>Algorithm 2</label>
                    <select
                        className="form-select"
                        value={algorithm2Id || ''}
                        onChange={(e) => selectAlgorithm2(e.target.value || null)}
                    >
                        <option value="">-- Select --</option>
                        {categories.map(([category, name]) => (
                            <optgroup key={category} label={name}>
                                {algorithms
                                    .filter((a) => a.category === category)
                                    .map((algo) => (
                                        <option key={algo.id} value={algo.id} disabled={algo.id === algorithm1Id}>
                                            {algo.name}
                                        </option>
                                    ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {/* Parameters */}
                {needsStartNode && (
                    <div className="form-group">
                        <label className="form-label">Start Node</label>
                        <select
                            className="form-select"
                            value={startNodeId || ''}
                            onChange={(e) => setStartNode(e.target.value || null)}
                        >
                            <option value="">-- Select --</option>
                            {graph.nodes.map((node) => (
                                <option key={node.id} value={node.id}>{node.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {needsEndNode && (
                    <div className="form-group">
                        <label className="form-label">End Node</label>
                        <select
                            className="form-select"
                            value={endNodeId || ''}
                            onChange={(e) => setEndNode(e.target.value || null)}
                        >
                            <option value="">-- Select --</option>
                            {graph.nodes.map((node) => (
                                <option key={node.id} value={node.id}>{node.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Run/Reset buttons */}
                <div className="btn-group" style={{ marginTop: '8px' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleRun}
                        disabled={!canRun}
                        style={{ flex: 1 }}
                    >
                        Run
                    </button>
                    <button className="btn btn-secondary" onClick={handleReset}>
                        Reset
                    </button>
                </div>

                {/* Playback Controls */}
                {steps1.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                            <button className="btn btn-icon" onClick={jumpToStart} title="Jump to start">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="19 20 9 12 19 4 19 20" />
                                    <line x1="5" y1="19" x2="5" y2="5" />
                                </svg>
                            </button>
                            <button className="btn btn-icon" onClick={stepBackward} title="Step back">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="19 20 9 12 19 4 19 20" />
                                </svg>
                            </button>
                            <button className="btn btn-icon" onClick={isPlaying ? pause : play} title={isPlaying ? 'Pause' : 'Play'}>
                                {isPlaying ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="6" y="4" width="4" height="16" />
                                        <rect x="14" y="4" width="4" height="16" />
                                    </svg>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                )}
                            </button>
                            <button className="btn btn-icon" onClick={stepForward} title="Step forward">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="5 4 15 12 5 20 5 4" />
                                </svg>
                            </button>
                            <button className="btn btn-icon" onClick={jumpToEnd} title="Jump to end">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="5 4 15 12 5 20 5 4" />
                                    <line x1="19" y1="5" x2="19" y2="19" />
                                </svg>
                            </button>
                        </div>

                        {/* Metrics Comparison */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div style={{
                                padding: '8px',
                                background: 'rgba(96, 165, 250, 0.1)',
                                borderRadius: '6px',
                                borderLeft: '3px solid #60a5fa'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: '#60a5fa', marginBottom: '4px' }}>
                                    {algo1?.name}
                                </div>
                                <div style={{ fontSize: '0.8rem' }}>
                                    Step: {currentStep1 + 1} / {steps1.length}
                                </div>
                                {metrics1 && (
                                    <>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            Visited: {metrics1.nodesVisited}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            Ops: {metrics1.operationsCount}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={{
                                padding: '8px',
                                background: 'rgba(244, 114, 182, 0.1)',
                                borderRadius: '6px',
                                borderLeft: '3px solid #f472b6'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: '#f472b6', marginBottom: '4px' }}>
                                    {algo2?.name}
                                </div>
                                <div style={{ fontSize: '0.8rem' }}>
                                    Step: {currentStep2 + 1} / {steps2.length}
                                </div>
                                {metrics2 && (
                                    <>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            Visited: {metrics2.nodesVisited}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            Ops: {metrics2.operationsCount}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
