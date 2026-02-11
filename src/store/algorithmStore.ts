import { create } from 'zustand';
import {
    AlgorithmStep,
    AlgorithmConfig,
    AlgorithmParams,
    PlaybackSpeed,
    NodeState,
    EdgeState
} from '../types';
import { Graph } from '../types';
import { algorithms } from '../algorithms';

interface AlgorithmState {
    // Algorithm selection
    selectedAlgorithmId: string | null;
    algorithmParams: AlgorithmParams;

    // Execution state
    steps: AlgorithmStep[];
    currentStepIndex: number;
    isPlaying: boolean;
    speed: PlaybackSpeed;

    // Visualization states
    nodeStates: Map<string, NodeState>;
    edgeStates: Map<string, EdgeState>;

    // Actions
    selectAlgorithm: (algorithmId: string | null) => void;
    setAlgorithmParams: (params: Partial<AlgorithmParams>) => void;

    runAlgorithm: (graph: Graph) => void;
    resetExecution: () => void;

    play: () => void;
    pause: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    jumpToStart: () => void;
    jumpToEnd: () => void;
    setSpeed: (speed: PlaybackSpeed) => void;

    applyStep: (stepIndex: number) => void;
}

export const useAlgorithmStore = create<AlgorithmState>((set, get) => ({
    // Initial state
    selectedAlgorithmId: null,
    algorithmParams: {},
    steps: [],
    currentStepIndex: -1,
    isPlaying: false,
    speed: 1,
    nodeStates: new Map(),
    edgeStates: new Map(),

    // Algorithm selection
    selectAlgorithm: (algorithmId) => {
        set({
            selectedAlgorithmId: algorithmId,
            steps: [],
            currentStepIndex: -1,
            isPlaying: false,
            nodeStates: new Map(),
            edgeStates: new Map(),
        });
    },

    setAlgorithmParams: (params) => {
        set((state) => ({
            algorithmParams: { ...state.algorithmParams, ...params },
        }));
    },

    // Execution
    runAlgorithm: (graph) => {
        const state = get();
        if (!state.selectedAlgorithmId) return;

        const algorithm = algorithms.find((a) => a.id === state.selectedAlgorithmId);
        if (!algorithm) return;

        const steps = algorithm.execute(graph, state.algorithmParams);
        set({
            steps,
            currentStepIndex: -1,
            isPlaying: false,
            nodeStates: new Map(),
            edgeStates: new Map(),
        });
    },

    resetExecution: () => {
        set({
            steps: [],
            currentStepIndex: -1,
            isPlaying: false,
            nodeStates: new Map(),
            edgeStates: new Map(),
        });
    },

    // Playback controls
    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),

    stepForward: () => {
        const state = get();
        if (state.currentStepIndex < state.steps.length - 1) {
            const newIndex = state.currentStepIndex + 1;
            get().applyStep(newIndex);
        } else {
            set({ isPlaying: false });
        }
    },

    stepBackward: () => {
        const state = get();
        if (state.currentStepIndex > 0) {
            const newIndex = state.currentStepIndex - 1;
            get().applyStep(newIndex);
        } else if (state.currentStepIndex === 0) {
            set({
                currentStepIndex: -1,
                nodeStates: new Map(),
                edgeStates: new Map(),
            });
        }
    },

    jumpToStart: () => {
        set({
            currentStepIndex: -1,
            isPlaying: false,
            nodeStates: new Map(),
            edgeStates: new Map(),
        });
    },

    jumpToEnd: () => {
        const state = get();
        if (state.steps.length > 0) {
            get().applyStep(state.steps.length - 1);
            set({ isPlaying: false });
        }
    },

    setSpeed: (speed) => set({ speed }),

    applyStep: (stepIndex) => {
        const state = get();
        if (stepIndex >= 0 && stepIndex < state.steps.length) {
            const step = state.steps[stepIndex];
            set({
                currentStepIndex: stepIndex,
                nodeStates: new Map(step.nodeStates),
                edgeStates: new Map(step.edgeStates),
            });
        }
    },
}));

// Helper to get algorithm config
export function getAlgorithmConfig(algorithmId: string): AlgorithmConfig | undefined {
    return algorithms.find((a) => a.id === algorithmId);
}

// Get algorithms by category
export function getAlgorithmsByCategory(): Record<string, AlgorithmConfig[]> {
    const categories: Record<string, AlgorithmConfig[]> = {};
    for (const algo of algorithms) {
        if (!categories[algo.category]) {
            categories[algo.category] = [];
        }
        categories[algo.category].push(algo);
    }
    return categories;
}
