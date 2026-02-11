import { Graph, AlgorithmStep, AlgorithmParams, AlgorithmConfig, NodeState, EdgeState, AlgorithmMetrics } from '../../types';
import { getNode } from '../../core/graph/graphUtils';

export const topologicalSortConfig: AlgorithmConfig = {
    id: 'topological',
    name: 'Topological Sort',
    category: 'other',
    description: "Kahn's algorithm for linear ordering of vertices in a DAG such that for every directed edge u→v, u comes before v.",
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    pseudocode: [
        "TopologicalSort(graph):",
        "  compute in-degree for each vertex",
        "  queue = all vertices with in-degree 0",
        "  result = []",
        "  while queue not empty:",
        "    u = dequeue",
        "    append u to result",
        "    for each neighbor v of u:",
        "      decrement in-degree of v",
        "      if in-degree[v] == 0: enqueue v",
        "  if |result| < |V|: cycle detected",
    ],
    requiresWeighted: false,
    requiresDirected: true,
    requiresStartNode: false,
    requiresEndNode: false,
};

export function executeTopologicalSort(graph: Graph, _params: AlgorithmParams): AlgorithmStep[] {
    const steps: AlgorithmStep[] = [];

    if (!graph.directed) {
        return steps;
    }

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

    // Calculate in-degrees
    const inDegree = new Map<string, number>();
    graph.nodes.forEach(n => inDegree.set(n.id, 0));

    for (const edge of graph.edges) {
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    const formatInDegrees = () => {
        const result: Record<string, number> = {};
        graph.nodes.forEach(n => {
            result[n.label] = inDegree.get(n.id) || 0;
        });
        return result;
    };

    steps.push({
        stepNumber: steps.length + 1,
        description: 'Calculate in-degree for each vertex.',
        pseudocodeLine: 1,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: { inDegrees: formatInDegrees() },
        currentOperation: 'Calculate in-degrees',
        metrics: { ...metrics },
    });

    // Initialize queue with nodes having in-degree 0
    const queue: string[] = [];
    graph.nodes.forEach(n => {
        if (inDegree.get(n.id) === 0) {
            queue.push(n.id);
            nodeStates.set(n.id, NodeState.VISITING);
        }
    });

    steps.push({
        stepNumber: steps.length + 1,
        description: `Initialize queue with nodes having in-degree 0: ${queue.map(id => getNode(graph, id)?.label).join(', ')}`,
        pseudocodeLine: 2,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: { inDegrees: formatInDegrees(), queue: queue.map(id => getNode(graph, id)?.label) },
        currentOperation: 'Initialize queue',
        metrics: { ...metrics },
    });

    const result: string[] = [];

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentNode = getNode(graph, currentId)!;
        result.push(currentId);
        metrics.nodesVisited++;
        metrics.operationsCount++;

        nodeStates.set(currentId, NodeState.CURRENT);

        steps.push({
            stepNumber: steps.length + 1,
            description: `Dequeue ${currentNode.label}. Add to result.`,
            pseudocodeLine: 5,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: {
                inDegrees: formatInDegrees(),
                queue: queue.map(id => getNode(graph, id)?.label),
                result: result.map(id => getNode(graph, id)?.label)
            },
            currentOperation: `Process ${currentNode.label}`,
            metrics: { ...metrics },
        });

        // Process outgoing edges
        for (const edge of graph.edges.filter(e => e.source === currentId)) {
            const neighborId = edge.target;
            const neighborNode = getNode(graph, neighborId)!;
            metrics.edgesExamined++;

            edgeStates.set(edge.id, EdgeState.IN_SOLUTION);

            const newDegree = (inDegree.get(neighborId) || 0) - 1;
            inDegree.set(neighborId, newDegree);

            steps.push({
                stepNumber: steps.length + 1,
                description: `Decrement in-degree of ${neighborNode.label} to ${newDegree}.`,
                pseudocodeLine: 8,
                nodeStates: new Map(nodeStates),
                edgeStates: new Map(edgeStates),
                dataStructures: {
                    inDegrees: formatInDegrees(),
                    queue: queue.map(id => getNode(graph, id)?.label),
                    result: result.map(id => getNode(graph, id)?.label)
                },
                currentOperation: `Update ${neighborNode.label}`,
                metrics: { ...metrics },
            });

            if (newDegree === 0) {
                queue.push(neighborId);
                nodeStates.set(neighborId, NodeState.VISITING);

                steps.push({
                    stepNumber: steps.length + 1,
                    description: `${neighborNode.label} has in-degree 0. Add to queue.`,
                    pseudocodeLine: 9,
                    nodeStates: new Map(nodeStates),
                    edgeStates: new Map(edgeStates),
                    dataStructures: {
                        inDegrees: formatInDegrees(),
                        queue: queue.map(id => getNode(graph, id)?.label),
                        result: result.map(id => getNode(graph, id)?.label)
                    },
                    currentOperation: `Enqueue ${neighborNode.label}`,
                    metrics: { ...metrics },
                });
            }
        }

        nodeStates.set(currentId, NodeState.IN_SOLUTION);
    }

    if (result.length < graph.nodes.length) {
        steps.push({
            stepNumber: steps.length + 1,
            description: `Cycle detected! Only ${result.length} of ${graph.nodes.length} nodes processed.`,
            pseudocodeLine: 10,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: { result: result.map(id => getNode(graph, id)?.label) },
            currentOperation: 'Cycle Detected',
            metrics: { ...metrics },
        });
    } else {
        steps.push({
            stepNumber: steps.length + 1,
            description: `Topological sort complete: ${result.map(id => getNode(graph, id)?.label).join(' → ')}`,
            pseudocodeLine: 10,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: { result: result.map(id => getNode(graph, id)?.label) },
            currentOperation: 'Complete',
            metrics: { ...metrics },
        });
    }

    return steps;
}
