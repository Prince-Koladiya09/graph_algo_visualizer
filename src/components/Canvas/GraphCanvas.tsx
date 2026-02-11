import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGraphStore } from '../../store/graphStore';
import { useAlgorithmStore } from '../../store/algorithmStore';
import { getNode } from '../../core/graph/graphUtils';

const NODE_RADIUS = 24;

export const GraphCanvas: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [edgeStart, setEdgeStart] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [editingEdge, setEditingEdge] = useState<{ edgeId: string; weight: string } | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [spacePressed, setSpacePressed] = useState(false);

    const {
        graph,
        selectedNodeIds,
        selectedEdgeIds,
        currentTool,
        zoom,
        panOffset,
        addNode,
        updateNodePosition,
        addEdge,
        updateEdgeWeight,
        reverseEdgeDirection,
        selectNode,
        selectEdge,
        clearSelection,
        setEditingNode,
        setZoom,
        setPanOffset,
    } = useGraphStore();

    const { nodeStates, edgeStates, currentStepIndex } = useAlgorithmStore();

    // Update dimensions on resize
    useEffect(() => {
        const updateDimensions = () => {
            if (svgRef.current?.parentElement) {
                const rect = svgRef.current.parentElement.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.height });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Detect space key for panning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat) {
                setSpacePressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setSpacePressed(false);
                setIsPanning(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Get screen coordinates from SVG coordinates
    const screenToSVG = useCallback((screenX: number, screenY: number) => {
        if (!svgRef.current) return { x: screenX, y: screenY };
        const rect = svgRef.current.getBoundingClientRect();
        return {
            x: (screenX - rect.left - panOffset.x) / zoom,
            y: (screenY - rect.top - panOffset.y) / zoom,
        };
    }, [zoom, panOffset]);

    // Find node at position
    const findNodeAtPosition = useCallback((x: number, y: number): string | null => {
        for (const node of graph.nodes) {
            const dx = x - node.x;
            const dy = y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= NODE_RADIUS) {
                return node.id;
            }
        }
        return null;
    }, [graph.nodes]);

    // Handle canvas mouse down - for panning
    const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.target !== svgRef.current) return;

        // Middle mouse button or space + left click = pan
        if (e.button === 1 || (e.button === 0 && spacePressed)) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
            return;
        }
    }, [spacePressed, panOffset]);

    // Handle canvas click
    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        if (e.target !== svgRef.current) return;
        if (isPanning) return; // Don't process click if we were panning

        const pos = screenToSVG(e.clientX, e.clientY);

        if (currentTool === 'addNode') {
            addNode(pos.x, pos.y);
        } else if (currentTool === 'select') {
            clearSelection();
        }

        setEdgeStart(null);
        setEditingEdge(null);
    }, [currentTool, addNode, clearSelection, screenToSVG, isPanning]);

    // Handle canvas mouse move
    const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
        // Handle panning
        if (isPanning) {
            e.preventDefault();
            setPanOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            });
            return;
        }

        const pos = screenToSVG(e.clientX, e.clientY);
        setMousePos(pos);

        if (draggingNode) {
            updateNodePosition(
                draggingNode,
                pos.x - dragOffset.x,
                pos.y - dragOffset.y
            );
        }
    }, [isPanning, panStart, draggingNode, dragOffset, screenToSVG, updateNodePosition, setPanOffset]);

    // Handle canvas mouse up - complete edge creation if dragging to a node
    const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        if (edgeStart && currentTool === 'addEdge') {
            const pos = screenToSVG(e.clientX, e.clientY);
            const targetNodeId = findNodeAtPosition(pos.x, pos.y);

            if (targetNodeId && targetNodeId !== edgeStart) {
                addEdge(edgeStart, targetNodeId);
            }
        }

        setDraggingNode(null);
        setEdgeStart(null);
    }, [isPanning, edgeStart, currentTool, screenToSVG, findNodeAtPosition, addEdge]);

    // Handle node mouse down
    const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        const node = getNode(graph, nodeId);
        if (!node) return;

        const pos = screenToSVG(e.clientX, e.clientY);

        if (currentTool === 'addEdge') {
            // Start edge creation - will complete on mouse up over another node
            setEdgeStart(nodeId);
        } else {
            setDraggingNode(nodeId);
            setDragOffset({
                x: pos.x - node.x,
                y: pos.y - node.y,
            });

            if (!e.ctrlKey && !e.metaKey) {
                selectNode(nodeId, false);
            } else {
                selectNode(nodeId, true);
            }
        }
    }, [graph, currentTool, selectNode, screenToSVG]);

    // Handle node mouse up - complete edge if dragging from another node
    const handleNodeMouseUp = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();

        if (edgeStart && edgeStart !== nodeId && currentTool === 'addEdge') {
            addEdge(edgeStart, nodeId);
            setEdgeStart(null);
        }

        setDraggingNode(null);
    }, [edgeStart, currentTool, addEdge]);

    // Handle node double click
    const handleNodeDoubleClick = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        setEditingNode(nodeId);
    }, [setEditingNode]);

    // Handle edge click
    const handleEdgeClick = useCallback((e: React.MouseEvent, edgeId: string) => {
        e.stopPropagation();
        if (!e.ctrlKey && !e.metaKey) {
            selectEdge(edgeId, false);
        } else {
            selectEdge(edgeId, true);
        }
    }, [selectEdge]);

    // Handle edge double click (open editor)
    const handleEdgeDoubleClick = useCallback((e: React.MouseEvent, edgeId: string) => {
        e.stopPropagation();
        const edge = graph.edges.find(ed => ed.id === edgeId);
        if (edge) {
            setEditingEdge({ edgeId, weight: String(edge.weight) });
        }
    }, [graph.edges]);

    // Handle weight click (for direct editing)
    const handleWeightClick = useCallback((e: React.MouseEvent, edgeId: string) => {
        e.stopPropagation();
        const edge = graph.edges.find(ed => ed.id === edgeId);
        if (edge) {
            setEditingEdge({ edgeId, weight: String(edge.weight) });
        }
    }, [graph.edges]);

    // Handle weight change
    const handleWeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (editingEdge) {
            setEditingEdge({ ...editingEdge, weight: e.target.value });
        }
    }, [editingEdge]);

    // Handle weight submit
    const handleWeightSubmit = useCallback(() => {
        if (editingEdge) {
            const weight = parseFloat(editingEdge.weight);
            if (!isNaN(weight) && weight >= 0) {
                updateEdgeWeight(editingEdge.edgeId, weight);
            }
            setEditingEdge(null);
        }
    }, [editingEdge, updateEdgeWeight]);

    // Handle reverse direction
    const handleReverseDirection = useCallback(() => {
        if (editingEdge) {
            reverseEdgeDirection(editingEdge.edgeId);
            setEditingEdge(null);
        }
    }, [editingEdge, reverseEdgeDirection]);

    // Handle key press in modal
    const handleModalKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleWeightSubmit();
        } else if (e.key === 'Escape') {
            setEditingEdge(null);
        }
    }, [handleWeightSubmit]);

    // Calculate edge path
    const getEdgePath = useCallback((sourceId: string, targetId: string): string => {
        const source = getNode(graph, sourceId);
        const target = getNode(graph, targetId);
        if (!source || !target) return '';

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) return '';

        // Shorten path to not overlap with nodes
        const ratio = NODE_RADIUS / dist;
        const startX = source.x + dx * ratio;
        const startY = source.y + dy * ratio;
        const endX = target.x - dx * ratio;
        const endY = target.y - dy * ratio;

        return `M ${startX} ${startY} L ${endX} ${endY}`;
    }, [graph]);

    // Get edge midpoint for weight label
    const getEdgeMidpoint = useCallback((sourceId: string, targetId: string) => {
        const source = getNode(graph, sourceId);
        const target = getNode(graph, targetId);
        if (!source || !target) return { x: 0, y: 0 };
        return {
            x: (source.x + target.x) / 2,
            y: (source.y + target.y) / 2 - 10,
        };
    }, [graph]);

    // Get node state class
    const getNodeStateClass = (nodeId: string): string => {
        if (currentStepIndex >= 0) {
            const state = nodeStates.get(nodeId);
            if (state) return `node-${state}`;
        }
        return 'node-unvisited';
    };

    // Get edge state class
    const getEdgeStateClass = (edgeId: string): string => {
        if (currentStepIndex >= 0) {
            const state = edgeStates.get(edgeId);
            if (state) return `edge-${state}`;
        }
        return 'edge-unexamined';
    };

    // Get edge label info for the modal
    const getEditingEdgeInfo = () => {
        if (!editingEdge) return null;
        const edge = graph.edges.find(e => e.id === editingEdge.edgeId);
        if (!edge) return null;
        const sourceNode = graph.nodes.find(n => n.id === edge.source);
        const targetNode = graph.nodes.find(n => n.id === edge.target);
        return {
            source: sourceNode?.label || edge.source,
            target: targetNode?.label || edge.target,
        };
    };

    const edgeInfo = getEditingEdgeInfo();

    // Handle mouse wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.25, Math.min(4, zoom + delta));

        // Zoom towards mouse position
        if (svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Calculate new pan offset to keep mouse position stable
            const zoomRatio = newZoom / zoom;
            const newPanX = mouseX - (mouseX - panOffset.x) * zoomRatio;
            const newPanY = mouseY - (mouseY - panOffset.y) * zoomRatio;

            setPanOffset({ x: newPanX, y: newPanY });
        }

        setZoom(newZoom);
    }, [zoom, panOffset, setZoom, setPanOffset]);

    // Zoom control functions
    const handleZoomIn = useCallback(() => {
        setZoom(Math.min(4, zoom + 0.25));
    }, [zoom, setZoom]);

    const handleZoomOut = useCallback(() => {
        setZoom(Math.max(0.25, zoom - 0.25));
    }, [zoom, setZoom]);

    const handleZoomReset = useCallback(() => {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
    }, [setZoom, setPanOffset]);

    const handleFitToScreen = useCallback(() => {
        if (graph.nodes.length === 0) return;

        // Calculate bounding box of all nodes
        const minX = Math.min(...graph.nodes.map(n => n.x)) - NODE_RADIUS * 2;
        const maxX = Math.max(...graph.nodes.map(n => n.x)) + NODE_RADIUS * 2;
        const minY = Math.min(...graph.nodes.map(n => n.y)) - NODE_RADIUS * 2;
        const maxY = Math.max(...graph.nodes.map(n => n.y)) + NODE_RADIUS * 2;

        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;

        // Calculate zoom to fit
        const zoomX = (dimensions.width - 40) / graphWidth;
        const zoomY = (dimensions.height - 40) / graphHeight;
        const newZoom = Math.max(0.25, Math.min(2, Math.min(zoomX, zoomY)));

        // Calculate pan offset to center
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const newPanX = dimensions.width / 2 - centerX * newZoom;
        const newPanY = dimensions.height / 2 - centerY * newZoom;

        setZoom(newZoom);
        setPanOffset({ x: newPanX, y: newPanY });
    }, [graph.nodes, dimensions, setZoom, setPanOffset]);

    return (
        <div className="canvas-container">
            <svg
                ref={svgRef}
                className={`graph-canvas ${currentTool} ${isPanning ? 'panning' : ''} ${spacePressed ? 'space-pressed' : ''}`}
                width={dimensions.width}
                height={dimensions.height}
                onClick={handleCanvasClick}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onWheel={handleWheel}
            >
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon
                            points="0 0, 10 3.5, 0 7"
                            className="arrow-marker"
                            fill="currentColor"
                        />
                    </marker>
                    <marker
                        id="arrowhead-solution"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" fill="var(--edge-in-solution)" />
                    </marker>
                </defs>

                <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
                    {/* Edges */}
                    {graph.edges.map((edge) => {
                        const stateClass = getEdgeStateClass(edge.id);
                        const isSelected = selectedEdgeIds.has(edge.id);
                        const midpoint = getEdgeMidpoint(edge.source, edge.target);
                        const isSolution = stateClass.includes('in_solution');

                        return (
                            <g
                                key={edge.id}
                                className={`edge ${stateClass} ${isSelected ? 'selected' : ''}`}
                                onClick={(e) => handleEdgeClick(e, edge.id)}
                                onDoubleClick={(e) => handleEdgeDoubleClick(e, edge.id)}
                            >
                                <path
                                    d={getEdgePath(edge.source, edge.target)}
                                    className="edge-line"
                                    markerEnd={graph.directed ? (isSolution ? 'url(#arrowhead-solution)' : 'url(#arrowhead)') : undefined}
                                />
                                {graph.weighted && (
                                    <g onClick={(e) => handleWeightClick(e, edge.id)} style={{ cursor: 'pointer' }}>
                                        <rect
                                            x={midpoint.x - 15}
                                            y={midpoint.y - 10}
                                            width="30"
                                            height="20"
                                            rx="4"
                                            className="edge-weight-bg"
                                        />
                                        <text
                                            x={midpoint.x}
                                            y={midpoint.y + 4}
                                            className="edge-weight"
                                            textAnchor="middle"
                                        >
                                            {edge.weight}
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    {/* Temporary edge while creating */}
                    {edgeStart && (
                        <line
                            x1={getNode(graph, edgeStart)?.x || 0}
                            y1={getNode(graph, edgeStart)?.y || 0}
                            x2={mousePos.x}
                            y2={mousePos.y}
                            stroke="var(--accent-primary)"
                            strokeWidth="2"
                            strokeDasharray="5 5"
                            pointerEvents="none"
                        />
                    )}

                    {/* Nodes */}
                    {graph.nodes.map((node) => {
                        const stateClass = getNodeStateClass(node.id);
                        const isSelected = selectedNodeIds.has(node.id);
                        const isDragging = draggingNode === node.id;

                        return (
                            <g
                                key={node.id}
                                className={`node ${stateClass} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
                                transform={`translate(${node.x}, ${node.y})`}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                                onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
                            >
                                <circle
                                    r={NODE_RADIUS}
                                    className="node-circle"
                                />
                                <text
                                    className="node-label"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                >
                                    {node.label}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* Edge Editor Modal */}
            {editingEdge && (
                <div
                    className="modal-overlay"
                    onClick={() => setEditingEdge(null)}
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '350px' }}
                    >
                        <div className="modal-title">Edit Edge</div>

                        {edgeInfo && (
                            <div style={{
                                marginBottom: '16px',
                                padding: '8px 12px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                fontSize: '0.9rem'
                            }}>
                                <span style={{ fontWeight: 600 }}>{edgeInfo.source}</span>
                                <span style={{ color: 'var(--text-muted)' }}>→</span>
                                <span style={{ fontWeight: 600 }}>{edgeInfo.target}</span>
                            </div>
                        )}

                        {graph.weighted && (
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label">Weight</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={editingEdge.weight}
                                    onChange={handleWeightChange}
                                    onKeyDown={handleModalKeyPress}
                                    autoFocus
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                        )}

                        {graph.directed && (
                            <button
                                className="btn btn-secondary"
                                onClick={handleReverseDirection}
                                style={{ width: '100%', marginBottom: '16px' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                                    <polyline points="17 1 21 5 17 9" />
                                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                    <polyline points="7 23 3 19 7 15" />
                                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                </svg>
                                Reverse Direction
                            </button>
                        )}

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setEditingEdge(null)}
                            >
                                Cancel
                            </button>
                            {graph.weighted && (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleWeightSubmit}
                                >
                                    Save
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Zoom Controls */}
            <div className="zoom-controls" aria-label="Zoom controls">
                <button
                    className="btn btn-icon zoom-btn"
                    onClick={handleZoomIn}
                    title="Zoom in (+)"
                    aria-label="Zoom in"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                </button>
                <span className="zoom-level" title="Current zoom level">
                    {Math.round(zoom * 100)}%
                </span>
                <button
                    className="btn btn-icon zoom-btn"
                    onClick={handleZoomOut}
                    title="Zoom out (-)"
                    aria-label="Zoom out"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                </button>
                <button
                    className="btn btn-icon zoom-btn"
                    onClick={handleZoomReset}
                    title="Reset zoom (100%)"
                    aria-label="Reset zoom"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                    </svg>
                </button>
                <button
                    className="btn btn-icon zoom-btn"
                    onClick={handleFitToScreen}
                    title="Fit to screen"
                    aria-label="Fit graph to screen"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
