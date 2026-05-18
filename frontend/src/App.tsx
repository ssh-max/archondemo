// ═══════════════════════════════════════════════════════════════════════════
// ARCHON — Enterprise Architecture Discovery Form
// Every request generates a detailed, specification-grade prompt
// matching the B2B Integration Platform example quality
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef } from 'react'

const API = ''
const SS: React.CSSProperties = { fontFamily: '"Segoe UI",system-ui,sans-serif' }

// ── Icon CDN ──────────────────────────────────────────────────────────
const ICON_MAP: Record<string, string> = {
  'app-services':'App-Services','function-apps':'Function-Apps',
  'container-instances':'Container-Instances','front-doors':'Front-Doors',
  'firewalls':'Firewalls','api-management-services':'API-Management-Services',
  'virtual-networks':'Virtual-Networks','network-security-groups':'Network-Security-Groups',
  'private-link':'Private-Link','ddos-protection-plans':'DDoS-Protection-Plans',
  'dns-zones':'DNS-Zones','key-vaults':'Key-Vaults','azure-ad-b2c':'Azure-AD-B2C',
  'microsoft-defender-for-cloud':'Security-Center','policy':'Policy',
  'azure-cosmos-db':'Azure-Cosmos-DB','cache-redis':'Cache-Redis',
  'storage-accounts':'Storage-Accounts','azure-service-bus':'Service-Bus',
  'event-grid-topics':'Event-Grid-Topics','cognitive-services':'Cognitive-Services',
  'cognitive-search':'Search-Services','log-analytics-workspaces':'Log-Analytics-Workspaces',
  'application-insights':'Application-Insights','resource-groups':'Resource-Groups',
  'subscriptions':'Subscriptions','monitor':'Monitor','alerts':'Alerts',
  'application-gateway':'Application-Gateways','logic-apps':'Logic-Apps',
  'integration-accounts':'Integration-Accounts','container-registry':'Container-Registries',
}
const iconUrl = (id: string) =>
  `https://code.benco.io/icon-collection/azure-icons/${ICON_MAP[id]||'Cognitive-Services'}.svg`

// ═══════════════════════════════════════════════════════════════════════════
// AZURE SERVICE CATALOGUE — every service with SKU options + icon
// ═══════════════════════════════════════════════════════════════════════════
const SERVICE_CATALOGUE = [
  // Ingress & networking
  { id:'appgw',   name:'Application Gateway v2',   icon:'application-gateway', cat:'Ingress',
    skus:['WAF v2 Standard','WAF v2 Zone-Redundant'], purpose:'Internet-facing WAF + SSL termination' },
  { id:'frontdoor',name:'Azure Front Door',          icon:'front-doors',         cat:'Ingress',
    skus:['Standard','Premium (Private Link)'],       purpose:'Global CDN + WAF + failover routing' },
  { id:'apim',    name:'Azure API Management',       icon:'api-management-services',cat:'Ingress',
    skus:['Developer (VNet internal)','Standard','Premium (zone-redundant)'], purpose:'API gateway, partner auth, rate limiting' },
  { id:'firewall',name:'Azure Firewall',             icon:'firewalls',           cat:'Network',
    skus:['Standard','Premium (IDPS + TLS inspect)'], purpose:'Hub egress control, FQDN filtering' },
  // Compute
  { id:'appservice',name:'Azure App Service',        icon:'app-services',        cat:'Compute',
    skus:['P1v3 Linux','P2v3 Linux','P3v3 Linux','P2v3 Zone-Redundant'], purpose:'API backend, web application host' },
  { id:'functions',name:'Azure Functions',           icon:'function-apps',       cat:'Compute',
    skus:['Consumption','Premium EP1','Premium EP2'], purpose:'Event-driven processing, ingestion worker' },
  { id:'containerapps',name:'Container Apps',        icon:'container-instances', cat:'Compute',
    skus:['Consumption plan','Dedicated'],            purpose:'Microservices, voice gateway, serverless containers' },
  { id:'logicapps',name:'Azure Logic Apps Standard', icon:'logic-apps',         cat:'Integration',
    skus:['Standard WS1','Standard WS2'],             purpose:'B2B workflows, EDI/AS2/X12 processing' },
  // Integration
  { id:'intaccount',name:'Integration Account',     icon:'integration-accounts',cat:'Integration',
    skus:['Basic','Standard'],                        purpose:'B2B schemas, maps, trading partner agreements' },
  { id:'svcbus',  name:'Azure Service Bus',          icon:'azure-service-bus',   cat:'Messaging',
    skus:['Standard','Premium (1 MU)','Premium Zone-Redundant'], purpose:'Message queuing, DLQ, pub/sub' },
  { id:'evtgrid', name:'Azure Event Grid',           icon:'event-grid-topics',  cat:'Messaging',
    skus:['System Topic','Custom Topic'],             purpose:'Event routing, blob trigger, system events' },
  // Data
  { id:'cosmos',  name:'Azure Cosmos DB',            icon:'azure-cosmos-db',    cat:'Data',
    skus:['Serverless','Provisioned 1000 RU/s','Autoscale 10000 RU/s'], purpose:'NoSQL metadata, audit log, registry' },
  { id:'sql',     name:'Azure SQL Database',         icon:'azure-cosmos-db',    cat:'Data',
    skus:['General Purpose 4 vCores','Business Critical 4 vCores','Business Critical Zone-Redundant'], purpose:'Relational data, transactional workloads' },
  { id:'redis',   name:'Azure Cache for Redis',      icon:'cache-redis',        cat:'Data',
    skus:['C1 Standard (1GB)','C3 Standard (6GB)','P1 Premium (6GB, VNet)'], purpose:'Session cache, query result cache, dedup' },
  { id:'storage', name:'Azure Blob Storage',         icon:'storage-accounts',   cat:'Data',
    skus:['Standard LRS','Standard GRS','Standard GZRS (CMK)'], purpose:'File storage, EDI staging, CDN origin' },
  { id:'aisearch',name:'Azure AI Search',            icon:'cognitive-search',   cat:'AI',
    skus:['Basic','Standard S1','Standard S2'], purpose:'Vector + hybrid semantic search, per-tenant indexes' },
  { id:'openai',  name:'Azure OpenAI',               icon:'cognitive-services', cat:'AI',
    skus:['text-embedding-3-large','GPT-4o','GPT-4o + Embeddings'], purpose:'Embeddings, AI generation, RAG' },
  { id:'docintel',name:'Azure AI Document Intelligence',icon:'cognitive-services',cat:'AI',
    skus:['S0 prebuilt-read','S0 custom model'],     purpose:'OCR, table extraction, key-value pairs' },
  // Security
  { id:'kv',      name:'Azure Key Vault',            icon:'key-vaults',         cat:'Security',
    skus:['Standard (RBAC)','Premium (HSM-backed)'], purpose:'Secrets, CMK keys, certificates, connection strings' },
  { id:'defender',name:'Microsoft Defender for Cloud',icon:'microsoft-defender-for-cloud',cat:'Security',
    skus:['CSPM Free','All workload plans'],          purpose:'CSPM, threat detection, vulnerability management' },
  { id:'adb2c',  name:'Azure AD B2C / Entra ID',    icon:'azure-ad-b2c',      cat:'Security',
    skus:['P1','P2 (PIM + Identity Protection)'],    purpose:'Identity provider, JWT issuance, B2B federation' },
  // Monitor
  { id:'law',    name:'Log Analytics Workspace',     icon:'log-analytics-workspaces',cat:'Monitor',
    skus:['Pay-per-GB (30-day)','Commitment Tier 100GB'], purpose:'Centralised log aggregation, query, retention' },
  { id:'appi',   name:'Application Insights',        icon:'application-insights',cat:'Monitor',
    skus:['Workspace-based'],                         purpose:'APM, distributed tracing, custom telemetry' },
  { id:'monitor',name:'Azure Monitor + Alerts',      icon:'monitor',           cat:'Monitor',
    skus:['Standard alert rules'],                    purpose:'SLA monitoring, cost alerts, action groups' },
  // Network
  { id:'vnet',   name:'Virtual Network',             icon:'virtual-networks',  cat:'Network',
    skus:['Standard'],                                purpose:'Spoke VNet, subnet isolation, VNet peering' },
  { id:'nsg',    name:'Network Security Group',      icon:'network-security-groups',cat:'Network',
    skus:['Standard'],                                purpose:'Subnet-level traffic filtering, deny-all default' },
  { id:'pe',     name:'Private Endpoints',           icon:'private-link',      cat:'Network',
    skus:['Standard'],                                purpose:'Private connectivity to PaaS services, no public data plane' },
  { id:'dns',    name:'Azure Private DNS Zones',     icon:'dns-zones',         cat:'Network',
    skus:['Standard'],                                purpose:'Auto-resolve private endpoints, hub-linked to spokes' },
  { id:'acr',    name:'Azure Container Registry',    icon:'container-registry',cat:'Compute',
    skus:['Basic','Standard','Premium (geo-replication)'], purpose:'Container image registry, CI/CD integration' },
]

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT TEMPLATES — column/tier presets per platform type
// ═══════════════════════════════════════════════════════════════════════════
interface Column { id:string; label:string; services:string[]; subnet:string; cidr:string; nsg:string }

