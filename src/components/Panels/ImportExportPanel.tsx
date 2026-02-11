import React, { useState, useRef } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useAlgorithmStore } from '../../store/algorithmStore';
import {
    exportAsJSON,
    exportAsAdjacencyMatrix,
    exportAsAdjacencyList,
    generateShareableURL,
    importFromJSON,
    importFromAdjacencyMatrix,
    downloadFile,
    copyToClipboard,
} from '../../utils/importExport';

export const ImportExportPanel: React.FC = () => {
    const { graph, loadGraph } = useGraphStore();
    const { resetExecution } = useAlgorithmStore();
    const [showModal, setShowModal] = useState<'export' | 'import' | null>(null);
    const [exportFormat, setExportFormat] = useState<'json' | 'matrix' | 'list'>('json');
    const [importText, setImportText] = useState('');
    const [importFormat, setImportFormat] = useState<'json' | 'matrix'>('json');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleExport = () => {
        let content = '';
        let filename = '';
        let mimeType = 'text/plain';

        switch (exportFormat) {
            case 'json':
                content = exportAsJSON(graph);
                filename = 'graph.json';
                mimeType = 'application/json';
                break;
            case 'matrix':
                content = exportAsAdjacencyMatrix(graph);
                filename = 'graph_matrix.csv';
                mimeType = 'text/csv';
                break;
            case 'list':
                content = exportAsAdjacencyList(graph);
                filename = 'graph_list.txt';
                break;
        }

        downloadFile(content, filename, mimeType);
        showMessage('success', `Exported as ${filename}`);
        setShowModal(null);
    };

    const handleCopyToClipboard = () => {
        let content = '';
        switch (exportFormat) {
            case 'json':
                content = exportAsJSON(graph);
                break;
            case 'matrix':
                content = exportAsAdjacencyMatrix(graph);
                break;
            case 'list':
                content = exportAsAdjacencyList(graph);
                break;
        }
        copyToClipboard(content);
        showMessage('success', 'Copied to clipboard!');
    };

    const handleShareURL = () => {
        const url = generateShareableURL(graph);
        copyToClipboard(url);
        showMessage('success', 'Share URL copied to clipboard!');
    };

    const handleImport = () => {
        let importedGraph = null;

        if (importFormat === 'json') {
            importedGraph = importFromJSON(importText);
        } else {
            importedGraph = importFromAdjacencyMatrix(importText, graph.directed, graph.weighted);
        }

        if (importedGraph) {
            if (window.confirm('This will replace your current graph. Continue?')) {
                loadGraph(importedGraph);
                resetExecution();
                showMessage('success', 'Graph imported successfully!');
                setShowModal(null);
                setImportText('');
            }
        } else {
            showMessage('error', 'Invalid format. Please check your input.');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                setImportText(content);
            };
            reader.readAsText(file);
        }
    };

    const getExportPreview = () => {
        switch (exportFormat) {
            case 'json':
                return exportAsJSON(graph);
            case 'matrix':
                return exportAsAdjacencyMatrix(graph);
            case 'list':
                return exportAsAdjacencyList(graph);
        }
    };

    return (
        <>
            <div className="panel">
                <div className="panel-title">Import / Export</div>
                <div className="panel-content">
                    <div className="btn-group" style={{ flexDirection: 'column', gap: '8px' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowModal('export')}
                            style={{ width: '100%' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export Graph
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowModal('import')}
                            style={{ width: '100%' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Import Graph
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={handleShareURL}
                            style={{ width: '100%' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                            Share via URL
                        </button>
                    </div>
                </div>
            </div>

            {/* Export Modal */}
            {showModal === 'export' && (
                <div className="modal-overlay" onClick={() => setShowModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-title">Export Graph</div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Format</label>
                            <select
                                className="form-select"
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value as 'json' | 'matrix' | 'list')}
                            >
                                <option value="json">JSON</option>
                                <option value="matrix">Adjacency Matrix (CSV)</option>
                                <option value="list">Adjacency List</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Preview</label>
                            <textarea
                                className="form-input"
                                value={getExportPreview()}
                                readOnly
                                style={{
                                    height: '200px',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={handleCopyToClipboard}>
                                Copy to Clipboard
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowModal(null)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleExport}>
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showModal === 'import' && (
                <div className="modal-overlay" onClick={() => setShowModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-title">Import Graph</div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Format</label>
                            <select
                                className="form-select"
                                value={importFormat}
                                onChange={(e) => setImportFormat(e.target.value as 'json' | 'matrix')}
                            >
                                <option value="json">JSON</option>
                                <option value="matrix">Adjacency Matrix (CSV)</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">
                                Upload File or Paste Content
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,.csv,.txt"
                                onChange={handleFileUpload}
                                style={{ marginBottom: '8px' }}
                            />
                            <textarea
                                className="form-input"
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                placeholder={importFormat === 'json'
                                    ? '{"nodes": [...], "edges": [...], "directed": false, "weighted": true}'
                                    : ',A,B,C\nA,0,1,0\nB,1,0,1\nC,0,1,0'
                                }
                                style={{
                                    height: '200px',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setShowModal(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleImport}
                                disabled={!importText.trim()}
                            >
                                Import
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Toast */}
            {message && (
                <div
                    className="toast"
                    style={{
                        background: message.type === 'success' ? 'var(--node-in-solution)' : 'var(--edge-rejected)',
                        color: 'white'
                    }}
                >
                    {message.text}
                </div>
            )}
        </>
    );
};
