// Core Graph Types
export interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  metadata?: Record<string, unknown>;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  directed: boolean;
  weighted: boolean;
}

// Node and Edge Visual States
export enum NodeState {
  UNVISITED = 'unvisited',
  VISITING = 'visiting',
  VISITED = 'visited',
  IN_PATH = 'in_path',
  IN_SOLUTION = 'in_solution',
  CURRENT = 'current'
}

export enum EdgeState {
  UNEXAMINED = 'unexamined',
  EXAMINING = 'examining',
  IN_SOLUTION = 'in_solution',
  REJECTED = 'rejected'
}

// Algorithm Step for visualization
export interface AlgorithmStep {
  stepNumber: number;
  description: string;
  pseudocodeLine: number;
  nodeStates: Map<string, NodeState>;
  edgeStates: Map<string, EdgeState>;
  dataStructures: Record<string, unknown>;
  currentOperation: string;
  metrics: AlgorithmMetrics;
}

export interface AlgorithmMetrics {
  nodesVisited: number;
  edgesExamined: number;
  operationsCount: number;
  comparisons: number;
}

// Algorithm Configuration
export interface AlgorithmConfig {
  id: string;
  name: string;
  category: 'traversal' | 'shortestPath' | 'mst' | 'other';
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  pseudocode: string[];
  requiresWeighted: boolean;
  requiresDirected: boolean | null; // null = works for both
  requiresStartNode: boolean;
  requiresEndNode: boolean;
}

export interface AlgorithmParams {
  startNodeId?: string;
  endNodeId?: string;
  heuristic?: 'manhattan' | 'euclidean';
}

// Playback state
export type PlaybackSpeed = 0.5 | 1 | 2 | 5;

export interface PlaybackState {
  isPlaying: boolean;
  currentStepIndex: number;
  speed: PlaybackSpeed;
}

// Tool/Mode for canvas interaction
export type CanvasTool = 'select' | 'addNode' | 'addEdge' | 'pan';

// Theme
export type Theme = 'light' | 'dark';

// History action for undo/redo
export interface HistoryAction {
  type: string;
  payload: unknown;
  inverse: unknown;
}