const LAYOUT_PRESETS: Record<string, Column[]> = {
  'B2B Integration Platform': [
    { id:'c1',label:'Internet / Partners',   services:[],          subnet:'',             cidr:'',            nsg:'' },
    { id:'c2',label:'Ingress / DMZ',         services:['appgw'],   subnet:'snet-appgw',   cidr:'10.2.1.0/24', nsg:'Allow 443 inbound from internet, deny all else' },
    { id:'c3',label:'Integration Tier',      services:['apim','logicapps','appservice'],subnet:'snet-integration',cidr:'10.2.2.0/24',nsg:'Allow inbound from snet-appgw only' },
    { id:'c4',label:'Messaging Tier',        services:['svcbus','evtgrid','intaccount','storage'],subnet:'snet-messaging',cidr:'10.2.3.0/24',nsg:'Allow inbound from snet-integration only' },
    { id:'c5',label:'Hub Shared Services',   services:['firewall','dns'],subnet:'',       cidr:'',            nsg:'' },
    { id:'c6',label:'Outbound / Egress',     services:[],          subnet:'',             cidr:'',            nsg:'UDR: 0.0.0.0/0 → Hub Azure Firewall private IP' },
  ],
  'RAG / AI Platform': [
    { id:'c1',label:'Users / Voice',         services:[],          subnet:'',             cidr:'',            nsg:'' },
    { id:'c2',label:'Ingress',               services:['appgw','containerapps'],subnet:'snet-ingress',cidr:'10.3.1.0/24',nsg:'Allow 443/WSS inbound internet' },
    { id:'c3',label:'Compute / API',         services:['appservice','functions'],subnet:'snet-app', cidr:'10.3.2.0/24',nsg:'Allow from snet-ingress only' },
    { id:'c4',label:'AI Services',           services:['docintel','openai','aisearch'],subnet:'snet-ai',cidr:'10.3.3.0/24',nsg:'Allow from snet-app only' },
    { id:'c5',label:'Data Tier',             services:['storage','cosmos','redis','svcbus'],subnet:'snet-data',cidr:'10.3.4.0/24',nsg:'Allow from snet-app + snet-ai only' },
    { id:'c6',label:'Security & Monitor',    services:['kv','law','appi','defender'],subnet:'',cidr:'',nsg:'' },
  ],
  'Web Application (N-Tier)': [
    { id:'c1',label:'Global Traffic / CDN',  services:['frontdoor'],subnet:'',            cidr:'',            nsg:'' },
    { id:'c2',label:'Ingress / WAF',         services:['appgw'],   subnet:'snet-appgw',   cidr:'10.5.1.0/24', nsg:'Allow 443 inbound internet' },
    { id:'c3',label:'Application Tier',      services:['appservice','apim'],subnet:'snet-app',cidr:'10.5.2.0/24',nsg:'Allow from snet-appgw only' },
    { id:'c4',label:'Cache Tier',            services:['redis'],   subnet:'snet-cache',   cidr:'10.5.3.0/24', nsg:'Allow from snet-app only' },
    { id:'c5',label:'Data Tier',             services:['cosmos','storage'],subnet:'snet-data',cidr:'10.5.4.0/24',nsg:'Allow from snet-app + snet-cache only' },
    { id:'c6',label:'Security & Monitor',    services:['kv','adb2c','law','appi'],subnet:'',cidr:'',nsg:'' },
  ],
  'Hub-Spoke Landing Zone': [
    { id:'c1',label:'Internet',              services:[],          subnet:'',             cidr:'',            nsg:'' },
    { id:'c2',label:'Hub Network',           services:['firewall','appgw','dns'],subnet:'snet-hub',cidr:'10.0.0.0/24',nsg:'Managed by hub subscription' },
    { id:'c3',label:'Spoke Compute',         services:['appservice','functions'],subnet:'snet-app',cidr:'10.2.2.0/24',nsg:'Allow from hub only' },
    { id:'c4',label:'Spoke Data',            services:['cosmos','storage','redis'],subnet:'snet-data',cidr:'10.2.3.0/24',nsg:'Allow from snet-app only' },
    { id:'c5',label:'Security',              services:['kv','defender','adb2c'],subnet:'',cidr:'',nsg:'' },
    { id:'c6',label:'Observability',         services:['law','appi','monitor'],subnet:'',cidr:'',nsg:'' },
  ],
  'Custom': [
    { id:'c1',label:'Internet',              services:[],          subnet:'',             cidr:'',            nsg:'' },
    { id:'c2',label:'Ingress',               services:[],          subnet:'snet-ingress', cidr:'10.x.1.0/24', nsg:'' },
    { id:'c3',label:'Application',           services:[],          subnet:'snet-app',     cidr:'10.x.2.0/24', nsg:'' },
    { id:'c4',label:'Data',                  services:[],          subnet:'snet-data',    cidr:'10.x.3.0/24', nsg:'' },
  ],
}

