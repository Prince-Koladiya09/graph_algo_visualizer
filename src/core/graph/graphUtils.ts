import { v4 as uuidv4 } from 'uuid';
import { Node, Edge, Graph } from '../../types';

export function createNode(x: number, y: number, label?: string): Node {
    const id = uuidv4();
    return {
        id,
        label: label || generateLabel(0), // Will be updated by store
        x,
        y,
    };
}

export function createEdge(source: string, target: string, weight: number = 1): Edge {
    return {
        id: uuidv4(),
        source,
        target,
        weight,
    };
}

export function createEmptyGraph(directed: boolean = false, weighted: boolean = false): Graph {
    return {
        nodes: [],
        edges: [],
        directed,
        weighted,
    };
}

// Generate labels A, B, C, ..., Z, AA, AB, ...
export function generateLabel(index: number): string {
    let label = '';
    let num = index;
    do {
        label = String.fromCharCode(65 + (num % 26)) + label;
        num = Math.floor(num / 26) - 1;
    } while (num >= 0);
    return label;
}

// Get neighbors of a node
export function getNeighbors(graph: Graph, nodeId: string): string[] {
    const neighbors: string[] = [];

    for (const edge of graph.edges) {
        if (edge.source === nodeId) {
            neighbors.push(edge.target);
        }
        if (!graph.directed && edge.target === nodeId) {
            neighbors.push(edge.source);
        }
    }

    return neighbors;
}

// Get edges connected to a node
export function getNodeEdges(graph: Graph, nodeId: string): Edge[] {
    return graph.edges.filter(edge =>
        edge.source === nodeId || edge.target === nodeId
    );
}

// Get edge between two nodes
export function getEdgeBetween(graph: Graph, source: string, target: string): Edge | undefined {
    return graph.edges.find(edge => {
        if (graph.directed) {
            return edge.source === source && edge.target === target;
        }
        return (edge.source === source && edge.target === target) ||
            (edge.source === target && edge.target === source);
    });
}

// Check if edge exists
export function hasEdge(graph: Graph, source: string, target: string): boolean {
    return getEdgeBetween(graph, source, target) !== undefined;
}

// Get node by ID
export function getNode(graph: Graph, nodeId: string): Node | undefined {
    return graph.nodes.find(n => n.id === nodeId);
}

// Convert to adjacency list
export function toAdjacencyList(graph: Graph): Map<string, Array<{ nodeId: string; weight: number }>> {
    const adjList = new Map<string, Array<{ nodeId: string; weight: number }>>();

    for (const node of graph.nodes) {
        adjList.set(node.id, []);
    }

    for (const edge of graph.edges) {
        adjList.get(edge.source)?.push({ nodeId: edge.target, weight: edge.weight });
        if (!graph.directed) {
            adjList.get(edge.target)?.push({ nodeId: edge.source, weight: edge.weight });
        }
    }

    return adjList;
}

// Convert to adjacency matrix
export function toAdjacencyMatrix(graph: Graph): { matrix: number[][]; nodeIds: string[] } {
    const nodeIds = graph.nodes.map(n => n.id);
    const n = nodeIds.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(Infinity));

    // Self-loops are 0
    for (let i = 0; i < n; i++) {
        matrix[i][i] = 0;
    }

    for (const edge of graph.edges) {
        const i = nodeIds.indexOf(edge.source);
        const j = nodeIds.indexOf(edge.target);
        if (i !== -1 && j !== -1) {
            matrix[i][j] = edge.weight;
            if (!graph.directed) {
                matrix[j][i] = edge.weight;
            }
        }
    }

    return { matrix, nodeIds };
}

// Calculate distance between two nodes (for A* heuristic)
export function calculateDistance(node1: Node, node2: Node, type: 'euclidean' | 'manhattan' = 'euclidean'): number {
    const dx = Math.abs(node1.x - node2.x);
    const dy = Math.abs(node1.y - node2.y);

    if (type === 'manhattan') {
        return dx + dy;
    }
    return Math.sqrt(dx * dx + dy * dy);
}

// Validate graph for specific algorithms
export function validateForDijkstra(graph: Graph): { valid: boolean; error?: string } {
    if (graph.weighted) {
        for (const edge of graph.edges) {
            if (edge.weight < 0) {
                return { valid: false, error: 'Dijkstra\'s algorithm requires non-negative edge weights' };
            }
        }
    }
    return { valid: true };
}

export function validateForTopologicalSort(graph: Graph): { valid: boolean; error?: string } {
    if (!graph.directed) {
        return { valid: false, error: 'Topological sort requires a directed graph' };
    }
    return { valid: true };
}
