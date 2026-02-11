import { Graph, AlgorithmStep, AlgorithmParams, AlgorithmConfig, NodeState, EdgeState, AlgorithmMetrics } from '../../types';
import { toAdjacencyList, getEdgeBetween } from '../../core/graph/graphUtils';

export const bfsConfig: AlgorithmConfig = {
    id: 'bfs',
    name: 'Breadth-First Search',
    category: 'traversal',
    description: 'Explores all vertices at the current depth before moving to vertices at the next depth level. Uses a queue data structure.',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    pseudocode: [
        'BFS(graph, start):',
        '  create queue Q',
        '  mark start as visited',
        '  enqueue start onto Q',
        '  while Q is not empty:',
        '    v = dequeue from Q',
        '    process v',
        '    for each neighbor u of v:',
        '      if u is not visited:',
        '        mark u as visited',
        '        enqueue u onto Q',
    ],
    requiresWeighted: false,
    requiresDirected: null,
    requiresStartNode: true,
    requiresEndNode: false,
};

export function executeBFS(graph: Graph, params: AlgorithmParams): AlgorithmStep[] {
    const steps: AlgorithmStep[] = [];
    const { startNodeId } = params;

    if (!startNodeId || !graph.nodes.find(n => n.id === startNodeId)) {
        return steps;
    }

    const adjList = toAdjacencyList(graph);
    const visited = new Set<string>();
    const queue: string[] = [];

    let metrics: AlgorithmMetrics = {
        nodesVisited: 0,
        edgesExamined: 0,
        operationsCount: 0,
        comparisons: 0,
    };

    // Initial state
    const nodeStates = new Map<string, NodeState>();
    const edgeStates = new Map<string, EdgeState>();

    graph.nodes.forEach(n => nodeStates.set(n.id, NodeState.UNVISITED));
    graph.edges.forEach(e => edgeStates.set(e.id, EdgeState.UNEXAMINED));

    // Step 1: Start
    visited.add(startNodeId);
    queue.push(startNodeId);
    nodeStates.set(startNodeId, NodeState.VISITING);
    metrics.nodesVisited++;
    metrics.operationsCount++;

    steps.push({
        stepNumber: steps.length + 1,
        description: `Start BFS from node ${graph.nodes.find(n => n.id === startNodeId)?.label}. Add to queue.`,
        pseudocodeLine: 3,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: { queue: [...queue].map(id => graph.nodes.find(n => n.id === id)?.label), visited: [...visited].map(id => graph.nodes.find(n => n.id === id)?.label) },
        currentOperation: 'Initialize',
        metrics: { ...metrics },
    });

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentNode = graph.nodes.find(n => n.id === currentId);
        nodeStates.set(currentId, NodeState.CURRENT);
        metrics.operationsCount++;

        steps.push({
            stepNumber: steps.length + 1,
            description: `Dequeue node ${currentNode?.label} from queue.`,
            pseudocodeLine: 5,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: { queue: [...queue].map(id => graph.nodes.find(n => n.id === id)?.label), visited: [...visited].map(id => graph.nodes.find(n => n.id === id)?.label) },
            currentOperation: `Dequeue ${currentNode?.label}`,
            metrics: { ...metrics },
        });

        const neighbors = adjList.get(currentId) || [];

        for (const { nodeId: neighborId } of neighbors) {
            const neighborNode = graph.nodes.find(n => n.id === neighborId);
            const edge = getEdgeBetween(graph, currentId, neighborId);
            metrics.edgesExamined++;
            metrics.comparisons++;
            metrics.operationsCount++;

            if (edge) {
                edgeStates.set(edge.id, EdgeState.EXAMINING);
            }

            steps.push({
                stepNumber: steps.length + 1,
                description: `Examine edge from ${currentNode?.label} to ${neighborNode?.label}.`,
                pseudocodeLine: 7,
                nodeStates: new Map(nodeStates),
                edgeStates: new Map(edgeStates),
                dataStructures: { queue: [...queue].map(id => graph.nodes.find(n => n.id === id)?.label), visited: [...visited].map(id => graph.nodes.find(n => n.id === id)?.label) },
                currentOperation: `Check neighbor ${neighborNode?.label}`,
                metrics: { ...metrics },
            });

            if (!visited.has(neighborId)) {
                visited.add(neighborId);
                queue.push(neighborId);
                nodeStates.set(neighborId, NodeState.VISITING);
                metrics.nodesVisited++;

                if (edge) {
                    edgeStates.set(edge.id, EdgeState.IN_SOLUTION);
                }

                steps.push({
                    stepNumber: steps.length + 1,
                    description: `Node ${neighborNode?.label} not visited. Mark as visited and add to queue.`,
                    pseudocodeLine: 9,
                    nodeStates: new Map(nodeStates),
                    edgeStates: new Map(edgeStates),
                    dataStructures: { queue: [...queue].map(id => graph.nodes.find(n => n.id === id)?.label), visited: [...visited].map(id => graph.nodes.find(n => n.id === id)?.label) },
                    currentOperation: `Enqueue ${neighborNode?.label}`,
                    metrics: { ...metrics },
                });
            } else {
                if (edge && edgeStates.get(edge.id) !== EdgeState.IN_SOLUTION) {
                    edgeStates.set(edge.id, EdgeState.REJECTED);
                }
            }
        }

        nodeStates.set(currentId, NodeState.VISITED);

        steps.push({
            stepNumber: steps.length + 1,
            description: `Finished processing node ${currentNode?.label}.`,
            pseudocodeLine: 6,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: { queue: [...queue].map(id => graph.nodes.find(n => n.id === id)?.label), visited: [...visited].map(id => graph.nodes.find(n => n.id === id)?.label) },
            currentOperation: `Complete ${currentNode?.label}`,
            metrics: { ...metrics },
        });
    }

    // Mark all visited nodes as in solution
    visited.forEach(id => {
        nodeStates.set(id, NodeState.IN_SOLUTION);
    });

    steps.push({
        stepNumber: steps.length + 1,
        description: `BFS complete. Visited ${visited.size} nodes.`,
        pseudocodeLine: 10,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: { queue: [], visited: [...visited].map(id => graph.nodes.find(n => n.id === id)?.label) },
        currentOperation: 'Complete',
        metrics: { ...metrics },
    });

    return steps;
}
