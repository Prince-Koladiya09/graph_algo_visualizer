import React, { useMemo } from 'react';
import { Vector3 } from 'three';
import { Text, Line } from '@react-three/drei';
import { EdgeState } from '../../types';

interface Graph3DEdgeProps {
    sourcePos: [number, number, number];
    targetPos: [number, number, number];
    directed: boolean;
    weight?: number;
    state?: EdgeState;
}

// Color mapping for edge states
const getEdgeColor = (state?: EdgeState): string => {
    if (!state) return '#475569'; // default dark gray

    switch (state) {
        case 'examining':
            return '#fbbf24'; // yellow
        case 'in_solution':
            return '#8b5cf6'; // purple
        case 'rejected':
            return '#ef4444'; // red
        case 'unexamined':
        default:
            return '#475569'; // gray
    }
};

export const Graph3DEdge: React.FC<Graph3DEdgeProps> = ({
    sourcePos,
    targetPos,
    directed,
    weight,
    state
}) => {
    const color = getEdgeColor(state);

    // Calculate edge direction and midpoint
    const [start, end, midpoint] = useMemo(() => {
        const s = new Vector3(...sourcePos);
        const t = new Vector3(...targetPos);
        const mid = new Vector3().lerpVectors(s, t, 0.5);
        return [s, t, mid];
    }, [sourcePos, targetPos]);

    return (
        <group>
            {/* Edge line using Line from drei - much simpler! */}
            <Line
                points={[[start.x, start.y, start.z], [end.x, end.y, end.z]]}
                color={color}
                lineWidth={2}
            />

            {/* Arrow for directed edges */}
            {directed && (
                <mesh
                    position={[
                        end.x - (end.x - start.x) * 0.08,
                        end.y - (end.y - start.y) * 0.08,
                        end.z - (end.z - start.z) * 0.08
                    ]}
                    rotation={[
                        0,
                        Math.atan2(end.x - start.x, end.z - start.z),
                        0
                    ]}
                >
                    <coneGeometry args={[0.1, 0.2, 8]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            )}

            {/* Weight label */}
            {weight !== undefined && (
                <Text
                    position={[midpoint.x, midpoint.y + 0.3, midpoint.z]}
                    fontSize={0.2}
                    color="#e2e8f0"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.01}
                    outlineColor="#000000"
                >
                    {weight}
                </Text>
            )}
        </group>
    );
};
