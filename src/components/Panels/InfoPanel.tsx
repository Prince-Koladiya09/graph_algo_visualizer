import React from 'react';
import { useAlgorithmStore } from '../../store/algorithmStore';
import { algorithms } from '../../algorithms';

export const InfoPanel: React.FC = () => {
    const { selectedAlgorithmId, steps, currentStepIndex } = useAlgorithmStore();

    const selectedAlgo = algorithms.find((a) => a.id === selectedAlgorithmId);
    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

    return (
        <div className="panel">
            <div className="panel-title">Information</div>
            <div className="panel-content">
                {/* Current Step Explanation */}
                {currentStep && (
                    <div className="info-section">
                        <h4>Current Step</h4>
                        <p>{currentStep.description}</p>
                    </div>
                )}

                {/* Algorithm Description */}
                {selectedAlgo && (
                    <>
                        <div className="info-section">
                            <h4>{selectedAlgo.name}</h4>
                            <p>{selectedAlgo.description}</p>
                        </div>

                        <div className="info-section">
                            <h4>Complexity</h4>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <span className="complexity-badge">
                                    Time: {selectedAlgo.timeComplexity}
                                </span>
                                <span className="complexity-badge">
                                    Space: {selectedAlgo.spaceComplexity}
                                </span>
                            </div>
                        </div>
                    </>
                )}

                {/* Metrics */}
                {currentStep && (
                    <div className="info-section">
                        <h4>Metrics</h4>
                        <div className="metrics-grid">
                            <div className="metric-item">
                                <div className="metric-value">{currentStep.metrics.nodesVisited}</div>
                                <div className="metric-label">Nodes Visited</div>
                            </div>
                            <div className="metric-item">
                                <div className="metric-value">{currentStep.metrics.edgesExamined}</div>
                                <div className="metric-label">Edges Examined</div>
                            </div>
                            <div className="metric-item">
                                <div className="metric-value">{currentStep.metrics.operationsCount}</div>
                                <div className="metric-label">Operations</div>
                            </div>
                            <div className="metric-item">
                                <div className="metric-value">{currentStep.metrics.comparisons}</div>
                                <div className="metric-label">Comparisons</div>
                            </div>
                        </div>
                    </div>
                )}

                {!selectedAlgo && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Select an algorithm to view information.
                    </p>
                )}
            </div>
        </div>
    );
};
