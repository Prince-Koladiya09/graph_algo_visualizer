import { Graph, AlgorithmStep, AlgorithmParams, AlgorithmConfig, NodeState, EdgeState, AlgorithmMetrics } from '../../types';
import { toAdjacencyList, getEdgeBetween, getNode } from '../../core/graph/graphUtils';

export const dijkstraConfig: AlgorithmConfig = {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    category: 'shortestPath',
    description: 'Finds the shortest path from a source node to all other nodes in a weighted graph with non-negative edge weights.',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    pseudocode: [
        "Dijkstra(graph, source, target):",
        "  dist[source] = 0",
        "  for each vertex v: dist[v] = ∞",
        "  create priority queue Q",
        "  add (0, source) to Q",
        "  while Q is not empty:",
        "    (d, u) = extract min from Q",
        "    if u == target: return path",
        "    if d > dist[u]: continue",
        "    for each neighbor v of u:",
        "      alt = dist[u] + weight(u, v)",
        "      if alt < dist[v]:",
        "        dist[v] = alt",
        "        parent[v] = u",
        "        add (alt, v) to Q",
    ],
    requiresWeighted: false, // Works on unweighted too (weight = 1)
    requiresDirected: null,
    requiresStartNode: true,
    requiresEndNode: true,
};

// Simple priority queue implementation
class PriorityQueue<T> {
    private items: Array<{ priority: number; value: T }> = [];

    enqueue(value: T, priority: number): void {
        this.items.push({ priority, value });
        this.items.sort((a, b) => a.priority - b.priority);
    }

