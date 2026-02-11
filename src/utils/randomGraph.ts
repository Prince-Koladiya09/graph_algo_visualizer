import { Graph, Node, Edge } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface RandomGraphOptions {
    nodeCount: number;
    edgeDensity: number; // 0-1, percentage of possible edges
    directed: boolean;
    weighted: boolean;
    minWeight: number;
    maxWeight: number;
    canvasWidth: number;
    canvasHeight: number;
}

const defaultOptions: RandomGraphOptions = {
    nodeCount: 8,
    edgeDensity: 0.3,
    directed: false,
    weighted: true,
    minWeight: 1,
    maxWeight: 10,
    canvasWidth: 800,
    canvasHeight: 600,
};

export function generateRandomGraph(options: Partial<RandomGraphOptions> = {}): Graph {
    const opts = { ...defaultOptions, ...options };
    const { nodeCount, edgeDensity, directed, weighted, minWeight, maxWeight, canvasWidth, canvasHeight } = opts;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Generate nodes with random positions
    const padding = 80;
    const usableWidth = canvasWidth - padding * 2;
    const usableHeight = canvasHeight - padding * 2;

    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            id: uuidv4(),
            label: String.fromCharCode(65 + (i % 26)) + (i >= 26 ? Math.floor(i / 26).toString() : ''),
            x: padding + Math.random() * usableWidth,
            y: padding + Math.random() * usableHeight,
        });
    }

    // Apply force-directed layout for better positioning
    applyForceDirectedLayout(nodes, 100);

    // Scale nodes to fit canvas
    scaleNodesToCanvas(nodes, canvasWidth, canvasHeight, padding);

    // Generate edges based on density
    const maxEdges = directed ? nodeCount * (nodeCount - 1) : (nodeCount * (nodeCount - 1)) / 2;
    const targetEdges = Math.floor(maxEdges * edgeDensity);

    const possibleEdges: [number, number][] = [];
    for (let i = 0; i < nodeCount; i++) {
        for (let j = 0; j < nodeCount; j++) {
            if (i !== j) {
                if (directed || i < j) {
                    possibleEdges.push([i, j]);
                }
            }
        }
    }

    // Shuffle and pick edges
    shuffleArray(possibleEdges);
    const selectedEdges = possibleEdges.slice(0, targetEdges);

    for (const [i, j] of selectedEdges) {
        const weight = weighted
            ? Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight
            : 1;
        edges.push({
            id: uuidv4(),
            source: nodes[i].id,
            target: nodes[j].id,
            weight,
        });
    }

    return { nodes, edges, directed, weighted };
}

export function generateConnectedRandomGraph(options: Partial<RandomGraphOptions> = {}): Graph {
    const graph = generateRandomGraph(options);

    // Ensure connectivity by adding edges if needed
    const visited = new Set<string>();
    // const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

    function dfs(nodeId: string) {
        visited.add(nodeId);
        for (const edge of graph.edges) {
            let neighbor: string | null = null;
            if (edge.source === nodeId) neighbor = edge.target;
            else if (!graph.directed && edge.target === nodeId) neighbor = edge.source;
            if (neighbor && !visited.has(neighbor)) {
                dfs(neighbor);
            }
        }
    }

    if (graph.nodes.length > 0) {
        dfs(graph.nodes[0].id);

        // Connect unvisited components
        for (const node of graph.nodes) {
            if (!visited.has(node.id)) {
                // Connect to a random visited node
                const visitedArray = Array.from(visited);
                const targetId = visitedArray[Math.floor(Math.random() * visitedArray.length)];
                graph.edges.push({
                    id: uuidv4(),
                    source: targetId,
                    target: node.id,
                    weight: graph.weighted ? Math.floor(Math.random() * 10) + 1 : 1,
                });
                dfs(node.id);
            }
        }
    }

    return graph;
}

function applyForceDirectedLayout(nodes: Node[], iterations: number = 50): void {
    const k = 100; // Optimal distance
    const cooling = 0.95;
    let temperature = 100;

    for (let iter = 0; iter < iterations; iter++) {
        // Calculate repulsive forces
        const forces: { x: number; y: number }[] = nodes.map(() => ({ x: 0, y: 0 }));

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x - nodes[i].x;
                const dy = nodes[j].y - nodes[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = (k * k) / dist;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                forces[i].x -= fx;
                forces[i].y -= fy;
                forces[j].x += fx;
                forces[j].y += fy;
            }
        }

        // Apply forces with temperature
        for (let i = 0; i < nodes.length; i++) {
            const dx = Math.min(temperature, Math.max(-temperature, forces[i].x));
            const dy = Math.min(temperature, Math.max(-temperature, forces[i].y));
            nodes[i].x += dx;
            nodes[i].y += dy;
        }

        temperature *= cooling;
    }
}

function scaleNodesToCanvas(nodes: Node[], width: number, height: number, padding: number): void {
    if (nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const node of nodes) {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
    }

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    for (const node of nodes) {
        node.x = padding + ((node.x - minX) / rangeX) * (width - padding * 2);
        node.y = padding + ((node.y - minY) / rangeY) * (height - padding * 2);
    }
}

function shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
