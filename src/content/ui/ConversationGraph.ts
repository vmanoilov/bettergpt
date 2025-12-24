/**
 * Conversation Graph Visualizer
 * 
 * Creates an interactive visualization of conversation relationships using D3.js
 * 
 * Features:
 * - Node-link diagram showing conversations and their connections
 * - Different colors for different link types (fork, continuation, reference)
 * - Zoom and pan controls
 * - Click nodes to view conversation details
 * - Hover to show preview
 */

import * as d3 from 'd3';
import type { Conversation, ConversationLink } from '../types';
import type { ConversationGraph } from '../../managers/conversation-link-manager';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  conversation: Conversation;
  x?: number;
  y?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  link: ConversationLink;
}

export interface GraphVisualizerOptions {
  width?: number;
  height?: number;
  onNodeClick?: (conversation: Conversation) => void;
  onNodeHover?: (conversation: Conversation | null) => void;
}

export class ConversationGraphVisualizer {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private simulation: d3.Simulation<GraphNode, GraphLink> | null = null;
  private options: Required<GraphVisualizerOptions>;

  constructor(container: HTMLElement, options: GraphVisualizerOptions = {}) {
    this.container = container;
    this.options = {
      width: options.width || 800,
      height: options.height || 600,
      onNodeClick: options.onNodeClick || (() => {}),
      onNodeHover: options.onNodeHover || (() => {}),
    };
  }

  /**
   * Render the conversation graph
   */
  render(graph: ConversationGraph): void {
    // Clear existing visualization
    this.clear();

    // Prepare data for D3
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Convert graph to D3 format
    for (const [id, node] of graph.nodes) {
      nodes.push({
        id,
        conversation: node.conversation,
      });

      // Add outgoing links
      for (const link of node.links.outgoing) {
        links.push({
          source: link.sourceId,
          target: link.targetId,
          link,
        });
      }
    }

    if (nodes.length === 0) {
      this.showEmptyState();
      return;
    }

    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.options.width)
      .attr('height', this.options.height)
      .style('border', '1px solid #e5e7eb')
      .style('border-radius', '8px')
      .style('background', '#fafafa');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    this.svg.call(zoom);

    // Create container group for zooming
    const g = this.svg.append('g');

    // Create arrow markers for directed links
    const defs = this.svg.append('defs');
    
    ['fork', 'continuation', 'reference'].forEach(type => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', this.getLinkColor(type as any));
    });

    // Create force simulation
    this.simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(this.options.width / 2, this.options.height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => this.getLinkColor(d.link.type))
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', d => `url(#arrow-${d.link.type})`);

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(this.drag(this.simulation));

    // Add circles
    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => this.getNodeColor(d.conversation))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add labels
    node.append('text')
      .text(d => this.truncateTitle(d.conversation.title))
      .attr('x', 25)
      .attr('y', 5)
      .style('font-size', '12px')
      .style('font-family', 'sans-serif')
      .style('pointer-events', 'none');

    // Add tooltips
    node.append('title')
      .text(d => this.getTooltipText(d.conversation));

    // Add event handlers
    node.on('click', (event, d) => {
      event.stopPropagation();
      this.options.onNodeClick(d.conversation);
    });

    node.on('mouseenter', (event, d) => {
      this.options.onNodeHover(d.conversation);
    });

    node.on('mouseleave', () => {
      this.options.onNodeHover(null);
    });

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);

      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });
  }

  /**
   * Get color for link based on type
   */
  private getLinkColor(type: 'fork' | 'continuation' | 'reference'): string {
    switch (type) {
      case 'fork':
        return '#3b82f6'; // Blue
      case 'continuation':
        return '#10b981'; // Green
      case 'reference':
        return '#8b5cf6'; // Purple
      default:
        return '#6b7280'; // Gray
    }
  }

  /**
   * Get color for node based on conversation properties
   */
  private getNodeColor(conversation: Conversation): string {
    if (conversation.isFavorite) {
      return '#fbbf24'; // Yellow/Gold for favorites
    }
    if (conversation.isArchived) {
      return '#9ca3af'; // Gray for archived
    }
    return '#60a5fa'; // Blue for regular
  }

  /**
   * Truncate title for display
   */
  private truncateTitle(title: string, maxLength: number = 30): string {
    if (title.length <= maxLength) {
      return title;
    }
    return title.substring(0, maxLength - 3) + '...';
  }

  /**
   * Get tooltip text for conversation
   */
  private getTooltipText(conversation: Conversation): string {
    const parts = [
      `Title: ${conversation.title}`,
      `Model: ${conversation.model}`,
      `Messages: ${conversation.messages.length}`,
      `Created: ${new Date(conversation.createdAt).toLocaleDateString()}`,
    ];

    if (conversation.isFavorite) {
      parts.push('⭐ Favorite');
    }
    if (conversation.isArchived) {
      parts.push('📦 Archived');
    }

    return parts.join('\n');
  }

  /**
   * Drag behavior for nodes
   */
  private drag(simulation: d3.Simulation<GraphNode, GraphLink>) {
    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag<SVGGElement, GraphNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  /**
   * Show empty state when no conversations
   */
  private showEmptyState(): void {
    const div = document.createElement('div');
    div.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      font-family: sans-serif;
    `;
    div.textContent = 'No conversation links to display';
    this.container.appendChild(div);
  }

  /**
   * Clear the visualization
   */
  clear(): void {
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
    this.container.innerHTML = '';
    this.svg = null;
  }

  /**
   * Resize the visualization
   */
  resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;

    if (this.svg) {
      this.svg
        .attr('width', width)
        .attr('height', height);

      if (this.simulation) {
        this.simulation.force('center', d3.forceCenter(width / 2, height / 2));
        this.simulation.alpha(0.3).restart();
      }
    }
  }

  /**
   * Destroy the visualizer
   */
  destroy(): void {
    this.clear();
  }
}
