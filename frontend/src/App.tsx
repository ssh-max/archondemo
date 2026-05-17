// ═══════════════════════════════════════════════════════════════════════
// ARCHON — Pure SVG Azure Architecture Renderer
// Replaces React Flow with boundary-aware SVG that matches
// Microsoft Architecture Center diagram style exactly
// ═══════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react'

const API = ''

// ── Icon CDN map ──────────────────────────────────────────────────────
const ICON_MAP: Record<string, string> = {
  'app-services':'App-Services','function-apps':'Function-Apps',
  'container-instances':'Container-Instances','app-service-plans':'App-Service-Plans',
  'front-doors':'Front-Doors','firewalls':'Firewalls',
  'api-management-services':'API-Management-Services',
  'virtual-networks':'Virtual-Networks',
  'network-security-groups':'Network-Security-Groups',
  'private-link':'Private-Link','ddos-protection-plans':'DDoS-Protection-Plans',
  'dns-zones':'DNS-Zones','key-vaults':'Key-Vaults',
  'azure-ad-b2c':'Azure-AD-B2C',
  'microsoft-defender-for-cloud':'Security-Center',
  'policy':'Policy','azure-cosmos-db':'Azure-Cosmos-DB',
  'cache-redis':'Cache-Redis','storage-accounts':'Storage-Accounts',
  'azure-service-bus':'Service-Bus','event-grid-topics':'Event-Grid-Topics',
  'cognitive-services':'Cognitive-Services','cognitive-search':'Search-Services',
  'log-analytics-workspaces':'Log-Analytics-Workspaces',
  'application-insights':'Application-Insights',
  'resource-groups':'Resource-Groups','subscriptions':'Subscriptions',
  'monitor':'Monitor','alerts':'Alerts',
  'application-gateway':'Application-Gateways',
  'logic-apps':'Logic-Apps','integration-accounts':'Integration-Accounts',
  'container-registry':'Container-Registries',
  'app-gateway':'Application-Gateways',
}
const iconUrl = (id: string) =>
  `https://code.benco.io/icon-collection/azure-icons/${ICON_MAP[id] || 'Cognitive-Services'}.svg`

// ═══════════════════════════════════════════════════════════════════════
// LAYOUT ENGINE
// Converts DiagramJSON into pixel coordinates for SVG rendering
// ═══════════════════════════════════════════════════════════════════════

const BOUNDARY_COLORS: Record<string, { stroke: string; fill: string; labelColor: string }> = {
  internet:        { stroke: '#8a8886', fill: '#f5f5f5',   labelColor: '#444' },
  external:        { stroke: '#D13438', fill: '#fff5f5',   labelColor: '#D13438' },
  subscription:    { stroke: '#0078D4', fill: 'none',      labelColor: '#0078D4' },
  vnet:            { stroke: '#00B4D8', fill: 'none',      labelColor: '#00B4D8' },
  subnet:          { stroke: '#737373', fill: 'none',      labelColor: '#555' },
  resource_group:  { stroke: '#68217A', fill: 'none',      labelColor: '#68217A' },
  'rg-security':   { stroke: '#68217A', fill: 'none',      labelColor: '#68217A' },
  'rg-network':    { stroke: '#F25022', fill: 'none',      labelColor: '#F25022' },
  'rg-compute':    { stroke: '#0078D4', fill: 'none',      labelColor: '#0078D4' },
  'rg-ai':         { stroke: '#107C10', fill: 'none',      labelColor: '#107C10' },
  'rg-data':       { stroke: '#008272', fill: 'none',      labelColor: '#008272' },
  'rg-monitor':    { stroke: '#737373', fill: 'none',      labelColor: '#737373' },
  hub:             { stroke: '#F25022', fill: '#fff8f6',   labelColor: '#F25022' },
}

const EDGE_COLORS: Record<string, { stroke: string; dash: string; label: string }> = {
  sync:      { stroke: '#0078D4', dash: 'none',  label: 'HTTPS' },
  async:     { stroke: '#FBBA00', dash: '8 4',   label: 'Async' },
  msi:       { stroke: '#ECD01E', dash: '4 3',   label: 'MSI'   },
  telemetry: { stroke: '#84278F', dash: '4 3',   label: 'Telemetry' },
  external:  { stroke: '#D13438', dash: '8 4',   label: 'External' },
}

// Node size constants
const NODE_W = 80, NODE_H = 88
const COL_W  = 200  // column width for vertical layout
const TIER_H = 180  // tier height for horizontal layout
const PAD    = 20   // internal padding
const GAP    = 16   // gap between nodes

interface LayoutNode {
  id: string; x: number; y: number; w: number; h: number; data: any
}
interface LayoutBoundary {
  id: string; x: number; y: number; w: number; h: number
  type: string; label: string; dash: string; color: any
}
interface LayoutEdge {
  id: string; x1: number; y1: number; x2: number; y2: number
  midX: number; midY: number; label: string; color: any; type: string
  bend: number
}
interface LayoutResult {
  nodes: LayoutNode[]; boundaries: LayoutBoundary[]
  edges: LayoutEdge[]; totalW: number; totalH: number
}

