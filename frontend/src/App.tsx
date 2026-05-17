import { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  addEdge, MarkerType, Panel,
  Handle, Position
} from 'reactflow'
import 'reactflow/dist/style.css'

const API = 'http://localhost:8000'

// ── Azure icon map: icon_id → benco CDN path ──────────────────────────────
const ICON_MAP: Record<string, string> = {
  'app-services':                   'App-Services',
  'function-apps':                  'Function-Apps',
  'container-instances':            'Container-Instances',
  'app-service-plans':              'App-Service-Plans',
  'front-doors':                    'Front-Doors',
  'firewalls':                      'Firewalls',
  'api-management-services':        'API-Management-Services',
  'virtual-networks':               'Virtual-Networks',
  'network-security-groups':        'Network-Security-Groups',
  'private-link':                   'Private-Link',
  'ddos-protection-plans':          'DDoS-Protection-Plans',
  'dns-zones':                      'DNS-Zones',
  'key-vaults':                     'Key-Vaults',
  'azure-ad-b2c':                   'Azure-AD-B2C',
  'microsoft-defender-for-cloud':   'Security-Center',
  'policy':                         'Policy',
  'azure-cosmos-db':                'Azure-Cosmos-DB',
  'cache-redis':                    'Cache-Redis',
  'storage-accounts':               'Storage-Accounts',
  'azure-service-bus':              'Service-Bus',
  'event-grid-topics':              'Event-Grid-Topics',
  'cognitive-services':             'Cognitive-Services',
  'cognitive-search':               'Search-Services',
  'log-analytics-workspaces':       'Log-Analytics-Workspaces',
  'application-insights':           'Application-Insights',
  'resource-groups':                'Resource-Groups',
  'subscriptions':                  'Subscriptions',
  'monitor':                        'Monitor',
  'alerts':                         'Alerts',
}

function getIconUrl(iconId: string): string {
  const name = ICON_MAP[iconId] || 'Cognitive-Services'
  return `https://code.benco.io/icon-collection/azure-icons/${name}.svg`
}

// ── Custom Azure service node ─────────────────────────────────────────────
function AzureNode({ data, selected }: any) {
  const [hovered, setHovered] = useState(false)
  const pillarColors: Record<string, string> = {
    Reliability: '#107C10', Security: '#0078D4',
    Performance: '#8764B8', Cost: '#004B1C', Operations: '#737373'
  }
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', cursor: 'pointer', userSelect: 'none'
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div style={{
        width: 52, height: 52,
        background: '#fff',
        border: selected ? '2px solid #0078D4' :
                data.validationWarning ? '2px solid #FFA500' :
                '1.5px solid #E0E0E0',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.13)' : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'all 0.15s ease',
      }}>
        <img
          src={getIconUrl(data.icon_id)}
          alt={data.display_name}
          width={36} height={36}
          style={{ objectFit: 'contain' }}
        />
      </div>

      <div style={{
        marginTop: 5, fontSize: 10, fontWeight: 500,
        color: '#1a1a1a', textAlign: 'center',
        maxWidth: 80, lineHeight: 1.3,
        fontFamily: '"Segoe UI", system-ui, sans-serif'
      }}>
        {data.display_name}
      </div>
      <div style={{
        fontSize: 9, color: '#737373', textAlign: 'center',
        maxWidth: 80, fontFamily: '"Segoe UI", system-ui, sans-serif'
      }}>
        {data.sku}
      </div>

      {/* WAF pillar dots */}
      {data.waf_pillars && (
        <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
          {data.waf_pillars.map((p: string) => (
            <div key={p} title={p} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: pillarColors[p] || '#ccc'
            }} />
          ))}
        </div>
      )}

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute', bottom: '110%', left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1a2e', color: '#fff',
          borderRadius: 8, padding: '10px 14px',
          fontSize: 11, whiteSpace: 'nowrap',
          zIndex: 1000, pointerEvents: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          lineHeight: 1.7,
          fontFamily: '"Segoe UI", system-ui, sans-serif'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#60a5fa', fontSize: 12 }}>
            {data.display_name}
          </div>
          <div>SKU: {data.sku}</div>
          <div>RG: {data.resource_group}</div>
          <div>PE: {data.private_endpoint ? '✓ Private endpoint' : '— Public'}</div>
          <div style={{ color: '#86efac' }}>A${data.estimated_cost_aud}/mo</div>
          <div style={{ marginTop: 4, color: '#94a3b8', maxWidth: 240, whiteSpace: 'normal' }}>
            {data.rationale}
          </div>
        </div>
      )}
    </div>
  )
}

