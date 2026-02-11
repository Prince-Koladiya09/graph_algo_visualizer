import React, { useRef, useState } from 'react';
import { Mesh } from 'three';
import { Text } from '@react-three/drei';
import { NodeState } from '../../types';

interface Graph3DNodeProps {
    position: [number, number, number];
    label: string;
    state?: NodeState;
}

// Color mapping for node states
const getNodeColor = (state?: NodeState): string => {
    if (!state) return '#64748b'; // default gray

    switch (state) {
        case 'current':
            return '#fbbf24'; // yellow
        case 'visiting':
            return '#3b82f6'; // blue
        case 'visited':
            return '#10b981'; // green
        case 'in_solution':
            return '#8b5cf6'; // purple
        case 'unvisited':
        default:
            return '#64748b'; // gray
    }
};

export const Graph3DNode: React.FC<Graph3DNodeProps> = ({ position, label, state }) => {
    const meshRef = useRef<Mesh>(null);
    const [hovered, setHovered] = useState(false);

    const color = getNodeColor(state);
    const scale = hovered ? 1.2 : 1;

    return (
        <group position={position}>
            {/* Node sphere */}
            <mesh
                ref={meshRef}
                scale={scale}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.2}
                    roughness={0.3}
                    metalness={0.5}
                />
            </mesh>

            {/* Label (billboard - always faces camera) */}
            <Text
                position={[0, 0.5, 0]}
                fontSize={0.3}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000000"
            >
                {label}
            </Text>

            {/* Glow effect when hovered or in special state */}
            {(hovered || state === 'current') && (
                <mesh scale={1.3}>
                    <sphereGeometry args={[0.3, 32, 32]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.2}
                    />
                </mesh>
            )}
        </group>
    );
};
