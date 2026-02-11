import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import { useGraphStore } from '../../store/graphStore';
import { useAlgorithmStore } from '../../store/algorithmStore';
import { Graph3DNode } from './Graph3DNode';
import { Graph3DEdge } from './Graph3DEdge';

export const Graph3DCanvas: React.FC = () => {
    const { graph } = useGraphStore();
    const { nodeStates, edgeStates, currentStepIndex } = useAlgorithmStore();

    // Convert 2D positions to 3D (map x,y to x,z plane, y becomes height)
    const get3DPosition = (node: { x: number; y: number }): [number, number, number] => {
        // Scale down for better viewing
        const scale = 0.01;
        return [
            (node.x - 400) * scale, // center x around 0
            0,                      // keep nodes on same plane initially
            (node.y - 300) * scale  // center z around 0
        ];
    };

    return (
        <div className="canvas-container">
            <Canvas>
                {/* Camera */}
                <PerspectiveCamera makeDefault position={[0, 8, 8]} />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -5]} intensity={0.5} />

                {/* Controls */}
                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={3}
                    maxDistance={50}
                />

                {/* Grid helper */}
                <Grid
                    args={[20, 20]}
                    cellSize={0.5}
                    cellThickness={0.5}
                    cellColor="#6366f1"
                    sectionSize={2}
                    sectionThickness={1}
                    sectionColor="#8b5cf6"
                    fadeDistance={25}
                    fadeStrength={1}
                    followCamera={false}
                    infiniteGrid
                />

                {/* Edges (render first so they appear behind nodes) */}
                {graph.edges.map((edge) => {
                    const sourceNode = graph.nodes.find(n => n.id === edge.source);
                    const targetNode = graph.nodes.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;

                    const sourcePos = get3DPosition(sourceNode);
                    const targetPos = get3DPosition(targetNode);
                    const edgeState = currentStepIndex >= 0 ? edgeStates.get(edge.id) : undefined;

                    return (
                        <Graph3DEdge
                            key={edge.id}
                            sourcePos={sourcePos}
                            targetPos={targetPos}
                            directed={graph.directed}
                            weight={graph.weighted ? edge.weight : undefined}
                            state={edgeState}
                        />
                    );
                })}

                {/* Nodes */}
                {graph.nodes.map((node) => {
                    const position = get3DPosition(node);
                    const nodeState = currentStepIndex >= 0 ? nodeStates.get(node.id) : undefined;

                    return (
                        <Graph3DNode
                            key={node.id}
                            position={position}
                            label={node.label}
                            state={nodeState}
                        />
                    );
                })}
            </Canvas>

            {/* Info overlay */}
            <div className="canvas-3d-info">
                <p>🖱️ Drag to rotate • Scroll to zoom • Right-click drag to pan</p>
            </div>
        </div>
    );
};
