import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CognitiveObject, CognitiveType } from '../types';

interface Props {
  objects: CognitiveObject[];
  onNodeClick?: (node: CognitiveObject) => void;
}

const typeColors: Record<string, string> = {
  [CognitiveType.FAIT]: '#3b82f6', // blue
  [CognitiveType.HYPOTHESE]: '#eab308', // yellow
  [CognitiveType.QUESTION]: '#a855f7', // purple
  [CognitiveType.CONTRAINTE]: '#ef4444', // red
  [CognitiveType.OBJECTIF]: '#22c55e', // green
  [CognitiveType.DECISION]: '#14b8a6', // teal
  [CognitiveType.MODELE]: '#f97316', // orange
  [CognitiveType.DAG_ROOT]: '#ffffff', // white (Root)
  [CognitiveType.TASK]: '#6366f1', // indigo (Main Task)
  [CognitiveType.MORSEL]: '#f43f5e', // rose (Atomic Unit)
  [CognitiveType.DEPENDENCY]: '#94a3b8', // slate
  'default': '#94a3b8'
};

const CognitiveVisualizer: React.FC<Props> = ({ objects, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [layoutMode, setLayoutMode] = useState<'FORCE' | 'DAG'>('FORCE');

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

  // Helper to compute DAG levels (simple BFS for hierarchy)
  const computeDagLevels = (nodes: any[], links: any[]) => {
      const levels: Record<string, number> = {};
      const incomingCount: Record<string, number> = {};
      
      nodes.forEach(n => {
          levels[n.id] = 0;
          incomingCount[n.id] = 0;
      });

      links.forEach(l => {
          const targetId = typeof l.target === 'object' ? l.target.id : l.target;
          if (incomingCount[targetId] !== undefined) incomingCount[targetId]++;
      });

      const queue = nodes.filter(n => incomingCount[n.id] === 0);
      
      while(queue.length > 0) {
          const node = queue.shift();
          const currentLevel = levels[node.id];
          
          const outgoing = links.filter(l => (typeof l.source === 'object' ? l.source.id : l.source) === node.id);
          outgoing.forEach(link => {
             const targetId = typeof link.target === 'object' ? link.target.id : link.target;
             if (levels[targetId] < currentLevel + 1) {
                 levels[targetId] = currentLevel + 1;
                 queue.push(nodes.find(n => n.id === targetId));
             }
          });
      }
      return levels;
  };

  // D3 Logic
  useEffect(() => {
    if (!objects || objects.length === 0 || !svgRef.current) return;
    
    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    // Prepare data
    const nodes = objects.map(o => ({ ...o }));
    const links: any[] = [];
    
    nodes.forEach((node, i) => {
        if (node.relations && node.relations.length > 0) {
            node.relations.forEach(relId => {
                const target = nodes.find(n => n.id === relId || n.nom === relId);
                if (target) links.push({ source: node.id, target: target.id });
            });
        } else if (i > 0 && layoutMode === 'FORCE') {
           links.push({ source: nodes[i-1].id, target: node.id });
        }
    });

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(layoutMode === 'DAG' ? 60 : 80))
      .force("charge", d3.forceManyBody().strength(layoutMode === 'DAG' ? -200 : -300))
      .force("collide", d3.forceCollide().radius(30).strength(0.7));

    if (layoutMode === 'FORCE') {
        simulation.force("center", d3.forceCenter(width / 2, height / 2));
    } else {
        const levels = computeDagLevels(nodes, links);
        const maxLevel = Math.max(...Object.values(levels)) || 1;
        const levelWidth = (width - 100) / (maxLevel + 1);

        simulation.force("x", d3.forceX((d: any) => {
            const level = levels[d.id] || 0;
            return 50 + (level * levelWidth);
        }).strength(1));
        
        simulation.force("y", d3.forceY(height / 2).strength(0.15));
    }

    // Arrow marker
    svg.append("defs").selectAll("marker")
        .data(["end"])
        .enter().append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 22)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#64748b");

    // Draw Links
    const link = svg.append("g")
      .attr("stroke", "#64748b")
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
      .style("cursor", "pointer")
      .on("click", (event, d: any) => {
          event.stopPropagation();
          if (onNodeClick) onNodeClick(d);
      })
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
      .attr("r", (d) => layoutMode === 'DAG' ? 18 : 8 + (d.poids * 15))
      .attr("fill", (d) => {
          const type = d.type.toLowerCase();
          const match = Object.keys(typeColors).find(key => type.includes(key));
          return match ? typeColors[match] : typeColors['default'];
      })
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2)
      .attr("class", "hover:stroke-cyan-400 transition-colors shadow-lg");

    // Labels
    node.append("text")
      .text(d => d.nom.substring(0, 15))
      .attr("x", 20)
      .attr("y", 5)
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", "11px")
      .attr("fill", "#cbd5e1")
      .attr("font-weight", "bold")
      .style("pointer-events", "none")
      .style("text-shadow", "0px 1px 3px rgba(0,0,0,0.8)");

    // Type Badge
    node.append("text")
      .text(d => d.type.substring(0, 4).toUpperCase())
      .attr("x", -8)
      .attr("y", 3)
      .attr("font-family", "JetBrains Mono")
      .attr("font-size", "7px")
      .attr("fill", "rgba(0,0,0,0.6)")
      .attr("font-weight", "bold")
      .style("pointer-events", "none");

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
  }, [objects, dimensions, layoutMode, onNodeClick]);

  if (objects.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-numtema-muted opacity-30 gap-4">
              <span className="font-mono text-xs">AWAITING COGNITIVE INPUT...</span>
          </div>
      )
  }

  return (
    <div ref={wrapperRef} className="w-full h-full bg-numtema-bg/30 relative overflow-hidden group">
        <div className="absolute top-2 left-2 flex gap-4 items-center z-10">
            <span className="text-[10px] font-mono text-numtema-primary opacity-50 group-hover:opacity-100 transition-opacity">
                LAYOUT :: {layoutMode}
            </span>
            <button 
                onClick={() => setLayoutMode(prev => prev === 'FORCE' ? 'DAG' : 'FORCE')}
                className="text-[10px] font-mono border border-numtema-border bg-numtema-bg/80 px-2 py-1 rounded text-numtema-muted hover:text-white hover:border-numtema-primary transition-all"
            >
                TOGGLE {layoutMode === 'FORCE' ? 'DAG' : 'FORCE'}
            </button>
        </div>
        <div className="absolute top-2 right-2 text-[10px] text-numtema-muted opacity-40 z-0 pointer-events-none">
            CLICK NODE TO DRILL DOWN
        </div>
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full block" />
    </div>
  );
};

export default CognitiveVisualizer;