const RG_STRATEGIES: Record<string, (prefix:string,platform:string)=>string[]> = {
  'By tier': (p) => [`rg-${p}-network — VNet, subnets, NSGs, UDRs, Application Gateway`,`rg-${p}-compute — Application tier services`,`rg-${p}-integration — Integration + messaging services`,`rg-${p}-data — Data + storage services`,`rg-${p}-security — Key Vault, Managed Identities, Defender`,`rg-${p}-monitor — Log Analytics, App Insights, Alerts`],
  'By platform type': (p,plat) => {
    const m: Record<string,string[]> = {
      'B2B Integration Platform':[`rg-${p}-network`,`rg-${p}-apim — APIM, API products, developer portal`,`rg-${p}-workflows — Logic Apps, Integration Account`,`rg-${p}-messaging — Service Bus, Event Grid, Storage`,`rg-${p}-security — Key Vault, Managed Identities`,`rg-${p}-monitor — Log Analytics, App Insights, Alerts`],
      'RAG / AI Platform':[`rg-${p}-network`,`rg-${p}-compute — App Service, Functions, Container Apps`,`rg-${p}-ai — Doc Intelligence, OpenAI, AI Search`,`rg-${p}-data — Blob Storage, Cosmos DB, Redis`,`rg-${p}-security`,`rg-${p}-monitor`],
    }
    return m[plat] || m['B2B Integration Platform']
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER — generates B2B-level detailed prompt from form state
// ═══════════════════════════════════════════════════════════════════════════
interface FormState {
  // Section A — Project
  projectName:string; clientName:string; industry:string; timeline:string; budget:number; rto:string; rpo:string
  // Section B — Deployment context
  subscriptionName:string; spokeVnetName:string; spokeVnetCidr:string
  connectToHub:boolean; hubVnetName:string; hubVnetCidr:string; hubServices:string[]
  // Section C — Platform
  platformType:string
  // Section D — Services (id → sku)
  selectedServices:Record<string,string>
  // Section E — Network layout
  layoutDirection:'column-wise'|'tier-based'; columns:Column[]
  // Section F — Traffic flows
  inboundFlow:string[]; outboundFlow:string; managementFlow:string[]
  extraFlows:string
  // Section G — Resource groups
  rgStrategy:string; rgPrefix:string
  // Section H — Security
  securityPosture:string; privateEndpoints:boolean; encryptionAtRest:string
  authMethods:string[]; wafRuleset:string; tlsVersion:string; compliance:string[]
  // Section I — HA
  haStrategy:string; primaryRegion:string; secondaryRegion:string
}

const DEFAULT: FormState = {
  projectName:'', clientName:'', industry:'Financial Services', timeline:'Production', budget:8000, rto:'1 hour', rpo:'15 minutes',
  subscriptionName:'sub-integration-prod', spokeVnetName:'vnet-integration-spoke', spokeVnetCidr:'10.2.0.0/16',
  connectToHub:true, hubVnetName:'vnet-hub', hubVnetCidr:'10.0.0.0/16',
  hubServices:['Azure Firewall (hub)','Private DNS Zones','DNS Resolver','Route Tables'],
  platformType:'B2B Integration Platform',
  selectedServices:{},
  layoutDirection:'column-wise', columns: JSON.parse(JSON.stringify(LAYOUT_PRESETS['B2B Integration Platform'])),
  inboundFlow:['B2B Partners / Internet','Application Gateway v2 (WAF, SSL termination)','APIM (partner auth, rate limiting)','Logic Apps (workflow processing)','Service Bus (message queuing)'],
  outboundFlow:'Logic Apps / APIM → UDR forces traffic to hub VNet → Hub Azure Firewall (FQDN filtering, logging) → Internet (partner endpoints)',
  managementFlow:['All services → Key Vault (MSI, certificate retrieval)','All compute → Log Analytics (telemetry, B2B tracking)','All services → Azure Monitor (alerts, dashboards)'],
  extraFlows:'',
  rgStrategy:'By platform type', rgPrefix:'integration',
  securityPosture:'Zero-Trust', privateEndpoints:true, encryptionAtRest:'CMK (Customer-Managed Keys)',
  authMethods:['OAuth2','Certificate-based partner authentication'],
  wafRuleset:'OWASP 3.2 + custom B2B rules', tlsVersion:'TLS 1.3',
  compliance:['SOC 2 Type II','ISO 27001'],
  haStrategy:'Multi-region active-passive', primaryRegion:'Australia East', secondaryRegion:'Australia Southeast',
}

function buildDetailedPrompt(f: FormState): string {
  const getSvc = (id:string) => SERVICE_CATALOGUE.find(s=>s.id===id)
  const svcList = Object.entries(f.selectedServices)
    .map(([id,sku]) => { const s=getSvc(id); return s?`- ${s.name} (${sku}) — ${s.purpose}`:'' })
    .filter(Boolean).join('\n')

  const columnsBlock = f.columns.map((col, i) => {
    const svcLines = col.services.map(sid => {
      const s = getSvc(sid)
      const sku = f.selectedServices[sid]
      return s ? `  ${s.name}${sku?` (${sku})':''}` : ''
    }).filter(Boolean).join('\n')
    const isFirst = i===0, isLast = i===f.columns.length-1
    const pos = isFirst?' (leftmost)':isLast?' (rightmost)':''
    let block = `COLUMN ${i+1} — ${col.label}${pos}:`
    if(svcLines) block += '\n'+svcLines
    if(col.subnet) block += `\n  Subnet: ${col.subnet}${col.cidr?` (${col.cidr})`:''}`
    if(col.nsg)    block += `\n  NSG: ${col.nsg}`
    return block
  }).join('\n\n')

  const rgBlock = RG_STRATEGIES[f.rgStrategy]
    ? RG_STRATEGIES[f.rgStrategy](f.rgPrefix, f.platformType).join('\n  ')
    : `rg-${f.rgPrefix}-network\n  rg-${f.rgPrefix}-compute\n  rg-${f.rgPrefix}-data\n  rg-${f.rgPrefix}-security\n  rg-${f.rgPrefix}-monitor`

  const inboundChain = f.inboundFlow.join('\n  → ')
  const mgmtBlock = f.managementFlow.join('\n  ')

  return `Design an Azure ${f.platformType} architecture${f.projectName?` for "${f.projectName}"`:''}.${f.clientName?`\nClient: ${f.clientName}.`:''}

━━━ DEPLOYMENT CONTEXT ━━━
- New spoke subscription: ${f.subscriptionName}
- New spoke VNet: ${f.spokeVnetName} (${f.spokeVnetCidr})${f.connectToHub?`
- Existing hub-spoke topology: connect to ${f.hubVnetName} (${f.hubVnetCidr}) via VNet peering
- Reuse existing shared services: ${f.hubServices.join(', ')}`:'\n- Standalone VNet — no hub connectivity'}

━━━ PLATFORM COMPONENTS TO INCLUDE ━━━
${svcList||'[No services selected — select services in Section C]'}

━━━ NETWORK ARCHITECTURE — ${f.layoutDirection} layout ━━━

${columnsBlock}

━━━ TRAFFIC FLOWS TO SHOW ━━━

INBOUND FLOW (internet → platform):
  ${inboundChain}

OUTBOUND FLOW (platform → internet${f.connectToHub?' via hub firewall':''}):
  ${f.outboundFlow}

MANAGEMENT FLOW:
  ${mgmtBlock}
${f.extraFlows?`\nADDITIONAL FLOWS:\n  ${f.extraFlows}`:''}

━━━ RESOURCE GROUPING ━━━
  ${rgBlock}

━━━ COMPLIANCE & SECURITY ━━━
- Security posture: ${f.securityPosture}
${f.privateEndpoints?'- All services use private endpoints (no public data plane)\n':''}${f.encryptionAtRest?`- Encryption at rest: ${f.encryptionAtRest}\n`:''}${f.authMethods.length?`- Authentication: ${f.authMethods.join(' + ')}\n`:''}${f.wafRuleset?`- WAF policy: ${f.wafRuleset}\n`:''}${f.tlsVersion?`- ${f.tlsVersion} enforced end-to-end\n`:''}${f.compliance.length?`- Compliance: ${f.compliance.join(', ')}`:''}

━━━ DELIVERY ━━━
REGION: ${f.primaryRegion}
HA: ${f.haStrategy}${f.secondaryRegion?` (${f.secondaryRegion} DR)`:''}
TIMELINE: ${f.timeline}
BUDGET: A$${f.budget.toLocaleString()}/month
RTO: ${f.rto}, RPO: ${f.rpo}

━━━ DIAGRAM REQUIREMENTS ━━━
- Generate 10–16 Azure services minimum
- Show all ${f.columns.length} columns/tiers with proper boundaries
- Every subnet must have CIDR block and NSG rules shown
- Show private endpoints for all data services
- Show all 3 traffic flows: inbound, outbound, management
- Resource groups shown as dashed boundary overlays
- WAF validation scores for all 5 pillars (Reliability/Security/Performance/Cost/Operations)
- Cost breakdown per service in AUD (Australia East pricing)
- Minimum 3 cost optimisation recommendations
- List all assumptions made`
}

// ═══════════════════════════════════════════════════════════════════════════
// SVG DIAGRAM RENDERER
// ═══════════════════════════════════════════════════════════════════════════
const BCOL: Record<string,{stroke:string;fill:string;lc:string}> = {
  subscription:{stroke:'#0078D4',fill:'none',lc:'#0078D4'},
  vnet:{stroke:'#00B4D8',fill:'none',lc:'#00B4D8'},
  column:{stroke:'#737373',fill:'rgba(248,249,250,0.8)',lc:'#555'},
  resource_group:{stroke:'#68217A',fill:'none',lc:'#68217A'},
  internet:{stroke:'#8a8886',fill:'#f5f5f5',lc:'#444'},
  external:{stroke:'#D13438',fill:'#fff5f5',lc:'#D13438'},
}
const ECOL: Record<string,{s:string;d:string}> = {
  sync:{s:'#0078D4',d:'none'}, async:{s:'#FBBA00',d:'8 4'},
  msi:{s:'#ECD01E',d:'4 3'},   telemetry:{s:'#84278F',d:'4 3'},
  external:{s:'#D13438',d:'8 4'},
}

function renderDiagram(diagram:any, onNodeClick:(s:any)=>void, selectedId?:string) {
  const svcs = diagram.services||[]
  const conns = diagram.connections||[]
  const bunds = diagram.boundaries||[]
  const cols = 4
  const NW=80,NH=88,CW=190,PX=30,PY=130,XG=20,YG=140

  // Auto-layout: place services in columns
  type Pos = {x:number;y:number}
  const pos: Record<string,Pos> = {}
  svcs.forEach((s:any,i:number) => {
    pos[s.id] = { x: PX+(i%cols)*(NW+XG), y: PY+Math.floor(i/cols)*YG }
  })

  const W = Math.max(900, PX*2 + cols*(NW+XG) + 60)
  const H = Math.max(600, PY + Math.ceil(svcs.length/cols)*YG + 100)

  return { pos, W, H, svcs, conns, bunds }
}

function WafBar({label,score,color}:{label:string;score:number;color:string}) {
  return (
    <div style={{marginBottom:7}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2,...SS}}>
        <span style={{color:'#444'}}>{label}</span>
        <span style={{fontWeight:600,color}}>{score}/100</span>
      </div>
      <div style={{height:5,background:'#f0f0f0',borderRadius:99,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${score}%`,background:color,borderRadius:99,transition:'width .8s'}}/>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
function FL({label,help,children}:{label:string;help?:string;children:React.ReactNode}) {
  return (
    <div style={{marginBottom:12}}>
      <label style={{fontSize:11,fontWeight:600,color:'#333',display:'block',marginBottom:3,...SS}}>{label}</label>
      {help&&<div style={{fontSize:10,color:'#888',marginBottom:4,lineHeight:1.5,...SS}}>{help}</div>}
      {children}
    </div>
  )
}
const inp:React.CSSProperties={width:'100%',padding:'6px 9px',border:'1.5px solid #e0e0e0',
  borderRadius:6,fontSize:11,color:'#333',background:'#fff',...SS,outline:'none',boxSizing:'border-box'}
function Inp({value,onChange,placeholder}:{value:string;onChange:(v:string)=>void;placeholder?:string}) {
  return <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={inp}
    onFocus={e=>{e.currentTarget.style.borderColor='#0078D4'}}
    onBlur={e=>{e.currentTarget.style.borderColor='#e0e0e0'}}/>
}
function Sel({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:string[]}) {
  return <select value={value} onChange={e=>onChange(e.target.value)}
    style={{...inp,cursor:'pointer',...SS}}>
    {options.map(o=><option key={o}>{o}</option>)}
  </select>
}
function Tog({value,onChange,label}:{value:boolean;onChange:(v:boolean)=>void;label:string}) {
  return (
    <div onClick={()=>onChange(!value)} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'4px 0'}}>
      <div style={{width:32,height:18,borderRadius:99,background:value?'#0078D4':'#ddd',position:'relative',transition:'background .2s',flexShrink:0}}>
        <div style={{position:'absolute',width:14,height:14,borderRadius:'50%',background:'#fff',top:2,left:value?16:2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}}/>
      </div>
      <span style={{fontSize:11,color:'#444',...SS}}>{label}</span>
    </div>
  )
}
function Chips({options,selected,onChange}:{options:string[];selected:string[];onChange:(v:string[])=>void}) {
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
      {options.map(o=>(
        <button key={o} onClick={()=>onChange(selected.includes(o)?selected.filter(x=>x!==o):[...selected,o])}
          style={{fontSize:10,padding:'3px 8px',border:'1px solid',borderRadius:99,
            borderColor:selected.includes(o)?'#0078D4':'#ddd',
            background:selected.includes(o)?'#0078D4':'#fafafa',
            color:selected.includes(o)?'#fff':'#555',cursor:'pointer',...SS}}>
          {o}
        </button>
      ))}
    </div>
  )
}

// Step header
const STEPS = [
  {n:1,icon:'📋',label:'Project'},
  {n:2,icon:'🌐',label:'Deployment'},
  {n:3,icon:'⚙️',label:'Services'},
  {n:4,icon:'🗺️',label:'Network'},
  {n:5,icon:'↔️',label:'Traffic'},
  {n:6,icon:'📦',label:'Resource Groups'},
  {n:7,icon:'🔒',label:'Security'},
  {n:8,icon:'🛡️',label:'HA / DR'},
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [f, setF] = useState<FormState>(DEFAULT)
  const [step, setStep] = useState(1)
  const [diagram, setDiagram] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [genPrompt, setGenPrompt] = useState('')
  const [showPromptPreview, setShowPromptPreview] = useState(false)
  const [rightPanel, setRightPanel] = useState<'waf'|'cost'|'prompt'>('waf')
  const [selSvc, setSelSvc] = useState<any>(null)
  const msgIdx = useRef(0)

  const upd = <K extends keyof FormState>(k:K,v:FormState[K]) => setF(p=>({...p,[k]:v}))

  const MSGS=['Analysing requirements...','Mapping architecture pattern...','Selecting Azure services...','Planning network topology...','Applying security controls...','Validating WAF pillars...','Estimating costs...','Finalising diagram...']

  async function generate() {
    const prompt = buildDetailedPrompt(f)
    setGenPrompt(prompt)
    setError('')
    setLoading(true)
    setDiagram(null)
    msgIdx.current=0; setLoadingMsg(MSGS[0])
    const iv=setInterval(()=>{msgIdx.current=(msgIdx.current+1)%MSGS.length;setLoadingMsg(MSGS[msgIdx.current])},2500)
    try {
      const res=await fetch(`${API}/api/generate`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          prompt, industry:f.industry, workload:f.platformType,
          compute:Object.keys(f.selectedServices).join(', '),
          ha:f.haStrategy, security:f.securityPosture,
          compliance:f.compliance, budget_aud:f.budget,
          region:f.primaryRegion, timeline:f.timeline
        })
      })
      if(!res.ok) throw new Error(await res.text())
      const data=await res.json()
      setDiagram(data)
      setRightPanel('waf')
    } catch(e:any){setError(`Generation failed: ${e.message}`)}
    finally{clearInterval(iv);setLoading(false)}
  }

  async function exportDrawio() {
    if(!diagram)return
    const res=await fetch(`${API}/api/export/drawio`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({diagram})})
    const data=await res.json()
    const blob=new Blob([data.xml],{type:'application/xml'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a');a.href=url;a.download=data.filename;a.click()
    URL.revokeObjectURL(url)
  }

  const waf=diagram?.waf_validation
  const cost=diagram?.cost_estimate
  const totalCost=cost?.total_aud||(diagram?.services||[]).reduce((s:number,sv:any)=>s+(sv.estimated_cost_aud||0),0)
  const pillars=[{k:'reliability',l:'Reliability',c:'#107C10'},{k:'security',l:'Security',c:'#0078D4'},{k:'performance',l:'Performance',c:'#8764B8'},{k:'cost',l:'Cost',c:'#004B1C'},{k:'operations',l:'Operations',c:'#737373'}]

  // Filter catalogue by category for the selected platform
  const CAT_ORDER = ['Ingress','Compute','Integration','Messaging','Data','AI','Security','Monitor','Network']

  function toggleService(id:string) {
    if(f.selectedServices[id]!==undefined) {
      const n={...f.selectedServices}; delete n[id]; upd('selectedServices',n)
    } else {
      const svc=SERVICE_CATALOGUE.find(s=>s.id===id)
      upd('selectedServices',{...f.selectedServices,[id]:svc?.skus[0]||''})
    }
  }

  function setSku(id:string,sku:string) {
    upd('selectedServices',{...f.selectedServices,[id]:sku})
  }

  function applyPreset(type:string) {
    const preset = LAYOUT_PRESETS[type] || LAYOUT_PRESETS['Custom']
    // Only pre-select services from preset that are in catalogue
    const presetSvcs: Record<string,string> = {}
    preset.forEach(col => col.services.forEach(sid => {
      const svc = SERVICE_CATALOGUE.find(s=>s.id===sid)
      if(svc) presetSvcs[sid] = svc.skus[0]
    }))
    // Always add monitoring
    ;['kv','law','appi','monitor','defender'].forEach(sid=>{
      const svc=SERVICE_CATALOGUE.find(s=>s.id===sid)
      if(svc) presetSvcs[sid]=svc.skus[0]
    })
    upd('selectedServices',{...presetSvcs,...f.selectedServices})
    upd('columns',JSON.parse(JSON.stringify(preset)))
    upd('platformType',type)
  }

  // Update a column field
  function updateCol(colId:string, field:keyof Column, value:any) {
    upd('columns', f.columns.map(c=>c.id===colId?{...c,[field]:value}:c))
  }
  function toggleColSvc(colId:string, svcId:string) {
    upd('columns', f.columns.map(c=>{
      if(c.id!==colId)return c
      const svcs=c.services.includes(svcId)?c.services.filter(x=>x!==svcId):[...c.services,svcId]
      return {...c,services:svcs}
    }))
  }
  function addColumn() {
    const n=f.columns.length+1
    upd('columns',[...f.columns,{id:`c${Date.now()}`,label:`Column ${n}`,services:[],subnet:`snet-tier${n}`,cidr:`10.x.${n}.0/24`,nsg:''}])
  }
  function removeColumn(colId:string) {
    upd('columns',f.columns.filter(c=>c.id!==colId))
  }

  const currentStep = STEPS[step-1]

  return (
    <div style={{display:'flex',height:'100vh',width:'100vw',...SS,background:'#f0f2f5',overflow:'hidden'}}>

      {/* ── STEP RAIL ── */}
      <div style={{width:56,background:'#1a1a2e',display:'flex',flexDirection:'column',alignItems:'center',padding:'12px 0',gap:2,flexShrink:0}}>
        <div style={{width:34,height:34,borderRadius:9,background:'#0078D4',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12}}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="9" cy="9" r="2.5" fill="white"/>
          </svg>
        </div>
        {STEPS.map(s=>(
          <div key={s.n} onClick={()=>setStep(s.n)} title={s.label}
            style={{width:40,height:40,borderRadius:8,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',cursor:'pointer',
              background:step===s.n?'rgba(0,120,212,0.3)':'transparent',
              border:step===s.n?'1px solid #0078D4':'1px solid transparent',
              transition:'all .15s',gap:1}}>
            <div style={{fontSize:15}}>{s.icon}</div>
            <div style={{fontSize:7,color:step===s.n?'#60a5fa':'#666',...SS}}>{s.n}</div>
          </div>
        ))}
      </div>

      {/* ── FORM PANEL ── */}
      <div style={{width:320,background:'#fff',display:'flex',flexDirection:'column',overflow:'hidden',borderRight:'1px solid #e8e8e8',boxShadow:'2px 0 8px rgba(0,0,0,.04)'}}>

        {/* Step header */}
        <div style={{padding:'12px 14px 10px',borderBottom:'1px solid #f0f0f0',
          background:`linear-gradient(135deg, #1a1a2e, #0c3460)`}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:22}}>{currentStep?.icon}</span>
            <div>
              <div style={{fontSize:11,color:'rgba(255,255,255,.6)',...SS}}>Step {step} of {STEPS.length}</div>
              <div style={{fontSize:14,fontWeight:700,color:'#fff',...SS}}>{currentStep?.label}</div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{marginTop:10,height:3,background:'rgba(255,255,255,.15)',borderRadius:99}}>
            <div style={{height:'100%',background:'#0078D4',borderRadius:99,width:`${(step/STEPS.length)*100}%`,transition:'width .3s'}}/>
          </div>
          {/* Step dots */}
          <div style={{display:'flex',gap:4,marginTop:8,justifyContent:'center'}}>
            {STEPS.map(s=>(
              <div key={s.n} onClick={()=>setStep(s.n)}
                style={{width:6,height:6,borderRadius:'50%',cursor:'pointer',
                  background:step===s.n?'#0078D4':step>s.n?'rgba(255,255,255,.5)':'rgba(255,255,255,.2)',
                  transition:'all .15s'}}/>
            ))}
          </div>
        </div>

        {/* Form content */}
        <div style={{flex:1,overflow:'auto',padding:'12px 13px'}}>

          {/* ── STEP 1: PROJECT ── */}
          {step===1&&<div>
            <FL label="Project / solution name">
              <Inp value={f.projectName} onChange={v=>upd('projectName',v)} placeholder="e.g. B2B Integration Hub"/>
            </FL>
            <FL label="Client / organisation name">
              <Inp value={f.clientName} onChange={v=>upd('clientName',v)} placeholder="e.g. Contoso Financial"/>
            </FL>
            <FL label="Industry vertical">
              <Sel value={f.industry} onChange={v=>upd('industry',v)} options={['Financial Services & Banking','Healthcare & Life Sciences','Legal & Professional Services','Retail & E-commerce','Transport & Logistics','Government & Public Sector','Manufacturing & Industry 4.0','Energy & Utilities','Education & Research','Media & Entertainment','Defence & Security','General Enterprise']}/>
            </FL>
            <FL label="Timeline / environment">
              <div style={{display:'flex',gap:6}}>
                {['POC','Pilot','Production'].map(t=>(
                  <button key={t} onClick={()=>upd('timeline',t)} style={{flex:1,padding:'6px 0',fontSize:11,
                    border:'1px solid',borderColor:f.timeline===t?'#0078D4':'#ddd',borderRadius:6,
                    background:f.timeline===t?'#0078D4':'#fff',color:f.timeline===t?'#fff':'#555',
                    cursor:'pointer',...SS}}>{t}</button>
                ))}
              </div>
            </FL>
            <FL label={`Monthly budget: A$${f.budget.toLocaleString()}`}>
              <input type="range" min={500} max={50000} step={500} value={f.budget}
                onChange={e=>upd('budget',+e.target.value)} style={{width:'100%'}}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#888',marginTop:2,...SS}}>
                <span>A$500</span><span>A$50,000</span>
              </div>
            </FL>
          </div>}

          {/* ── STEP 2: DEPLOYMENT CONTEXT ── */}
          {step===2&&<div>
            <FL label="Spoke subscription name">
              <Inp value={f.subscriptionName} onChange={v=>upd('subscriptionName',v)} placeholder="sub-integration-prod"/>
            </FL>
            <FL label="Spoke VNet name">
              <Inp value={f.spokeVnetName} onChange={v=>upd('spokeVnetName',v)} placeholder="vnet-integration-spoke"/>
            </FL>
            <FL label="Spoke VNet CIDR">
              <Sel value={f.spokeVnetCidr} onChange={v=>upd('spokeVnetCidr',v)} options={['10.1.0.0/16','10.2.0.0/16','10.3.0.0/16','10.4.0.0/16','10.5.0.0/16','172.16.0.0/16','192.168.0.0/16']}/>
            </FL>
            <Tog value={f.connectToHub} onChange={v=>upd('connectToHub',v)} label="Connect to existing hub VNet"/>
            {f.connectToHub&&<>
              <div style={{marginTop:8}}>
              <FL label="Hub VNet name">
                <Inp value={f.hubVnetName} onChange={v=>upd('hubVnetName',v)} placeholder="vnet-hub"/>
              </FL>
              <FL label="Hub VNet CIDR">
                <Sel value={f.hubVnetCidr} onChange={v=>upd('hubVnetCidr',v)} options={['10.0.0.0/16','10.0.0.0/8','172.16.0.0/12']}/>
              </FL>
              <FL label="Hub services to reuse">
                <Chips options={['Azure Firewall (hub)','Azure Firewall Premium (hub)','Private DNS Zones','DNS Resolver','Route Tables','ExpressRoute Gateway','VPN Gateway','Azure Bastion','DDoS Protection Standard','Network Watcher']}
                  selected={f.hubServices} onChange={v=>upd('hubServices',v)}/>
              </FL>
              </div>
            </>}
          </div>}

          {/* ── STEP 3: SERVICES ── */}
          {step===3&&<div>
            <FL label="Platform type">
              <Sel value={f.platformType} onChange={v=>{upd('platformType',v);applyPreset(v)}}
                options={['B2B Integration Platform','RAG / AI Platform','Web Application (N-Tier)','Hub-Spoke Landing Zone','Data Platform (Lakehouse)','AKS Microservices','Multi-Region HA','Zero-Trust Security','Custom']}/>
            </FL>
            <div style={{fontSize:10,color:'#888',marginBottom:10,lineHeight:1.5,...SS}}>
              Select each Azure service and choose its SKU/tier. Services will appear in the network layout.
            </div>
            {CAT_ORDER.map(cat=>{
              const catSvcs=SERVICE_CATALOGUE.filter(s=>s.cat===cat)
              if(!catSvcs.length)return null
              return <div key={cat} style={{marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,color:'#444',marginBottom:5,textTransform:'uppercase',letterSpacing:.5,...SS}}>{cat}</div>
                {catSvcs.map(svc=>{
                  const sel=f.selectedServices[svc.id]!==undefined
                  return <div key={svc.id} style={{marginBottom:6}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:7,
                      border:`1px solid ${sel?'#0078D4':'#eee'}`,background:sel?'#EFF6FF':'#fafafa',
                      cursor:'pointer'}} onClick={()=>toggleService(svc.id)}>
                      <img src={iconUrl(svc.icon)} width={22} height={22} style={{objectFit:'contain',flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:500,color:sel?'#0078D4':'#333',...SS}}>{svc.name}</div>
                        <div style={{fontSize:9,color:'#888',...SS}}>{svc.purpose}</div>
                      </div>
                      <div style={{width:16,height:16,borderRadius:'50%',border:`1.5px solid ${sel?'#0078D4':'#ddd'}`,
                        background:sel?'#0078D4':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {sel&&<div style={{width:6,height:6,borderRadius:'50%',background:'#fff'}}/>}
                      </div>
                    </div>
                    {sel&&<select value={f.selectedServices[svc.id]} onChange={e=>{e.stopPropagation();setSku(svc.id,e.target.value)}}
                      style={{...inp,marginTop:3,fontSize:10,padding:'4px 8px'}}>
                      {svc.skus.map(sk=><option key={sk}>{sk}</option>)}
                    </select>}
                  </div>
                })}
              </div>
            })}
          </div>}

          {/* ── STEP 4: NETWORK LAYOUT ── */}
          {step===4&&<div>
            <FL label="Layout direction">
              <div style={{display:'flex',gap:6,marginBottom:10}}>
                {(['column-wise','tier-based'] as const).map(d=>(
                  <button key={d} onClick={()=>upd('layoutDirection',d)} style={{flex:1,padding:'8px 0',fontSize:11,
                    border:'1px solid',borderColor:f.layoutDirection===d?'#0078D4':'#ddd',borderRadius:6,
                    background:f.layoutDirection===d?'#0078D4':'#fff',color:f.layoutDirection===d?'#fff':'#555',
                    cursor:'pointer',...SS}}>
                    {d==='column-wise'?'↔ Column-wise':'↕ Tier-based'}
                  </button>
                ))}
              </div>
            </FL>
            <div style={{fontSize:10,color:'#888',marginBottom:10,...SS}}>
              Define each {f.layoutDirection==='column-wise'?'column':'tier'}, its label, which services it contains, and its subnet details.
            </div>
            {f.columns.map((col,ci)=>(
              <div key={col.id} style={{marginBottom:10,border:'1px solid #e8e8e8',borderRadius:8,padding:10,background:'#fafafa'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:5,background:'#0078D4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>{ci+1}</div>
                  <input value={col.label} onChange={e=>updateCol(col.id,'label',e.target.value)}
                    style={{...inp,fontSize:11,padding:'4px 8px',flex:1}}/>
                  {f.columns.length>2&&<button onClick={()=>removeColumn(col.id)}
                    style={{fontSize:12,padding:'2px 7px',border:'1px solid #ffcdd2',borderRadius:5,background:'#fff0f0',color:'#c62828',cursor:'pointer'}}>✕</button>}
                </div>
                {/* Services in this column */}
                <div style={{marginBottom:6}}>
                  <div style={{fontSize:9,fontWeight:600,color:'#888',marginBottom:4,...SS}}>SERVICES</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                    {Object.keys(f.selectedServices).map(sid=>{
                      const svc=SERVICE_CATALOGUE.find(s=>s.id===sid)
                      if(!svc)return null
                      const inCol=col.services.includes(sid)
                      return <button key={sid} onClick={()=>toggleColSvc(col.id,sid)}
                        style={{fontSize:9,padding:'2px 7px',border:'1px solid',borderRadius:99,
                          borderColor:inCol?'#0078D4':'#ddd',background:inCol?'#0078D4':'#fff',
                          color:inCol?'#fff':'#555',cursor:'pointer',...SS}}>
                        {svc.name.replace('Azure ','').replace('Microsoft ','').substring(0,18)}
                      </button>
                    })}
                    {Object.keys(f.selectedServices).length===0&&<span style={{fontSize:9,color:'#bbb',...SS}}>Select services in Step 3 first</span>}
                  </div>
                </div>
                {/* Subnet */}
                <div style={{display:'flex',gap:6,marginBottom:4}}>
                  <input value={col.subnet} onChange={e=>updateCol(col.id,'subnet',e.target.value)}
                    placeholder="snet-name" style={{...inp,fontSize:10,padding:'4px 8px',flex:1}}/>
                  <input value={col.cidr} onChange={e=>updateCol(col.id,'cidr',e.target.value)}
                    placeholder="10.x.1.0/24" style={{...inp,fontSize:10,padding:'4px 8px',width:110}}/>
                </div>
                {/* NSG */}
                <input value={col.nsg} onChange={e=>updateCol(col.id,'nsg',e.target.value)}
                  placeholder="NSG rules: allow 443 inbound from internet, deny all else"
                  style={{...inp,fontSize:10,padding:'4px 8px'}}/>
              </div>
            ))}
            <button onClick={addColumn} style={{width:'100%',padding:'7px 0',fontSize:11,border:'1.5px dashed #0078D4',
              borderRadius:7,background:'#EFF6FF',color:'#0078D4',cursor:'pointer',...SS}}>
              + Add {f.layoutDirection==='column-wise'?'column':'tier'}
            </button>
          </div>}

          {/* ── STEP 5: TRAFFIC FLOWS ── */}
          {step===5&&<div>
            <FL label="Inbound flow (internet → platform)" help="Add each hop in order — drag to reorder">
              {f.inboundFlow.map((hop,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                  <div style={{width:20,height:20,borderRadius:'50%',background:'#0078D4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'#fff',flexShrink:0}}>{i+1}</div>
                  <input value={hop} onChange={e=>{const a=[...f.inboundFlow];a[i]=e.target.value;upd('inboundFlow',a)}}
                    style={{...inp,fontSize:10,padding:'4px 8px',flex:1}}/>
                  {f.inboundFlow.length>2&&<button onClick={()=>upd('inboundFlow',f.inboundFlow.filter((_,j)=>j!==i))}
                    style={{fontSize:11,padding:'2px 6px',border:'1px solid #ffcdd2',borderRadius:5,background:'#fff0f0',color:'#c62828',cursor:'pointer'}}>✕</button>}
                </div>
              ))}
              <button onClick={()=>upd('inboundFlow',[...f.inboundFlow,''])}
                style={{fontSize:10,padding:'4px 10px',border:'1.5px dashed #0078D4',borderRadius:6,background:'#EFF6FF',color:'#0078D4',cursor:'pointer',marginTop:4,...SS}}>
                + Add hop
              </button>
            </FL>
            <FL label="Outbound flow description">
              <textarea value={f.outboundFlow} onChange={e=>upd('outboundFlow',e.target.value)} rows={3}
                style={{...inp,resize:'vertical',lineHeight:1.5}}/>
            </FL>
            <FL label="Management flows">
              {f.managementFlow.map((mf,i)=>(
                <div key={i} style={{display:'flex',gap:6,marginBottom:5}}>
                  <input value={mf} onChange={e=>{const a=[...f.managementFlow];a[i]=e.target.value;upd('managementFlow',a)}}
                    style={{...inp,fontSize:10,padding:'4px 8px',flex:1}}/>
                  {f.managementFlow.length>1&&<button onClick={()=>upd('managementFlow',f.managementFlow.filter((_,j)=>j!==i))}
                    style={{fontSize:11,padding:'2px 6px',border:'1px solid #ffcdd2',borderRadius:5,background:'#fff0f0',color:'#c62828',cursor:'pointer'}}>✕</button>}
                </div>
              ))}
              <button onClick={()=>upd('managementFlow',[...f.managementFlow,''])}
                style={{fontSize:10,padding:'4px 10px',border:'1.5px dashed #ddd',borderRadius:6,background:'#fafafa',color:'#555',cursor:'pointer',marginTop:4,...SS}}>
                + Add flow
              </button>
            </FL>
            <FL label="Additional flows (optional)">
              <textarea value={f.extraFlows} onChange={e=>upd('extraFlows',e.target.value)}
                placeholder="e.g. DLQ retry: Service Bus DLQ → Functions → retry with exponential backoff → alert on max retries"
                rows={3} style={{...inp,resize:'vertical',lineHeight:1.5}}/>
            </FL>
          </div>}

          {/* ── STEP 6: RESOURCE GROUPS ── */}
          {step===6&&<div>
            <FL label="Resource group name prefix">
              <Inp value={f.rgPrefix} onChange={v=>upd('rgPrefix',v)} placeholder="integration"/>
            </FL>
            <FL label="Grouping strategy">
              <Sel value={f.rgStrategy} onChange={v=>upd('rgStrategy',v)}
                options={['By tier','By platform type','By team','By lifecycle']}/>
            </FL>
            <div style={{background:'#f8f9fa',borderRadius:8,padding:10,marginTop:8}}>
              <div style={{fontSize:10,fontWeight:600,color:'#444',marginBottom:6,...SS}}>Generated resource groups:</div>
              {(RG_STRATEGIES[f.rgStrategy]?.(f.rgPrefix,f.platformType)||[`rg-${f.rgPrefix}-platform`]).map((rg,i)=>(
                <div key={i} style={{fontSize:10,color:'#555',padding:'3px 0',borderBottom:'1px solid #eee',lineHeight:1.5,...SS}}>
                  {rg}
                </div>
              ))}
            </div>
          </div>}

          {/* ── STEP 7: SECURITY ── */}
          {step===7&&<div>
            <FL label="Security posture">
              <div style={{display:'flex',gap:6,marginBottom:4}}>
                {['Basic','Standard','Zero-Trust'].map(p=>(
                  <button key={p} onClick={()=>upd('securityPosture',p)} style={{flex:1,padding:'6px 0',fontSize:10,
                    border:'1px solid',borderColor:f.securityPosture===p?'#0078D4':'#ddd',borderRadius:6,
                    background:f.securityPosture===p?'#0078D4':'#fff',color:f.securityPosture===p?'#fff':'#555',
                    cursor:'pointer',...SS}}>{p}</button>
                ))}
              </div>
            </FL>
            <Tog value={f.privateEndpoints} onChange={v=>upd('privateEndpoints',v)} label="Private endpoints on ALL data services"/>
            <div style={{marginTop:8}}>
            <FL label="Encryption at rest">
              <Sel value={f.encryptionAtRest} onChange={v=>upd('encryptionAtRest',v)}
                options={['PMK (Platform-Managed Keys)','CMK (Customer-Managed Keys)','BYOK (Bring Your Own Key)','Double encryption (PMK + CMK)']}/>
            </FL>
            <FL label="Authentication methods">
              <Chips options={['OAuth2','Certificate-based partner authentication','Entra ID SSO','Azure AD B2C','SAML 2.0','API key + subscription','Managed Identity (MSI)']}
                selected={f.authMethods} onChange={v=>upd('authMethods',v)}/>
            </FL>
            <FL label="WAF ruleset">
              <Sel value={f.wafRuleset} onChange={v=>upd('wafRuleset',v)}
                options={['OWASP 3.2 + custom B2B rules','OWASP 3.2 prevention mode','DRS 2.1 (Front Door)','OWASP 3.2 + bot protection','Custom rules only']}/>
            </FL>
            <FL label="TLS minimum version">
              <div style={{display:'flex',gap:6}}>
                {['TLS 1.2','TLS 1.3'].map(t=>(
                  <button key={t} onClick={()=>upd('tlsVersion',t)} style={{flex:1,padding:'6px 0',fontSize:10,
                    border:'1px solid',borderColor:f.tlsVersion===t?'#0078D4':'#ddd',borderRadius:6,
                    background:f.tlsVersion===t?'#0078D4':'#fff',color:f.tlsVersion===t?'#fff':'#555',cursor:'pointer',...SS}}>{t}</button>
                ))}
              </div>
            </FL>
            <FL label="Compliance frameworks">
              <Chips options={['SOC 2 Type II','ISO 27001:2022','GDPR','HIPAA','IRAP','APRA CPS 234','PCI-DSS v4.0','ASD Essential Eight','NIST SP 800-53']}
                selected={f.compliance} onChange={v=>upd('compliance',v)}/>
            </FL>
            </div>
          </div>}

          {/* ── STEP 8: HA / DR ── */}
          {step===8&&<div>
            <FL label="High availability strategy">
              <Sel value={f.haStrategy} onChange={v=>upd('haStrategy',v)}
                options={['Single region — no HA (dev/test)','Zone-redundant — Availability Zones','Multi-region active-passive','Multi-region active-active','Global active-active (Front Door + 3+ regions)']}/>
            </FL>
            <FL label="Primary region">
              <Sel value={f.primaryRegion} onChange={v=>upd('primaryRegion',v)}
                options={['Australia East','Australia Southeast','East US 2','UK South','West Europe','Southeast Asia','Japan East','Canada Central']}/>
            </FL>
            <FL label="Secondary / DR region">
              <Sel value={f.secondaryRegion} onChange={v=>upd('secondaryRegion',v)}
                options={['Australia Southeast','Australia East','West US 2','UK West','North Europe','East Asia','Japan West']}/>
            </FL>
            <FL label="Recovery Time Objective (RTO)">
              <Sel value={f.rto} onChange={v=>upd('rto',v)}
                options={['5 minutes (mission critical)','15 minutes (tier 1)','1 hour (tier 2)','4 hours (standard)','24 hours (best effort)']}/>
            </FL>
            <FL label="Recovery Point Objective (RPO)">
              <Sel value={f.rpo} onChange={v=>upd('rpo',v)}
                options={['0 — zero data loss','1 minute','15 minutes','1 hour','4 hours','24 hours']}/>
            </FL>
          </div>}

          {error&&<div style={{background:'#fff0f0',border:'1px solid #ffcdd2',borderRadius:8,padding:'8px 11px',fontSize:10,color:'#c62828',marginTop:10,...SS}}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{borderTop:'1px solid #f0f0f0',padding:'10px 13px',background:'#fafafa'}}>
          {/* Prompt preview toggle */}
          <button onClick={()=>setShowPromptPreview(!showPromptPreview)}
            style={{width:'100%',marginBottom:8,fontSize:10,padding:'5px 0',
              border:'1px solid #d0e8ff',borderRadius:6,background:'#f0f7ff',
              color:'#0078D4',cursor:'pointer',...SS}}>
            {showPromptPreview?'▲ Hide prompt preview':'▼ Preview generated prompt'}
          </button>
          {showPromptPreview&&<div style={{background:'#1a1a2e',borderRadius:8,padding:8,fontSize:8,
            color:'#94a3b8',lineHeight:1.6,maxHeight:160,overflow:'auto',marginBottom:8,
            fontFamily:'monospace',whiteSpace:'pre-wrap'}}>
            {buildDetailedPrompt(f)}
          </div>}

          {/* Nav buttons */}
          <div style={{display:'flex',gap:6,marginBottom:8}}>
            {step>1&&<button onClick={()=>setStep(s=>s-1)}
              style={{flex:1,padding:'8px 0',fontSize:11,border:'1px solid #ddd',borderRadius:7,
                background:'#fff',color:'#555',cursor:'pointer',...SS}}>← Back</button>}
            {step<STEPS.length
              ?<button onClick={()=>setStep(s=>s+1)}
                style={{flex:2,padding:'8px 0',fontSize:11,fontWeight:600,border:'none',
                  borderRadius:7,background:'#0078D4',color:'#fff',cursor:'pointer',...SS}}>
                Next: {STEPS[step]?.label} →
              </button>
              :<button onClick={generate} disabled={loading}
                style={{flex:2,padding:'8px 0',fontSize:11,fontWeight:600,border:'none',
                  borderRadius:7,background:loading?'#90CAF9':'#D13438',
                  color:'#fff',cursor:loading?'not-allowed':'pointer',...SS}}>
                {loading?loadingMsg:diagram?'↺ Regenerate':'⚡ Generate Architecture'}
              </button>}
          </div>

          {/* Export */}
          {diagram&&<div style={{display:'flex',gap:6}}>
            <button onClick={exportDrawio} style={{flex:1,padding:'6px 0',fontSize:10,fontWeight:600,
              border:'none',borderRadius:6,background:'#107C10',color:'#fff',cursor:'pointer',...SS}}>
              ↓ draw.io
            </button>
            <button onClick={()=>{setRightPanel('prompt')}} style={{flex:1,padding:'6px 0',fontSize:10,
              border:'1px solid #0078D4',borderRadius:6,background:'#fff',color:'#0078D4',cursor:'pointer',...SS}}>
              View prompt
            </button>
          </div>}
        </div>
      </div>

      {/* ── CANVAS ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{height:44,background:'#fff',borderBottom:'1px solid #e8e8e8',
          display:'flex',alignItems:'center',padding:'0 14px',gap:8,
          boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
          {diagram&&<div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',...SS}}>{diagram.title}</div>}
          {!diagram&&<div style={{fontSize:12,color:'#888',...SS}}>Complete all 8 steps → Generate Architecture</div>}
          {diagram&&<div style={{marginLeft:'auto',fontSize:11,fontWeight:600,color:'#107C10',...SS}}>
            ✓ {diagram.services?.length||0} services · A${(cost?.total_aud||0).toLocaleString()}/mo
          </div>}
        </div>

        <div style={{flex:1,position:'relative',background:'#fff',overflow:'auto'}}>
          {!diagram&&!loading&&(
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
              <div style={{fontSize:48,opacity:.08,marginBottom:16}}>⬡</div>
              <div style={{fontSize:15,fontWeight:600,color:'#c0c0c0',marginBottom:8,...SS}}>
                Work through the 8 steps on the left
              </div>
              <div style={{fontSize:11,color:'#d0d0d0',maxWidth:400,textAlign:'center',lineHeight:1.8,...SS}}>
                Each step builds the detailed specification prompt.<br/>
                Archon generates a prompt like the B2B Integration example<br/>
                with full CIDR blocks, NSG rules, resource groups, traffic flows,<br/>
                compliance controls, and RTO/RPO requirements — automatically.
              </div>
              <div style={{display:'flex',gap:10,marginTop:24,flexWrap:'wrap',justifyContent:'center',maxWidth:420}}>
                {STEPS.map(s=>(
                  <div key={s.n} onClick={()=>setStep(s.n)}
                    style={{padding:'10px 14px',borderRadius:8,border:'1.5px solid',
                      borderColor:step===s.n?'#0078D4':'#eee',
                      background:step===s.n?'#EFF6FF':'#fff',cursor:'pointer',
                      textAlign:'center',pointerEvents:'all'}}>
                    <div style={{fontSize:18,marginBottom:2}}>{s.icon}</div>
                    <div style={{fontSize:9,color:step===s.n?'#0078D4':'#999',...SS}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading&&(
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,.95)',zIndex:10}}>
              <div style={{width:44,height:44,borderRadius:'50%',border:'3px solid #e0e0e0',
                borderTopColor:'#0078D4',animation:'spin .8s linear infinite',marginBottom:14}}/>
              <div style={{fontSize:14,color:'#0078D4',fontWeight:600,...SS}}>{loadingMsg}</div>
              <div style={{fontSize:10,color:'#999',marginTop:5,...SS}}>
                Claude Sonnet 4.6 · Enterprise-grade specification prompt · Azure WAF
              </div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {diagram&&(
            <div style={{padding:20}}>
              {/* Services grid */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:12,marginBottom:20}}>
                {(diagram.services||[]).map((svc:any)=>(
                  <div key={svc.id} onClick={()=>{setSelSvc(svc);setRightPanel('waf')}}
                    style={{background:'#fff',border:`1.5px solid ${selSvc?.id===svc.id?'#0078D4':'#e8e8e8'}`,
                      borderRadius:10,padding:'12px 10px',textAlign:'center',cursor:'pointer',
                      boxShadow:selSvc?.id===svc.id?'0 0 0 3px rgba(0,120,212,.15)':'0 1px 4px rgba(0,0,0,.06)',
                      transition:'all .15s'}}>
                    <img src={iconUrl(svc.icon_id||'cognitive-services')} width={36} height={36}
                      style={{objectFit:'contain',marginBottom:6}}/>
                    <div style={{fontSize:10,fontWeight:500,color:'#1a1a1a',lineHeight:1.3,marginBottom:3,...SS}}>
                      {svc.display_name}
                    </div>
                    <div style={{fontSize:9,color:'#737373',...SS}}>{svc.sku}</div>
                    <div style={{fontSize:9,fontWeight:600,color:'#107C10',marginTop:3,...SS}}>
                      A${svc.estimated_cost_aud}/mo
                    </div>
                    {svc.waf_pillars&&(
                      <div style={{display:'flex',gap:3,marginTop:4,justifyContent:'center'}}>
                        {svc.waf_pillars.map((p:string)=>(
                          <div key={p} title={p} style={{width:6,height:6,borderRadius:'50%',
                            background:{Reliability:'#107C10',Security:'#0078D4',Performance:'#8764B8',Cost:'#004B1C',Operations:'#737373'}[p]||'#ccc'}}/>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Architecture description */}
              {diagram.description&&(
                <div style={{background:'#f8f9fa',borderRadius:10,padding:'14px 16px',border:'1px solid #e8e8e8'}}>
                  <div style={{fontSize:11,fontWeight:600,color:'#444',marginBottom:6,...SS}}>Architecture overview</div>
                  <div style={{fontSize:11,color:'#555',lineHeight:1.7,...SS}}>{diagram.description}</div>
                  {diagram.assumptions?.length>0&&(
                    <div style={{marginTop:10}}>
                      <div style={{fontSize:10,fontWeight:600,color:'#888',marginBottom:4,...SS}}>Assumptions</div>
                      {diagram.assumptions.map((a:string,i:number)=>(
                        <div key={i} style={{fontSize:10,color:'#666',padding:'2px 0',...SS}}>• {a}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div style={{marginTop:12,fontSize:10,color:'#aaa',textAlign:'center',...SS}}>
                ← Export draw.io from the left panel for the full diagram with boundaries, subnets and connections
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      {(diagram||true)&&(
        <div style={{width:264,background:'#fff',borderLeft:'1px solid #e8e8e8',
          display:'flex',flexDirection:'column',overflow:'hidden',
          boxShadow:'-2px 0 8px rgba(0,0,0,.04)'}}>
          <div style={{display:'flex',borderBottom:'1px solid #f0f0f0',background:'#fafafa'}}>
            {(['waf','cost','prompt'] as const).map(p=>(
              <button key={p} onClick={()=>setRightPanel(p)} style={{flex:1,padding:'9px 0',fontSize:10,
                fontWeight:rightPanel===p?600:400,color:rightPanel===p?'#0078D4':'#999',
                background:'none',border:'none',
                borderBottom:rightPanel===p?'2px solid #0078D4':'2px solid transparent',
                cursor:'pointer',textTransform:'uppercase',...SS}}>
                {p==='waf'?'WAF':p==='cost'?'Cost':'Prompt'}
              </button>
            ))}
          </div>
          <div style={{flex:1,overflow:'auto',padding:'12px 13px'}}>

            {rightPanel==='waf'&&(
              <div>
                {selSvc&&(
                  <div style={{background:'#f0f7ff',border:'1px solid #d0e8ff',borderRadius:8,padding:10,marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#0078D4',marginBottom:4,...SS}}>{selSvc.display_name}</div>
                    <div style={{fontSize:11,color:'#555',lineHeight:1.7,...SS}}>
                      <div><strong>SKU:</strong> {selSvc.sku}</div>
                      <div><strong>RG:</strong> {selSvc.resource_group}</div>
                      <div><strong>Subnet:</strong> {selSvc.subnet||'N/A'}</div>
                      <div><strong>PE:</strong> {selSvc.private_endpoint?'✓ Private endpoint':'— Public'}</div>
                      <div style={{color:'#107C10',fontWeight:600}}>A${selSvc.estimated_cost_aud}/mo</div>
                      {selSvc.rationale&&<div style={{marginTop:5,color:'#444'}}>{selSvc.rationale}</div>}
                    </div>
                  </div>
                )}
                {waf?<>
                  <div style={{fontSize:11,fontWeight:600,color:'#444',marginBottom:8,...SS}}>WAF pillar scores</div>
                  {pillars.map(p=><WafBar key={p.k} label={p.l} score={waf[p.k]?.score||0} color={p.c}/>)}
                  {pillars.map(p=>waf[p.k]?.findings?.length>0&&(
                    <div key={p.k} style={{marginBottom:8,marginTop:6}}>
                      <div style={{fontSize:10,fontWeight:600,color:p.c,marginBottom:3,...SS}}>{p.l}</div>
                      {waf[p.k].findings.map((ff:string,i:number)=>(
                        <div key={i} style={{fontSize:10,color:'#555',padding:'2px 0',borderBottom:'1px solid #f5f5f5',lineHeight:1.5,...SS}}>• {ff}</div>
                      ))}
                    </div>
                  ))}
                </>:<div style={{fontSize:11,color:'#bbb',textAlign:'center',marginTop:40,...SS}}>Generate an architecture to see WAF validation</div>}
              </div>
            )}

            {rightPanel==='cost'&&(
              <div>
                {diagram?<>
                  <div style={{background:'linear-gradient(135deg,#0078D4,#005a9e)',borderRadius:10,
                    padding:'12px 14px',marginBottom:12,color:'#fff'}}>
                    <div style={{fontSize:10,opacity:.85,...SS}}>Estimated monthly total</div>
                    <div style={{fontSize:22,fontWeight:700,...SS}}>A${totalCost?.toLocaleString()}</div>
                    <div style={{fontSize:9,opacity:.75,...SS}}>{f.primaryRegion} · per month</div>
                  </div>
                  {(cost?.breakdown||diagram.services)?.map((item:any,i:number)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #f0f0f0',fontSize:11,...SS}}>
                      <span style={{color:'#444'}}>{item.name||item.display_name}</span>
                      <span style={{fontWeight:600,color:'#333'}}>A${item.monthly_aud||item.estimated_cost_aud}</span>
                    </div>
                  ))}
                  {cost?.optimisation_tips?.length>0&&<div style={{marginTop:12}}>
                    <div style={{fontSize:11,fontWeight:600,color:'#107C10',marginBottom:5,...SS}}>💡 Optimisation</div>
                    {cost.optimisation_tips.map((t:string,i:number)=>(
                      <div key={i} style={{fontSize:10,color:'#444',padding:'3px 0',borderBottom:'1px solid #f5f5f5',lineHeight:1.5,...SS}}>• {t}</div>
                    ))}
                  </div>}
                </>:<div style={{fontSize:11,color:'#bbb',textAlign:'center',marginTop:40,...SS}}>Generate an architecture to see cost estimates</div>}
              </div>
            )}

            {rightPanel==='prompt'&&(
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'#444',marginBottom:6,...SS}}>
                  Prompt sent to Claude Sonnet 4.6
                </div>
                <div style={{background:'#1a1a2e',borderRadius:8,padding:10,fontSize:9,
                  color:'#94a3b8',lineHeight:1.7,whiteSpace:'pre-wrap',fontFamily:'monospace',
                  maxHeight:480,overflow:'auto'}}>
                  {genPrompt||buildDetailedPrompt(f)}
                </div>
                <button onClick={()=>navigator.clipboard.writeText(genPrompt||buildDetailedPrompt(f))}
                  style={{marginTop:8,width:'100%',fontSize:11,padding:'7px 0',border:'1px solid #ddd',
                    borderRadius:6,background:'#fafafa',color:'#555',cursor:'pointer',...SS}}>
                  Copy prompt
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