function computeLayout(diagram: any): LayoutResult {
  const services   = diagram.services   || []
  const boundaries = diagram.boundaries || []
  const connections= diagram.connections|| []

  // Detect layout style from diagram metadata or archetype
  const isVertical = detectVerticalLayout(diagram)

  let nodeMap: Record<string, LayoutNode> = {}
  let boundaryMap: Record<string, LayoutBoundary> = {}

  if (isVertical) {
    // ── VERTICAL COLUMN LAYOUT ─────────────────────────
    // Columns: Internet | Ingress | App | Integration | Data | Hub | Egress
    const COLUMNS = [
      { id: 'internet', label: 'Internet / Users',   types: ['internet', 'external_users'] },
      { id: 'ingress',  label: 'Ingress / DMZ',      types: ['ingress', 'dmz', 'internet_facing'] },
      { id: 'app',      label: 'Application Tier',   types: ['app', 'compute', 'application'] },
      { id: 'integration', label: 'Integration',     types: ['integration', 'messaging'] },
      { id: 'data',     label: 'Data Tier',          types: ['data', 'storage', 'database'] },
      { id: 'hub',      label: 'Hub Shared Services',types: ['hub', 'shared', 'hub_services'] },
      { id: 'security', label: 'Security & Monitor', types: ['security', 'monitor', 'observability'] },
    ]

    const CANVAS_TOP = 140  // leave room for subscription label
    const COL_START_X = 30

    // Assign services to columns by subnet or resource_group hints
    const colServices: Record<string, any[]> = {}
    COLUMNS.forEach(c => { colServices[c.id] = [] })

    services.forEach((svc: any) => {
      const col = assignToColumn(svc, COLUMNS)
      colServices[col].push(svc)
    })

    // Calculate column heights and positions
    COLUMNS.forEach((col, ci) => {
      const svcs = colServices[col.id]
      const colX = COL_START_X + ci * (COL_W + PAD)
      const rows = Math.ceil(svcs.length / 1) // 1 service per row in column
      const colH = Math.max(160, rows * (NODE_H + GAP) + PAD * 2 + 40)

      svcs.forEach((svc: any, si: number) => {
        const nodeX = colX + (COL_W - NODE_W) / 2
        const nodeY = CANVAS_TOP + 60 + si * (NODE_H + GAP)
        nodeMap[svc.id] = { id: svc.id, x: nodeX, y: nodeY, w: NODE_W, h: NODE_H, data: svc }
      })

      // Draw column boundary box
      const colColor = BOUNDARY_COLORS.subnet
      boundaryMap[`col-${col.id}`] = {
        id: `col-${col.id}`, x: colX, y: CANVAS_TOP,
        w: COL_W, h: colH,
        type: 'column', label: col.label,
        dash: '5 3', color: colColor
      }
    })

    // Subscription outer boundary
    const totalW = COL_START_X * 2 + COLUMNS.length * (COL_W + PAD)
    const maxColH = Math.max(...Object.values(boundaryMap).map(b => b.h))
    const totalH = CANVAS_TOP + maxColH + 60

    boundaryMap['subscription'] = {
      id: 'subscription', x: 10, y: 80,
      w: totalW - 20, h: totalH - 80,
      type: 'subscription', label: 'Azure Subscription — Australia East',
      dash: '8 4', color: BOUNDARY_COLORS.subscription
    }

    // Add semantic boundaries from diagram if present
    boundaries.forEach((b: any) => {
      if (!boundaryMap[b.id] && b.type !== 'internet') {
        // overlay RG boundaries on top of columns
        const containedNodes = (b.contains || [])
          .map((sid: string) => nodeMap[sid])
          .filter(Boolean)
        if (containedNodes.length > 0) {
          const xs = containedNodes.map(n => n.x)
          const ys = containedNodes.map(n => n.y)
          const minX = Math.min(...xs) - 12
          const minY = Math.min(...ys) - 28
          const maxX = Math.max(...xs) + NODE_W + 12
          const maxY = Math.max(...ys) + NODE_H + 10
          const btype = b.type || 'resource_group'
          boundaryMap[b.id] = {
            id: b.id, x: minX, y: minY,
            w: maxX - minX, h: maxY - minY,
            type: btype, label: b.label || b.id,
            dash: btype === 'vnet' ? '6 3' : btype === 'subnet' ? '4 2' : '6 3',
            color: BOUNDARY_COLORS[btype] || BOUNDARY_COLORS.resource_group
          }
        }
      }
    })

    const totalW2 = COL_START_X * 2 + COLUMNS.length * (COL_W + PAD)
    const totalH2 = CANVAS_TOP + Math.max(...Object.values(boundaryMap).map(b => b.y + b.h)) + 40

    return buildEdges(connections, nodeMap, boundaryMap, totalW2, totalH2 + 40)

  } else {
    // ── HORIZONTAL TIER LAYOUT ─────────────────────────
    // Tiers: Global Traffic | App Tier | Integration | Data | Security | Observability
    const TIERS = [
      { id: 'global',      label: 'Internet & Global Traffic',  types: ['internet', 'cdn', 'front_door'] },
      { id: 'ingress',     label: 'Security & Ingress',         types: ['ingress', 'waf', 'apim'] },
      { id: 'app',         label: 'Compute / Application',      types: ['app', 'compute'] },
      { id: 'integration', label: 'Integration & Messaging',    types: ['integration', 'messaging'] },
      { id: 'data',        label: 'Data & Storage',             types: ['data', 'storage'] },
      { id: 'security',    label: 'Security & Identity',        types: ['security', 'identity'] },
      { id: 'monitor',     label: 'Observability & Monitoring', types: ['monitor', 'observability'] },
    ]

    const CANVAS_LEFT = 140  // leave room for tier labels
    const TIER_START_Y = 80

    const tierServices: Record<string, any[]> = {}
    TIERS.forEach(t => { tierServices[t.id] = [] })
    services.forEach((svc: any) => {
      const tier = assignToTier(svc, TIERS)
      tierServices[tier].push(svc)
    })

    const canvasW = Math.max(800, Math.max(...TIERS.map(t =>
      tierServices[t.id].length * (NODE_W + GAP))) + CANVAS_LEFT + 40)

    TIERS.forEach((tier, ti) => {
      const svcs = tierServices[tier.id]
      const tierY = TIER_START_Y + ti * (TIER_H + GAP)
      const totalSvcW = svcs.length * (NODE_W + GAP)
      const startX = CANVAS_LEFT + (canvasW - CANVAS_LEFT - totalSvcW) / 2

      svcs.forEach((svc: any, si: number) => {
        const nodeX = startX + si * (NODE_W + GAP)
        const nodeY = tierY + (TIER_H - NODE_H) / 2
        nodeMap[svc.id] = { id: svc.id, x: nodeX, y: nodeY, w: NODE_W, h: NODE_H, data: svc }
      })

      // Tier boundary
      if (svcs.length > 0) {
        boundaryMap[`tier-${tier.id}`] = {
          id: `tier-${tier.id}`, x: CANVAS_LEFT, y: tierY,
          w: canvasW - CANVAS_LEFT - 10, h: TIER_H,
          type: 'subnet', label: tier.label,
          dash: '5 3', color: BOUNDARY_COLORS.subnet
        }
      }
    })

    const totalH = TIER_START_Y + TIERS.length * (TIER_H + GAP) + 40
    return buildEdges(connections, nodeMap, boundaryMap, canvasW, totalH)
  }
}

function detectVerticalLayout(diagram: any): boolean {
  const desc = (diagram.description || '').toLowerCase()
  const title = (diagram.title || '').toLowerCase()
  const svcs  = diagram.services || []
  // Hub-spoke or integration/B2B → vertical
  if (desc.includes('hub') || desc.includes('spoke') || desc.includes('b2b') ||
      desc.includes('integration') || title.includes('integration') ||
      title.includes('hub')) return true
  // Microservices → vertical
  if (svcs.some((s: any) => s.subnet?.includes('microservice'))) return true
  // Multi-region → horizontal
  if (desc.includes('multi-region') || desc.includes('active-active')) return false
  // Data pipeline → horizontal
  if (desc.includes('pipeline') || desc.includes('data platform')) return false
  // Default vertical for enterprise
  return true
}

