
import React, { useEffect, useRef, useState } from 'react';
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
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Helper to get color: Check custom color first, then type color
  const getNodeColor = (node: GraphNode) => {
    if (node.color) return node.color;
    return NODE_COLORS[node.type] || NODE_COLORS.UNKNOWN;
  };

  // Drag behavior
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

    // --- 0. Data Preparation (Fix for D3 Mutation & Scattering) ---
    // CRITICAL FIX: D3 mutates data (replacing string IDs with object refs). 
    // We must clone the data to prevent polluting the upstream state and causing "disconnected" bugs on re-renders.
    const simulationNodes = data.nodes.map(n => ({ ...n }));
    const simulationLinks = data.links.map(l => ({ ...l }));

    const oldNodes = simulationRef.current?.nodes() || [];
    const oldNodesMap = new Map<string, GraphNode>(oldNodes.map(n => [n.id, n]));

    simulationNodes.forEach(node => {
      const oldNode = oldNodesMap.get(node.id);
      if (oldNode) {
        node.x = oldNode.x;
        node.y = oldNode.y;
        node.vx = oldNode.vx;
        node.vy = oldNode.vy;
      } else if (node.x === undefined || node.y === undefined) {
         node.x = width / 2 + (Math.random() - 0.5) * 50;
         node.y = height / 2 + (Math.random() - 0.5) * 50;
      }
    });

    // --- 1. Definitions (Glow Filters & Gradients) ---
    const defs = svg.append("defs");

    // Glow Filter
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "coloredBlur");

    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Arrow Marker
    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 24) 
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#64748b"); 

    // Grid Pattern
    const pattern = defs.append("pattern")
      .attr("id", "grid")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");
    
    pattern.append("circle")
      .attr("cx", 1)
      .attr("cy", 1)
      .attr("r", 1)
      .attr("fill", "#334155")
      .attr("opacity", 0.5);

    // --- 2. Background ---
    const bgGroup = svg.append("g").attr("class", "background");
    bgGroup.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#grid)");

    // --- 3. Main Container for Zoom ---
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        bgGroup.attr("transform", event.transform); 
      });

    svg.call(zoom).on("dblclick.zoom", null);

    // --- 4. Simulation Setup ---
    const simulation = d3.forceSimulation<GraphNode, GraphLink>(simulationNodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(simulationLinks).id((d) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-500)) 
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05)) 
      .force("collide", d3.forceCollide().radius(35).iterations(2))
      .alpha(1)
      .alphaDecay(0.02); 

    simulationRef.current = simulation;

    // --- 5. Drawing Elements ---

    // Links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(simulationLinks)
      .join("line")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", "url(#arrow)");

    // Particles
    const particleGroup = g.append("g").attr("class", "particles");

    // Link Labels
    const linkLabel = g.append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(simulationLinks)
      .join("text")
      .text(d => d.label)
      .attr("font-size", "9px")
      .attr("fill", "#94a3b8")
      .attr("text-anchor", "middle")
      .attr("dy", -6)
      .style("pointer-events", "none")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.9)");

    // Nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(simulationNodes)
      .join("g")
      .call(drag(simulation));

    // Node: Glow Circle
    node.append("circle")
      .attr("r", 18)
      .attr("fill", d => getNodeColor(d)) // Updated to use color prop
      .attr("fill-opacity", 0.2)
      .style("filter", "url(#glow)");

    // Node: Main Circle
    node.append("circle")
      .attr("r", 12)
      .attr("fill", "#0f172a") 
      .attr("stroke", d => getNodeColor(d)) // Updated to use color prop
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("mouseover", (event, d) => {
        setHoveredNode(d.id);
        
        const connectedNodeIds = new Set<string>();
        connectedNodeIds.add(d.id);
        simulationLinks.forEach(l => {
          const sId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
          const tId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
          if (sId === d.id) connectedNodeIds.add(tId);
          if (tId === d.id) connectedNodeIds.add(sId);
        });

        node.transition().duration(200).style("opacity", n => connectedNodeIds.has(n.id) ? 1 : 0.15);
        link.transition().duration(200).style("opacity", l => {
            const sId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
            const tId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
            return (sId === d.id || tId === d.id) ? 1 : 0.05;
        }).attr("stroke", l => {
            const sId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
            const tId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
            return (sId === d.id || tId === d.id) ? getNodeColor(d) : "#334155";
        });
        linkLabel.transition().duration(200).style("opacity", l => {
           const sId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
            const tId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
            return (sId === d.id || tId === d.id) ? 1 : 0.05;
        });

      })
      .on("mouseout", () => {
        setHoveredNode(null);
        node.transition().duration(200).style("opacity", 1);
        link.transition().duration(200).style("opacity", 0.6).attr("stroke", "#334155");
        linkLabel.transition().duration(200).style("opacity", 1);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick(d);
      });

    // Node: Type Icon/Letter
    node.append("text")
      .text(d => d.type === NodeType.PIPE ? '' : d.type[0])
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .attr("fill", d => getNodeColor(d)) // Updated
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none");

    // Node Labels
    node.append("text")
      .text(d => d.label)
      .attr("dy", 28)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", "11px")
      .attr("font-weight", 500)
      .style("pointer-events", "none")
      .style("text-shadow", "0 2px 4px #000");

    // --- 6. Tick Function ---
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      linkLabel
        .attr("x", d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr("y", d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // --- 7. Particle Animation ---
    const particles = simulationLinks.map(d => ({ link: d, t: Math.random() }));
    
    const particleSelection = particleGroup.selectAll("circle")
      .data(particles)
      .enter().append("circle")
      .attr("r", 2)
      .attr("fill", "#fff");

    const timer = d3.timer((elapsed) => {
      particleSelection
        .attr("cx", d => {
            const source = d.link.source as GraphNode;
            const target = d.link.target as GraphNode;
            d.t += 0.005; 
            if (d.t > 1) d.t = 0;
            return source.x! + (target.x! - source.x!) * d.t;
        })
        .attr("cy", d => {
            const source = d.link.source as GraphNode;
            const target = d.link.target as GraphNode;
            return source.y! + (target.y! - source.y!) * d.t;
        })
        .attr("fill-opacity", d => {
            if (d.t < 0.1) return d.t * 10;
            if (d.t > 0.9) return (1 - d.t) * 10;
            return 1;
        });
    });

    return () => {
      simulation.stop();
      timer.stop();
    };
  }, [data, width, height, onNodeClick]);

  return (
    <div className="w-full h-full bg-[#050911] rounded-lg overflow-hidden border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)_inset] relative group">
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
           <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase">Live System Monitor</span>
        </div>
      </div>
    </div>
  );
};

export default GraphCanvas;
