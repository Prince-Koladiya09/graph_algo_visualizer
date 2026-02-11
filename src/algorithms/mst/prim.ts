import { Graph, AlgorithmStep, AlgorithmParams, AlgorithmConfig, NodeState, EdgeState, AlgorithmMetrics } from '../../types';
import { toAdjacencyList, getNode, getEdgeBetween } from '../../core/graph/graphUtils';

export const primConfig: AlgorithmConfig = {
    id: 'prim',
    name: "Prim's Algorithm",
    category: 'mst',
    description: 'Builds the minimum spanning tree by growing a single tree, always adding the minimum weight edge connecting the tree to a non-tree vertex.',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    pseudocode: [
        "Prim(graph, start):",
        "  key[start] = 0, key[v] = ∞ for all other v",
        "  create priority queue Q with all vertices",
        "  while Q is not empty:",
        "    u = extract min from Q",
        "    add u to MST",
        "    for each neighbor v of u:",
        "      if v in Q and weight(u,v) < key[v]:",
        "        parent[v] = u",
        "        key[v] = weight(u,v)",
    ],
    requiresWeighted: false,
    requiresDirected: false,
    requiresStartNode: true,
    requiresEndNode: false,
};

class PriorityQueue<T> {
    private items: Array<{ priority: number; value: T }> = [];

    enqueue(value: T, priority: number): void {
        const existing = this.items.findIndex(item => item.value === value);
        if (existing >= 0) {
            if (priority < this.items[existing].priority) {
                this.items[existing].priority = priority;
                this.items.sort((a, b) => a.priority - b.priority);
            }
            return;
        }
        this.items.push({ priority, value });
        this.items.sort((a, b) => a.priority - b.priority);
    }

    dequeue(): { priority: number; value: T } | undefined {
        return this.items.shift();
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    has(value: T): boolean {
        return this.items.some(item => item.value === value);
    }

    toArray(): Array<{ priority: number; value: T }> {
        return [...this.items];
    }
}

export function executePrim(graph: Graph, params: AlgorithmParams): AlgorithmStep[] {
    const steps: AlgorithmStep[] = [];
    const { startNodeId } = params;

    if (!startNodeId) {
        return steps;
    }

    const adjList = toAdjacencyList(graph);
    const key = new Map<string, number>();
    const parent = new Map<string, string | null>();
    const inMST = new Set<string>();
    const pq = new PriorityQueue<string>();

    let metrics: AlgorithmMetrics = {
        nodesVisited: 0,
        edgesExamined: 0,
        operationsCount: 0,
        comparisons: 0,
    };

    const nodeStates = new Map<string, NodeState>();
    const edgeStates = new Map<string, EdgeState>();

    graph.nodes.forEach(n => {
        key.set(n.id, n.id === startNodeId ? 0 : Infinity);
        parent.set(n.id, null);
        nodeStates.set(n.id, NodeState.UNVISITED);
        pq.enqueue(n.id, n.id === startNodeId ? 0 : Infinity);
    });
    graph.edges.forEach(e => edgeStates.set(e.id, EdgeState.UNEXAMINED));

    const formatKeys = () => {
        const result: Record<string, string> = {};
        graph.nodes.forEach(n => {
            const k = key.get(n.id);
            result[n.label] = k === Infinity ? '∞' : String(k);
        });
        return result;
    };

    steps.push({
        stepNumber: steps.length + 1,
        description: `Initialize Prim's from ${getNode(graph, startNodeId)?.label}. Set key[${getNode(graph, startNodeId)?.label}] = 0.`,
        pseudocodeLine: 1,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: { keys: formatKeys() },
        currentOperation: 'Initialize',
        metrics: { ...metrics },
    });

    let totalWeight = 0;

    while (!pq.isEmpty()) {
        const current = pq.dequeue()!;
        const currentId = current.value;
        const currentNode = getNode(graph, currentId)!;
        metrics.operationsCount++;

        if (inMST.has(currentId)) continue;

        inMST.add(currentId);
        nodeStates.set(currentId, NodeState.IN_SOLUTION);
        metrics.nodesVisited++;

        // Add edge to MST if there's a parent
        const parentId = parent.get(currentId);
        if (parentId) {
            const edge = getEdgeBetween(graph, parentId, currentId);
            if (edge) {
                edgeStates.set(edge.id, EdgeState.IN_SOLUTION);
                totalWeight += edge.weight;
            }
        }

        steps.push({
            stepNumber: steps.length + 1,
            description: `Add ${currentNode.label} to MST${parentId ? ` via edge from ${getNode(graph, parentId)?.label}` : ''}.`,
            pseudocodeLine: 5,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: { keys: formatKeys(), totalWeight, mstSize: inMST.size },
            currentOperation: `Add ${currentNode.label}`,
            metrics: { ...metrics },
        });

        const neighbors = adjList.get(currentId) || [];

        for (const { nodeId: neighborId, weight } of neighbors) {
            if (inMST.has(neighborId)) continue;

            const neighborNode = getNode(graph, neighborId)!;
            const edge = getEdgeBetween(graph, currentId, neighborId);
            metrics.edgesExamined++;
            metrics.comparisons++;

            if (edge) edgeStates.set(edge.id, EdgeState.EXAMINING);

            steps.push({
                stepNumber: steps.length + 1,
                description: `Check edge ${currentNode.label}-${neighborNode.label} (weight: ${weight}). Current key[${neighborNode.label}] = ${key.get(neighborId) === Infinity ? '∞' : key.get(neighborId)}`,
                pseudocodeLine: 7,
                nodeStates: new Map(nodeStates),
                edgeStates: new Map(edgeStates),
                dataStructures: { keys: formatKeys() },
                currentOperation: `Check ${neighborNode.label}`,
                metrics: { ...metrics },
            });

            if (weight < (key.get(neighborId) || Infinity)) {
                key.set(neighborId, weight);
                parent.set(neighborId, currentId);
                pq.enqueue(neighborId, weight);
                nodeStates.set(neighborId, NodeState.VISITING);

                steps.push({
                    stepNumber: steps.length + 1,
                    description: `Update key[${neighborNode.label}] = ${weight}, parent = ${currentNode.label}`,
                    pseudocodeLine: 9,
                    nodeStates: new Map(nodeStates),
                    edgeStates: new Map(edgeStates),
                    dataStructures: { keys: formatKeys() },
                    currentOperation: `Update ${neighborNode.label}`,
                    metrics: { ...metrics },
                });
            } else {
                if (edge && edgeStates.get(edge.id) !== EdgeState.IN_SOLUTION) {
                    edgeStates.set(edge.id, EdgeState.REJECTED);
                }
            }
        }
    }

    steps.push({
        stepNumber: steps.length + 1,
        description: `Prim's complete. MST has ${inMST.size} nodes with total weight: ${totalWeight}`,
        pseudocodeLine: 9,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: { totalWeight, nodeCount: inMST.size },
        currentOperation: 'Complete',
        metrics: { ...metrics },
    });

    return steps;
}
