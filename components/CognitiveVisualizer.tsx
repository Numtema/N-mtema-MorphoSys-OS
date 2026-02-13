import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CognitiveObject, CognitiveType } from '../types';

interface Props {
  objects: CognitiveObject[];
}

const typeColors: Record<string, string> = {
  [CognitiveType.FAIT]: '#3b82f6', // blue
  [CognitiveType.HYPOTHESE]: '#eab308', // yellow
  [CognitiveType.QUESTION]: '#a855f7', // purple
  [CognitiveType.CONTRAINTE]: '#ef4444', // red
  [CognitiveType.OBJECTIF]: '#22c55e', // green
  [CognitiveType.DECISION]: '#14b8a6', // teal
  [CognitiveType.MODELE]: '#f97316', // orange
  'default': '#94a3b8'
};

const CognitiveVisualizer: React.FC<Props> = ({ objects }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const { clientWidth, clientHeight } = wrapperRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };
    
    handleResize(); // Initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // D3 Logic
  useEffect(() => {
    if (!objects || objects.length === 0 || !svgRef.current) return;
    
    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    // Prepare data (shallow copy to prevent mutation issues with React state)
    const nodes = objects.map(o => ({ ...o }));
    
    // Create links based on relations property or implied logic
    const links: any[] = [];
    
    nodes.forEach((node, i) => {
        // Link to explicit relations if they exist
        if (node.relations && node.relations.length > 0) {
            node.relations.forEach(relId => {
                const target = nodes.find(n => n.id === relId || n.nom === relId);
                if (target) links.push({ source: node.id, target: target.id });
            });
        } 
        // Fallback: Link to previous node to create a chain/flow if no explicit relations
        else if (i > 0) {
           links.push({ source: nodes[i-1].id, target: node.id });
        }
    });

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40).strength(0.7));

    // Arrow marker
    svg.append("defs").selectAll("marker")
        .data(["end"])
        .enter().append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#475569");

    // Draw Links
    const link = svg.append("g")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    // Draw Nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Circle background
    node.append("circle")
      .attr("r", (d) => 8 + (d.poids * 15))
      .attr("fill", (d) => {
          // Robust color mapping
          const type = d.type.toLowerCase();
          const match = Object.keys(typeColors).find(key => type.includes(key));
          return match ? typeColors[match] : typeColors['default'];
      })
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer hover:stroke-cyan-400 transition-colors shadow-lg");

    // Labels
    node.append("text")
      .text(d => d.nom.substring(0, 15))
      .attr("x", 16)
      .attr("y", 5)
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", "11px")
      .attr("fill", "#cbd5e1")
      .attr("font-weight", "bold")
      .style("pointer-events", "none")
      .style("text-shadow", "0px 1px 3px rgba(0,0,0,0.8)");

    // Type Badge
    node.append("text")
      .text(d => d.type.substring(0, 3).toUpperCase())
      .attr("x", -6)
      .attr("y", 3)
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", "8px")
      .attr("fill", "rgba(0,0,0,0.5)")
      .style("pointer-events", "none");

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
        simulation.stop();
    };
  }, [objects, dimensions]);

  if (objects.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-numtema-muted opacity-30 gap-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span className="font-mono text-xs">AWAITING COGNITIVE INPUT...</span>
          </div>
      )
  }

  return (
    <div ref={wrapperRef} className="w-full h-full bg-numtema-bg/30 relative overflow-hidden group">
        <div className="absolute top-2 left-2 text-[10px] font-mono text-numtema-primary opacity-50 group-hover:opacity-100 transition-opacity">
            D3.FORCE_LAYOUT :: {dimensions.width}x{dimensions.height}
        </div>
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full block" />
    </div>
  );
};

export default CognitiveVisualizer;