function assignToColumn(svc: any, cols: any[]): string {
  const rg     = (svc.resource_group || '').toLowerCase()
  const subnet = (svc.subnet || '').toLowerCase()
  const name   = (svc.display_name || '').toLowerCase()
  const icon   = (svc.icon_id || '').toLowerCase()

  if (icon.includes('front-door') || icon.includes('firewall') ||
      icon.includes('ddos') || icon.includes('application-gateway') ||
      subnet.includes('ingress') || subnet.includes('dmz') ||
      subnet.includes('appgw')) return 'ingress'

  if (icon.includes('api-management')) return 'ingress'

  if (icon.includes('app-service') || icon.includes('function') ||
      icon.includes('container') || icon.includes('logic-app') ||
      subnet.includes('app') || subnet.includes('compute') ||
      rg.includes('compute')) return 'app'

  if (icon.includes('service-bus') || icon.includes('event-grid') ||
      icon.includes('event-hub') || icon.includes('integration') ||
      subnet.includes('integration') || subnet.includes('messaging') ||
      rg.includes('integration')) return 'integration'

  if (icon.includes('cosmos') || icon.includes('storage') ||
      icon.includes('redis') || icon.includes('sql') ||
      icon.includes('database') || subnet.includes('data') ||
      rg.includes('data')) return 'data'

  if (icon.includes('key-vault') || icon.includes('defender') ||
      icon.includes('azure-ad') || icon.includes('policy') ||
      rg.includes('security')) return 'security'

  if (icon.includes('monitor') || icon.includes('log-analytics') ||
      icon.includes('application-insights') || icon.includes('alerts') ||
      rg.includes('monitor')) return 'security'

  if (icon.includes('virtual-network') || icon.includes('dns') ||
      icon.includes('private-link') || icon.includes('network-security') ||
      rg.includes('network') || subnet.includes('hub')) return 'hub'

  return 'app' // default
}

function assignToTier(svc: any, tiers: any[]): string {
  const icon = (svc.icon_id || '').toLowerCase()
  const rg   = (svc.resource_group || '').toLowerCase()

  if (icon.includes('front-door') || icon.includes('ddos')) return 'global'
  if (icon.includes('firewall') || icon.includes('application-gateway') ||
      icon.includes('api-management')) return 'ingress'
  if (icon.includes('app-service') || icon.includes('function') ||
      icon.includes('container') || icon.includes('logic-app')) return 'app'
  if (icon.includes('service-bus') || icon.includes('event-grid') ||
      icon.includes('integration')) return 'integration'
  if (icon.includes('cosmos') || icon.includes('storage') ||
      icon.includes('redis') || icon.includes('sql')) return 'data'
  if (icon.includes('key-vault') || icon.includes('defender') ||
      icon.includes('azure-ad') || icon.includes('policy')) return 'security'
  if (icon.includes('monitor') || icon.includes('log-analytics') ||
      icon.includes('insights') || icon.includes('alerts')) return 'monitor'
  return 'app'
}