const nodeTypes = { azureService: AzureNode }

// ── Edge styles ───────────────────────────────────────────────────────────
const EDGE_STYLES: Record<string, any> = {
  sync:      { stroke: '#0078D4', strokeWidth: 1.5, animated: false },
  async:     { stroke: '#FBBA00', strokeWidth: 1.5, strokeDasharray: '6 3' },
  msi:       { stroke: '#ECD01E', strokeWidth: 1, strokeDasharray: '3 2', opacity: 0.7 },
  telemetry: { stroke: '#84278F', strokeWidth: 1, strokeDasharray: '3 2', opacity: 0.5 },
  external:  { stroke: '#D13438', strokeWidth: 1.5, strokeDasharray: '6 3' },
}

function edgeStyle(type: string) {
  return EDGE_STYLES[type] || EDGE_STYLES.sync
}

// ── Diagram JSON → React Flow nodes + edges ───────────────────────────────
function diagramToFlow(diagram: any) {
  const services = diagram.services || []
  const connections = diagram.connections || []
  const cols = 4
  const xBase = 80, yBase = 40, xGap = 170, yGap = 150

  const nodes = services.map((svc: any, i: number) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    return {
      id: svc.id,
      type: 'azureService',
      position: { x: xBase + col * xGap, y: yBase + row * yGap },
      data: svc,
    }
  })

  const edges = connections.map((conn: any) => ({
    id: conn.id,
    source: conn.from,
    target: conn.to,
    label: conn.label,
    style: edgeStyle(conn.type),
    markerEnd: { type: MarkerType.ArrowClosed, color: edgeStyle(conn.type).stroke },
    labelStyle: {
      fontSize: 9, fill: '#555',
      fontFamily: '"Segoe UI", system-ui, sans-serif'
    },
    labelBgStyle: { fill: '#fff', opacity: 0.85 },
    data: { flow_group: conn.flow_group }
  }))

  return { nodes, edges }
}

