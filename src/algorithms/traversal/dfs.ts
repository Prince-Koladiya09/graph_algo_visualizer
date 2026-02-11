import { Graph, AlgorithmStep, AlgorithmParams, AlgorithmConfig, NodeState, EdgeState, AlgorithmMetrics } from '../../types';
import { toAdjacencyList, getEdgeBetween } from '../../core/graph/graphUtils';

export const dfsConfig: AlgorithmConfig = {
    id: 'dfs',
    name: 'Depth-First Search',
    category: 'traversal',
    description: 'Explores as far as possible along each branch before backtracking. Uses a stack data structure (or recursion).',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    pseudocode: [
        'DFS(graph, start):',
        '  create stack S',
        '  push start onto S',
        '  while S is not empty:',
        '    v = pop from S',
        '    if v is not visited:',
        '      mark v as visited',
        '      process v',
        '      for each neighbor u of v:',
        '        push u onto S',
    ],
    requiresWeighted: false,
    requiresDirected: null,
    requiresStartNode: true,
    requiresEndNode: false,
};

export function executeDFS(graph: Graph, params: AlgorithmParams): AlgorithmStep[] {
    const steps: AlgorithmStep[] = [];
    const { startNodeId } = params;

    if (!startNodeId || !graph.nodes.find(n => n.id === startNodeId)) {
        return steps;
    }

    const adjList = toAdjacencyList(graph);
    const visited = new Set<string>();
    const stack: string[] = [];

    let metrics: AlgorithmMetrics = {
        nodesVisited: 0,
        edgesExamined: 0,
        operationsCount: 0,
        comparisons: 0,
    };

    const nodeStates = new Map<string, NodeState>();
    const edgeStates = new Map<string, EdgeState>();

    graph.nodes.forEach(n => nodeStates.set(n.id, NodeState.UNVISITED));
    graph.edges.forEach(e => edgeStates.set(e.id, EdgeState.UNEXAMINED));

    // Step 1: Start
    stack.push(startNodeId);
    metrics.operationsCount++;
    nodeStates.set(startNodeId, NodeState.VISITING);

    steps.push({
        stepNumber: steps.length + 1,
        description: `Start DFS from node ${graph.nodes.find(n => n.id === startNodeId)?.label}. Push to stack.`,
        pseudocodeLine: 2,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: { stack: [...stack].reverse().map(id => graph.nodes.find(n => n.id === id)?.label), visited: [...visited].map(id => graph.nodes.find(n => n.id === id)?.label) },
        currentOperation: 'Initialize',
        metrics: { ...metrics },
    });

    while (stack.length > 0) {
        const currentId = stack.pop()!;
        const currentNode = graph.nodes.find(n => n.id === currentId);
        metrics.operationsCount++;
        metrics.comparisons++;

        if (visited.has(currentId)) {
            steps.push({
                stepNumber: steps.length + 1,
                description: `Node ${currentNode?.label} already visited. Skip.`,
                pseudocodeLine: 5,
                nodeStates: new Map(nodeStates),
                edgeStates: new Map(edgeStates),
                dataStructures: { stack: [...stack].reverse().map(id => graph.nodes.find(n => n.id === id)?.label), visited: [...visited].map(id => graph.nodes.find(n => n.id === id)?.label) },
                currentOperation: `Skip ${currentNode?.label}`,
                metrics: { ...metrics },
            });
            continue;
        }

        visited.add(currentId);
        metrics.nodesVisited++;
        nodeStates.set(currentId, NodeState.CURRENT);

        steps.push({
            stepNumber: steps.length + 1,
            description: `Pop node ${currentNode?.label} from stack. Mark as visited.`,
            pseudocodeLine: 6,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: { stack: [...stack].reverse().map(id => graph.nodes.find(n => n.id === id)?.label), visited: [...visited].map(id => graph.nodes.find(n => n.id === id)?.label) },
            currentOperation: `Visit ${currentNode?.label}`,
            metrics: { ...metrics },
        });

        const neighbors = adjList.get(currentId) || [];

        // Process neighbors in reverse order for consistent traversal
        for (let i = neighbors.length - 1; i >= 0; i--) {
            const { nodeId: neighborId } = neighbors[i];
            const neighborNode = graph.nodes.find(n => n.id === neighborId);
            const edge = getEdgeBetween(graph, currentId, neighborId);
            metrics.edgesExamined++;
            metrics.operationsCount++;

            if (edge) {
                if (!visited.has(neighborId)) {
                    edgeStates.set(edge.id, EdgeState.EXAMINING);
                }
            }

            if (!visited.has(neighborId)) {
                stack.push(neighborId);
                if (nodeStates.get(neighborId) === NodeState.UNVISITED) {
                    nodeStates.set(neighborId, NodeState.VISITING);
                }

                if (edge) {
                    edgeStates.set(edge.id, EdgeState.IN_SOLUTION);
                }

                steps.push({
                    stepNumber: steps.length + 1,
                    description: `Push neighbor ${neighborNode?.label} onto stack.`,
                    pseudocodeLine: 9,
                    nodeStates: new Map(nodeStates),
                    edgeStates: new Map(edgeStates),
                    dataStructures: { stack: [...stack].reverse().map(id => graph.nodes.find(n => n.id === id)?.label), visited: [...visited].map(id => graph.nodes.find(n => n.id === id)?.label) },
                    currentOperation: `Push ${neighborNode?.label}`,
                    metrics: { ...metrics },
                });
            } else {
                if (edge && edgeStates.get(edge.id) !== EdgeState.IN_SOLUTION) {
                    edgeStates.set(edge.id, EdgeState.REJECTED);
                }
            }
        }

        nodeStates.set(currentId, NodeState.VISITED);
    }

    // Mark all visited nodes as in solution
    visited.forEach(id => {
        nodeStates.set(id, NodeState.IN_SOLUTION);
    });

    steps.push({
        stepNumber: steps.length + 1,
        description: `DFS complete. Visited ${visited.size} nodes.`,
        pseudocodeLine: 9,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: { stack: [], visited: [...visited].map(id => graph.nodes.find(n => n.id === id)?.label) },
        currentOperation: 'Complete',
        metrics: { ...metrics },
    });

    return steps;
}
