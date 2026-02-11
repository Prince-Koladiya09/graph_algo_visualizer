import { Graph, AlgorithmStep, AlgorithmParams, AlgorithmConfig, NodeState, EdgeState, AlgorithmMetrics } from '../../types';
import { toAdjacencyList, getEdgeBetween, getNode, calculateDistance } from '../../core/graph/graphUtils';

export const aStarConfig: AlgorithmConfig = {
    id: 'astar',
    name: 'A* Search',
    category: 'shortestPath',
    description: 'An informed search algorithm that uses heuristics to find the shortest path more efficiently than Dijkstra.',
    timeComplexity: 'O(E)',
    spaceComplexity: 'O(V)',
    pseudocode: [
        'A*(graph, start, goal):',
        '  openSet = {start}',
        '  gScore[start] = 0',
        '  fScore[start] = h(start)',
        '  while openSet not empty:',
        '    current = node in openSet with lowest fScore',
        '    if current == goal: return path',
        '    remove current from openSet',
        '    for each neighbor of current:',
        '      tentative_g = gScore[current] + d(current, neighbor)',
        '      if tentative_g < gScore[neighbor]:',
        '        cameFrom[neighbor] = current',
        '        gScore[neighbor] = tentative_g',
        '        fScore[neighbor] = gScore[neighbor] + h(neighbor)',
        '        add neighbor to openSet',
    ],
    requiresWeighted: false,
    requiresDirected: null,
    requiresStartNode: true,
    requiresEndNode: true,
};

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

    has(value: T): boolean {
        return this.items.some(item => item.value === value);
    }

    toArray(): Array<{ priority: number; value: T }> {
        return [...this.items];
    }
}

