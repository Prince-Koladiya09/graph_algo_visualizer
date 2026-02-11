import React from 'react';
import { useGraphStore } from '../../store/graphStore';

export const SettingsPanel: React.FC = () => {
    const {
        graph,
        theme,
        setGraphDirected,
        setGraphWeighted,
        setTheme,
    } = useGraphStore();

    return (
        <div className="panel">
            <div className="panel-title">Graph Settings</div>
            <div className="panel-content">
                <div className="toggle-group">
                    <span className="form-label">Directed Graph</span>
                    <button
                        className={`toggle ${graph.directed ? 'active' : ''}`}
                        onClick={() => setGraphDirected(!graph.directed)}
                        aria-label="Toggle directed graph"
                    />
                </div>

                <div className="toggle-group">
                    <span className="form-label">Weighted Edges</span>
                    <button
                        className={`toggle ${graph.weighted ? 'active' : ''}`}
                        onClick={() => setGraphWeighted(!graph.weighted)}
                        aria-label="Toggle weighted edges"
                    />
                </div>

                <div className="toggle-group">
                    <span className="form-label">Dark Mode</span>
                    <button
                        className={`toggle ${theme === 'dark' ? 'active' : ''}`}
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        aria-label="Toggle dark mode"
                    />
                </div>
            </div>
        </div>
    );
};
