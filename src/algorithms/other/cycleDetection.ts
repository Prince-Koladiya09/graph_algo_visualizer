import { Graph, AlgorithmStep, AlgorithmParams, AlgorithmConfig, NodeState, EdgeState, AlgorithmMetrics } from '../../types';
import { toAdjacencyList, getNode, getEdgeBetween } from '../../core/graph/graphUtils';

export const cycleDetectionConfig: AlgorithmConfig = {
    id: 'cycleDetection',
    name: 'Cycle Detection',
    category: 'other',
    description: 'Uses DFS with coloring to detect cycles in a graph. Detects back edges that indicate cycles.',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    pseudocode: [
        "CycleDetection(graph):",
        "  color all vertices WHITE",
        "  for each vertex v:",
        "    if color[v] == WHITE:",
        "      if DFS(v) has cycle:",
        "        return true",
        "  return false",
        "",
        "DFS(u):",
        "  color[u] = GRAY",
        "  for each neighbor v of u:",
        "    if color[v] == GRAY: cycle found",
        "    if color[v] == WHITE and DFS(v): cycle found",
        "  color[u] = BLACK",
    ],
    requiresWeighted: false,
    requiresDirected: null,
    requiresStartNode: false,
    requiresEndNode: false,
};

enum Color {
    WHITE = 'white',
    GRAY = 'gray',
    BLACK = 'black'
}

export function executeCycleDetection(graph: Graph, _params: AlgorithmParams): AlgorithmStep[] {
    const steps: AlgorithmStep[] = [];

    let metrics: AlgorithmMetrics = {
        nodesVisited: 0,
        edgesExamined: 0,
        operationsCount: 0,
        comparisons: 0,
    };

    const nodeStates = new Map<string, NodeState>();
    const edgeStates = new Map<string, EdgeState>();
    const color = new Map<string, Color>();

    graph.nodes.forEach(n => {
        nodeStates.set(n.id, NodeState.UNVISITED);
        color.set(n.id, Color.WHITE);
    });
    graph.edges.forEach(e => edgeStates.set(e.id, EdgeState.UNEXAMINED));

    const adjList = toAdjacencyList(graph);
    let cycleFound = false;
    let cycleEdge: { source: string; target: string } | null = null;

    steps.push({
        stepNumber: steps.length + 1,
        description: 'Initialize: Color all vertices WHITE.',
        pseudocodeLine: 1,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: { colors: Object.fromEntries([...color.entries()].map(([id, c]) => [getNode(graph, id)?.label, c])) },
        currentOperation: 'Initialize',
        metrics: { ...metrics },
    });

    function dfs(nodeId: string): boolean {
        const node = getNode(graph, nodeId)!;
        color.set(nodeId, Color.GRAY);
        nodeStates.set(nodeId, NodeState.VISITING);
        metrics.nodesVisited++;
        metrics.operationsCount++;

        steps.push({
            stepNumber: steps.length + 1,
            description: `Visit ${node.label}. Color GRAY (in current path).`,
            pseudocodeLine: 9,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: { colors: Object.fromEntries([...color.entries()].map(([id, c]) => [getNode(graph, id)?.label, c])) },
            currentOperation: `Visit ${node.label}`,
            metrics: { ...metrics },
        });

        const neighbors = adjList.get(nodeId) || [];

        for (const { nodeId: neighborId } of neighbors) {
            const neighborNode = getNode(graph, neighborId)!;
            const edge = getEdgeBetween(graph, nodeId, neighborId);
            metrics.edgesExamined++;
            metrics.comparisons++;

            if (edge) edgeStates.set(edge.id, EdgeState.EXAMINING);

            const neighborColor = color.get(neighborId);

            steps.push({
                stepNumber: steps.length + 1,
                description: `Check neighbor ${neighborNode.label}. Color: ${neighborColor}.`,
                pseudocodeLine: 10,
                nodeStates: new Map(nodeStates),
                edgeStates: new Map(edgeStates),
                dataStructures: { colors: Object.fromEntries([...color.entries()].map(([id, c]) => [getNode(graph, id)?.label, c])) },
                currentOperation: `Check ${neighborNode.label}`,
                metrics: { ...metrics },
            });

            if (neighborColor === Color.GRAY) {
                // Back edge found - cycle!
                cycleFound = true;
                cycleEdge = { source: nodeId, target: neighborId };

                if (edge) edgeStates.set(edge.id, EdgeState.IN_SOLUTION);
                nodeStates.set(neighborId, NodeState.IN_SOLUTION);

                steps.push({
                    stepNumber: steps.length + 1,
                    description: `CYCLE DETECTED! Back edge from ${node.label} to ${neighborNode.label} (GRAY node).`,
                    pseudocodeLine: 11,
                    nodeStates: new Map(nodeStates),
                    edgeStates: new Map(edgeStates),
                    dataStructures: { cycleEdge: `${node.label} → ${neighborNode.label}` },
                    currentOperation: 'Cycle Found',
                    metrics: { ...metrics },
                });

                return true;
            }

            if (neighborColor === Color.WHITE) {
                if (edge) edgeStates.set(edge.id, EdgeState.IN_SOLUTION);
                if (dfs(neighborId)) {
                    return true;
                }
            } else {
                if (edge) edgeStates.set(edge.id, EdgeState.REJECTED);
            }
        }

        color.set(nodeId, Color.BLACK);
        nodeStates.set(nodeId, NodeState.VISITED);

        steps.push({
            stepNumber: steps.length + 1,
            description: `Finish ${node.label}. Color BLACK (completely processed).`,
            pseudocodeLine: 13,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: { colors: Object.fromEntries([...color.entries()].map(([id, c]) => [getNode(graph, id)?.label, c])) },
            currentOperation: `Finish ${node.label}`,
            metrics: { ...metrics },
        });

        return false;
    }

    for (const node of graph.nodes) {
        if (color.get(node.id) === Color.WHITE) {
            steps.push({
                stepNumber: steps.length + 1,
                description: `Start DFS from unvisited node ${node.label}.`,
                pseudocodeLine: 3,
                nodeStates: new Map(nodeStates),
                edgeStates: new Map(edgeStates),
                dataStructures: { colors: Object.fromEntries([...color.entries()].map(([id, c]) => [getNode(graph, id)?.label, c])) },
                currentOperation: `Start from ${node.label}`,
                metrics: { ...metrics },
            });

            if (dfs(node.id)) {
                break;
            }
        }
    }

    if (cycleFound) {
        steps.push({
            stepNumber: steps.length + 1,
            description: `Cycle detection complete. CYCLE FOUND via edge ${getNode(graph, cycleEdge!.source)?.label} → ${getNode(graph, cycleEdge!.target)?.label}`,
            pseudocodeLine: 5,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: { hasCycle: true },
            currentOperation: 'Complete - Cycle Found',
            metrics: { ...metrics },
        });
    } else {
        // Mark all as visited for no cycle case
        graph.nodes.forEach(n => nodeStates.set(n.id, NodeState.IN_SOLUTION));

        steps.push({
            stepNumber: steps.length + 1,
            description: 'Cycle detection complete. NO CYCLE found. Graph is acyclic.',
            pseudocodeLine: 6,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: { hasCycle: false },
            currentOperation: 'Complete - No Cycle',
            metrics: { ...metrics },
        });
    }

    return steps;
}
