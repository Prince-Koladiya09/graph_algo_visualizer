import { create } from 'zustand';
import { Graph, AlgorithmStep, NodeState, EdgeState } from '../types';
import { getAlgorithmById } from '../algorithms';

interface ComparisonState {
    isComparisonMode: boolean;

    // Two algorithms to compare
    algorithm1Id: string | null;
    algorithm2Id: string | null;

    // Steps for each algorithm
    steps1: AlgorithmStep[];
    steps2: AlgorithmStep[];

    // Current step indices
    currentStep1: number;
    currentStep2: number;

    // Playback state
    isPlaying: boolean;
    speed: 0.5 | 1 | 2 | 5;

    // Visual states
    nodeStates1: Map<string, NodeState>;
    edgeStates1: Map<string, EdgeState>;
    nodeStates2: Map<string, NodeState>;
    edgeStates2: Map<string, EdgeState>;

    // Parameters
    startNodeId: string | null;
    endNodeId: string | null;

    // Actions
    enableComparisonMode: () => void;
    disableComparisonMode: () => void;

    selectAlgorithm1: (id: string | null) => void;
    selectAlgorithm2: (id: string | null) => void;

    setStartNode: (nodeId: string | null) => void;
    setEndNode: (nodeId: string | null) => void;

    runComparison: (graph: Graph) => void;
    resetComparison: () => void;

    play: () => void;
    pause: () => void;
    setSpeed: (speed: 0.5 | 1 | 2 | 5) => void;

    stepForward: () => void;
    stepBackward: () => void;
    jumpToStart: () => void;
    jumpToEnd: () => void;
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
    isComparisonMode: false,

    algorithm1Id: null,
    algorithm2Id: null,

    steps1: [],
    steps2: [],

    currentStep1: -1,
    currentStep2: -1,

    isPlaying: false,
    speed: 1,

    nodeStates1: new Map(),
    edgeStates1: new Map(),
    nodeStates2: new Map(),
    edgeStates2: new Map(),

    startNodeId: null,
    endNodeId: null,

    enableComparisonMode: () => {
        set({ isComparisonMode: true });
    },

    disableComparisonMode: () => {
        set({
            isComparisonMode: false,
            algorithm1Id: null,
            algorithm2Id: null,
            steps1: [],
            steps2: [],
            currentStep1: -1,
            currentStep2: -1,
            isPlaying: false,
            nodeStates1: new Map(),
            edgeStates1: new Map(),
            nodeStates2: new Map(),
            edgeStates2: new Map(),
        });
    },

    selectAlgorithm1: (id) => set({ algorithm1Id: id }),
    selectAlgorithm2: (id) => set({ algorithm2Id: id }),

    setStartNode: (nodeId) => set({ startNodeId: nodeId }),
    setEndNode: (nodeId) => set({ endNodeId: nodeId }),

    runComparison: (graph) => {
        const state = get();
        const { algorithm1Id, algorithm2Id, startNodeId, endNodeId } = state;

        if (!algorithm1Id || !algorithm2Id) return;

        const algo1 = getAlgorithmById(algorithm1Id);
        const algo2 = getAlgorithmById(algorithm2Id);

        if (!algo1 || !algo2) return;

        const params = {
            startNodeId: startNodeId || undefined,
            endNodeId: endNodeId || undefined
        };

        try {
            const steps1 = algo1.execute(graph, params);
            const steps2 = algo2.execute(graph, params);

            set({
                steps1,
                steps2,
                currentStep1: 0,
                currentStep2: 0,
                nodeStates1: steps1[0]?.nodeStates || new Map(),
                edgeStates1: steps1[0]?.edgeStates || new Map(),
                nodeStates2: steps2[0]?.nodeStates || new Map(),
                edgeStates2: steps2[0]?.edgeStates || new Map(),
            });
        } catch (error) {
            console.error('Error running comparison:', error);
        }
    },

    resetComparison: () => {
        set({
            steps1: [],
            steps2: [],
            currentStep1: -1,
            currentStep2: -1,
            isPlaying: false,
            nodeStates1: new Map(),
            edgeStates1: new Map(),
            nodeStates2: new Map(),
            edgeStates2: new Map(),
        });
    },

    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    setSpeed: (speed) => set({ speed }),

    stepForward: () => {
        const state = get();
        const { steps1, steps2, currentStep1, currentStep2 } = state;

        const newStep1 = Math.min(currentStep1 + 1, steps1.length - 1);
        const newStep2 = Math.min(currentStep2 + 1, steps2.length - 1);

        set({
            currentStep1: newStep1,
            currentStep2: newStep2,
            nodeStates1: steps1[newStep1]?.nodeStates || new Map(),
            edgeStates1: steps1[newStep1]?.edgeStates || new Map(),
            nodeStates2: steps2[newStep2]?.nodeStates || new Map(),
            edgeStates2: steps2[newStep2]?.edgeStates || new Map(),
        });

        // Stop if both reached end
        if (newStep1 >= steps1.length - 1 && newStep2 >= steps2.length - 1) {
            set({ isPlaying: false });
        }
    },

    stepBackward: () => {
        const state = get();
        const { steps1, steps2, currentStep1, currentStep2 } = state;

        const newStep1 = Math.max(currentStep1 - 1, 0);
        const newStep2 = Math.max(currentStep2 - 1, 0);

        set({
            currentStep1: newStep1,
            currentStep2: newStep2,
            nodeStates1: steps1[newStep1]?.nodeStates || new Map(),
            edgeStates1: steps1[newStep1]?.edgeStates || new Map(),
            nodeStates2: steps2[newStep2]?.nodeStates || new Map(),
            edgeStates2: steps2[newStep2]?.edgeStates || new Map(),
        });
    },

    jumpToStart: () => {
        const state = get();
        const { steps1, steps2 } = state;

        set({
            currentStep1: 0,
            currentStep2: 0,
            nodeStates1: steps1[0]?.nodeStates || new Map(),
            edgeStates1: steps1[0]?.edgeStates || new Map(),
            nodeStates2: steps2[0]?.nodeStates || new Map(),
            edgeStates2: steps2[0]?.edgeStates || new Map(),
            isPlaying: false,
        });
    },

    jumpToEnd: () => {
        const state = get();
        const { steps1, steps2 } = state;

        const lastStep1 = steps1.length - 1;
        const lastStep2 = steps2.length - 1;

        set({
            currentStep1: lastStep1,
            currentStep2: lastStep2,
            nodeStates1: steps1[lastStep1]?.nodeStates || new Map(),
            edgeStates1: steps1[lastStep1]?.edgeStates || new Map(),
            nodeStates2: steps2[lastStep2]?.nodeStates || new Map(),
            edgeStates2: steps2[lastStep2]?.edgeStates || new Map(),
            isPlaying: false,
        });
    },
}));
