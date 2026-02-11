import { Graph, AlgorithmStep, AlgorithmParams, AlgorithmConfig, NodeState, EdgeState, AlgorithmMetrics } from '../../types';
import { getNode } from '../../core/graph/graphUtils';

export const kruskalConfig: AlgorithmConfig = {
    id: 'kruskal',
    name: "Kruskal's Algorithm",
    category: 'mst',
    description: 'Finds the minimum spanning tree by greedily adding the smallest edge that does not create a cycle.',
    timeComplexity: 'O(E log E)',
    spaceComplexity: 'O(V)',
    pseudocode: [
        "Kruskal(graph):",
        "  sort edges by weight ascending",
        "  MST = empty set",
        "  create disjoint set for each vertex",
        "  for each edge (u, v) in sorted order:",
        "    if find(u) ≠ find(v):",
        "      add edge to MST",
        "      union(u, v)",
        "  return MST",
    ],
    requiresWeighted: false,
    requiresDirected: false,
    requiresStartNode: false,
    requiresEndNode: false,
};

// Union-Find data structure
class UnionFind {
    private parent: Map<string, string> = new Map();
    private rank: Map<string, number> = new Map();

    constructor(nodes: string[]) {
        nodes.forEach(node => {
            this.parent.set(node, node);
            this.rank.set(node, 0);
        });
    }

    find(x: string): string {
        if (this.parent.get(x) !== x) {
            this.parent.set(x, this.find(this.parent.get(x)!));
        }
        return this.parent.get(x)!;
    }

    union(x: string, y: string): boolean {
        const rootX = this.find(x);
        const rootY = this.find(y);

        if (rootX === rootY) return false;

        const rankX = this.rank.get(rootX) || 0;
        const rankY = this.rank.get(rootY) || 0;

        if (rankX < rankY) {
            this.parent.set(rootX, rootY);
        } else if (rankX > rankY) {
            this.parent.set(rootY, rootX);
        } else {
            this.parent.set(rootY, rootX);
            this.rank.set(rootX, rankX + 1);
        }

        return true;
    }

    getComponents(): Map<string, string[]> {
        const components = new Map<string, string[]>();
        this.parent.forEach((_, node) => {
            const root = this.find(node);
            if (!components.has(root)) {
                components.set(root, []);
            }
            components.get(root)!.push(node);
        });
        return components;
    }
}

export function executeKruskal(graph: Graph, _params: AlgorithmParams): AlgorithmStep[] {
    const steps: AlgorithmStep[] = [];

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

    // Sort edges by weight
    const sortedEdges = [...graph.edges].sort((a, b) => a.weight - b.weight);

    steps.push({
        stepNumber: steps.length + 1,
        description: `Sort ${graph.edges.length} edges by weight.`,
        pseudocodeLine: 1,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: {
            sortedEdges: sortedEdges.map(e => `${getNode(graph, e.source)?.label}-${getNode(graph, e.target)?.label}(${e.weight})`)
        },
        currentOperation: 'Sort edges',
        metrics: { ...metrics },
    });

    const uf = new UnionFind(graph.nodes.map(n => n.id));
    const mstEdges: string[] = [];
    let totalWeight = 0;

    for (const edge of sortedEdges) {
        const sourceNode = getNode(graph, edge.source);
        const targetNode = getNode(graph, edge.target);
        metrics.edgesExamined++;
        metrics.comparisons++;
        metrics.operationsCount++;

        edgeStates.set(edge.id, EdgeState.EXAMINING);

        steps.push({
            stepNumber: steps.length + 1,
            description: `Consider edge ${sourceNode?.label}-${targetNode?.label} (weight: ${edge.weight})`,
            pseudocodeLine: 4,
            nodeStates: new Map(nodeStates),
            edgeStates: new Map(edgeStates),
            dataStructures: {
                mstEdges: mstEdges.map(id => {
                    const e = graph.edges.find(e => e.id === id)!;
                    return `${getNode(graph, e.source)?.label}-${getNode(graph, e.target)?.label}`;
                }),
                totalWeight,
            },
            currentOperation: `Check edge`,
            metrics: { ...metrics },
        });

        if (uf.union(edge.source, edge.target)) {
            mstEdges.push(edge.id);
            totalWeight += edge.weight;
            edgeStates.set(edge.id, EdgeState.IN_SOLUTION);
            nodeStates.set(edge.source, NodeState.IN_SOLUTION);
            nodeStates.set(edge.target, NodeState.IN_SOLUTION);
            metrics.nodesVisited += 2;

            steps.push({
                stepNumber: steps.length + 1,
                description: `Add edge ${sourceNode?.label}-${targetNode?.label} to MST. No cycle created.`,
                pseudocodeLine: 6,
                nodeStates: new Map(nodeStates),
                edgeStates: new Map(edgeStates),
                dataStructures: {
                    mstEdges: mstEdges.map(id => {
                        const e = graph.edges.find(e => e.id === id)!;
                        return `${getNode(graph, e.source)?.label}-${getNode(graph, e.target)?.label}`;
                    }),
                    totalWeight,
                },
                currentOperation: `Add to MST`,
                metrics: { ...metrics },
            });
        } else {
            edgeStates.set(edge.id, EdgeState.REJECTED);

            steps.push({
                stepNumber: steps.length + 1,
                description: `Reject edge ${sourceNode?.label}-${targetNode?.label}. Would create cycle.`,
                pseudocodeLine: 5,
                nodeStates: new Map(nodeStates),
                edgeStates: new Map(edgeStates),
                dataStructures: {
                    mstEdges: mstEdges.map(id => {
                        const e = graph.edges.find(e => e.id === id)!;
                        return `${getNode(graph, e.source)?.label}-${getNode(graph, e.target)?.label}`;
                    }),
                    totalWeight,
                },
                currentOperation: `Reject edge`,
                metrics: { ...metrics },
            });
        }

        // Stop if we have V-1 edges
        if (mstEdges.length === graph.nodes.length - 1) {
            break;
        }
    }

    steps.push({
        stepNumber: steps.length + 1,
        description: `Kruskal's complete. MST has ${mstEdges.length} edges with total weight: ${totalWeight}`,
        pseudocodeLine: 8,
        nodeStates: new Map(nodeStates),
        edgeStates: new Map(edgeStates),
        dataStructures: { totalWeight, edgeCount: mstEdges.length },
        currentOperation: 'Complete',
        metrics: { ...metrics },
    });

    return steps;
}
