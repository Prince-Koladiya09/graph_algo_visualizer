import React from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useAlgorithmStore } from '../../store/algorithmStore';
import { exampleGraphs } from '../../data/examples';

export const ExamplesPanel: React.FC = () => {
    const { loadGraph } = useGraphStore();
    const { resetExecution } = useAlgorithmStore();

    const handleLoadExample = (graphId: string) => {
        const example = exampleGraphs.find((e) => e.id === graphId);
        if (example) {
            if (window.confirm(`Load "${example.name}"? This will replace your current graph.`)) {
                loadGraph(example.graph);
                resetExecution();
            }
        }
    };

    return (
        <div className="panel">
            <div className="panel-title">Example Graphs</div>
            <div className="panel-content">
                <div className="example-grid">
                    {exampleGraphs.map((example) => (
                        <button
                            key={example.id}
                            className="example-btn"
                            onClick={() => handleLoadExample(example.id)}
                        >
                            {example.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
