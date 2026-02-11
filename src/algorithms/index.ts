import { AlgorithmConfig, Graph, AlgorithmStep, AlgorithmParams } from '../types';

// Import all algorithms
import { bfsConfig, executeBFS } from './traversal/bfs';
import { dfsConfig, executeDFS } from './traversal/dfs';
import { dijkstraConfig, executeDijkstra } from './shortestPath/dijkstra';
import { aStarConfig, executeAStar } from './shortestPath/astar';
import { kruskalConfig, executeKruskal } from './mst/kruskal';
import { primConfig, executePrim } from './mst/prim';
import { topologicalSortConfig, executeTopologicalSort } from './other/topological';
import { cycleDetectionConfig, executeCycleDetection } from './other/cycleDetection';
import { connectedComponentsConfig, executeConnectedComponents } from './other/connectedComponents';

// Algorithm interface with execute function
export interface AlgorithmWithExecute extends AlgorithmConfig {
    execute: (graph: Graph, params: AlgorithmParams) => AlgorithmStep[];
}

// All algorithms
export const algorithms: AlgorithmWithExecute[] = [
    { ...bfsConfig, execute: executeBFS },
    { ...dfsConfig, execute: executeDFS },
    { ...dijkstraConfig, execute: executeDijkstra },
    { ...aStarConfig, execute: executeAStar },
    { ...kruskalConfig, execute: executeKruskal },
    { ...primConfig, execute: executePrim },
    { ...topologicalSortConfig, execute: executeTopologicalSort },
    { ...cycleDetectionConfig, execute: executeCycleDetection },
    { ...connectedComponentsConfig, execute: executeConnectedComponents },
];

// Get algorithm by ID
export function getAlgorithm(id: string): AlgorithmWithExecute | undefined {
    return algorithms.find(a => a.id === id);
}

// Alias for getAlgorithm
export const getAlgorithmById = getAlgorithm;

// Get algorithms by category
export function getAlgorithmsByCategory(): Record<string, AlgorithmWithExecute[]> {
    const categories: Record<string, AlgorithmWithExecute[]> = {
        traversal: [],
        shortestPath: [],
        mst: [],
        other: [],
    };

    for (const algo of algorithms) {
        categories[algo.category].push(algo);
    }

    return categories;
}

// Category display names
export const categoryNames: Record<string, string> = {
    traversal: 'Traversal',
    shortestPath: 'Shortest Path',
    mst: 'Minimum Spanning Tree',
    other: 'Other Algorithms',
};

// Check if algorithm is valid for given graph
export function isAlgorithmValidForGraph(algorithmId: string, graph: Graph): { valid: boolean; reason?: string } {
    const algo = getAlgorithm(algorithmId);
    if (!algo) return { valid: false, reason: 'Algorithm not found' };

    if (algo.requiresDirected === true && !graph.directed) {
        return { valid: false, reason: 'This algorithm requires a directed graph' };
    }

    if (algo.requiresDirected === false && graph.directed) {
        return { valid: false, reason: 'This algorithm requires an undirected graph' };
    }

    return { valid: true };
}
