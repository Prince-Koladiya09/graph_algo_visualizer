import { create } from 'zustand';
import { Graph } from '../types';
import { v4 as uuidv4 } from 'uuid';

export type QuizType = 'bfs_order' | 'dfs_order' | 'shortest_path' | 'mst_edges';

export interface QuizQuestion {
    id: string;
    type: QuizType;
    graph: Graph;
    startNodeId?: string;
    endNodeId?: string;
    question: string;
    correctAnswer: string[];
    hints: string[];
}

export interface QuizResult {
    questionId: string;
    userAnswer: string[];
    isCorrect: boolean;
    timeTaken: number;
}

interface QuizState {
    isQuizMode: boolean;
    currentQuestion: QuizQuestion | null;
    questionIndex: number;
    totalQuestions: number;
    results: QuizResult[];
    userAnswer: string[];
    startTime: number | null;
    showResult: boolean;
    score: number;

    // Actions
    startQuiz: (type: QuizType, graph: Graph) => void;
    endQuiz: () => void;
    submitAnswer: () => void;
    nextQuestion: () => void;
    toggleNodeInAnswer: (nodeId: string) => void;
    clearAnswer: () => void;
}

// Generate quiz questions based on type and graph
function generateQuestions(type: QuizType, graph: Graph): QuizQuestion[] {
    const questions: QuizQuestion[] = [];

    if (graph.nodes.length < 3) return questions;

    const startNode = graph.nodes[0];
    const endNode = graph.nodes[graph.nodes.length - 1];

    switch (type) {
        case 'bfs_order': {
            // BFS traversal order question
            const bfsOrder = computeBFS(graph, startNode.id);
            questions.push({
                id: uuidv4(),
                type: 'bfs_order',
                graph,
                startNodeId: startNode.id,
                question: `Starting from node "${startNode.label}", click the nodes in BFS traversal order.`,
                correctAnswer: bfsOrder,
                hints: [
                    'BFS visits all neighbors before going deeper',
                    'Use a queue to track nodes to visit',
                    `Start with node ${startNode.label}`,
                ],
            });
            break;
        }
        case 'dfs_order': {
            // DFS traversal order question
            const dfsOrder = computeDFS(graph, startNode.id);
            questions.push({
                id: uuidv4(),
                type: 'dfs_order',
                graph,
                startNodeId: startNode.id,
                question: `Starting from node "${startNode.label}", click the nodes in DFS traversal order.`,
                correctAnswer: dfsOrder,
                hints: [
                    'DFS goes as deep as possible before backtracking',
                    'Use a stack to track nodes to visit',
                    `Start with node ${startNode.label}`,
                ],
            });
            break;
        }
        case 'shortest_path': {
            // Shortest path question
            if (graph.weighted) {
                const path = computeShortestPath(graph, startNode.id, endNode.id);
                if (path.length > 0) {
                    questions.push({
                        id: uuidv4(),
                        type: 'shortest_path',
                        graph,
                        startNodeId: startNode.id,
                        endNodeId: endNode.id,
                        question: `Click all nodes on the shortest path from "${startNode.label}" to "${endNode.label}" (in order).`,
                        correctAnswer: path,
                        hints: [
                            'Consider edge weights when finding shortest path',
                            'Use Dijkstra\'s algorithm mentally',
                            `The path starts at ${startNode.label} and ends at ${endNode.label}`,
                        ],
                    });
                }
            }
            break;
        }
        case 'mst_edges': {
            // MST edges question - simplified
            questions.push({
                id: uuidv4(),
                type: 'mst_edges',
                graph,
                question: 'This is a minimum spanning tree challenge. Think about which edges would be in the MST.',
                correctAnswer: [],
                hints: [
                    'MST connects all nodes with minimum total weight',
                    'MST has exactly n-1 edges for n nodes',
                    'Greedy approach: pick smallest edges that don\'t form cycles',
                ],
            });
            break;
        }
    }

    return questions;
}

// Simple BFS implementation for answer verification
function computeBFS(graph: Graph, startId: string): string[] {
    const visited = new Set<string>();
    const order: string[] = [];
    const queue: string[] = [startId];

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (visited.has(nodeId)) continue;

        visited.add(nodeId);
        order.push(nodeId);

        // Get neighbors
        for (const edge of graph.edges) {
            let neighbor: string | null = null;
            if (edge.source === nodeId) neighbor = edge.target;
            else if (!graph.directed && edge.target === nodeId) neighbor = edge.source;

            if (neighbor && !visited.has(neighbor)) {
                queue.push(neighbor);
            }
        }
    }

    return order;
}