    dequeue(): { priority: number; value: T } | undefined {
        return this.items.shift();
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    toArray(): Array<{ priority: number; value: T }> {
        return [...this.items];
    }
}

export function executeDijkstra(graph: Graph, params: AlgorithmParams): AlgorithmStep[] {
    const steps: AlgorithmStep[] = [];
    const { startNodeId, endNodeId } = params;

    if (!startNodeId || !graph.nodes.find(n => n.id === startNodeId)) {
        return steps;
    }

    const adjList = toAdjacencyList(graph);
    const dist = new Map<string, number>();
    const parent = new Map<string, string | null>();
    const visited = new Set<string>();
    const pq = new PriorityQueue<string>();

    let metrics: AlgorithmMetrics = {
        nodesVisited: 0,
        edgesExamined: 0,
        operationsCount: 0,
        comparisons: 0,
    };

    const nodeStates = new Map<string, NodeState>();
    const edgeStates = new Map<string, EdgeState>();

    // Initialize distances
    graph.nodes.forEach(n => {
        dist.set(n.id, n.id === startNodeId ? 0 : Infinity);
        parent.set(n.id, null);
        nodeStates.set(n.id, NodeState.UNVISITED);
    });
    graph.edges.forEach(e => edgeStates.set(e.id, EdgeState.UNEXAMINED));

    // Helper to format distances for display
    const formatDist = () => {
        const result: Record<string, string> = {};
        graph.nodes.forEach(n => {
            const d = dist.get(n.id);
            result[n.label] = d === Infinity ? '∞' : String(d);
        });
        return result;
    };

    // Step 1: Initialize
    pq.enqueue(startNodeId, 0);
    nodeStates.set(startNodeId, NodeState.VISITING);
    metrics.operationsCount++;

    steps.push({
        stepNumber: steps.length + 1,
        description: `Initialize: Set distance to ${graph.nodes.find(n => n.id === startNodeId)?.label} = 0, all others = ∞`,
        pseudocodeLine: 1,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: {
            distances: formatDist(),
            priorityQueue: pq.toArray().map(item => `(${item.priority}, ${getNode(graph, item.value)?.label})`),
        },
        currentOperation: 'Initialize',
        metrics: { ...metrics },
    });

    while (!pq.isEmpty()) {
        const current = pq.dequeue()!;
        const currentId = current.value;
        const currentDist = current.priority;
        const currentNode = getNode(graph, currentId);
        metrics.operationsCount++;
        metrics.comparisons++;

        // Skip if we've already found a better path
        if (currentDist > (dist.get(currentId) || Infinity)) {
            continue;
        }

        if (visited.has(currentId)) {
            continue;
        }

        visited.add(currentId);
        metrics.nodesVisited++;
        nodeStates.set(currentId, NodeState.CURRENT);

        steps.push({
            stepNumber: steps.length + 1,
            description: `Extract minimum: node ${currentNode?.label} with distance ${currentDist}`,
            pseudocodeLine: 6,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: {
                distances: formatDist(),
                priorityQueue: pq.toArray().map(item => `(${item.priority}, ${getNode(graph, item.value)?.label})`),
            },
            currentOperation: `Process ${currentNode?.label}`,
            metrics: { ...metrics },
        });

        // Check if we reached the target
        if (endNodeId && currentId === endNodeId) {
            nodeStates.set(currentId, NodeState.IN_SOLUTION);

            // Reconstruct path
            const path: string[] = [];
            let curr: string | null = currentId;
            while (curr) {
                path.unshift(curr);
                curr = parent.get(curr) || null;
            }

            // Mark path nodes and edges
            for (let i = 0; i < path.length; i++) {
                nodeStates.set(path[i], NodeState.IN_SOLUTION);
                if (i > 0) {
                    const edge = getEdgeBetween(graph, path[i - 1], path[i]);
                    if (edge) {
                        edgeStates.set(edge.id, EdgeState.IN_SOLUTION);
                    }
                }
            }

            steps.push({
                stepNumber: steps.length + 1,
                description: `Target ${currentNode?.label} reached! Shortest path distance: ${currentDist}. Path: ${path.map(id => getNode(graph, id)?.label).join(' → ')}`,
                pseudocodeLine: 7,
                nodeStates: new Map(nodeStates),
                edgeStates: new Map(edgeStates),
                dataStructures: {
                    distances: formatDist(),
                    path: path.map(id => getNode(graph, id)?.label),
                },
                currentOperation: 'Path Found',
                metrics: { ...metrics },
            });

            return steps;
        }

        // Process neighbors
        const neighbors = adjList.get(currentId) || [];

        for (const { nodeId: neighborId, weight } of neighbors) {
            if (visited.has(neighborId)) continue;

            const neighborNode = getNode(graph, neighborId);
            const edge = getEdgeBetween(graph, currentId, neighborId);
            metrics.edgesExamined++;
            metrics.comparisons++;
            metrics.operationsCount++;

            if (edge) {
                edgeStates.set(edge.id, EdgeState.EXAMINING);
            }

            const alt = (dist.get(currentId) || 0) + weight;
            const currentNeighborDist = dist.get(neighborId) || Infinity;

            steps.push({
                stepNumber: steps.length + 1,
                description: `Check edge ${currentNode?.label} → ${neighborNode?.label} (weight: ${weight}). New distance: ${alt}, Current: ${currentNeighborDist === Infinity ? '∞' : currentNeighborDist}`,
                pseudocodeLine: 10,
                nodeStates: new Map(nodeStates),
                edgeStates: new Map(edgeStates),
                dataStructures: {
                    distances: formatDist(),
                    priorityQueue: pq.toArray().map(item => `(${item.priority}, ${getNode(graph, item.value)?.label})`),
                },
                currentOperation: `Relax edge to ${neighborNode?.label}`,
                metrics: { ...metrics },
            });

            if (alt < currentNeighborDist) {
                dist.set(neighborId, alt);
                parent.set(neighborId, currentId);
                pq.enqueue(neighborId, alt);

                if (nodeStates.get(neighborId) !== NodeState.VISITED) {
                    nodeStates.set(neighborId, NodeState.VISITING);
                }

                steps.push({
                    stepNumber: steps.length + 1,
                    description: `Update distance to ${neighborNode?.label}: ${alt} (via ${currentNode?.label})`,
                    pseudocodeLine: 12,
                    nodeStates: new Map(nodeStates),
                    edgeStates: new Map(edgeStates),
                    dataStructures: {
                        distances: formatDist(),
                        priorityQueue: pq.toArray().map(item => `(${item.priority}, ${getNode(graph, item.value)?.label})`),
                    },
                    currentOperation: `Update ${neighborNode?.label}`,
                    metrics: { ...metrics },
                });
            } else {
                if (edge) {
                    edgeStates.set(edge.id, EdgeState.REJECTED);
                }
            }
        }

        nodeStates.set(currentId, NodeState.VISITED);
    }

    // If no target specified, show all shortest paths
    if (!endNodeId) {
        graph.nodes.forEach(n => {
            if (dist.get(n.id) !== Infinity) {
                nodeStates.set(n.id, NodeState.IN_SOLUTION);
            }
        });

        steps.push({
            stepNumber: steps.length + 1,
            description: `Dijkstra complete. Computed shortest paths from ${getNode(graph, startNodeId)?.label} to all reachable nodes.`,
            pseudocodeLine: 14,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: { distances: formatDist() },
            currentOperation: 'Complete',
            metrics: { ...metrics },
        });
    } else {
        steps.push({
            stepNumber: steps.length + 1,
            description: `No path found from ${getNode(graph, startNodeId)?.label} to ${getNode(graph, endNodeId)?.label}.`,
            pseudocodeLine: 5,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: { distances: formatDist() },
            currentOperation: 'No Path',
            metrics: { ...metrics },
        });
    }

    return steps;
}
