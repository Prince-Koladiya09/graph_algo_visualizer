import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Graph, Node, Edge, CanvasTool, Theme } from '../types';
import { createNode, createEdge, createEmptyGraph, generateLabel, hasEdge } from '../core/graph/graphUtils';

interface GraphState {
    // Graph data
    graph: Graph;

    // Selection state
    selectedNodeIds: Set<string>;
    selectedEdgeIds: Set<string>;

    // Editing state
    currentTool: CanvasTool;
    edgeStartNodeId: string | null;
    editingNodeId: string | null;
    editingEdgeId: string | null;

    // UI state
    theme: Theme;
    viewMode: '2d' | '3d';
    zoom: number;
    panOffset: { x: number; y: number };

    // History for undo/redo
    history: Graph[];
    historyIndex: number;

    // Actions
    addNode: (x: number, y: number) => void;
    removeNode: (nodeId: string) => void;
    updateNodePosition: (nodeId: string, x: number, y: number) => void;
    updateNodeLabel: (nodeId: string, label: string) => void;

    addEdge: (source: string, target: string, weight?: number) => void;
    removeEdge: (edgeId: string) => void;
    updateEdgeWeight: (edgeId: string, weight: number) => void;
    reverseEdgeDirection: (edgeId: string) => void;

    setGraphDirected: (directed: boolean) => void;
    setGraphWeighted: (weighted: boolean) => void;

    selectNode: (nodeId: string, multiSelect?: boolean) => void;
    selectEdge: (edgeId: string, multiSelect?: boolean) => void;
    clearSelection: () => void;
    deleteSelected: () => void;

    setCurrentTool: (tool: CanvasTool) => void;
    setEdgeStartNode: (nodeId: string | null) => void;
    setEditingNode: (nodeId: string | null) => void;
    setEditingEdge: (edgeId: string | null) => void;

    setTheme: (theme: Theme) => void;
    setViewMode: (mode: '2d' | '3d') => void;
    setZoom: (zoom: number) => void;
    setPanOffset: (offset: { x: number; y: number }) => void;

    loadGraph: (graph: Graph) => void;
    clearGraph: () => void;

    undo: () => void;
    redo: () => void;
    saveToHistory: () => void;
}

const MAX_HISTORY = 20;

