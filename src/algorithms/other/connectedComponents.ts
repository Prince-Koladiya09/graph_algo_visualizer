import { Graph, AlgorithmStep, AlgorithmParams, AlgorithmConfig, NodeState, EdgeState, AlgorithmMetrics } from '../../types';
import { toAdjacencyList, getNode, getEdgeBetween } from '../../core/graph/graphUtils';

export const connectedComponentsConfig: AlgorithmConfig = {
    id: 'connectedComponents',
    name: 'Connected Components',
    category: 'other',
    description: 'Finds all connected components in an undirected graph using DFS.',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    pseudocode: [
        "ConnectedComponents(graph):",
        "  componentId = 0",
        "  for each vertex v:",
        "    if v not visited:",
        "      DFS(v, componentId)",
        "      componentId++",
        "",
        "DFS(v, id):",
        "  mark v as visited",
        "  component[v] = id",
        "  for each neighbor u of v:",
        "    if u not visited: DFS(u, id)",
    ],
    requiresWeighted: false,
    requiresDirected: false, // Only works for undirected
    requiresStartNode: false,
    requiresEndNode: false,
};

const COMPONENT_COLORS = [
    NodeState.IN_SOLUTION,
    NodeState.VISITING,
    NodeState.VISITED,
    NodeState.IN_PATH,
    NodeState.CURRENT,
];

export function executeConnectedComponents(graph: Graph, _params: AlgorithmParams): AlgorithmStep[] {
    const steps: AlgorithmStep[] = [];

    let metrics: AlgorithmMetrics = {
        nodesVisited: 0,
        edgesExamined: 0,
        operationsCount: 0,
        comparisons: 0,
    };

    const nodeStates = new Map<string, NodeState>();
    const edgeStates = new Map<string, EdgeState>();
    const visited = new Set<string>();
    const component = new Map<string, number>();

    graph.nodes.forEach(n => nodeStates.set(n.id, NodeState.UNVISITED));
    graph.edges.forEach(e => edgeStates.set(e.id, EdgeState.UNEXAMINED));

    const adjList = toAdjacencyList(graph);
    let componentId = 0;

    steps.push({
        stepNumber: steps.length + 1,
        description: 'Start finding connected components.',
        pseudocodeLine: 0,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: { componentCount: 0 },
        currentOperation: 'Initialize',
        metrics: { ...metrics },
    });

    function dfs(nodeId: string, compId: number): void {
        const node = getNode(graph, nodeId)!;
        visited.add(nodeId);
        component.set(nodeId, compId);
        nodeStates.set(nodeId, COMPONENT_COLORS[compId % COMPONENT_COLORS.length]);
        metrics.nodesVisited++;
        metrics.operationsCount++;

        steps.push({
            stepNumber: steps.length + 1,
            description: `Visit ${node.label}. Assign to component ${compId + 1}.`,
            pseudocodeLine: 8,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: {
                componentCount: compId + 1,
                components: formatComponents()
            },
            currentOperation: `Visit ${node.label}`,
            metrics: { ...metrics },
        });

        const neighbors = adjList.get(nodeId) || [];

        for (const { nodeId: neighborId } of neighbors) {
            const edge = getEdgeBetween(graph, nodeId, neighborId);
            metrics.edgesExamined++;

            if (!visited.has(neighborId)) {
                if (edge) {
                    edgeStates.set(edge.id, EdgeState.IN_SOLUTION);
                }
                dfs(neighborId, compId);
            }
        }
    }

    function formatComponents(): Record<string, string[]> {
        const comps: Record<string, string[]> = {};
        component.forEach((compId, nodeId) => {
            const key = `Component ${compId + 1}`;
            if (!comps[key]) comps[key] = [];
            comps[key].push(getNode(graph, nodeId)?.label || nodeId);
        });
        return comps;
    }

    for (const node of graph.nodes) {
        if (!visited.has(node.id)) {
            steps.push({
                stepNumber: steps.length + 1,
                description: `Start new component ${componentId + 1} from ${node.label}.`,
                pseudocodeLine: 4,
                nodeStates: new Map(nodeStates),
                edgeStates: new Map(edgeStates),
                dataStructures: { componentCount: componentId + 1 },
                currentOperation: `New component from ${node.label}`,
                metrics: { ...metrics },
            });

            dfs(node.id, componentId);
            componentId++;
        }
    }

    steps.push({
        stepNumber: steps.length + 1,
        description: `Found ${componentId} connected component(s).`,
        pseudocodeLine: 5,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: {
            componentCount: componentId,
            components: formatComponents()
        },
        currentOperation: 'Complete',
        metrics: { ...metrics },
    });

    return steps;
}
