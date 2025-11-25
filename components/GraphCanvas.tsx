import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink, NodeType } from '../types';
import { NODE_COLORS } from '../constants';

interface GraphCanvasProps {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
  width?: number;
  height?: number;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ data, onNodeClick, width = 800, height = 600 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  // Helper to get color
  const getNodeColor = (type: string) => {
    return NODE_COLORS[type as NodeType] || NODE_COLORS.UNKNOWN;
  };

  // Drag behavior definition
  const drag = (simulation: d3.Simulation<GraphNode, GraphLink>) => {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag<any, any>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Create a container group for zooming
    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Initialize Simulation
    const simulation = d3.forceSimulation<GraphNode, GraphLink>(data.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(data.links).id((d) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));
    
    simulationRef.current = simulation;

    // Define arrow markers for directed edges
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28) // Offset to not overlap node
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#6b7280");

    // Draw Links
    const link = g.append("g")
      .attr("stroke", "#4b5563")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)");

    // Link Labels
    const linkLabel = g.append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(data.links)
      .join("text")
      .text(d => d.label)
      .attr("font-size", "10px")
      .attr("fill", "#9ca3af")
      .attr("text-anchor", "middle")
      .attr("dy", -5);

    // Draw Nodes
    const node = g.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", 20)
      .attr("fill", d => getNodeColor(d.type))
      .attr("cursor", "pointer")
      .call(drag(simulation));

    node.on('click', (event, d) => {
      event.stopPropagation(); // Prevent zoom click
      onNodeClick(d);
    });

    node.append("title")
      .text(d => `${d.label} (${d.type})`);

    // Node Labels
    const label = g.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .attr("dx", 0)
      .attr("dy", 32)
      .text(d => d.label)
      .attr("font-size", "12px")
      .attr("fill", "#e5e7eb")
      .attr("text-anchor", "middle")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)");


    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      linkLabel
        .attr("x", d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr("y", d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);
      
      label
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);
    });

    return () => {
      simulation.stop();
    };
  }, [data, width, height, onNodeClick]);

  return (
    <div className="w-full h-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-2xl relative">
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
      />
      <div className="absolute bottom-4 right-4 text-xs text-gray-500 bg-black/50 p-2 rounded pointer-events-none">
        按住左键拖动节点 • 滚轮缩放 • 点击节点查看详情
      </div>
    </div>
  );
};

export default GraphCanvas;