export const useGraphStore = create<GraphState>()(
    persist(
        (set, get) => ({
            // Initial state
            graph: createEmptyGraph(),
            selectedNodeIds: new Set(),
            selectedEdgeIds: new Set(),
            currentTool: 'select',
            edgeStartNodeId: null,
            editingNodeId: null,
            editingEdgeId: null,
            theme: 'dark',
            viewMode: '2d' as '2d' | '3d',
            zoom: 1,
            panOffset: { x: 0, y: 0 },
            history: [],
            historyIndex: -1,

            // Node actions
            addNode: (x, y) => {
                const state = get();
                state.saveToHistory();
                const nodeCount = state.graph.nodes.length;
                const node = createNode(x, y, generateLabel(nodeCount));
                set({
                    graph: {
                        ...state.graph,
                        nodes: [...state.graph.nodes, node],
                    },
                });
            },

            removeNode: (nodeId) => {
                const state = get();
                state.saveToHistory();
                set({
                    graph: {
                        ...state.graph,
                        nodes: state.graph.nodes.filter((n) => n.id !== nodeId),
                        edges: state.graph.edges.filter(
                            (e) => e.source !== nodeId && e.target !== nodeId
                        ),
                    },
                    selectedNodeIds: new Set([...state.selectedNodeIds].filter((id) => id !== nodeId)),
                });
            },

            updateNodePosition: (nodeId, x, y) => {
                set((state) => ({
                    graph: {
                        ...state.graph,
                        nodes: state.graph.nodes.map((n) =>
                            n.id === nodeId ? { ...n, x, y } : n
                        ),
                    },
                }));
            },

            updateNodeLabel: (nodeId, label) => {
                const state = get();
                state.saveToHistory();
                set({
                    graph: {
                        ...state.graph,
                        nodes: state.graph.nodes.map((n) =>
                            n.id === nodeId ? { ...n, label } : n
                        ),
                    },
                });
            },

            // Edge actions
            addEdge: (source, target, weight = 1) => {
                const state = get();
                if (hasEdge(state.graph, source, target)) {
                    return; // Prevent duplicate edges
                }
                state.saveToHistory();
                const edge = createEdge(source, target, weight);
                set({
                    graph: {
                        ...state.graph,
                        edges: [...state.graph.edges, edge],
                    },
                });
            },

            removeEdge: (edgeId) => {
                const state = get();
                state.saveToHistory();
                set({
                    graph: {
                        ...state.graph,
                        edges: state.graph.edges.filter((e) => e.id !== edgeId),
                    },
                    selectedEdgeIds: new Set([...state.selectedEdgeIds].filter((id) => id !== edgeId)),
                });
            },

            updateEdgeWeight: (edgeId, weight) => {
                const state = get();
                state.saveToHistory();
                set({
                    graph: {
                        ...state.graph,
                        edges: state.graph.edges.map((e) =>
                            e.id === edgeId ? { ...e, weight } : e
                        ),
                    },
                });
            },

            reverseEdgeDirection: (edgeId) => {
                const state = get();
                state.saveToHistory();
                set({
                    graph: {
                        ...state.graph,
                        edges: state.graph.edges.map((e) =>
                            e.id === edgeId ? { ...e, source: e.target, target: e.source } : e
                        ),
                    },
                });
            },
            setGraphDirected: (directed) => {
                const state = get();
                state.saveToHistory();
                set({
                    graph: {
                        ...state.graph,
                        directed,
                    },
                });
            },

            setGraphWeighted: (weighted) => {
                const state = get();
                state.saveToHistory();
                set({
                    graph: {
                        ...state.graph,
                        weighted,
                        edges: state.graph.edges.map((e) => ({
                            ...e,
                            weight: weighted ? e.weight : 1,
                        })),
                    },
                });
            },

            // Selection actions
            selectNode: (nodeId, multiSelect = false) => {
                set((state) => {
                    const newSelection = new Set(multiSelect ? state.selectedNodeIds : []);
                    if (newSelection.has(nodeId)) {
                        newSelection.delete(nodeId);
                    } else {
                        newSelection.add(nodeId);
                    }
                    return {
                        selectedNodeIds: newSelection,
                        selectedEdgeIds: multiSelect ? state.selectedEdgeIds : new Set(),
                    };
                });
            },

            selectEdge: (edgeId, multiSelect = false) => {
                set((state) => {
                    const newSelection = new Set(multiSelect ? state.selectedEdgeIds : []);
                    if (newSelection.has(edgeId)) {
                        newSelection.delete(edgeId);
                    } else {
                        newSelection.add(edgeId);
                    }
                    return {
                        selectedEdgeIds: newSelection,
                        selectedNodeIds: multiSelect ? state.selectedNodeIds : new Set(),
                    };
                });
            },

            clearSelection: () => {
                set({
                    selectedNodeIds: new Set(),
                    selectedEdgeIds: new Set(),
                });
            },

            deleteSelected: () => {
                const state = get();
                if (state.selectedNodeIds.size === 0 && state.selectedEdgeIds.size === 0) {
                    return;
                }
                state.saveToHistory();
                set({
                    graph: {
                        ...state.graph,
                        nodes: state.graph.nodes.filter((n) => !state.selectedNodeIds.has(n.id)),
                        edges: state.graph.edges.filter(
                            (e) =>
                                !state.selectedEdgeIds.has(e.id) &&
                                !state.selectedNodeIds.has(e.source) &&
                                !state.selectedNodeIds.has(e.target)
                        ),
                    },
                    selectedNodeIds: new Set(),
                    selectedEdgeIds: new Set(),
                });
            },

            // Tool actions
            setCurrentTool: (tool) => set({ currentTool: tool }),
            setEdgeStartNode: (nodeId) => set({ edgeStartNodeId: nodeId }),
            setEditingNode: (nodeId) => set({ editingNodeId: nodeId }),
            setEditingEdge: (edgeId) => set({ editingEdgeId: edgeId }),

            // UI actions
            setTheme: (theme) => set({ theme }),
            setViewMode: (mode) => set({ viewMode: mode }),
            setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
            setPanOffset: (offset) => set({ panOffset: offset }),

            // Graph management
            loadGraph: (graph) => {
                const state = get();
                state.saveToHistory();
                set({
                    graph,
                    selectedNodeIds: new Set(),
                    selectedEdgeIds: new Set(),
                });
            },

            clearGraph: () => {
                const state = get();
                state.saveToHistory();
                set({
                    graph: createEmptyGraph(state.graph.directed, state.graph.weighted),
                    selectedNodeIds: new Set(),
                    selectedEdgeIds: new Set(),
                });
            },

            // History actions
            saveToHistory: () => {
                const state = get();
                const newHistory = state.history.slice(0, state.historyIndex + 1);
                newHistory.push(JSON.parse(JSON.stringify(state.graph)));
                if (newHistory.length > MAX_HISTORY) {
                    newHistory.shift();
                }
                set({
                    history: newHistory,
                    historyIndex: newHistory.length - 1,
                });
            },

            undo: () => {
                const state = get();
                if (state.historyIndex >= 0) {
                    const previousGraph = state.history[state.historyIndex];
                    set({
                        graph: JSON.parse(JSON.stringify(previousGraph)),
                        historyIndex: state.historyIndex - 1,
                        selectedNodeIds: new Set(),
                        selectedEdgeIds: new Set(),
                    });
                }
            },

            redo: () => {
                const state = get();
                if (state.historyIndex < state.history.length - 1) {
                    const nextGraph = state.history[state.historyIndex + 1];
                    set({
                        graph: JSON.parse(JSON.stringify(nextGraph)),
                        historyIndex: state.historyIndex + 1,
                        selectedNodeIds: new Set(),
                        selectedEdgeIds: new Set(),
                    });
                }
            },
        }),
        {
            name: 'graph-visualizer-storage',
            partialize: (state) => ({
                graph: state.graph,
                theme: state.theme,
            }),
        }
    )
);
