import React from 'react';
import { useAlgorithmStore } from '../../store/algorithmStore';
import { algorithms } from '../../algorithms';

export const PseudocodePanel: React.FC = () => {
    const { selectedAlgorithmId, steps, currentStepIndex } = useAlgorithmStore();

    const selectedAlgo = algorithms.find((a) => a.id === selectedAlgorithmId);

    if (!selectedAlgo) {
        return (
            <div className="panel">
                <div className="panel-title">Pseudocode</div>
                <div className="panel-content">
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Select an algorithm to view its pseudocode.
                    </p>
                </div>
            </div>
        );
    }

    const currentLine =
        currentStepIndex >= 0 && steps[currentStepIndex]
            ? steps[currentStepIndex].pseudocodeLine
            : -1;

    return (
        <div className="panel">
            <div className="panel-title">Pseudocode</div>
            <div className="panel-content">
                <div className="pseudocode">
                    {selectedAlgo.pseudocode.map((line, index) => (
                        <div
                            key={index}
                            className={`pseudocode-line ${currentLine === index ? 'active' : ''}`}
                        >
                            {line}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
