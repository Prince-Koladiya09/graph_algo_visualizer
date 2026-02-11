import React from 'react';
import { useAlgorithmStore } from '../../store/algorithmStore';

export const DataStructuresPanel: React.FC = () => {
    const { steps, currentStepIndex } = useAlgorithmStore();

    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

    if (!currentStep || !currentStep.dataStructures) {
        return null;
    }

    const { dataStructures } = currentStep;

    const renderValue = (value: unknown): React.ReactNode => {
        if (Array.isArray(value)) {
            if (value.length === 0) return <span style={{ color: 'var(--text-muted)' }}>empty</span>;
            return (
                <div className="data-structure-content">
                    {value.map((item, i) => (
                        <span key={i} className="data-item">
                            {String(item)}
                        </span>
                    ))}
                </div>
            );
        }

        if (typeof value === 'object' && value !== null) {
            return (
                <div className="data-structure-content" style={{ flexDirection: 'column', gap: '4px' }}>
                    {Object.entries(value).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, minWidth: '30px' }}>{k}:</span>
                            <span className="data-item">{String(v)}</span>
                        </div>
                    ))}
                </div>
            );
        }

        return <span className="data-item">{String(value)}</span>;
    };

    return (
        <div className="panel">
            <div className="panel-title">Data Structures</div>
            <div className="panel-content">
                {Object.entries(dataStructures).map(([key, value]) => (
                    <div key={key} className="data-structure">
                        <div className="data-structure-title">{key}</div>
                        {renderValue(value)}
                    </div>
                ))}
            </div>
        </div>
    );
};