// ── WAF Pillar bar ────────────────────────────────────────────────────────
function WafBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, marginBottom: 3,
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        color: '#444'
      }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color }}>{score}/100</span>
      </div>
      <div style={{
        height: 6, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', width: `${score}%`,
          background: color, borderRadius: 99,
          transition: 'width 0.8s ease'
        }} />
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [diagram, setDiagram] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [activeFlow, setActiveFlow] = useState('all')
  const [panel, setPanel] = useState<'form'|'waf'|'cost'>('form')
  const [selectedNode, setSelectedNode] = useState<any>(null)

  // Form state
  const [prompt, setPrompt] = useState('')
  const [industry, setIndustry] = useState('Healthcare')
  const [workload, setWorkload] = useState('AI/ML platform')
  const [compute, setCompute] = useState('PaaS')
  const [ha, setHa] = useState('Single region')
  const [security, setSecurity] = useState('Standard')
  const [compliance, setCompliance] = useState<string[]>([])
  const [budget, setBudget] = useState(2000)

  const loadingMsgs = [
    'Analysing requirements...',
    'Designing architecture...',
    'Selecting Azure services...',
    'Validating WAF pillars...',
    'Estimating costs...',
    'Finalising diagram...',
  ]
  const msgIdx = useRef(0)

  const onConnect = useCallback((p: any) => setEdges(e => addEdge(p, e)), [setEdges])

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node.data)
    setPanel('waf')
  }, [])

  function toggleCompliance(c: string) {
    setCompliance(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  function filterEdges(flow: string) {
    setActiveFlow(flow)
    setEdges(prev => prev.map(e => ({
      ...e,
      style: {
        ...edgeStyle(e.style?.stroke === '#D13438' ? 'external' :
                     e.style?.stroke === '#FBBA00' ? 'async' :
                     e.style?.stroke === '#ECD01E' ? 'msi' :
                     e.style?.stroke === '#84278F' ? 'telemetry' : 'sync'),
        opacity: flow === 'all' ? 1 :
                 e.data?.flow_group === flow ? 1 : 0.07
      }
    })))
  }

  async function generate() {
    if (!prompt.trim()) {
      setError('Please describe your architecture requirements.')
      return
    }
    setError('')
    setLoading(true)
    setDiagram(null)
    setNodes([])
    setEdges([])
    msgIdx.current = 0
    setLoadingMsg(loadingMsgs[0])

    const interval = setInterval(() => {
      msgIdx.current = (msgIdx.current + 1) % loadingMsgs.length
      setLoadingMsg(loadingMsgs[msgIdx.current])
    }, 2500)

    try {
      const res = await fetch(`${API}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt, industry, workload, compute, ha,
          security, compliance, budget_aud: budget,
          region: 'Australia East', timeline: 'Production'
        })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setDiagram(data)
      const { nodes: n, edges: e } = diagramToFlow(data)
      setNodes(n)
      setEdges(e)
      setPanel('waf')
      setActiveFlow('all')
    } catch (e: any) {
      setError(`Generation failed: ${e.message}`)
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  async function exportDrawio() {
    if (!diagram) return
    const res = await fetch(`${API}/api/export/drawio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagram })
    })
    const data = await res.json()
    const blob = new Blob([data.xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = data.filename; a.click()
    URL.revokeObjectURL(url)
  }

  const waf = diagram?.waf_validation
  const cost = diagram?.cost_estimate
  const totalCost = cost?.total_aud || diagram?.services?.reduce(
    (sum: number, s: any) => sum + (s.estimated_cost_aud || 0), 0
  ) || 0

  const pillarConfig = [
    { key: 'reliability',  label: 'Reliability',  color: '#107C10' },
    { key: 'security',     label: 'Security',     color: '#0078D4' },
    { key: 'performance',  label: 'Performance',  color: '#8764B8' },
    { key: 'cost',         label: 'Cost',         color: '#004B1C' },
    { key: 'operations',   label: 'Operations',   color: '#737373' },
  ]

  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100vw',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
      background: '#f8f9fa', overflow: 'hidden'
    }}>

      {/* ── LEFT SIDEBAR ──────────────────────────────────── */}
      <div style={{
        width: 310, minWidth: 310, height: '100vh',
        background: '#fff',
        borderRight: '1px solid #e8e8e8',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: '#0078D4',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z"
                  stroke="white" strokeWidth="1.5" fill="none"/>
                <circle cx="9" cy="9" r="2.5" fill="white"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0078D4', letterSpacing: '-0.3px' }}>
                Archon
              </div>
              <div style={{ fontSize: 10, color: '#888' }}>Azure Architecture AI</div>
            </div>
          </div>
        </div>

        {/* Panel tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #f0f0f0',
          background: '#fafafa'
        }}>
          {([['form','Design'], ['waf','WAF'], ['cost','Cost']] as [typeof panel, string][]).map(([p, label]) => (
            <button key={p} onClick={() => setPanel(p)} style={{
              flex: 1, padding: '9px 0', fontSize: 11,
              fontWeight: panel === p ? 600 : 400,
              color: panel === p ? '#0078D4' : '#666',
              background: 'none', border: 'none',
              borderBottom: panel === p ? '2px solid #0078D4' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: '"Segoe UI", system-ui, sans-serif'
            }}>{label}</button>
          ))}
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>

          {/* FORM PANEL */}
          {panel === 'form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#444', display: 'block', marginBottom: 5 }}>
                  Describe your architecture *
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="e.g. AI document intelligence platform with RAG, voice assistant, and multi-tenant customer isolation for a law firm"
                  rows={4}
                  style={{
                    width: '100%', padding: '9px 10px',
                    border: '1.5px solid #e0e0e0', borderRadius: 8,
                    fontSize: 12, resize: 'vertical', lineHeight: 1.5,
                    fontFamily: '"Segoe UI", system-ui, sans-serif',
                    outline: 'none', color: '#333',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0078D4'}
                  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              {/* Quick prompts */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {[
                  'Smart document intelligence with RAG and voice',
                  'E-commerce platform with payments',
                  'IoT data pipeline with real-time analytics',
                  'Healthcare patient portal with HIPAA compliance',
                ].map(ex => (
                  <button key={ex} onClick={() => setPrompt(ex)} style={{
                    fontSize: 10, padding: '3px 8px',
                    border: '1px solid #d0e8ff', borderRadius: 99,
                    background: '#f0f7ff', color: '#0078D4',
                    cursor: 'pointer', fontFamily: '"Segoe UI", system-ui, sans-serif'
                  }}>{ex}</button>
                ))}
              </div>

              <FieldGroup label="Industry">
                <Select value={industry} onChange={setIndustry}
                  options={['Healthcare','Finance','Legal','Retail','Transport','Education','Government','General']}/>
              </FieldGroup>

              <FieldGroup label="Workload type">
                <Select value={workload} onChange={setWorkload}
                  options={['Web application','AI/ML platform','Data pipeline','IoT platform','Microservices','E-commerce']}/>
              </FieldGroup>

              <FieldGroup label="Compute preference">
                <Select value={compute} onChange={setCompute}
                  options={['PaaS','Containers','Serverless','Mixed']}/>
              </FieldGroup>

              <FieldGroup label="High availability">
                <Select value={ha} onChange={setHa}
                  options={['Single region','Multi-region active-passive','Active-active']}/>
              </FieldGroup>

              <FieldGroup label="Security posture">
                <Select value={security} onChange={setSecurity}
                  options={['Basic','Standard','Zero-Trust']}/>
              </FieldGroup>

              <FieldGroup label="Compliance">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {['HIPAA','SOC2','GDPR','ISO27001','PCI-DSS','IRAP'].map(c => (
                    <button key={c} onClick={() => toggleCompliance(c)} style={{
                      fontSize: 10, padding: '3px 8px',
                      border: '1px solid',
                      borderColor: compliance.includes(c) ? '#0078D4' : '#ddd',
                      borderRadius: 99,
                      background: compliance.includes(c) ? '#0078D4' : '#fafafa',
                      color: compliance.includes(c) ? '#fff' : '#555',
                      cursor: 'pointer', fontFamily: '"Segoe UI", system-ui, sans-serif',
                      transition: 'all 0.15s'
                    }}>{c}</button>
                  ))}
                </div>
              </FieldGroup>

              <FieldGroup label={`Monthly budget: A$${budget.toLocaleString()}`}>
                <input type="range" min={500} max={20000} step={500}
                  value={budget} onChange={e => setBudget(+e.target.value)}
                  style={{ width: '100%' }}/>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#888' }}>
                  <span>A$500</span><span>A$20,000</span>
                </div>
              </FieldGroup>

              {error && (
                <div style={{
                  background: '#fff0f0', border: '1px solid #ffcdd2',
                  borderRadius: 8, padding: '9px 12px',
                  fontSize: 12, color: '#c62828'
                }}>{error}</div>
              )}

              <button
                onClick={generate}
                disabled={loading}
                style={{
                  background: loading ? '#90CAF9' : '#0078D4',
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '12px 0', fontSize: 13, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: '"Segoe UI", system-ui, sans-serif',
                  width: '100%', marginTop: 4
                }}
              >
                {loading ? `${loadingMsg}` : diagram ? '↺ Regenerate' : '⚡ Generate architecture'}
              </button>
            </div>
          )}

          {/* WAF PANEL */}
          {panel === 'waf' && (
            <div>
              {selectedNode && (
                <div style={{
                  background: '#f0f7ff', border: '1px solid #d0e8ff',
                  borderRadius: 8, padding: 12, marginBottom: 14
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0078D4', marginBottom: 4 }}>
                    {selectedNode.display_name}
                  </div>
                  <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>
                    <div><strong>SKU:</strong> {selectedNode.sku}</div>
                    <div><strong>RG:</strong> {selectedNode.resource_group}</div>
                    <div><strong>Private endpoint:</strong> {selectedNode.private_endpoint ? '✓ Yes' : '✗ No'}</div>
                    <div style={{ marginTop: 6, color: '#444' }}>{selectedNode.rationale}</div>
                  </div>
                </div>
              )}

              {waf ? (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#444', marginBottom: 10 }}>
                    WAF Pillar scores
                  </div>
                  {pillarConfig.map(pc => (
                    <WafBar key={pc.key} label={pc.label}
                      score={waf[pc.key]?.score || 0} color={pc.color}/>
                  ))}

                  {pillarConfig.map(pc =>
                    waf[pc.key]?.findings?.length > 0 && (
                      <div key={pc.key} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: pc.color, marginBottom: 3 }}>
                          {pc.label} findings
                        </div>
                        {waf[pc.key].findings.map((f: string, i: number) => (
                          <div key={i} style={{
                            fontSize: 10, color: '#555', padding: '3px 0',
                            borderBottom: '1px solid #f5f5f5', lineHeight: 1.5
                          }}>• {f}</div>
                        ))}
                      </div>
                    )
                  )}
                </>
              ) : (
                <EmptyState icon="🏗️" text="Generate an architecture to see WAF validation" />
              )}
            </div>
          )}

          {/* COST PANEL */}
          {panel === 'cost' && (
            <div>
              {diagram ? (
                <>
                  <div style={{
                    background: 'linear-gradient(135deg, #0078D4, #005a9e)',
                    borderRadius: 10, padding: '14px 16px', marginBottom: 14, color: '#fff'
                  }}>
                    <div style={{ fontSize: 11, opacity: 0.85 }}>Estimated monthly total</div>
                    <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-1px' }}>
                      A${totalCost.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.75 }}>Australia East · per month</div>
                  </div>

                  {cost?.breakdown?.map((item: any, i: number) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '7px 0', borderBottom: '1px solid #f0f0f0',
                      fontSize: 11
                    }}>
                      <span style={{ color: '#444' }}>{item.name}</span>
                      <span style={{ fontWeight: 600, color: '#333' }}>
                        A${item.monthly_aud?.toLocaleString() || item.monthly_aud}
                      </span>
                    </div>
                  ))}

                  {!cost?.breakdown && diagram.services?.map((svc: any) => (
                    <div key={svc.id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '7px 0', borderBottom: '1px solid #f0f0f0',
                      fontSize: 11
                    }}>
                      <span style={{ color: '#444' }}>{svc.display_name}</span>
                      <span style={{ fontWeight: 600, color: '#333' }}>
                        A${svc.estimated_cost_aud}
                      </span>
                    </div>
                  ))}

                  {cost?.optimisation_tips?.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#107C10', marginBottom: 6 }}>
                        💡 Cost optimisation tips
                      </div>
                      {cost.optimisation_tips.map((tip: string, i: number) => (
                        <div key={i} style={{
                          fontSize: 10, color: '#444', padding: '4px 0',
                          borderBottom: '1px solid #f5f5f5', lineHeight: 1.5
                        }}>• {tip}</div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <EmptyState icon="💰" text="Generate an architecture to see cost estimates" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CANVAS ───────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Canvas topbar */}
        <div style={{
          height: 48, background: '#fff',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex', alignItems: 'center',
          padding: '0 16px', gap: 8,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          {diagram && (
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginRight: 8 }}>
              {diagram.title}
            </div>
          )}

          {/* Flow filters */}
          {diagram && (
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              {['all','ingestion','query','security','monitoring'].map(f => (
                <button key={f} onClick={() => filterEdges(f)} style={{
                  fontSize: 10, padding: '4px 10px',
                  border: '1px solid',
                  borderColor: activeFlow === f ? '#0078D4' : '#ddd',
                  borderRadius: 99,
                  background: activeFlow === f ? '#0078D4' : '#fff',
                  color: activeFlow === f ? '#fff' : '#555',
                  cursor: 'pointer', fontWeight: activeFlow === f ? 600 : 400,
                  transition: 'all 0.15s', textTransform: 'capitalize',
                  fontFamily: '"Segoe UI", system-ui, sans-serif'
                }}>{f}</button>
              ))}
            </div>
          )}

          {/* Export button */}
          {diagram && (
            <button onClick={exportDrawio} style={{
              marginLeft: 8, fontSize: 11, padding: '6px 14px',
              background: '#107C10', color: '#fff',
              border: 'none', borderRadius: 6,
              cursor: 'pointer', fontWeight: 600,
              fontFamily: '"Segoe UI", system-ui, sans-serif',
              display: 'flex', alignItems: 'center', gap: 5
            }}>
              <span>↓</span> Export draw.io
            </button>
          )}
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          {!diagram && !loading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 10, pointerEvents: 'none'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.15 }}>⬡</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#999', marginBottom: 8 }}>
                Your architecture will appear here
              </div>
              <div style={{ fontSize: 13, color: '#bbb', maxWidth: 360, textAlign: 'center' }}>
                Fill in the form on the left and click Generate to create your Azure architecture diagram
              </div>
            </div>
          )}

          {loading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.9)', zIndex: 10
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '3px solid #e0e0e0',
                borderTopColor: '#0078D4',
                animation: 'spin 0.8s linear infinite',
                marginBottom: 16
              }} />
              <div style={{ fontSize: 14, color: '#0078D4', fontWeight: 500 }}>{loadingMsg}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                Claude Sonnet 4.6 is designing your architecture...
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={3}
            style={{ background: '#fafbfc' }}
          >
            <Background color="#e8e8e8" gap={24} size={1} />
            <Controls style={{ bottom: 16, right: 16, left: 'auto' }} />
            <MiniMap
              nodeColor={() => '#0078D4'}
              maskColor="rgba(0,0,0,0.05)"
              style={{ bottom: 120, right: 16 }}
            />

            {/* Legend */}
            {diagram && (
              <Panel position="bottom-left">
                <div style={{
                  background: '#fff', border: '1px solid #e8e8e8',
                  borderRadius: 8, padding: '8px 12px',
                  fontSize: 10, color: '#666',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 5, color: '#333' }}>Connection types</div>
                  {[
                    { color: '#0078D4', dash: 'none', label: 'Sync HTTPS' },
                    { color: '#FBBA00', dash: '6 3', label: 'Async / event' },
                    { color: '#ECD01E', dash: '3 2', label: 'MSI / secrets' },
                    { color: '#84278F', dash: '3 2', label: 'Telemetry' },
                    { color: '#D13438', dash: '6 3', label: 'External' },
                  ].map(l => (
                    <div key={l.label} style={{ display:'flex', alignItems:'center', gap: 7, marginBottom: 3 }}>
                      <svg width="24" height="8">
                        <line x1="0" y1="4" x2="24" y2="4"
                          stroke={l.color} strokeWidth="1.5"
                          strokeDasharray={l.dash}/>
                      </svg>
                      <span>{l.label}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 6, color: '#999', fontSize: 9 }}>
                    Click any service for details • Drag to reposition
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        fontSize: 11, fontWeight: 600, color: '#555',
        display: 'block', marginBottom: 5
      }}>{label}</label>
      {children}
    </div>
  )
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '7px 10px',
        border: '1.5px solid #e0e0e0', borderRadius: 7,
        fontSize: 12, color: '#333', background: '#fff',
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        outline: 'none', cursor: 'pointer', boxSizing: 'border-box'
      }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '40px 20px', color: '#bbb'
    }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 12, lineHeight: 1.6 }}>{text}</div>
    </div>
  )
}
