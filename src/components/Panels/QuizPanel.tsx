import React from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useQuizStore, QuizType } from '../../store/quizStore';

export const QuizPanel: React.FC = () => {
    const { graph } = useGraphStore();
    const {
        isQuizMode,
        currentQuestion,
        questionIndex,
        totalQuestions,
        userAnswer,
        showResult,
        score,
        results,
        startQuiz,
        endQuiz,
        submitAnswer,
        clearAnswer,
    } = useQuizStore();

    const handleStartQuiz = (type: QuizType) => {
        startQuiz(type, graph);
    };

    if (!isQuizMode) {
        return (
            <div className="panel">
                <div className="panel-title">Quiz Mode 🎯</div>
                <div className="panel-content">
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        Test your knowledge of graph algorithms!
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleStartQuiz('bfs_order')}
                            disabled={graph.nodes.length < 3}
                            style={{ width: '100%', justifyContent: 'flex-start' }}
                        >
                            📊 BFS Order Challenge
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleStartQuiz('dfs_order')}
                            disabled={graph.nodes.length < 3}
                            style={{ width: '100%', justifyContent: 'flex-start' }}
                        >
                            🔍 DFS Order Challenge
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleStartQuiz('shortest_path')}
                            disabled={!graph.weighted || graph.nodes.length < 3}
                            style={{ width: '100%', justifyContent: 'flex-start' }}
                        >
                            🛤️ Shortest Path Challenge
                        </button>
                    </div>

                    {graph.nodes.length < 3 && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                            Add at least 3 nodes to start a quiz
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Quiz in progress
    return (
        <div className="panel">
            <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Quiz Mode 🎯</span>
                <button
                    className="btn btn-secondary"
                    onClick={endQuiz}
                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                >
                    Exit
                </button>
            </div>
            <div className="panel-content">
                {/* Progress */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                }}>
                    <span>Question {questionIndex + 1} / {totalQuestions}</span>
                    <span>Score: {score}</span>
                </div>

                {/* Question */}
                {currentQuestion && (
                    <div style={{
                        padding: '12px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        marginBottom: '12px'
                    }}>
                        <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                            {currentQuestion.question}
                        </p>

                        {/* Hints */}
                        <details style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <summary style={{ cursor: 'pointer' }}>💡 Show hints</summary>
                            <ul style={{ marginTop: '4px', paddingLeft: '16px' }}>
                                {currentQuestion.hints.map((hint, i) => (
                                    <li key={i}>{hint}</li>
                                ))}
                            </ul>
                        </details>
                    </div>
                )}

                {/* User Answer Display */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Your answer (click nodes on canvas):
                    </div>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        minHeight: '32px',
                        padding: '8px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '6px'
                    }}>
                        {userAnswer.length === 0 ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                Click nodes to select...
                            </span>
                        ) : (
                            userAnswer.map((nodeId, i) => {
                                const node = graph.nodes.find(n => n.id === nodeId);
                                return (
                                    <span
                                        key={i}
                                        style={{
                                            padding: '2px 8px',
                                            background: 'var(--accent-primary)',
                                            color: 'white',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        {node?.label || nodeId}
                                    </span>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Result Display */}
                {showResult && results.length > 0 && (
                    <div style={{
                        padding: '12px',
                        background: results[results.length - 1].isCorrect
                            ? 'rgba(52, 211, 153, 0.2)'
                            : 'rgba(248, 113, 113, 0.2)',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        borderLeft: `3px solid ${results[results.length - 1].isCorrect ? '#34d399' : '#f87171'}`
                    }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                            {results[results.length - 1].isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                        </div>
                        {!results[results.length - 1].isCorrect && currentQuestion && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Correct answer: {currentQuestion.correctAnswer.map(id =>
                                    graph.nodes.find(n => n.id === id)?.label
                                ).join(' → ')}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="btn-group">
                    <button
                        className="btn btn-secondary"
                        onClick={clearAnswer}
                        disabled={showResult}
                    >
                        Clear
                    </button>
                    {!showResult ? (
                        <button
                            className="btn btn-primary"
                            onClick={submitAnswer}
                            disabled={userAnswer.length === 0}
                            style={{ flex: 1 }}
                        >
                            Submit
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={endQuiz}
                            style={{ flex: 1 }}
                        >
                            Finish Quiz
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
