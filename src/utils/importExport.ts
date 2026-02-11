import { Graph, Node, Edge } from '../types';
import { v4 as uuidv4 } from 'uuid';

// ==================== EXPORT FUNCTIONS ====================

export function exportAsJSON(graph: Graph): string {
    return JSON.stringify(graph, null, 2);
}

export function exportAsAdjacencyMatrix(graph: Graph): string {
    const nodeIds = graph.nodes.map(n => n.id);
    const nodeLabels = graph.nodes.map(n => n.label);
    const n = nodeIds.length;

    // Create matrix
    const matrix: (number | string)[][] = [];

    // Header row with node labels
    matrix.push(['', ...nodeLabels]);

    for (let i = 0; i < n; i++) {
        const row: (number | string)[] = [nodeLabels[i]];
        for (let j = 0; j < n; j++) {
            const edge = graph.edges.find(e =>
                (e.source === nodeIds[i] && e.target === nodeIds[j]) ||
                (!graph.directed && e.source === nodeIds[j] && e.target === nodeIds[i])
            );
            row.push(edge ? edge.weight : 0);
        }
        matrix.push(row);
    }

    return matrix.map(row => row.join(',')).join('\n');
}

export function exportAsAdjacencyList(graph: Graph): string {
    const lines: string[] = [];

    for (const node of graph.nodes) {
        const neighbors: string[] = [];
        for (const edge of graph.edges) {
            if (edge.source === node.id) {
                const targetNode = graph.nodes.find(n => n.id === edge.target);
                if (targetNode) {
                    neighbors.push(graph.weighted ? `${targetNode.label}:${edge.weight}` : targetNode.label);
                }
            } else if (!graph.directed && edge.target === node.id) {
                const sourceNode = graph.nodes.find(n => n.id === edge.source);
                if (sourceNode) {
                    neighbors.push(graph.weighted ? `${sourceNode.label}:${edge.weight}` : sourceNode.label);
                }
            }
        }
        lines.push(`${node.label}: ${neighbors.join(', ')}`);
    }

    return lines.join('\n');
}

export function generateShareableURL(graph: Graph): string {
    const compressed = btoa(JSON.stringify(graph));
    const url = `${window.location.origin}${window.location.pathname}?graph=${encodeURIComponent(compressed)}`;
    return url;
}

// ==================== IMPORT FUNCTIONS ====================

export function importFromJSON(jsonString: string): Graph | null {
    try {
        const parsed = JSON.parse(jsonString);
        if (isValidGraph(parsed)) {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
}

export function importFromAdjacencyMatrix(csvString: string, directed: boolean = false, weighted: boolean = true): Graph | null {
    try {
        const lines = csvString.trim().split('\n').map(line => line.split(',').map(s => s.trim()));
        if (lines.length < 2) return null;

        // First row is header with node labels
        const headerLabels = lines[0].slice(1);
        const n = headerLabels.length;

        const nodes: Node[] = [];
        const edges: Edge[] = [];

        // Create nodes in a grid layout
        const cols = Math.ceil(Math.sqrt(n));
        for (let i = 0; i < n; i++) {
            nodes.push({
                id: uuidv4(),
                label: headerLabels[i],
                x: 150 + (i % cols) * 120,
                y: 150 + Math.floor(i / cols) * 120,
            });
        }

        // Create edges from matrix
        for (let i = 0; i < n; i++) {
            const row = lines[i + 1];
            for (let j = 0; j < n; j++) {
                const weight = parseFloat(row[j + 1]);
                if (weight > 0 && !isNaN(weight)) {
                    // For undirected, only add edge once (upper triangle)
                    if (directed || i < j) {
                        edges.push({
                            id: uuidv4(),
                            source: nodes[i].id,
                            target: nodes[j].id,
                            weight: weighted ? weight : 1,
                        });
                    }
                }
            }
        }

        return { nodes, edges, directed, weighted };
    } catch {
        return null;
    }
}

export function parseGraphFromURL(): Graph | null {
    const params = new URLSearchParams(window.location.search);
    const graphParam = params.get('graph');
    if (graphParam) {
        try {
            const decompressed = atob(decodeURIComponent(graphParam));
            return importFromJSON(decompressed);
        } catch {
            return null;
        }
    }
    return null;
}

function isValidGraph(obj: unknown): obj is Graph {
    if (typeof obj !== 'object' || obj === null) return false;
    const graph = obj as Record<string, unknown>;
    return (
        Array.isArray(graph.nodes) &&
        Array.isArray(graph.edges) &&
        typeof graph.directed === 'boolean' &&
        typeof graph.weighted === 'boolean'
    );
}

// ==================== DOWNLOAD HELPERS ====================

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
}