// Simple DFS implementation
function computeDFS(graph: Graph, startId: string): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    function dfs(nodeId: string) {
        if (visited.has(nodeId)) return;

        visited.add(nodeId);
        order.push(nodeId);

        for (const edge of graph.edges) {
            let neighbor: string | null = null;
            if (edge.source === nodeId) neighbor = edge.target;
            else if (!graph.directed && edge.target === nodeId) neighbor = edge.source;

            if (neighbor && !visited.has(neighbor)) {
                dfs(neighbor);
            }
        }
    }

    dfs(startId);
    return order;
}

// Simple Dijkstra's for shortest path
function computeShortestPath(graph: Graph, startId: string, endId: string): string[] {
    const dist = new Map<string, number>();
    const prev = new Map<string, string | null>();
    const unvisited = new Set<string>();

    for (const node of graph.nodes) {
        dist.set(node.id, Infinity);
        prev.set(node.id, null);
        unvisited.add(node.id);
    }
    dist.set(startId, 0);

    while (unvisited.size > 0) {
        // Find min distance node
        let minNode: string | null = null;
        let minDist = Infinity;
        for (const nodeId of unvisited) {
            const d = dist.get(nodeId)!;
            if (d < minDist) {
                minDist = d;
                minNode = nodeId;
            }
        }

        if (minNode === null || minDist === Infinity) break;
        if (minNode === endId) break;

        unvisited.delete(minNode);

        // Update neighbors
        for (const edge of graph.edges) {
            let neighbor: string | null = null;
            let weight = edge.weight;

            if (edge.source === minNode) neighbor = edge.target;
            else if (!graph.directed && edge.target === minNode) neighbor = edge.source;

            if (neighbor && unvisited.has(neighbor)) {
                const alt = dist.get(minNode)! + weight;
                if (alt < dist.get(neighbor)!) {
                    dist.set(neighbor, alt);
                    prev.set(neighbor, minNode);
                }
            }
        }
    }

    // Reconstruct path
    const path: string[] = [];
    let current: string | null = endId;
    while (current !== null) {
        path.unshift(current);
        current = prev.get(current) || null;
    }

    if (path[0] !== startId) return []; // No path found
    return path;
}

export const useQuizStore = create<QuizState>((set, get) => ({
    isQuizMode: false,
    currentQuestion: null,
    questionIndex: 0,
    totalQuestions: 0,
    results: [],
    userAnswer: [],
    startTime: null,
    showResult: false,
    score: 0,

    startQuiz: (type, graph) => {
        const questions = generateQuestions(type, graph);
        if (questions.length === 0) {
            alert('Cannot generate quiz for this graph. Make sure the graph has enough nodes.');
            return;
        }

        set({
            isQuizMode: true,
            currentQuestion: questions[0],
            questionIndex: 0,
            totalQuestions: questions.length,
            results: [],
            userAnswer: [],
            startTime: Date.now(),
            showResult: false,
            score: 0,
        });
    },

    endQuiz: () => {
        set({
            isQuizMode: false,
            currentQuestion: null,
            questionIndex: 0,
            totalQuestions: 0,
            results: [],
            userAnswer: [],
            startTime: null,
            showResult: false,
        });
    },

    submitAnswer: () => {
        const state = get();
        const { currentQuestion, userAnswer, startTime, results, score } = state;

        if (!currentQuestion || !startTime) return;

        const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(currentQuestion.correctAnswer);
        const timeTaken = Date.now() - startTime;

        const result: QuizResult = {
            questionId: currentQuestion.id,
            userAnswer,
            isCorrect,
            timeTaken,
        };

        set({
            results: [...results, result],
            showResult: true,
            score: isCorrect ? score + 1 : score,
        });
    },

    nextQuestion: () => {
        const state = get();
        const { questionIndex, totalQuestions } = state;

        if (questionIndex + 1 >= totalQuestions) {
            // Quiz finished
            set({ showResult: true });
        } else {
            set({
                questionIndex: questionIndex + 1,
                userAnswer: [],
                startTime: Date.now(),
                showResult: false,
            });
        }
    },

    toggleNodeInAnswer: (nodeId) => {
        const state = get();
        const { userAnswer, currentQuestion } = state;

        if (!currentQuestion) return;

        // For order-based questions, add to end
        if (currentQuestion.type.includes('order') || currentQuestion.type === 'shortest_path') {
            if (userAnswer.includes(nodeId)) {
                // Remove from answer
                set({ userAnswer: userAnswer.filter(id => id !== nodeId) });
            } else {
                set({ userAnswer: [...userAnswer, nodeId] });
            }
        } else {
            // Toggle selection
            if (userAnswer.includes(nodeId)) {
                set({ userAnswer: userAnswer.filter(id => id !== nodeId) });
            } else {
                set({ userAnswer: [...userAnswer, nodeId] });
            }
        }
    },

    clearAnswer: () => {
        set({ userAnswer: [] });
    },
}));