function buildEdges(
  connections: any[], nodeMap: Record<string, LayoutNode>,
  boundaryMap: Record<string, LayoutBoundary>,
  totalW: number, totalH: number
): LayoutResult {
  const edges: LayoutEdge[] = []
  connections.forEach((conn: any, i: number) => {
    const src = nodeMap[conn.from]
    const tgt = nodeMap[conn.to]
    if (!src || !tgt) return
    const x1 = src.x + src.w / 2
    const y1 = src.y + src.h / 2
    const x2 = tgt.x + tgt.w / 2
    const y2 = tgt.y + tgt.h / 2
    const color = EDGE_COLORS[conn.type] || EDGE_COLORS.sync
    edges.push({
      id: conn.id, x1, y1, x2, y2,
      midX: (x1 + x2) / 2, midY: (y1 + y2) / 2,
      label: conn.label || '', color, type: conn.type || 'sync',
      bend: (i % 3 - 1) * 30
    })
  })
  return {
    nodes: Object.values(nodeMap),
    boundaries: Object.values(boundaryMap),
    edges, totalW, totalH
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SVG RENDERER
// Pure SVG — matches Microsoft Architecture Center style
// ═══════════════════════════════════════════════════════════════════════

function AzureSvgDiagram({
  diagram, activeFlow, onNodeClick, selectedId
}: {
  diagram: any; activeFlow: string; onNodeClick: (svc: any) => void; selectedId?: string
}) {
  const layout = computeLayout(diagram)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; svc: any } | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const svgRef = useRef<SVGSVGElement>(null)
  const isPanning = useRef(false)
  const lastPan = useRef({ x: 0, y: 0 })

  const W = Math.max(layout.totalW, 900)
  const H = Math.max(layout.totalH, 600)

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)))
  }
  function onMouseDown(e: React.MouseEvent) {
    if ((e.target as Element).classList.contains('node-hit')) return
    isPanning.current = true
    lastPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isPanning.current) return
    setPan({ x: e.clientX - lastPan.current.x, y: e.clientY - lastPan.current.y })
  }
  function onMouseUp() { isPanning.current = false }

  const flowOpacity = (conn: any) => {
    if (activeFlow === 'all') return 1
    return conn.data?.flow_group === activeFlow ? 1 : 0.06
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#fff' }}>
      <svg ref={svgRef} width="100%" height="100%"
        viewBox={`${-pan.x/zoom} ${-pan.y/zoom} ${W/zoom} ${H/zoom}`}
        style={{ cursor: isPanning.current ? 'grabbing' : 'grab', display: 'block' }}
        onWheel={onWheel} onMouseDown={onMouseDown}
        onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

        <defs>
          {/* Arrow markers per colour */}
          {Object.entries(EDGE_COLORS).map(([type, cfg]) => (
            <marker key={type} id={`arr-${type}`}
              viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M1 2L8 5L1 8" fill="none"
                stroke={cfg.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </marker>
          ))}
        </defs>

        {/* ── BOUNDARIES ── */}
        {layout.boundaries
          .sort((a, b) => {
            // Render order: subscription first (largest), then vnet, then subnets
            const order: Record<string, number> = { subscription: 0, vnet: 1, subnet: 2, column: 2, resource_group: 3, hub: 2, internet: 2, external: 2 }
            return (order[a.type] || 3) - (order[b.type] || 3)
          })
          .map(b => {
            const bc = b.color || BOUNDARY_COLORS.subnet
            const isSubscription = b.type === 'subscription'
            const isVnet = b.type === 'vnet'
            return (
              <g key={b.id}>
                <rect
                  x={b.x} y={b.y} width={b.w} height={b.h}
                  rx={isSubscription ? 6 : 4}
                  fill={bc.fill || 'none'}
                  stroke={bc.stroke}
                  strokeWidth={isSubscription ? 1.5 : isVnet ? 1.2 : 0.8}
                  strokeDasharray={b.dash}
                />
                {/* Label */}
                <rect x={b.x + 8} y={b.y - 8} width={Math.min(b.label.length * 7 + 10, 260)} height={16} rx={3}
                  fill="#fff"/>
                <text x={b.x + 13} y={b.y + 4}
                  fontSize={isSubscription ? 10 : 9}
                  fontWeight={isSubscription || isVnet ? 700 : 500}
                  fill={bc.labelColor || bc.stroke}
                  fontFamily='"Segoe UI",system-ui,sans-serif'>
                  {b.label}
                </text>
                {/* Tier label on left side for horizontal layout */}
                {b.type === 'subnet' && b.x < 150 && b.h > 100 && (
                  <text
                    x={b.x - 8} y={b.y + b.h / 2}
                    fontSize={9} fill={bc.labelColor || '#555'}
                    fontFamily='"Segoe UI",system-ui,sans-serif'
                    textAnchor="middle"
                    transform={`rotate(-90, ${b.x - 8}, ${b.y + b.h / 2})`}>
                    {b.label}
                  </text>
                )}
              </g>
            )
          })}

        {/* ── EDGES ── */}
        {layout.edges.map(edge => {
          const c = edge.color
          const isActive = activeFlow === 'all' || true // simplified
          const op = isActive ? 1 : 0.07

          // Curved path
          const dx = edge.x2 - edge.x1
          const dy = edge.y2 - edge.y1
          const dist = Math.sqrt(dx * dx + dy * dy)
          const cx = edge.midX + (edge.bend * -dy) / dist
          const cy = edge.midY + (edge.bend * dx) / dist

          return (
            <g key={edge.id} opacity={op}>
              <path
                d={`M ${edge.x1} ${edge.y1} Q ${cx} ${cy} ${edge.x2} ${edge.y2}`}
                fill="none"
                stroke={c.stroke}
                strokeWidth={1.5}
                strokeDasharray={c.dash === 'none' ? undefined : c.dash}
                markerEnd={`url(#arr-${edge.type})`}
              />
              {/* Edge label */}
              {edge.label && (
                <>
                  <rect x={cx - edge.label.length * 3 - 2} y={cy - 8} width={edge.label.length * 6 + 4} height={14} rx={3} fill="rgba(255,255,255,0.92)"/>
                  <text x={cx} y={cy + 2} textAnchor="middle"
                    fontSize={8} fill={c.stroke}
                    fontFamily='"Segoe UI",system-ui,sans-serif'>
                    {edge.label}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {/* ── SERVICE NODES ── */}
        {layout.nodes.map(node => {
          const svc = node.data
          const isSelected = selectedId === svc.id
          const pillarColors: Record<string, string> = {
            Reliability: '#107C10', Security: '#0078D4',
            Performance: '#8764B8', Cost: '#004B1C', Operations: '#737373'
          }
          return (
            <g key={node.id}
              onClick={() => onNodeClick(svc)}
              onMouseEnter={e => setTooltip({ x: node.x + node.w, y: node.y, svc })}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}>
              <className className="node-hit"/>
              {/* Icon container */}
              <rect
                x={node.x + (NODE_W - 48) / 2} y={node.y}
                width={48} height={48} rx={10}
                fill="#fff"
                stroke={isSelected ? '#0078D4' : '#E0E0E0'}
                strokeWidth={isSelected ? 2 : 1.5}
                filter={isSelected ? 'drop-shadow(0 0 4px rgba(0,120,212,0.4))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))'}
              />
              <image
                href={iconUrl(svc.icon_id || 'cognitive-services')}
                x={node.x + (NODE_W - 36) / 2} y={node.y + 6}
                width={36} height={36}
              />
              {/* Service name */}
              <foreignObject x={node.x} y={node.y + 52} width={NODE_W} height={36}>
                <div style={{
                  fontSize: 9, fontWeight: 500, color: '#1a1a1a', textAlign: 'center',
                  lineHeight: 1.3, fontFamily: '"Segoe UI",system-ui,sans-serif',
                  padding: '0 2px', wordBreak: 'break-word'
                }}>
                  {svc.display_name}
                </div>
              </foreignObject>
              {/* WAF pillar dots */}
              {svc.waf_pillars && (
                <g transform={`translate(${node.x + (NODE_W - (svc.waf_pillars.length * 8)) / 2}, ${node.y + 82})`}>
                  {svc.waf_pillars.map((p: string, i: number) => (
                    <circle key={p} cx={i * 8 + 3} cy={3} r={3}
                      fill={pillarColors[p] || '#ccc'} title={p}/>
                  ))}
                </g>
              )}
            </g>
          )
        })}

        {/* ── AZURE LOGO ── */}
        <g transform={`translate(${W - 120}, ${H - 30})`}>
          <rect x={0} y={0} width={8} height={8} fill="#F25022"/>
          <rect x={10} y={0} width={8} height={8} fill="#7FBA00"/>
          <rect x={0} y={10} width={8} height={8} fill="#00A4EF"/>
          <rect x={10} y={10} width={8} height={8} fill="#FFB900"/>
          <text x={22} y={8} fontSize={9} fontWeight={700} fill="#0078D4"
            fontFamily='"Segoe UI",system-ui,sans-serif'>Microsoft</text>
          <text x={22} y={18} fontSize={9} fill="#737373"
            fontFamily='"Segoe UI",system-ui,sans-serif'>Azure</text>
        </g>

        {/* Region badge */}
        <rect x={10} y={H - 26} width={140} height={18} rx={4} fill="#EFF6FF" stroke="#0078D4" strokeWidth={0.5}/>
        <text x={18} y={H - 14} fontSize={9} fill="#0078D4" fontWeight={600}
          fontFamily='"Segoe UI",system-ui,sans-serif'>
          {diagram.region || 'Australia East — Sydney'}
        </text>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: Math.min(tooltip.x * zoom + pan.x + 10, window.innerWidth - 260),
          top: Math.max(tooltip.y * zoom + pan.y, 10),
          background: '#1a1a2e', color: '#fff', borderRadius: 8,
          padding: '10px 14px', fontSize: 11, maxWidth: 240,
          zIndex: 100, pointerEvents: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,.3)',
          lineHeight: 1.7, fontFamily: '"Segoe UI",system-ui,sans-serif'
        }}>
          <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: 12, marginBottom: 4 }}>
            {tooltip.svc.display_name}
          </div>
          <div>SKU: {tooltip.svc.sku}</div>
          <div>RG: {tooltip.svc.resource_group}</div>
          <div>PE: {tooltip.svc.private_endpoint ? '✓ Private endpoint' : '— Public'}</div>
          <div style={{ color: '#86efac', fontWeight: 600 }}>A${tooltip.svc.estimated_cost_aud}/mo</div>
          {tooltip.svc.rationale && (
            <div style={{ color: '#94a3b8', marginTop: 6, fontSize: 10 }}>{tooltip.svc.rationale}</div>
          )}
        </div>
      )}

      {/* Zoom controls */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16, display: 'flex',
        flexDirection: 'column', gap: 4
      }}>
        {[
          { label: '+', action: () => setZoom(z => Math.min(3, z + 0.2)) },
          { label: '⊡', action: () => { setZoom(1); setPan({ x: 0, y: 0 }) } },
          { label: '−', action: () => setZoom(z => Math.max(0.3, z - 0.2)) },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action} style={{
            width: 32, height: 32, borderRadius: 6, border: '1px solid #e0e0e0',
            background: '#fff', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,.1)',
            fontFamily: '"Segoe UI",system-ui,sans-serif'
          }}>{btn.label}</button>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATES — 8 Microsoft reference architectures
