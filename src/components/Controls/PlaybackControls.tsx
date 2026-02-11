import React, { useEffect, useRef } from 'react';
import { useAlgorithmStore } from '../../store/algorithmStore';

export const PlaybackControls: React.FC = () => {
    const {
        steps,
        currentStepIndex,
        isPlaying,
        speed,
        play,
        pause,
        stepForward,
        stepBackward,
        jumpToStart,
        jumpToEnd,
        setSpeed,
    } = useAlgorithmStore();

    const timerRef = useRef<number | null>(null);

    // Auto-step when playing
    useEffect(() => {
        if (isPlaying && steps.length > 0) {
            timerRef.current = window.setInterval(() => {
                stepForward();
            }, 1000 / speed);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isPlaying, speed, stepForward, steps.length]);

    // Stop playing when reaching end
    useEffect(() => {
        if (currentStepIndex >= steps.length - 1 && isPlaying) {
            pause();
        }
    }, [currentStepIndex, steps.length, isPlaying, pause]);

    const hasSteps = steps.length > 0;
    const canStepBack = hasSteps && currentStepIndex >= 0;
    const canStepForward = hasSteps && currentStepIndex < steps.length - 1;

    const speedOptions = [0.5, 1, 2, 5];

    return (
        <div className="playback-controls">
            <button
                className="playback-btn"
                onClick={jumpToStart}
                disabled={!canStepBack}
                title="Jump to start"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="19 20 9 12 19 4 19 20" />
                    <line x1="5" y1="19" x2="5" y2="5" />
                </svg>
            </button>

            <button
                className="playback-btn"
                onClick={stepBackward}
                disabled={!canStepBack}
                title="Step backward"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="19 20 9 12 19 4 19 20" />
                </svg>
            </button>

            <button
                className="playback-btn play-btn"
                onClick={isPlaying ? pause : play}
                disabled={!hasSteps || currentStepIndex >= steps.length - 1}
                title={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                )}
            </button>

            <button
                className="playback-btn"
                onClick={stepForward}
                disabled={!canStepForward}
                title="Step forward"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 4 15 12 5 20 5 4" />
                </svg>
            </button>

            <button
                className="playback-btn"
                onClick={jumpToEnd}
                disabled={!canStepForward}
                title="Jump to end"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 4 15 12 5 20 5 4" />
                    <line x1="19" y1="5" x2="19" y2="19" />
                </svg>
            </button>

            <div className="speed-control">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Speed:</span>
                <select
                    className="form-select"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value) as 0.5 | 1 | 2 | 5)}
                    style={{ padding: '4px 8px', minWidth: '60px' }}
                >
                    {speedOptions.map((s) => (
                        <option key={s} value={s}>
                            {s}x
                        </option>
                    ))}
                </select>
            </div>

            <div className="step-counter">
                {hasSteps ? (
                    <>Step {currentStepIndex + 1} / {steps.length}</>
                ) : (
                    'No steps'
                )}
            </div>
        </div>
    );
};