export function executeAStar(graph: Graph, params: AlgorithmParams): AlgorithmStep[] {
    const steps: AlgorithmStep[] = [];
    const { startNodeId, endNodeId, heuristic = 'euclidean' } = params;

    if (!startNodeId || !endNodeId) {
        return steps;
    }

    const startNode = getNode(graph, startNodeId);
    const endNode = getNode(graph, endNodeId);

    if (!startNode || !endNode) {
        return steps;
    }

    const adjList = toAdjacencyList(graph);
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const cameFrom = new Map<string, string>();
    const openSet = new PriorityQueue<string>();
    const closedSet = new Set<string>();

    let metrics: AlgorithmMetrics = {
        nodesVisited: 0,
        edgesExamined: 0,
        operationsCount: 0,
        comparisons: 0,
    };

    const nodeStates = new Map<string, NodeState>();
    const edgeStates = new Map<string, EdgeState>();

    graph.nodes.forEach(n => {
        gScore.set(n.id, Infinity);
        fScore.set(n.id, Infinity);
        nodeStates.set(n.id, NodeState.UNVISITED);
    });
    graph.edges.forEach(e => edgeStates.set(e.id, EdgeState.UNEXAMINED));

    const h = (nodeId: string): number => {
        const node = getNode(graph, nodeId);
        if (!node || !endNode) return Infinity;
        return calculateDistance(node, endNode, heuristic) / 100; // Normalize
    };

    const formatScores = () => {
        const result: Record<string, string> = {};
        graph.nodes.forEach(n => {
            const g = gScore.get(n.id);
            const f = fScore.get(n.id);
            result[n.label] = `g:${g === Infinity ? '∞' : g?.toFixed(1)}, f:${f === Infinity ? '∞' : f?.toFixed(1)}`;
        });
        return result;
    };

    // Initialize
    gScore.set(startNodeId, 0);
    fScore.set(startNodeId, h(startNodeId));
    openSet.enqueue(startNodeId, fScore.get(startNodeId)!);
    nodeStates.set(startNodeId, NodeState.VISITING);

    steps.push({
        stepNumber: steps.length + 1,
        description: `Initialize A*. Start: ${startNode.label}, Goal: ${endNode.label}. Using ${heuristic} heuristic.`,
        pseudocodeLine: 1,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: { scores: formatScores(), openSet: openSet.toArray().map(i => getNode(graph, i.value)?.label) },
        currentOperation: 'Initialize',
        metrics: { ...metrics },
    });

    while (!openSet.isEmpty()) {
        const current = openSet.dequeue()!;
        const currentId = current.value;
        const currentNode = getNode(graph, currentId)!;
        metrics.operationsCount++;

        nodeStates.set(currentId, NodeState.CURRENT);

        steps.push({
            stepNumber: steps.length + 1,
            description: `Select ${currentNode.label} with lowest f-score: ${fScore.get(currentId)?.toFixed(1)}`,
            pseudocodeLine: 5,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: { scores: formatScores(), openSet: openSet.toArray().map(i => getNode(graph, i.value)?.label) },
            currentOperation: `Process ${currentNode.label}`,
            metrics: { ...metrics },
        });

        if (currentId === endNodeId) {
            // Reconstruct path
            const path: string[] = [];
            let curr: string | undefined = currentId;
            while (curr) {
                path.unshift(curr);
                curr = cameFrom.get(curr);
            }

            path.forEach(id => nodeStates.set(id, NodeState.IN_SOLUTION));
            for (let i = 0; i < path.length - 1; i++) {
                const edge = getEdgeBetween(graph, path[i], path[i + 1]);
                if (edge) edgeStates.set(edge.id, EdgeState.IN_SOLUTION);
            }

            steps.push({
                stepNumber: steps.length + 1,
                description: `Goal reached! Path: ${path.map(id => getNode(graph, id)?.label).join(' → ')}. Cost: ${gScore.get(endNodeId)?.toFixed(1)}`,
                pseudocodeLine: 6,
                nodeStates: new Map(nodeStates),
                edgeStates: new Map(edgeStates),
                dataStructures: { path: path.map(id => getNode(graph, id)?.label) },
                currentOperation: 'Path Found',
                metrics: { ...metrics },
            });

            return steps;
        }

        closedSet.add(currentId);
        nodeStates.set(currentId, NodeState.VISITED);
        metrics.nodesVisited++;

        const neighbors = adjList.get(currentId) || [];

        for (const { nodeId: neighborId, weight } of neighbors) {
            if (closedSet.has(neighborId)) continue;

            const neighborNode = getNode(graph, neighborId)!;
            const edge = getEdgeBetween(graph, currentId, neighborId);
            metrics.edgesExamined++;
            metrics.comparisons++;

            if (edge) edgeStates.set(edge.id, EdgeState.EXAMINING);

            const tentativeG = (gScore.get(currentId) || 0) + weight;

            steps.push({
                stepNumber: steps.length + 1,
                description: `Check neighbor ${neighborNode.label}. Tentative g: ${tentativeG.toFixed(1)}, Current g: ${gScore.get(neighborId) === Infinity ? '∞' : gScore.get(neighborId)?.toFixed(1)}`,
                pseudocodeLine: 9,
                nodeStates: new Map(nodeStates),
                edgeStates: new Map(edgeStates),
                dataStructures: { scores: formatScores() },
                currentOperation: `Check ${neighborNode.label}`,
                metrics: { ...metrics },
            });

            if (tentativeG < (gScore.get(neighborId) || Infinity)) {
                cameFrom.set(neighborId, currentId);
                gScore.set(neighborId, tentativeG);
                fScore.set(neighborId, tentativeG + h(neighborId));

                if (!openSet.has(neighborId)) {
                    openSet.enqueue(neighborId, fScore.get(neighborId)!);
                    nodeStates.set(neighborId, NodeState.VISITING);
                }

                steps.push({
                    stepNumber: steps.length + 1,
                    description: `Update ${neighborNode.label}: g=${tentativeG.toFixed(1)}, f=${fScore.get(neighborId)?.toFixed(1)}`,
                    pseudocodeLine: 13,
                    nodeStates: new Map(nodeStates),
                    edgeStates: new Map(edgeStates),
                    dataStructures: { scores: formatScores(), openSet: openSet.toArray().map(i => getNode(graph, i.value)?.label) },
                    currentOperation: `Update ${neighborNode.label}`,
                    metrics: { ...metrics },
                });
            } else {
                if (edge) edgeStates.set(edge.id, EdgeState.REJECTED);
            }
        }
    }

    steps.push({
        stepNumber: steps.length + 1,
        description: `No path found from ${startNode.label} to ${endNode.label}.`,
        pseudocodeLine: 4,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: {},
        currentOperation: 'No Path',
        metrics: { ...metrics },
    });

    return steps;
}