// ═══════════════════════════════════════════════════════════════════════

const TEMPLATES = [
  {
    id: 'hub-spoke-enterprise',
    name: 'Enterprise Hub-Spoke Landing Zone',
    icon: '🏢', tag: 'WAF recommended',
    description: 'Full Azure Landing Zone with hub-spoke topology, Azure Firewall, Private DNS, and spoke VNets',
    prompt: 'Enterprise Azure Landing Zone hub-spoke architecture. Hub VNet with Azure Firewall Premium, Azure Bastion, Private DNS Zones, DNS Resolver, VPN Gateway. New spoke VNet peered to hub. Application Gateway v2 + WAF on spoke for internet ingress. All outbound traffic via hub Azure Firewall UDR. Zero-Trust security posture. Australia East primary, Australia Southeast DR. SOC 2 Type II compliance.'
  },
  {
    id: 'b2b-integration',
    name: 'B2B Integration Platform',
    icon: '🔗', tag: 'Event-driven',
    description: 'Enterprise B2B integration with APIM, Logic Apps, Service Bus, and Application Gateway',
    prompt: 'B2B Integration Platform on Azure in new spoke subscription peered to existing hub. Application Gateway v2 WAF for internet-facing ingress. Azure APIM in internal VNet mode for partner API gateway. Logic Apps Standard for B2B workflows and EDI processing. Azure Service Bus Premium for messaging with dead-letter queues. Azure Integration Account for trading partner agreements. Key Vault for certificates. Outbound via hub Azure Firewall. Column-wise layout left-to-right showing traffic flow.'
  },
  {
    id: 'rag-ai-platform',
    name: 'RAG / AI Document Intelligence',
    icon: '🤖', tag: 'AI workload',
    description: 'Retrieval-Augmented Generation with Azure OpenAI, AI Search, Document Intelligence',
    prompt: 'AI Document Intelligence platform with RAG architecture. Azure Application Gateway for ingress. Azure App Service for FastAPI backend. Azure Functions for async document ingestion. Azure AI Document Intelligence for OCR. Azure OpenAI for embeddings and generation. Azure AI Search with hybrid vector + semantic search, per-tenant indexes. Azure Blob Storage ADLS Gen2 for document storage. Azure Cosmos DB for metadata. Azure Cache for Redis for query caching. Azure Service Bus for ingestion queue with DLQ. Key Vault MSI. Zero-Trust. Australia East.'
  },
  {
    id: 'aks-microservices',
    name: 'AKS Microservices Baseline',
    icon: '⚙️', tag: 'Microsoft baseline',
    description: 'AKS baseline architecture per Microsoft reference implementation',
    prompt: 'AKS microservices baseline architecture. Azure Front Door with WAF for global load balancing. AKS cluster with Azure CNI Overlay, Cilium network policy. Application Gateway Ingress Controller. Workload identity with Entra ID. Azure Container Registry with private endpoint. Azure Key Vault Secrets Store CSI driver. Azure Monitor with Container Insights. Log Analytics Workspace. Private cluster — no public API server. Egress via Azure Firewall with FQDN rules. Zone-redundant node pools. Australia East.'
  },
  {
    id: 'web-app-paas',
    name: 'Scalable Web Application (PaaS)',
    icon: '🌐', tag: 'N-Tier',
    description: 'N-Tier web application with App Service, Redis, SQL Database and CDN',
    prompt: 'Scalable N-Tier web application on Azure PaaS. Azure Front Door Standard for global CDN and WAF. Azure App Service P2v3 with staging slots, VNet integration, auto-scale 2-20 instances. Azure Cache for Redis C3 Premium for session and data caching. Azure SQL Database Business Critical with zone redundancy and active geo-replication. Azure Key Vault for secrets with MSI. Application Insights for APM. Log Analytics. Azure AD B2C for customer identity. Horizontal tier layout: CDN → App → Cache → Data. Australia East primary, Southeast DR.'
  },
  {
    id: 'data-platform',
    name: 'Modern Data Platform (Lakehouse)',
    icon: '📊', tag: 'Data-driven',
    description: 'Data lakehouse with ADLS Gen2, Azure Databricks, Synapse Analytics and Power BI',
    prompt: 'Modern data platform lakehouse architecture. Azure Data Factory for ingestion orchestration. Azure Event Hubs for real-time streaming ingestion. Azure Data Lake Storage Gen2 with hierarchical namespace and CMK encryption. Azure Databricks Premium for transformation and ML. Azure Synapse Analytics for SQL serving layer. Azure Purview for data governance and lineage. Azure Analysis Services for semantic model. Power BI Premium for reporting. Azure Key Vault. Log Analytics. Horizontal tier layout: Ingestion → Processing → Storage → Serving → Consumption. Australia East.'
  },
  {
    id: 'multiregion-ha',
    name: 'Multi-Region Active-Active',
    icon: '🌏', tag: 'HA/DR',
    description: 'Active-active multi-region with Traffic Manager, paired regions and geo-replication',
    prompt: 'Multi-region active-active high availability architecture. Azure Front Door Premium for global load balancing with automatic failover. Azure Traffic Manager as DNS-based backup. Identical application stacks in Australia East and Australia Southeast. App Service with zone redundancy in each region. Azure Cosmos DB multi-region writes with strong consistency. Azure SQL Database with active geo-replication. Azure Cache for Redis geo-replication. Azure Service Bus Geo-Disaster Recovery. Azure Blob GRS replication. RTO 5 minutes, RPO 0 (zero data loss). Horizontal tiers showing primary and secondary region side by side.'
  },
  {
    id: 'zero-trust-security',
    name: 'Zero-Trust Security Architecture',
    icon: '🔒', tag: 'Security',
    description: 'Defense-in-depth Zero-Trust with Sentinel, Conditional Access, Defender and PIM',
    prompt: 'Zero-Trust security architecture on Azure. Microsoft Entra ID with Conditional Access policies (device compliance, risk-based, location). Privileged Identity Management (PIM) for JIT access. Microsoft Sentinel SIEM connected to Log Analytics. Microsoft Defender for Cloud with all workload protection plans. Azure Policy with deny assignments enforcing private endpoints and CMK. Key Vault HSM-backed with RBAC. Azure Firewall Premium with IDPS and TLS inspection. DDoS Network Protection Standard. Private endpoints on all PaaS services. NSG flow logs to Traffic Analytics. Microsoft Defender for DevOps. APRA CPS 234 and Essential Eight compliance. Australia East.'
  },
]

// ═══════════════════════════════════════════════════════════════════════
// WAF BAR
// ═══════════════════════════════════════════════════════════════════════
function WafBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3, color: '#444', fontFamily: '"Segoe UI",system-ui,sans-serif' }}>
        <span>{label}</span><span style={{ fontWeight: 600, color }}>{score}/100</span>
      </div>
      <div style={{ height: 5, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 99, transition: 'width .8s ease' }} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════
const SS: React.CSSProperties = { fontFamily: '"Segoe UI",system-ui,sans-serif' }

export default function App() {
  const [diagram, setDiagram] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [activeFlow, setActiveFlow] = useState('all')
  const [rightPanel, setRightPanel] = useState<'waf' | 'cost' | 'prompt' | 'legend'>('legend')
  const [selectedSvc, setSelectedSvc] = useState<any>(null)
  const [prompt, setPrompt] = useState('')
  const [showTemplates, setShowTemplates] = useState(true)
  const [genPrompt, setGenPrompt] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const MSGS = [
    'Analysing requirements...', 'Detecting architecture pattern...',
    'Selecting Azure services...', 'Planning network topology...',
    'Computing layout...', 'Validating WAF pillars...',
    'Estimating costs...', 'Finalising...'
  ]
  const msgIdx = useRef(0)

  async function generate(customPrompt?: string) {
    const p = customPrompt || prompt
    if (!p.trim()) { setError('Please describe your architecture or select a template.'); return }
    setGenPrompt(p)
    setError('')
    setLoading(true)
    setShowTemplates(false)
    setDiagram(null)
    msgIdx.current = 0; setLoadingMsg(MSGS[0])
    const iv = setInterval(() => {
      msgIdx.current = (msgIdx.current + 1) % MSGS.length
      setLoadingMsg(MSGS[msgIdx.current])
    }, 2500)

    try {
      const res = await fetch(`${API}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: p, industry: 'Enterprise', workload: 'Enterprise platform',
          compute: 'PaaS', ha: 'zone-redundant', security: 'zero-trust',
          compliance: [], budget_aud: 10000, region: 'Australia East', timeline: 'Production'
        })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setDiagram(data)
      setRightPanel('waf')
    } catch (e: any) {
      setError(`Generation failed: ${e.message}`)
    } finally {
      clearInterval(iv); setLoading(false)
    }
  }

  async function exportDrawio() {
    if (!diagram) return
    const res = await fetch(`${API}/api/export/drawio`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagram })
    })
    const data = await res.json()
    const blob = new Blob([data.xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = data.filename; a.click()
    URL.revokeObjectURL(url)
  }

  function exportSvg() {
    const svg = document.querySelector('svg')
    if (!svg) return
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'archon-architecture.svg'; a.click()
    URL.revokeObjectURL(url)
  }

  const waf  = diagram?.waf_validation
  const cost = diagram?.cost_estimate
  const totalCost = cost?.total_aud || (diagram?.services || []).reduce(
    (s: number, sv: any) => s + (sv.estimated_cost_aud || 0), 0)
  const pillars = [
    { k: 'reliability', l: 'Reliability', c: '#107C10' },
    { k: 'security',    l: 'Security',    c: '#0078D4' },
    { k: 'performance', l: 'Performance', c: '#8764B8' },
    { k: 'cost',        l: 'Cost',        c: '#004B1C' },
    { k: 'operations',  l: 'Operations',  c: '#737373' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', ...SS, background: '#f8f9fa', overflow: 'hidden' }}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ width: 300, background: '#fff', borderRight: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '2px 0 8px rgba(0,0,0,.04)' }}>

        {/* Header */}
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#0078D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" stroke="white" strokeWidth="1.5" fill="none"/>
                <circle cx="9" cy="9" r="2.5" fill="white"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0078D4' }}>Archon</div>
              <div style={{ fontSize: 9, color: '#888' }}>Azure Architecture AI</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
          {[['templates', '📋 Templates'], ['prompt', '✏️ Prompt']].map(([key, label]) => (
            <button key={key} onClick={() => setShowTemplates(key === 'templates')} style={{
              flex: 1, padding: '9px 0', fontSize: 11,
              fontWeight: (showTemplates ? key === 'templates' : key === 'prompt') ? 600 : 400,
              color: (showTemplates ? key === 'templates' : key === 'prompt') ? '#0078D4' : '#888',
              background: 'none', border: 'none',
              borderBottom: (showTemplates ? key === 'templates' : key === 'prompt') ? '2px solid #0078D4' : '2px solid transparent',
              cursor: 'pointer', ...SS
            }}>{label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px' }}>

          {/* Templates tab */}
          {showTemplates && (
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 10, lineHeight: 1.5 }}>
                Select a Microsoft reference architecture to start with. Archon will generate a complete diagram you can customise.
              </div>
              {TEMPLATES.map(t => (
                <div key={t.id} onClick={() => { setSelectedTemplate(t.id); setPrompt(t.prompt) }}
                  style={{
                    padding: '10px 12px', marginBottom: 8, borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${selectedTemplate === t.id ? '#0078D4' : '#e8e8e8'}`,
                    background: selectedTemplate === t.id ? '#EFF6FF' : '#fff',
                    transition: 'all .15s'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: selectedTemplate === t.id ? '#0078D4' : '#333' }}>{t.name}</div>
                      <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, background: '#e8f0fe', color: '#0078D4' }}>{t.tag}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#666', lineHeight: 1.5 }}>{t.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* Prompt tab */}
          {!showTemplates && (
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8, lineHeight: 1.5 }}>
                Describe your Azure architecture in natural language. Be specific about topology, services, and traffic flows.
              </div>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. Enterprise B2B integration platform deployed to new spoke VNet peered to existing hub. Application Gateway v2 for internet ingress, APIM internal mode, Logic Apps for workflows, Service Bus Premium for messaging. Outbound via hub Azure Firewall. Column-wise layout showing ingress → app → integration → data → hub → egress."
                rows={10}
                style={{
                  width: '100%', padding: '9px 10px', border: '1.5px solid #e0e0e0',
                  borderRadius: 8, fontSize: 11, resize: 'vertical', lineHeight: 1.6,
                  ...SS, outline: 'none', color: '#333', boxSizing: 'border-box'
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#0078D4' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0' }}
              />
              <div style={{ fontSize: 10, color: '#888', marginTop: 6, lineHeight: 1.5 }}>
                💡 Tips: Mention hub-spoke / standalone topology · specify ingress type · list key services · describe traffic flows (inbound/outbound) · state compliance needs
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 8, padding: '9px 12px', fontSize: 11, color: '#c62828', marginTop: 10 }}>{error}</div>
          )}
        </div>

        {/* Generate button */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
          <button onClick={() => generate(showTemplates && selectedTemplate ? TEMPLATES.find(t => t.id === selectedTemplate)?.prompt : undefined)}
            disabled={loading}
            style={{
              width: '100%', padding: '12px 0', fontSize: 13, fontWeight: 700,
              border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#90CAF9' : '#0078D4', color: '#fff',
              transition: 'all .2s', ...SS,
              boxShadow: loading ? 'none' : '0 2px 8px rgba(0,120,212,.3)'
            }}>
            {loading ? `${loadingMsg}` : diagram ? '↺ Regenerate' : '⚡ Generate Architecture'}
          </button>
          {diagram && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={exportDrawio} style={{
                flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 600,
                border: 'none', borderRadius: 6, background: '#107C10', color: '#fff', cursor: 'pointer', ...SS
              }}>↓ draw.io</button>
              <button onClick={exportSvg} style={{
                flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 600,
                border: '1px solid #0078D4', borderRadius: 6, background: '#fff', color: '#0078D4', cursor: 'pointer', ...SS
              }}>↓ SVG</button>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CANVAS ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ height: 46, background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          {diagram && <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{diagram.title}</div>}
          {diagram && (
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              {['all', 'ingestion', 'query', 'security', 'monitoring'].map(f => (
                <button key={f} onClick={() => setActiveFlow(f)} style={{
                  fontSize: 10, padding: '3px 9px', border: '1px solid',
                  borderColor: activeFlow === f ? '#0078D4' : '#ddd', borderRadius: 99,
                  background: activeFlow === f ? '#0078D4' : '#fff',
                  color: activeFlow === f ? '#fff' : '#555',
                  cursor: 'pointer', fontWeight: activeFlow === f ? 600 : 400,
                  transition: 'all .15s', textTransform: 'capitalize', ...SS
                }}>{f}</button>
              ))}
            </div>
          )}
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, position: 'relative' }}>
          {!diagram && !loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
              <div style={{ fontSize: 52, opacity: .08, marginBottom: 16 }}>⬡</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#c0c0c0', marginBottom: 8, ...SS }}>
                Select a template or describe your architecture
              </div>
              <div style={{ fontSize: 12, color: '#d0d0d0', maxWidth: 420, textAlign: 'center', lineHeight: 1.7, ...SS }}>
                Archon renders proper Azure Architecture Center-style diagrams —<br/>
                with subscription boundaries, VNet nesting, subnet boxes,<br/>
                resource group groupings, and hub-spoke column layout
              </div>
            </div>
          )}

          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.95)', zIndex: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #e0e0e0', borderTopColor: '#0078D4', animation: 'spin .8s linear infinite', marginBottom: 14 }} />
              <div style={{ fontSize: 14, color: '#0078D4', fontWeight: 600, ...SS }}>{loadingMsg}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 5, ...SS }}>Claude Sonnet 4.6 · Azure Well-Architected Framework</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {diagram && (
            <AzureSvgDiagram
              diagram={diagram}
              activeFlow={activeFlow}
              onNodeClick={svc => { setSelectedSvc(svc); setRightPanel('waf') }}
              selectedId={selectedSvc?.id}
            />
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      {(diagram || true) && (
        <div style={{ width: 260, background: '#fff', borderLeft: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-2px 0 8px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
            {(['legend', 'waf', 'cost', 'prompt'] as const).map(p => (
              <button key={p} onClick={() => setRightPanel(p)} style={{
                flex: 1, padding: '8px 0', fontSize: 10,
                fontWeight: rightPanel === p ? 600 : 400,
                color: rightPanel === p ? '#0078D4' : '#999',
                background: 'none', border: 'none',
                borderBottom: rightPanel === p ? '2px solid #0078D4' : '2px solid transparent',
                cursor: 'pointer', textTransform: 'uppercase', ...SS
              }}>{p}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '12px 13px' }}>

            {/* Legend panel */}
            {rightPanel === 'legend' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 10, ...SS }}>Diagram legend</div>

                <div style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 6, ...SS }}>Boundary types</div>
                {[
                  { color: '#0078D4', dash: '8 4', label: 'Azure Subscription' },
                  { color: '#00B4D8', dash: '6 3', label: 'Virtual Network' },
                  { color: '#737373', dash: '4 2', label: 'Subnet / Tier column' },
                  { color: '#68217A', dash: '6 3', label: 'Resource Group' },
                  { color: '#F25022', dash: '6 3', label: 'Hub shared services' },
                  { color: '#D13438', dash: '6 3', label: 'External zone' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <svg width="30" height="16">
                      <rect x={1} y={1} width={28} height={14} rx={2} fill="none" stroke={l.color} strokeWidth={1} strokeDasharray={l.dash}/>
                    </svg>
                    <span style={{ fontSize: 10, color: '#555', ...SS }}>{l.label}</span>
                  </div>
                ))}

                <div style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 6, marginTop: 12, ...SS }}>Connection types</div>
                {Object.entries(EDGE_COLORS).map(([type, cfg]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <svg width="30" height="10">
                      <defs>
                        <marker id={`leg-${type}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                          <path d="M1 2L8 5L1 8" fill="none" stroke={cfg.stroke} strokeWidth="2"/>
                        </marker>
                      </defs>
                      <line x1="2" y1="5" x2="26" y2="5" stroke={cfg.stroke} strokeWidth="1.5"
                        strokeDasharray={cfg.dash === 'none' ? undefined : cfg.dash}
                        markerEnd={`url(#leg-${type})`}/>
                    </svg>
                    <span style={{ fontSize: 10, color: '#555', textTransform: 'capitalize', ...SS }}>{type} — {cfg.label}</span>
                  </div>
                ))}

                <div style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 6, marginTop: 12, ...SS }}>Layout intelligence</div>
                <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 10, fontSize: 10, color: '#555', lineHeight: 1.7, ...SS }}>
                  <div style={{ marginBottom: 4 }}><strong style={{ color: '#0078D4' }}>↔ Vertical columns</strong> — used for hub-spoke, microservices, event-driven, B2B integration. Shows traffic flow left → right.</div>
                  <div><strong style={{ color: '#107C10' }}>↕ Horizontal tiers</strong> — used for N-Tier, data pipelines, multi-region HA. Shows logical layers top → bottom.</div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 6, marginTop: 12, ...SS }}>WAF pillar dots</div>
                {[
                  { c: '#107C10', l: 'Reliability' }, { c: '#0078D4', l: 'Security' },
                  { c: '#8764B8', l: 'Performance' }, { c: '#004B1C', l: 'Cost' },
                  { c: '#737373', l: 'Operations' },
                ].map(p => (
                  <div key={p.l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.c }}/>
                    <span style={{ fontSize: 10, color: '#555', ...SS }}>{p.l}</span>
                  </div>
                ))}
              </div>
            )}

            {/* WAF panel */}
            {rightPanel === 'waf' && (
              <div>
                {selectedSvc && (
                  <div style={{ background: '#f0f7ff', border: '1px solid #d0e8ff', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0078D4', marginBottom: 4, ...SS }}>{selectedSvc.display_name}</div>
                    <div style={{ fontSize: 11, color: '#555', lineHeight: 1.7, ...SS }}>
                      <div><strong>SKU:</strong> {selectedSvc.sku}</div>
                      <div><strong>RG:</strong> {selectedSvc.resource_group}</div>
                      <div><strong>PE:</strong> {selectedSvc.private_endpoint ? '✓ Yes' : '✗ No'}</div>
                      <div><strong>Cost:</strong> A${selectedSvc.estimated_cost_aud}/mo</div>
                      {selectedSvc.rationale && <div style={{ marginTop: 6, color: '#444' }}>{selectedSvc.rationale}</div>}
                    </div>
                  </div>
                )}
                {waf ? (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 8, ...SS }}>WAF pillar scores</div>
                    {pillars.map(p => <WafBar key={p.k} label={p.l} score={waf[p.k]?.score || 0} color={p.c} />)}
                    {pillars.map(p => waf[p.k]?.findings?.length > 0 && (
                      <div key={p.k} style={{ marginBottom: 8, marginTop: 6 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: p.c, marginBottom: 3, ...SS }}>{p.l} findings</div>
                        {waf[p.k].findings.map((f: string, i: number) => (
                          <div key={i} style={{ fontSize: 10, color: '#555', padding: '2px 0', borderBottom: '1px solid #f5f5f5', lineHeight: 1.5, ...SS }}>• {f}</div>
                        ))}
                      </div>
                    ))}
                  </>
                ) : <div style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 40, ...SS }}>Generate a diagram to see WAF validation</div>}
              </div>
            )}

            {/* Cost panel */}
            {rightPanel === 'cost' && (
              <div>
                {diagram ? (
                  <>
                    <div style={{ background: 'linear-gradient(135deg,#0078D4,#005a9e)', borderRadius: 10, padding: '12px 14px', marginBottom: 12, color: '#fff' }}>
                      <div style={{ fontSize: 10, opacity: .85, ...SS }}>Estimated monthly total</div>
                      <div style={{ fontSize: 24, fontWeight: 700, ...SS }}>A${totalCost?.toLocaleString()}</div>
                      <div style={{ fontSize: 9, opacity: .75, ...SS }}>Australia East · per month</div>
                    </div>
                    {(cost?.breakdown || diagram.services)?.map((item: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f0f0f0', fontSize: 11, ...SS }}>
                        <span style={{ color: '#444' }}>{item.name || item.display_name}</span>
                        <span style={{ fontWeight: 600, color: '#333' }}>A${item.monthly_aud || item.estimated_cost_aud}</span>
                      </div>
                    ))}
                    {cost?.optimisation_tips?.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#107C10', marginBottom: 5, ...SS }}>💡 Optimisation</div>
                        {cost.optimisation_tips.map((t: string, i: number) => (
                          <div key={i} style={{ fontSize: 10, color: '#444', padding: '3px 0', borderBottom: '1px solid #f5f5f5', lineHeight: 1.5, ...SS }}>• {t}</div>
                        ))}
                      </div>
                    )}
                  </>
                ) : <div style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 40, ...SS }}>Generate a diagram to see cost estimates</div>}
              </div>
            )}

            {/* Prompt panel */}
            {rightPanel === 'prompt' && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 6, ...SS }}>Sent to Claude</div>
                <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 10, fontSize: 9, color: '#94a3b8', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: 500, overflow: 'auto' }}>
                  {genPrompt || 'No prompt generated yet'}
                </div>
                {genPrompt && (
                  <button onClick={() => navigator.clipboard.writeText(genPrompt)} style={{ marginTop: 8, width: '100%', fontSize: 11, padding: '7px 0', border: '1px solid #ddd', borderRadius: 6, background: '#fafafa', color: '#555', cursor: 'pointer', ...SS }}>
                    Copy prompt
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
