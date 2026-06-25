// ═══════════════════════════════════════════════════════════════════════════
// ARCHON — Enterprise Architecture Discovery Form
// Every request generates a detailed, specification-grade prompt
// matching the B2B Integration Platform example quality
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react'
import mermaid from 'mermaid'
import type { AdvisorFormState } from './types'
import { AdvisorPanel } from './components/AdvisorPanel'
import { useAuth } from './lib/auth'
import { createProject, updateProject } from './lib/api'

const API = ''
const SS: React.CSSProperties = { fontFamily: '"DM Sans","Segoe UI",system-ui,sans-serif' }
const LORA: React.CSSProperties = { fontFamily: '"Lora",Georgia,serif' }
const MONO: React.CSSProperties = { fontFamily: '"DM Mono","Consolas",monospace' }

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
  managementFlow:[
    'All services → Key Vault (MSI — no secrets in code, certificate + connection string retrieval)',
    'All compute (App Service, Functions, Logic Apps, APIM) → Log Analytics Workspace (B2B transaction logs, integration telemetry, 30-day retention)',
    'All compute → Application Insights (APM, distributed tracing, dependency tracking, custom B2B metrics)',
    'All services → Azure Monitor + Alerts (SLA monitoring, cost threshold alerts at 80%/100%, action groups)',
  ],
  extraFlows:'',
  rgStrategy:'By platform type', rgPrefix:'integration',
  securityPosture:'Zero-Trust', privateEndpoints:true, encryptionAtRest:'PMK (Platform-Managed Keys)',
  authMethods:['OAuth2','Certificate-based partner authentication'],
  wafRuleset:'OWASP 3.2 + custom B2B rules', tlsVersion:'TLS 1.3',
  compliance:['SOC 2 Type II','ISO 27001'],
  haStrategy:'Multi-region active-passive', primaryRegion:'Australia East', secondaryRegion:'Australia Southeast',
}

// Services that are shared/cross-cutting — never placed inside a single column
const SHARED_SERVICE_IDS = ['dns','nsg','pe','appi','law','monitor','kv','defender','vnet','adb2c']

// Columns that have no Azure subnet (external zones)
function isExternalColumn(label: string): boolean {
  const l = label.toLowerCase()
  return l.includes('internet') || l.includes('partner') || l.includes('egress') ||
    l.includes('outbound') || l.includes('hub shared') || l.includes('external') ||
    l.includes('cdn') || l.includes('global traffic')
}

function buildDetailedPrompt(f: FormState): string {
  const getSvc = (id:string) => SERVICE_CATALOGUE.find(s=>s.id===id)

  // Separate workload services from shared/cross-cutting services
  const workloadSvcs = Object.entries(f.selectedServices)
    .filter(([id]) => !SHARED_SERVICE_IDS.includes(id))
    .map(([id,sku]) => { const s=getSvc(id); return s?`- ${s.name} (${sku}) — ${s.purpose}`:'' })
    .filter(Boolean).join('\n')

  const sharedSvcs = Object.entries(f.selectedServices)
    .filter(([id]) => SHARED_SERVICE_IDS.includes(id))
    .map(([id,sku]) => { const s=getSvc(id); return s?`- ${s.name} (${sku}) — ${s.purpose}`:'' })
    .filter(Boolean).join('\n')

  const svcList = [
    workloadSvcs,
    sharedSvcs ? `\nSHARED / CROSS-CUTTING SERVICES (appear once, used by all tiers):\n${sharedSvcs}` : ''
  ].filter(Boolean).join('\n') || '[No services selected — select services in Section C]'

  const columnsBlock = f.columns.map((col, i) => {
    const isExternal = isExternalColumn(col.label)
    // Only show workload services inside columns — not shared services
    const colSvcLines = col.services
      .filter(sid => !SHARED_SERVICE_IDS.includes(sid))
      .map(sid => {
        const s = getSvc(sid)
        const sku = f.selectedServices[sid]
        return s ? `  ${s.name}${sku ? ` (${sku})` : ''}` : ''
      }).filter(Boolean).join('\n')

    const isFirst = i===0, isLast = i===f.columns.length-1
    const pos = isFirst?' (leftmost)':isLast?' (rightmost)':''
    let block = `COLUMN ${i+1} — ${col.label}${pos}:`
    if(isExternal) block += '\n  [External zone — no Azure subnet]'
    if(colSvcLines) block += '\n'+colSvcLines
    if(!isExternal && col.subnet) block += `\n  Subnet: ${col.subnet}${col.cidr?` (${col.cidr})`:''}`
    if(!isExternal && col.nsg)    block += `\n  NSG: ${col.nsg}`
    if(isExternal && col.nsg)     block += `\n  ${col.nsg}`
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
// ADVISOR MODE — types, defaults, and components
// ═══════════════════════════════════════════════════════════════════════════

const ADVISOR_DEFAULTS: AdvisorFormState = {
  project_type: 'B2B SaaS',
  concurrent_users: '100-500',
  requests_per_day: '10k-100k',
  cloud_preference: ['Azure'],
  compliance_requirements: ['SOC2', 'GDPR', 'ISO 27001'],
  team_size: '4-10',
  cloud_maturity: 'Intermediate',
  budget_range: '$5k-$25k',
  availability_sla: '99.9%',
  primary_concern: 'Security',
  region_preference: 'Australia East',
  functional_requirements: `AI-powered cloud architecture advisory platform (multi-tenant B2B SaaS). Core capabilities:
1. AI-driven architecture recommendations using Claude API with real-time streaming responses
2. Interactive requirements intake form (project type, scale, compliance, budget, preferred region)
3. Structured JSON solution documents: platform components with zones, network topology with dual Mermaid diagrams (TD + LR), security architecture, cost estimates in USD ranges, IaC starter (Terraform), prioritised next steps
4. Change impact analysis: before modifying an existing solution, AI evaluates risks, improvements, and effort — user must confirm before changes are applied
5. WAF validation scoring across 5 pillars (Reliability, Security, Performance, Cost, Operations)
6. draw.io diagram export with Azure Architecture Center styling (boundary boxes, dashed subnets, icon nodes)
7. Enterprise SSO via WorkOS; subscription billing via Stripe; team notifications via Slack
8. Per-tenant data isolation with audit logging; GitHub Actions CI/CD pipeline; Notion and Confluence documentation sync`,
  integrations: 'Anthropic Claude API, Stripe, Slack, GitHub, Notion, Confluence, WorkOS',
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════

// @ts-nocheck
function AzureContent({f,step,setStep,currentStep,upd,diagram,loading,loadingMsg,
  error,genPrompt,showPromptPreview,setShowPromptPreview,rightPanel,setRightPanel,
  selSvc,setSelSvc,generate,exportDrawio,buildDetailedPrompt,
  addColumn,removeColumn,updateCol,toggleColSvc,applyPreset,toggleService,setSku,
  waf,cost,totalCost}:any) {
  const pillars=[
    {k:'reliability',l:'Reliability',c:'#107C10'},{k:'security',l:'Security',c:'#0078D4'},
    {k:'performance',l:'Performance',c:'#8764B8'},{k:'cost',l:'Cost',c:'#004B1C'},
    {k:'operations',l:'Operations',c:'#737373'}
  ]
  const CAT_ORDER = ['Ingress','Compute','Integration','Messaging','Data','AI','Security','Monitor','Network']
  return (<>


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
              <div style={{display:'flex',gap:6,marginBottom:8}}>
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
            {/* Shared services info banner */}
            <div style={{background:'#EFF6FF',border:'1px solid #d0e8ff',borderRadius:7,
              padding:'7px 10px',marginBottom:10,fontSize:10,color:'#0078D4',lineHeight:1.6,...SS}}>
              <strong>ℹ️ Shared services</strong> (Key Vault, NSG, Private Endpoints, DNS, Log Analytics, App Insights,
              Monitor, Defender, Entra ID, VNet) are cross-cutting — they appear once in the prompt under a shared
              section and do NOT need to be assigned to individual columns.
              Only assign workload services (App Gateway, APIM, Logic Apps, Service Bus, Storage etc.) to columns.
            </div>
            <div style={{fontSize:10,color:'#888',marginBottom:8,...SS}}>
              Define each {f.layoutDirection==='column-wise'?'column':'tier'}.
              Internet, Hub, and Egress columns have no Azure subnet — those fields are hidden automatically.
            </div>
            {f.columns.map((col:any,ci:number)=>{
              const extCol = isExternalColumn(col.label)
              // Only show non-shared workload services in the chips
              const assignableIds = Object.keys(f.selectedServices)
                .filter(sid => !SHARED_SERVICE_IDS.includes(sid))
              return (
              <div key={col.id} style={{marginBottom:10,border:`1px solid ${extCol?'#e0e0e0':'#d0e8ff'}`,
                borderRadius:8,padding:10,background:extCol?'#fafafa':'#f7fbff'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:5,
                    background:extCol?'#888':'#0078D4',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:11,fontWeight:700,color:'#fff',flexShrink:0}}>{ci+1}</div>
                  <input value={col.label} onChange={e=>updateCol(col.id,'label',e.target.value)}
                    style={{...inp,fontSize:11,padding:'4px 8px',flex:1}}/>
                  {extCol&&<span style={{fontSize:9,padding:'2px 7px',borderRadius:99,
                    background:'#f0f0f0',color:'#888',flexShrink:0,...SS}}>external</span>}
                  {f.columns.length>2&&<button onClick={()=>removeColumn(col.id)}
                    style={{fontSize:12,padding:'2px 7px',border:'1px solid #ffcdd2',
                      borderRadius:5,background:'#fff0f0',color:'#c62828',cursor:'pointer'}}>✕</button>}
                </div>
                {/* Services — only workload services, not shared */}
                {!extCol&&<div style={{marginBottom:6}}>
                  <div style={{fontSize:9,fontWeight:600,color:'#0078D4',marginBottom:4,...SS}}>
                    WORKLOAD SERVICES IN THIS {f.layoutDirection==='column-wise'?'COLUMN':'TIER'}
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                    {assignableIds.map(sid=>{
                      const svc=SERVICE_CATALOGUE.find(s=>s.id===sid)
                      if(!svc)return null
                      const inCol=col.services.includes(sid)
                      return <button key={sid} onClick={()=>toggleColSvc(col.id,sid)}
                        style={{fontSize:9,padding:'2px 7px',border:'1px solid',borderRadius:99,
                          borderColor:inCol?'#0078D4':'#ddd',background:inCol?'#0078D4':'#fff',
                          color:inCol?'#fff':'#555',cursor:'pointer',...SS}}>
                        {svc.name.replace('Azure ','').replace('Microsoft ','').substring(0,22)}
                      </button>
                    })}
                    {assignableIds.length===0&&<span style={{fontSize:9,color:'#bbb',...SS}}>
                      Select workload services in Step 3 first
                    </span>}
                  </div>
                </div>}
                {extCol&&<div style={{fontSize:9,color:'#888',fontStyle:'italic',marginBottom:6,...SS}}>
                  External zone — no Azure subnet or services assigned here
                </div>}
                {/* Subnet + CIDR — only for internal Azure columns */}
                {!extCol&&<>
                  <div style={{display:'flex',gap:6,marginBottom:4}}>
                    <input value={col.subnet} onChange={e=>updateCol(col.id,'subnet',e.target.value)}
                      placeholder="snet-name (e.g. snet-appgw)"
                      style={{...inp,fontSize:10,padding:'4px 8px',flex:1}}/>
                    <input value={col.cidr} onChange={e=>updateCol(col.id,'cidr',e.target.value)}
                      placeholder="10.x.1.0/24"
                      style={{...inp,fontSize:10,padding:'4px 8px',width:110}}/>
                  </div>
                  <input value={col.nsg} onChange={e=>updateCol(col.id,'nsg',e.target.value)}
                    placeholder="NSG rules: allow 443 inbound from internet, deny all else"
                    style={{...inp,fontSize:10,padding:'4px 8px'}}/>
                </>}
                {/* For egress/hub columns show UDR/notes field only */}
                {extCol&&col.nsg&&<div style={{fontSize:9,color:'#555',padding:'4px 8px',
                  background:'#f5f5f5',borderRadius:5,marginTop:4,...SS}}>{col.nsg}</div>}
                {extCol&&!col.nsg&&<input value={col.nsg} onChange={e=>updateCol(col.id,'nsg',e.target.value)}
                  placeholder="Notes (e.g. UDR: 0.0.0.0/0 → Hub Firewall private IP)"
                  style={{...inp,fontSize:10,padding:'4px 8px'}}/>}
              </div>
            )})}
            <button onClick={addColumn} style={{width:'100%',padding:'7px 0',fontSize:11,
              border:'1.5px dashed #0078D4',borderRadius:7,background:'#EFF6FF',
              color:'#0078D4',cursor:'pointer',...SS}}>
              + Add {f.layoutDirection==='column-wise'?'column':'tier'}
            </button>
          </div>}

          {/* ── STEP 5: TRAFFIC FLOWS ── */}
          {step===5&&<div>
            <FL label="Inbound flow (internet → platform)" help="Add each hop in order — drag to reorder">
              {f.inboundFlow.map((hop:any,i:number)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                  <div style={{width:20,height:20,borderRadius:'50%',background:'#0078D4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:'#fff',flexShrink:0}}>{i+1}</div>
                  <input value={hop} onChange={e=>{const a=[...f.inboundFlow];a[i]=e.target.value;upd('inboundFlow',a)}}
                    style={{...inp,fontSize:10,padding:'4px 8px',flex:1}}/>
                  {f.inboundFlow.length>2&&<button onClick={()=>upd('inboundFlow',f.inboundFlow.filter((_:any,j:number)=>j!==i))}
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
              {f.managementFlow.map((mf:any,i:number)=>(
                <div key={i} style={{display:'flex',gap:6,marginBottom:5}}>
                  <input value={mf} onChange={e=>{const a=[...f.managementFlow];a[i]=e.target.value;upd('managementFlow',a)}}
                    style={{...inp,fontSize:10,padding:'4px 8px',flex:1}}/>
                  {f.managementFlow.length>1&&<button onClick={()=>upd('managementFlow',f.managementFlow.filter((_:any,j:number)=>j!==i))}
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
            {step>1&&<button onClick={()=>setStep((s:number)=>s-1)}
              style={{flex:1,padding:'8px 0',fontSize:11,border:'1px solid #ddd',borderRadius:7,
                background:'#fff',color:'#555',cursor:'pointer',...SS}}>← Back</button>}
            {step<STEPS.length
              ?<button onClick={()=>setStep((s:number)=>s+1)}
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
  </>)
}
// @ts-check

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
  const [appMode, setAppMode] = useState<'azure'|'hld'|'advisor'>('advisor')
  const [solution, setSolution] = useState<any>(null)
  const [solPanel, setSolPanel] = useState<'overview'|'components'|'network'|'security'|'hld'|'resilience'|'cost'|'nextsteps'>('overview')
  const [hldStep, setHldStep] = useState(1)
  const [hld, setHld] = useState({
    platformType: 'Web application',
    cloud: [] as string[],
    concurrentUsers: '1k–10k concurrent users',
    functionalReqs: '',
    teamSize: 'Startup (3–8 engineers)',
    cloudExp: 'Intermediate (some cloud projects)',
    compliance: [] as string[],
    compute: [] as string[],
    budget: '$5k–15k/month',
    availabilitySla: '99.9% (43 min downtime/month)',
    integrations: '',
    primaryConcern: 'Scalability',
    keyRequirement: '',
  })
  // ── ADVISOR STATE ──────────────────────────────────────────────────────────
  const [advisorForm, setAdvisorForm] = useState<AdvisorFormState>(ADVISOR_DEFAULTS)
  const [advisorSolution, setAdvisorSolution] = useState<any>(null)
  const [advisorChangeImpact, setAdvisorChangeImpact] = useState<any>(null)
  const [advisorLoading, setAdvisorLoading] = useState(false)
  const [advisorStreamText, setAdvisorStreamText] = useState('')
  const [advisorError, setAdvisorError] = useState('')
  const [advisorTab, setAdvisorTab] = useState<'overview'|'diagram'|'security'|'cost'|'iac'|'nextsteps'>('overview')
  const [advisorDiagramLayout, setAdvisorDiagramLayout] = useState<'topdown'|'leftright'>('topdown')
  // Auto-save plumbing — workspace target + the row the current session is editing.
  const { workspaceId } = useAuth()
  const currentProjectId = useRef<string | null>(null)
  const [advisorDiagramType, setAdvisorDiagramType] = useState<'hld'|'network'>('hld')
  const [advisorPendingConfirm, setAdvisorPendingConfirm] = useState<string|null>(null)

  const updAdvisor = <K extends keyof AdvisorFormState>(k: K, v: AdvisorFormState[K]) =>
    setAdvisorForm(p => ({ ...p, [k]: v }))

  const toggleAdvisorArr = (k: 'cloud_preference'|'compliance_requirements', val: string) =>
    setAdvisorForm(p => {
      const arr = p[k] as string[]
      return { ...p, [k]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })

  const msgIdx = useRef(0)
  const advisorPanelCollapseRef = useRef<(() => void) | null>(null)

  // ── THEME ─────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'light'|'dark'>(() =>
    (localStorage.getItem('archon-theme') as 'light'|'dark') || 'light'
  )
  const [zoomLevel, setZoomLevel] = useState(100)

  function toggleTheme() {
    const next: 'light'|'dark' = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('archon-theme', next)
  }

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

  const HLD_MSGS=['Analysing requirements...','Selecting architecture pattern...','Designing network topology...','Defining security controls...','Planning resilience strategy...','Estimating costs...','Building HLD diagram...','Finalising solution document...']

  function updHld<K extends keyof typeof hld>(k:K, v:typeof hld[K]) {
    setHld(p=>({...p,[k]:v}))
  }
  function toggleHldArr(k:'cloud'|'compliance'|'compute', val:string) {
    setHld(p=>{ const arr=p[k] as string[]; return {...p,[k]:arr.includes(val)?arr.filter(x=>x!==val):[...arr,val]} })
  }

  function buildHldPrompt(h:typeof hld):string {
    return `## Technical Requirements

**Project type:** ${h.platformType}
**Concurrent users at launch:** ${h.concurrentUsers}
**Preferred cloud:** ${h.cloud.length?h.cloud.join(', '):'No preference — recommend best fit'}
**Key functional requirements:** ${h.functionalReqs||'None specified'}
**Non-functional requirements:**
- Availability SLA: ${h.availabilitySla}
- Compliance: ${h.compliance.length?h.compliance.join(', '):'None'}
- Team size: ${h.teamSize}, cloud experience: ${h.cloudExp}
- Compute preference: ${h.compute.length?h.compute.join(', '):'No preference'}
- Monthly budget: ${h.budget}
**Existing systems to integrate:** ${h.integrations||'None'}
**Primary architecture concern:** ${h.primaryConcern}
**Key constraint:** ${h.keyRequirement||'None'}

Please produce a complete solution architecture for these requirements.

You are an expert enterprise cloud architect with 20+ years of experience advising Fortune 500 CTOs. Based on the above inputs, produce a complete solution document.

Consider internally: does the scale match the budget? Does the compliance requirement constrain the cloud choice? Does the compute preference fit the architecture pattern? State any assumptions in solution_overview.

Return ONLY valid JSON with this exact schema — no markdown, no prose:
{
  "solution_overview": "2–3 paragraph executive summary covering architectural pattern chosen and why, key trade-offs, and assumptions made",
  "platform_components": [{"name":"string","purpose":"string","service":"string","rationale":"string"}],
  "network_topology": {"description":"string covering VPCs/VNets subnets tiers peering CDN ingress/egress","mermaid":"valid Mermaid architecture-beta diagram of the network topology using group for zones"},
  "security_architecture": {"iam":"string","encryption":"string","network_security":"string","secrets":"string","compliance":"string"},
  "hld_diagram": {"mermaid":"valid Mermaid architecture-beta diagram showing all major components using group for logical zones"},
  "scalability_resilience": {"scaling":"string","availability":"string","dr":"string with RTO/RPO targets"},
  "cost_estimate": {"compute":"string","storage":"string","network":"string","managed_services":"string","total_range":"string e.g. $8,000–$12,000/month"},
  "next_steps": ["concrete technical decision 1","concrete technical decision 2","concrete technical decision 3"]
}

MERMAID RULES — mandatory:
- Use architecture-beta syntax ONLY. Never use flowchart, graph TD, graph LR, or subgraph.
- Every diagram starts with: %%{init: {"architecture": {"padding": 20}}}%% then architecture-beta
- Use group <id>[<label>] for zones, service <id>(server|database|internet|disk)[<label>] in <group> for nodes
- IDs alphanumeric only (AppGW, APIM, SvcBus, CosmosDB etc)
- Labels in square brackets: [App Gateway WAF]
- Connections use port syntax: A:R --> L:B for horizontal, A:B --> T:B for vertical
- Max 4 words per label. Return ONLY JSON.`
  }

  async function generateSolution() {
    setError('');setLoading(true);setSolution(null)
    msgIdx.current=0;setLoadingMsg(HLD_MSGS[0])
    const iv=setInterval(()=>{msgIdx.current=(msgIdx.current+1)%HLD_MSGS.length;setLoadingMsg(HLD_MSGS[msgIdx.current])},2600)
    try {
      const res=await fetch(`${API}/api/solution`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:buildHldPrompt(hld)})})
      if(!res.ok)throw new Error(await res.text())
      setSolution(await res.json());setSolPanel('overview')
    } catch(e:any){setError(`Generation failed: ${e.message}`)}
    finally{clearInterval(iv);setLoading(false)}
  }

  async function generateAdvisor(changeDescription?: string, requirements?: string) {
    if (!(requirements ?? advisorForm.functional_requirements).trim()) {
      setAdvisorError('Functional requirements are required.')
      return
    }
    setAdvisorLoading(true)
    setAdvisorError('')
    setAdvisorStreamText('')
    setAdvisorChangeImpact(null)
    setAdvisorPendingConfirm(null)

    const body = {
      project_type: advisorForm.project_type,
      concurrent_users: advisorForm.concurrent_users,
      requests_per_day: advisorForm.requests_per_day,
      cloud_preference: advisorForm.cloud_preference.join(', ') || 'No preference',
      compliance_requirements: advisorForm.compliance_requirements.join(', ') || 'None',
      team_size: advisorForm.team_size,
      cloud_maturity: advisorForm.cloud_maturity,
      budget_range: advisorForm.budget_range,
      availability_sla: advisorForm.availability_sla,
      primary_concern: advisorForm.primary_concern,
      region_preference: advisorForm.region_preference,
      functional_requirements: requirements ?? advisorForm.functional_requirements,
      integrations: advisorForm.integrations || 'None',
      existing_solution_json: advisorSolution ? JSON.stringify(advisorSolution) : null,
      change_description: changeDescription || null,
    }

    try {
      const res = await fetch(`${API}/api/advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        let errMsg: string
        try {
          const errBody = await res.json()
          if (Array.isArray(errBody.detail)) {
            errMsg = errBody.detail.map((d: any) => {
              const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : 'field'
              return `${field}: ${d.msg}`
            }).join('; ')
          } else {
            errMsg = errBody.detail ?? JSON.stringify(errBody)
          }
        } catch {
          errMsg = await res.text()
        }
        throw new Error(errMsg)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            const cleaned = data === '[DONE]' ? accumulated : data
            void cleaned
            try {
              let raw = accumulated.trim()
              raw = raw.replace(/^```json\s*/,'').replace(/^```\s*/,'').replace(/\s*```$/,'').trim()
              const parsed = JSON.parse(raw)
              if (parsed.change_impact) {
                setAdvisorChangeImpact(parsed.change_impact)
              } else {
                setAdvisorSolution(parsed)
                setAdvisorTab('overview')
                saveAdvisorProject(parsed)
              }
            } catch {
              setAdvisorError('AI returned malformed JSON. Please try again.')
            }
          } else {
            try {
              const msg = JSON.parse(data)
              if (msg.error) throw new Error(msg.error)
              accumulated += msg.text
              setAdvisorStreamText(accumulated)
            } catch(e: any) {
              if (e.message && !e.message.includes('JSON')) setAdvisorError(e.message)
            }
          }
        }
      }
    } catch (e: any) {
      setAdvisorError(`Generation failed: ${e.message}`)
    } finally {
      setAdvisorLoading(false)
    }
  }

  // Auto-save the completed advisor solution. Fire-and-forget: any failure
  // (logged out, no workspace, network, 4xx/5xx) is swallowed so it can NEVER
  // interrupt or break the generation/render flow. First completion in a session
  // creates a row; regenerations of the same solution update that same row.
  function saveAdvisorProject(solution: any) {
    if (!workspaceId) return
    const brief = (advisorForm.functional_requirements || advisorForm.project_type || 'Untitled architecture').trim()
    const name = brief.length > 60 ? brief.slice(0, 57) + '…' : brief
    const input_json = advisorForm as unknown as Record<string, unknown>
    void (async () => {
      try {
        if (currentProjectId.current) {
          await updateProject(currentProjectId.current, { name, input_json, solution_json: solution })
        } else {
          const created = await createProject({
            name, input_mode: 'form', input_json, solution_json: solution, workspace_id: workspaceId,
          })
          currentProjectId.current = created.id
        }
      } catch (err) {
        console.warn('Auto-save skipped:', err)
      }
    })()
  }

  function downloadAdvisorPDF() {
    if (!advisorSolution) return
    const s = advisorSolution
    const win = window.open('', '_blank')
    if (!win) return
    const comps = (s.platform_components || []).map((c: any) =>
      `<tr><td>${c.name}</td><td>${c.azure_service||c.service||''}</td><td>${c.purpose}</td><td>${c.rationale}</td></tr>`
    ).join('')
    const iac = (s.iac_starter?.resources || []).map((r: any) =>
      `resource "${r.terraform_resource}" "${r.name}" {\n  # ${r.key_arguments}\n}`
    ).join('\n\n')
    const steps = (s.next_steps || []).map((n: string, i: number) =>
      `<li>${i+1}. ${n}</li>`
    ).join('')
    win.document.write(`<!DOCTYPE html><html><head><title>Architecture Solution</title>
<style>
body{font-family:system-ui,sans-serif;max-width:960px;margin:0 auto;padding:32px;color:#1a1a1a}
h1{font-size:22px;color:#0078D4;margin-bottom:4px}
h2{font-size:15px;color:#0078D4;margin-top:28px;border-bottom:1px solid #e0e0e0;padding-bottom:6px}
p{line-height:1.8;font-size:13px;color:#333}
pre{background:#f5f5f5;padding:14px;border-radius:8px;font-size:11px;white-space:pre-wrap;overflow:auto}
table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}
th{background:#0078D4;color:#fff;padding:8px 10px;text-align:left}
td{padding:7px 10px;border-bottom:1px solid #eee;vertical-align:top}
.badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#EFF6FF;color:#0078D4}
.total{font-size:20px;font-weight:700;color:#0078D4}
li{margin-bottom:8px;font-size:13px;line-height:1.7}
@media print{body{padding:16px}}
</style></head><body>
<h1>Architecture Solution Document</h1>
<span class="badge">Generated by Archon</span>
<h2>Solution Overview</h2>
<p>${(s.solution_overview||'').replace(/\n/g,'<br>')}</p>
<h2>Platform Components</h2>
<table><tr><th>Name</th><th>Azure Service</th><th>Purpose</th><th>Rationale</th></tr>${comps}</table>
<h2>Network Topology</h2>
<p>${s.network_topology?.description||''}</p>
<h2>Security Architecture</h2>
<p><strong>Identity:</strong> ${s.security_architecture?.identity||''}</p>
<p><strong>Network Security:</strong> ${s.security_architecture?.network_security||''}</p>
<p><strong>Encryption:</strong> ${s.security_architecture?.encryption||''}</p>
<p><strong>Secrets Management:</strong> ${s.security_architecture?.secrets_management||''}</p>
<p><strong>Compliance:</strong> ${s.security_architecture?.compliance||''}</p>
<h2>Scalability & Resilience</h2>
<p><strong>Scaling:</strong> ${s.scalability_resilience?.scaling_strategy||''}</p>
<p><strong>Availability:</strong> ${s.scalability_resilience?.availability||''}</p>
<p><strong>Disaster Recovery:</strong> ${s.scalability_resilience?.disaster_recovery||''}</p>
<h2>Cost Estimate</h2>
<p class="total">${s.cost_estimate?.total_range||''}</p>
<table><tr><th>Category</th><th>Monthly USD</th></tr>
<tr><td>Compute</td><td>${s.cost_estimate?.compute||''}</td></tr>
<tr><td>Data Storage</td><td>${s.cost_estimate?.data_storage||''}</td></tr>
<tr><td>AI Services</td><td>${s.cost_estimate?.ai_services||''}</td></tr>
<tr><td>Networking</td><td>${s.cost_estimate?.networking||''}</td></tr>
</table>
<h2>IaC Starter (Terraform)</h2>
<pre>${iac}</pre>
<h2>Next Steps</h2>
<ol>${steps}</ol>
</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  function copyAdvisorJSON() {
    if (!advisorSolution) return
    navigator.clipboard.writeText(JSON.stringify(advisorSolution, null, 2))
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

  // ── HLD STEP DEFINITIONS ─────────────────────────────────────────────────
  const HLD_STEPS = [
    {n:1,icon:'🏗️',label:'Platform'},
    {n:2,icon:'🔧',label:'Architecture'},
    {n:3,icon:'🚀',label:'Delivery'},
  ]

  const SOL_TABS=[
    {k:'overview' as const,l:'Overview'},{k:'components' as const,l:'Components'},
    {k:'network' as const,l:'Network'},{k:'security' as const,l:'Security'},
    {k:'hld' as const,l:'HLD Diagram'},{k:'resilience' as const,l:'Resilience'},
    {k:'cost' as const,l:'Cost'},{k:'nextsteps' as const,l:'Next Steps'},
  ]

  function MermaidBlock({code,height=400,layout}:{code:string,height?:number,layout?:'topdown'|'leftright'}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [renderError, setRenderError] = useState<string|null>(null)

    useEffect(() => {
      if (!containerRef.current || !code.trim()) return
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`
      mermaid.render(id, code)
        .then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg
            setRenderError(null)
          }
        })
        .catch(err => setRenderError(String(err)))
    }, [code, layout])

    return (
      <div style={{position:'relative'}}>
        {renderError ? (
          <pre style={{background:'#1a1a2e',border:'1px solid #2d2d44',borderRadius:8,
            padding:'10px 12px',fontSize:10,color:'#f87171',lineHeight:1.6,
            maxHeight:height,overflowY:'auto',whiteSpace:'pre-wrap',margin:0,...SS}}>
            {renderError}
          </pre>
        ) : (
          <div ref={containerRef} style={{background:'#fff',border:'1px solid #e8e8e8',
            borderRadius:8,padding:'12px 16px',maxHeight:height,overflowY:'auto',
            display:'flex',justifyContent:'center',...SS}}/>
        )}
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
          <button onClick={()=>navigator.clipboard.writeText(code)}
            style={{fontSize:9,padding:'3px 9px',border:'1px solid #e0e0e0',borderRadius:5,
              background:'#fafafa',color:'#666',cursor:'pointer',...SS}}>
            Copy source
          </button>
          <a href={`https://mermaid.live/edit#base64:${btoa(unescape(encodeURIComponent(code)))}`}
            target="_blank" rel="noreferrer"
            style={{fontSize:9,color:'#0078D4',...SS}}>
            ↗ Open in Mermaid Live
          </a>
        </div>
      </div>
    )
  }

  function SolutionPanel() {
    if(!solution)return null
    const s=solution
    return (
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        <div style={{width:120,background:'#fff',borderRight:'1px solid #e8e8e8',
          display:'flex',flexDirection:'column',padding:'6px 0',flexShrink:0}}>
          {SOL_TABS.map(t=>(
            <button key={t.k} onClick={()=>setSolPanel(t.k)}
              style={{padding:'8px 10px',textAlign:'left',fontSize:10,
                fontWeight:solPanel===t.k?600:400,
                color:solPanel===t.k?'#0078D4':'#555',
                background:solPanel===t.k?'#EFF6FF':'none',border:'none',
                borderLeft:solPanel===t.k?'2px solid #0078D4':'2px solid transparent',
                cursor:'pointer',...SS}}>
              {t.l}
            </button>
          ))}
          <div style={{flex:1}}/>
          <button onClick={()=>{setSolution(null);setHldStep(1)}}
            style={{margin:'8px 8px 10px',padding:'6px 0',fontSize:10,fontWeight:600,
              border:'1px solid #e0e0e0',borderRadius:6,background:'#fafafa',
              color:'#555',cursor:'pointer',...SS}}>
            ← Edit
          </button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:20,background:'#f8f9fa'}}>
          {solPanel==='overview'&&(
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',marginBottom:12,...SS}}>Solution Overview</div>
              <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,
                padding:18,fontSize:12,lineHeight:1.9,color:'#333',whiteSpace:'pre-wrap',...SS}}>
                {s.solution_overview}
              </div>
            </div>
          )}
          {solPanel==='components'&&(
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',marginBottom:12,...SS}}>Platform Components</div>
              {(s.platform_components||[]).map((c:any,i:number)=>(
                <div key={i} style={{background:'#fff',border:'1px solid #e8e8e8',
                  borderRadius:10,padding:'12px 16px',marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                    <span style={{fontSize:12,fontWeight:600,color:'#1a1a1a',...SS}}>{c.name}</span>
                    <span style={{fontSize:9,padding:'2px 8px',borderRadius:99,
                      background:'#EFF6FF',color:'#0078D4',fontWeight:600,...SS}}>{c.service}</span>
                  </div>
                  <div style={{fontSize:11,color:'#555',marginBottom:3,...SS}}>
                    <strong>Purpose:</strong> {c.purpose}
                  </div>
                  <div style={{fontSize:11,color:'#888',...SS}}>
                    <strong>Why chosen:</strong> {c.rationale}
                  </div>
                </div>
              ))}
            </div>
          )}
          {solPanel==='network'&&(
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',marginBottom:12,...SS}}>Network Topology</div>
              <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,
                padding:'14px 16px',marginBottom:14,fontSize:12,lineHeight:1.8,color:'#333',...SS}}>
                {s.network_topology?.description}
              </div>
              {s.network_topology?.mermaid&&<MermaidBlock code={s.network_topology.mermaid} height={360}/>}
            </div>
          )}
          {solPanel==='security'&&(
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',marginBottom:12,...SS}}>Security Architecture</div>
              {[
                {k:'iam',label:'Identity & Access Management',icon:'🔑'},
                {k:'encryption',label:'Encryption',icon:'🔐'},
                {k:'network_security',label:'Network Security',icon:'🛡️'},
                {k:'secrets',label:'Secrets Management',icon:'🗝️'},
                {k:'compliance',label:'Compliance',icon:'✅'},
              ].map(row=>(
                <div key={row.k} style={{background:'#fff',border:'1px solid #e8e8e8',
                  borderRadius:10,padding:'12px 16px',marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:600,color:'#1a1a1a',marginBottom:5,...SS}}>
                    {row.icon} {row.label}
                  </div>
                  <div style={{fontSize:11,color:'#555',lineHeight:1.7,...SS}}>
                    {(s.security_architecture as any)?.[row.k]}
                  </div>
                </div>
              ))}
            </div>
          )}
          {solPanel==='hld'&&(
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',marginBottom:6,...SS}}>High-Level Design Diagram</div>
              <div style={{fontSize:11,color:'#888',marginBottom:12,...SS}}>
                Copy the Mermaid source below and paste into{' '}
                <a href="https://mermaid.live" target="_blank" rel="noreferrer" style={{color:'#0078D4'}}>mermaid.live</a>{' '}
                to render and export the diagram.
              </div>
              {s.hld_diagram?.mermaid&&<MermaidBlock code={s.hld_diagram.mermaid} height={560}/>}
            </div>
          )}
          {solPanel==='resilience'&&(
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',marginBottom:12,...SS}}>Scalability & Resilience</div>
              {[
                {k:'scaling',label:'Scaling Strategy',icon:'📈'},
                {k:'availability',label:'Availability Design',icon:'🌐'},
                {k:'dr',label:'Disaster Recovery',icon:'🔄'},
              ].map(row=>(
                <div key={row.k} style={{background:'#fff',border:'1px solid #e8e8e8',
                  borderRadius:10,padding:'12px 16px',marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:600,color:'#1a1a1a',marginBottom:5,...SS}}>
                    {row.icon} {row.label}
                  </div>
                  <div style={{fontSize:11,color:'#555',lineHeight:1.7,...SS}}>
                    {(s.scalability_resilience as any)?.[row.k]}
                  </div>
                </div>
              ))}
            </div>
          )}
          {solPanel==='cost'&&(
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',marginBottom:12,...SS}}>Cost Estimate</div>
              <div style={{background:'#EFF6FF',border:'1px solid #d0e8ff',borderRadius:10,
                padding:'14px 18px',marginBottom:14,textAlign:'center'}}>
                <div style={{fontSize:11,color:'#0078D4',fontWeight:600,...SS}}>Estimated Monthly Range</div>
                <div style={{fontSize:22,fontWeight:700,color:'#0078D4',marginTop:4,...SS}}>
                  {s.cost_estimate?.total_range}
                </div>
              </div>
              {[
                {k:'compute',l:'Compute'},{k:'storage',l:'Storage'},
                {k:'network',l:'Network / Egress'},{k:'managed_services',l:'Managed Services'},
              ].map(row=>(
                <div key={row.k} style={{background:'#fff',border:'1px solid #e8e8e8',
                  borderRadius:8,padding:'10px 14px',marginBottom:8,
                  display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:11,color:'#555',...SS}}>{row.l}</span>
                  <span style={{fontSize:11,fontWeight:600,color:'#333',...SS}}>
                    {(s.cost_estimate as any)?.[row.k]}
                  </span>
                </div>
              ))}
            </div>
          )}
          {solPanel==='nextsteps'&&(
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',marginBottom:12,...SS}}>Recommended Next Steps</div>
              {(s.next_steps||[]).map((ns:string,i:number)=>(
                <div key={i} style={{background:'#fff',border:'1px solid #e8e8e8',
                  borderRadius:10,padding:'14px 16px',marginBottom:10,
                  display:'flex',gap:12,alignItems:'flex-start'}}>
                  <div style={{width:26,height:26,borderRadius:8,background:'#0078D4',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:12,fontWeight:700,color:'#fff',flexShrink:0,...SS}}>{i+1}</div>
                  <div style={{fontSize:12,color:'#333',lineHeight:1.7,...SS}}>{ns}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── HLD FORM ──────────────────────────────────────────────────────────────
  const Chips = ({opts,val,onToggle,cols=2}:{opts:string[],val:string[],onToggle:(v:string)=>void,cols?:number}) => (
    <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:4}}>
      {opts.map(o=>{
        const on=val.includes(o)
        return (
          <button key={o} onClick={()=>onToggle(o)}
            style={{padding:'5px 8px',fontSize:10,border:'1px solid',
              borderColor:on?'#0078D4':'#ddd',borderRadius:6,
              background:on?'#EFF6FF':'#fafafa',color:on?'#0078D4':'#555',
              cursor:'pointer',textAlign:'left',...SS}}>
            {on?'✓ ':''}{o}
          </button>
        )
      })}
    </div>
  )

  const HldSelect = ({val,onChange,opts}:{val:string,onChange:(v:string)=>void,opts:string[]}) => (
    <select value={val} onChange={e=>onChange(e.target.value)}
      style={{width:'100%',padding:'7px 10px',fontSize:11,border:'1px solid #e0e0e0',
        borderRadius:7,background:'#fff',color:'#333',cursor:'pointer',...SS}}>
      {opts.map(o=><option key={o}>{o}</option>)}
    </select>
  )

  function HldForm() {
    return (
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {/* Step rail */}
        <div style={{width:52,background:'#1a1a2e',display:'flex',flexDirection:'column',
          alignItems:'center',padding:'12px 0',gap:2,flexShrink:0}}>
          {HLD_STEPS.map(s=>(
            <div key={s.n} onClick={()=>setHldStep(s.n)} title={s.label}
              style={{width:38,height:38,borderRadius:8,display:'flex',flexDirection:'column',
                alignItems:'center',justifyContent:'center',cursor:'pointer',
                background:hldStep===s.n?'rgba(0,120,212,.3)':'transparent',
                border:hldStep===s.n?'1px solid #0078D4':'1px solid transparent',
                transition:'all .15s',gap:1}}>
              <div style={{fontSize:14}}>{s.icon}</div>
              <div style={{fontSize:7,color:hldStep===s.n?'#60a5fa':'#666',...SS}}>{s.n}</div>
            </div>
          ))}
        </div>
        {/* Form panel */}
        <div style={{width:288,background:'#fff',display:'flex',flexDirection:'column',
          overflow:'hidden',borderRight:'1px solid #e8e8e8',flexShrink:0}}>
          {/* Step header */}
          <div style={{padding:'12px 14px 10px',borderBottom:'1px solid #f0f0f0',background:'#fafafa'}}>
            <div style={{fontSize:11,color:'#888',marginBottom:2,...SS}}>
              Step {hldStep} of {HLD_STEPS.length} — {HLD_STEPS[hldStep-1].label}
            </div>
            <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',...SS}}>
              {hldStep===1?'What are you building?':hldStep===2?'How should it be built?':'Delivery constraints'}
            </div>
          </div>
          {/* Form fields */}
          <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>

            {hldStep===1&&(
              <div>
                <div style={{fontSize:10,fontWeight:600,color:'#888',marginBottom:4,...SS}}>PLATFORM TYPE</div>
                <HldSelect val={hld.platformType} onChange={v=>updHld('platformType',v)} opts={[
                  'Web application','B2B integration platform','Data & analytics platform',
                  'AI / ML platform','Mobile backend (API)','IoT data pipeline',
                  'E-commerce platform','Internal tooling / admin portal','Microservices migration',
                ]}/>
                <div style={{fontSize:10,fontWeight:600,color:'#888',margin:'12px 0 4px',...SS}}>CLOUD PROVIDER(S)</div>
                <Chips opts={['AWS','Azure','GCP','Multi-cloud','No preference']} val={hld.cloud} onToggle={v=>toggleHldArr('cloud',v)} cols={3}/>
                <div style={{fontSize:10,fontWeight:600,color:'#888',margin:'12px 0 4px',...SS}}>CONCURRENT USERS AT LAUNCH</div>
                <HldSelect val={hld.concurrentUsers} onChange={v=>updHld('concurrentUsers',v)} opts={[
                  '<1k concurrent users',
                  '1k–10k concurrent users',
                  '10k–100k concurrent users',
                  '100k+ concurrent users',
                  '< 1 TB/day data ingestion',
                  '1–10 TB/day data ingestion',
                  '10 TB+/day data ingestion',
                  '< 1k RPS API throughput',
                  '1k–10k RPS API throughput',
                  '10k+ RPS API throughput',
                ]}/>
                <div style={{fontSize:10,fontWeight:600,color:'#888',margin:'12px 0 4px',...SS}}>KEY FUNCTIONAL REQUIREMENTS</div>
                <div style={{fontSize:9,color:'#aaa',marginBottom:4,...SS}}>Max 200 characters — the core capabilities this platform must deliver.</div>
                <textarea value={hld.functionalReqs} onChange={e=>updHld('functionalReqs',e.target.value.slice(0,200))}
                  placeholder="e.g. Real-time order tracking, multi-tenant data isolation, partner API webhooks, bulk EDI file processing"
                  rows={3} style={{width:'100%',padding:'6px 9px',fontSize:10,
                    border:'1px solid #e0e0e0',borderRadius:7,color:'#333',
                    resize:'none',lineHeight:1.6,fontFamily:'inherit',...SS}}/>
                <div style={{fontSize:9,color:hld.functionalReqs.length>180?'#c62828':'#bbb',textAlign:'right',marginTop:2,...SS}}>
                  {hld.functionalReqs.length}/200
                </div>
                <div style={{fontSize:10,fontWeight:600,color:'#888',margin:'12px 0 4px',...SS}}>TEAM SIZE</div>
                <HldSelect val={hld.teamSize} onChange={v=>updHld('teamSize',v)} opts={[
                  'Solo / 2 engineers','Startup (3–8 engineers)',
                  'SMB team (8–20 engineers)','Mid-market (20–50 engineers)',
                  'Enterprise (50+ engineers)','Outsourced / managed',
                ]}/>
                <div style={{fontSize:10,fontWeight:600,color:'#888',margin:'12px 0 4px',...SS}}>CLOUD EXPERIENCE</div>
                <HldSelect val={hld.cloudExp} onChange={v=>updHld('cloudExp',v)} opts={[
                  'Beginner (mostly on-prem)','Intermediate (some cloud projects)',
                  'Advanced (cloud-native team)','Expert (ex-FAANG / cloud specialists)',
                ]}/>
              </div>
            )}

            {hldStep===2&&(
              <div>
                <div style={{fontSize:10,fontWeight:600,color:'#888',marginBottom:4,...SS}}>COMPLIANCE REQUIREMENTS</div>
                <Chips opts={['None','SOC 2 Type II','GDPR','HIPAA','PCI DSS','ISO 27001','FedRAMP']}
                  val={hld.compliance} onToggle={v=>toggleHldArr('compliance',v)} cols={2}/>
                <div style={{fontSize:10,fontWeight:600,color:'#888',margin:'12px 0 4px',...SS}}>COMPUTE PREFERENCE</div>
                <Chips opts={['Serverless','Containers (K8s)','PaaS managed','VMs / IaaS','Managed services only']}
                  val={hld.compute} onToggle={v=>toggleHldArr('compute',v)} cols={2}/>

              </div>
            )}

            {hldStep===3&&(
              <div>
                <div style={{fontSize:10,fontWeight:600,color:'#888',marginBottom:4,...SS}}>MONTHLY INFRASTRUCTURE BUDGET</div>
                <HldSelect val={hld.budget} onChange={v=>updHld('budget',v)} opts={[
                  'Under $5k/month','$5k–25k/month','$25k–100k/month','$100k+/month','Unknown / flexible',
                ]}/>
                <div style={{fontSize:10,fontWeight:600,color:'#888',margin:'12px 0 4px',...SS}}>AVAILABILITY SLA</div>
                <HldSelect val={hld.availabilitySla} onChange={v=>updHld('availabilitySla',v)} opts={[
                  '99% (87 hrs downtime/year — dev/test)',
                  '99.9% (8.7 hrs downtime/year — standard)',
                  '99.95% (4.4 hrs downtime/year — business critical)',
                  '99.99% (52 min downtime/year — high availability)',
                  '99.999% (5 min downtime/year — mission critical)',
                ]}/>
                <div style={{fontSize:10,fontWeight:600,color:'#888',margin:'12px 0 4px',...SS}}>PRIMARY ARCHITECTURE CONCERN</div>
                <HldSelect val={hld.primaryConcern} onChange={v=>updHld('primaryConcern',v)} opts={[
                  'Cost (minimise spend)','Scalability (handle growth)','Security (protect data)',
                  'Time to market (ship fast)','Reliability (zero downtime)','Developer experience',
                ]}/>
                <div style={{fontSize:10,fontWeight:600,color:'#888',margin:'12px 0 4px',...SS}}>EXISTING SYSTEMS TO INTEGRATE</div>
                <textarea value={hld.integrations} onChange={e=>updHld('integrations',e.target.value)}
                  placeholder="e.g. Salesforce CRM, SAP ERP via RFC, legacy Oracle DB (read-only), Stripe payments, internal ActiveMQ broker"
                  rows={3} style={{width:'100%',padding:'6px 9px',fontSize:10,
                    border:'1px solid #e0e0e0',borderRadius:7,color:'#333',
                    resize:'none',lineHeight:1.6,fontFamily:'inherit',...SS}}/>
                <div style={{fontSize:10,fontWeight:600,color:'#888',margin:'12px 0 4px',...SS}}>KEY CONSTRAINT</div>
                <textarea value={hld.keyRequirement} onChange={e=>updHld('keyRequirement',e.target.value)}
                  placeholder="e.g. All EU customer data must remain in eu-west-1. Traffic spikes 20× during Black Friday. Latency SLA &lt;200ms p99."
                  rows={3} style={{width:'100%',padding:'6px 9px',fontSize:10,
                    border:'1px solid #e0e0e0',borderRadius:7,color:'#333',
                    resize:'none',lineHeight:1.6,fontFamily:'inherit',...SS}}/>
                {error&&(
                  <div style={{background:'#fff0f0',border:'1px solid #ffcdd2',borderRadius:7,
                    padding:'7px 9px',fontSize:10,color:'#c62828',marginTop:8,...SS}}>
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Nav */}
          <div style={{padding:'10px 14px',borderTop:'1px solid #f0f0f0'}}>
            <div style={{display:'flex',gap:6,marginBottom:6}}>
              {hldStep>1&&(
                <button onClick={()=>setHldStep(s=>s-1)}
                  style={{flex:1,padding:'8px 0',fontSize:11,border:'1px solid #ddd',
                    borderRadius:7,background:'#fff',color:'#555',cursor:'pointer',...SS}}>
                  ← Back
                </button>
              )}
              {hldStep<HLD_STEPS.length
                ?<button onClick={()=>setHldStep(s=>s+1)}
                  style={{flex:2,padding:'8px 0',fontSize:11,fontWeight:600,border:'none',
                    borderRadius:7,background:'#0078D4',color:'#fff',cursor:'pointer',...SS}}>
                  Next: {HLD_STEPS[hldStep]?.label} →
                </button>
                :<button onClick={generateSolution} disabled={loading}
                  style={{flex:2,padding:'8px 0',fontSize:11,fontWeight:600,border:'none',
                    borderRadius:7,background:loading?'#e0e0e0':'#107C10',
                    color:loading?'#bbb':'#fff',cursor:loading?'not-allowed':'pointer',...SS}}>
                  {loading?'Generating...':'⚡ Generate Solution'}
                </button>
              }
            </div>
            {loading&&(
              <div style={{textAlign:'center',fontSize:10,color:'#0078D4',...SS}}>
                <style>{'@keyframes sph{to{transform:rotate(360deg)}}'}</style>
                <span style={{display:'inline-block',width:12,height:12,borderRadius:'50%',
                  border:'2px solid #e0e0e0',borderTopColor:'#0078D4',
                  animation:'sph .8s linear infinite',marginRight:5,verticalAlign:'middle'}}/>
                {loadingMsg}
              </div>
            )}
          </div>
        </div>

        {/* Prompt preview */}
        <div style={{flex:1,overflowY:'auto',padding:20,background:'#f8f9fa'}}>
          <div style={{fontSize:11,fontWeight:600,color:'#444',marginBottom:8,...SS}}>
            Prompt preview — updates as you answer
          </div>
          <pre style={{background:'#1a1a2e',borderRadius:10,padding:'14px 16px',fontSize:9,
            color:'#94a3b8',lineHeight:1.7,whiteSpace:'pre-wrap',margin:0,...SS}}>
            {buildHldPrompt(hld)}
          </pre>
          <div style={{marginTop:10,fontSize:9,color:'#bbb',textAlign:'center',...SS}}>
            Powered by Claude Sonnet 4.6 · Multi-cloud architecture · Mermaid HLD diagrams
          </div>
        </div>
      </div>
    )
  }

  // ── ADVISOR COMPONENTS (closures over advisor state) ─────────────────────

  function AdvisorImpactCard() {
    if (!advisorChangeImpact) return null
    const ci = advisorChangeImpact
    const recColor = ci.recommendation === 'PROCEED' ? '#107C10'
      : ci.recommendation === 'PROCEED_WITH_CAUTION' ? '#D47B00' : '#D13438'
    const recBg = ci.recommendation === 'PROCEED' ? '#F0FFF0'
      : ci.recommendation === 'PROCEED_WITH_CAUTION' ? '#FFFBF0' : '#FFF0F0'
    return (
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.45)',zIndex:50,
        display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
        <div style={{background:'#fff',borderRadius:14,maxWidth:640,width:'100%',
          boxShadow:'0 20px 60px rgba(0,0,0,.25)',overflow:'hidden'}}>
          <div style={{background:'linear-gradient(135deg,#1a1a2e,#0c3460)',padding:'16px 20px',
            display:'flex',alignItems:'center',gap:10}}>
            <div style={{fontSize:20}}>⚡</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:'#fff',...SS}}>Change Impact Analysis</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,.6)',...SS}}>Review before proceeding</div>
            </div>
          </div>
          <div style={{padding:'16px 20px',maxHeight:'60vh',overflowY:'auto'}}>
            <div style={{background:'#f8f9fa',borderRadius:8,padding:'10px 14px',marginBottom:14,
              fontSize:12,color:'#333',lineHeight:1.7,...SS}}>
              <strong>Requested change:</strong> {ci.requested_change}
            </div>
            {ci.affected_components?.length>0&&(
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,color:'#555',marginBottom:5,textTransform:'uppercase',...SS}}>Affected Components</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                  {ci.affected_components.map((c: string,i: number)=>(
                    <span key={i} style={{fontSize:10,padding:'2px 8px',borderRadius:99,
                      background:'#EFF6FF',color:'#0078D4',border:'1px solid #d0e8ff',...SS}}>{c}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'#107C10',marginBottom:4,textTransform:'uppercase',...SS}}>Improvements</div>
                {(ci.improvements||[]).map((imp: string,i: number)=>(
                  <div key={i} style={{fontSize:11,color:'#444',padding:'3px 0',lineHeight:1.6,
                    display:'flex',gap:6,...SS}}>
                    <span style={{color:'#107C10',flexShrink:0}}>✓</span>{imp}
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'#D13438',marginBottom:4,textTransform:'uppercase',...SS}}>Risks</div>
                {(ci.risks||[]).map((r: string,i: number)=>(
                  <div key={i} style={{fontSize:11,color:'#444',padding:'3px 0',lineHeight:1.6,
                    display:'flex',gap:6,...SS}}>
                    <span style={{color:'#D13438',flexShrink:0}}>⚠</span>{r}
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              <div style={{fontSize:11,padding:'4px 12px',borderRadius:99,
                background:'#f0f0f0',color:'#555',...SS}}>
                Effort: <strong>{ci.effort_estimate}</strong>
              </div>
              <div style={{fontSize:11,padding:'4px 12px',borderRadius:99,
                background:recBg,color:recColor,fontWeight:700,...SS}}>
                {ci.recommendation?.replace(/_/g,' ')}
              </div>
            </div>
            <div style={{background:'#f8f9fa',borderRadius:8,padding:'10px 14px',
              fontSize:11,color:'#555',lineHeight:1.7,marginBottom:14,...SS}}>
              {ci.recommendation_reason}
            </div>
            <div style={{fontSize:12,color:'#333',fontWeight:500,marginBottom:14,...SS}}>
              {ci.confirmation_question}
            </div>
          </div>
          <div style={{padding:'12px 20px',borderTop:'1px solid #f0f0f0',display:'flex',gap:8,background:'#fafafa'}}>
            <button onClick={()=>{setAdvisorChangeImpact(null)}}
              style={{flex:1,padding:'9px 0',fontSize:12,border:'1px solid #ddd',borderRadius:8,
                background:'#fff',color:'#555',cursor:'pointer',...SS}}>
              Cancel
            </button>
            <button onClick={()=>{
                const desc = advisorPendingConfirm || 'User confirmed — please proceed with the change.'
                setAdvisorChangeImpact(null)
                generateAdvisor(desc)
              }}
              style={{flex:2,padding:'9px 0',fontSize:12,fontWeight:600,border:'none',borderRadius:8,
                background:recColor,color:'#fff',cursor:'pointer',...SS}}>
              Confirm & Apply Change
            </button>
          </div>
        </div>
      </div>
    )
  }

  function AdvisorSolutionPanel() {
    if (!advisorSolution) return null
    const s = advisorSolution
    const TABS = [
      {k:'overview'  as const,l:'Overview'},
      {k:'diagram'   as const,l:'Architecture Diagram'},
      {k:'security'  as const,l:'Security'},
      {k:'cost'      as const,l:'Cost'},
      {k:'iac'       as const,l:'IaC Starter'},
      {k:'nextsteps' as const,l:'Next Steps'},
    ]
    const hldTD  = s.hld_diagrams?.layout_topdown   || s.hld_diagram?.mermaid || ''
    const hldLR  = s.hld_diagrams?.layout_leftright  || hldTD
    const netTD  = s.network_topology?.diagrams?.layout_topdown  || s.network_topology?.mermaid || ''
    const netLR  = s.network_topology?.diagrams?.layout_leftright || netTD
    const activeDiagram = advisorDiagramType === 'hld'
      ? (advisorDiagramLayout === 'topdown' ? hldTD : hldLR)
      : (advisorDiagramLayout === 'topdown' ? netTD : netLR)

    return (
      <div style={{display:'flex',flexDirection:'column',flex:1,overflow:'hidden'}}>
        {/* Output header */}
        <div style={{height:46,background:'var(--c-surface)',borderBottom:'1px solid var(--c-border)',
          display:'flex',alignItems:'center',padding:'0 14px',gap:8,flexShrink:0}}>
          <div style={{...LORA,fontSize:13,fontWeight:600,color:'var(--c-text-primary)'}}>
            Solution Document
          </div>
          <div style={{flex:1}}/>
          <button onClick={()=>{setAdvisorSolution(null);setAdvisorStreamText('');currentProjectId.current=null}}
            style={{fontSize:11,padding:'5px 11px',border:'1px solid var(--c-border)',borderRadius:'var(--r-sm)',
              background:'transparent',color:'var(--c-text-secondary)',cursor:'pointer',...SS}}>
            ← Edit
          </button>
          <button onClick={copyAdvisorJSON}
            style={{fontSize:11,padding:'5px 11px',border:'1px solid var(--c-border)',borderRadius:'var(--r-sm)',
              background:'var(--c-accent-light)',color:'var(--c-accent-deep)',cursor:'pointer',...SS}}>
            Copy JSON
          </button>
          <button onClick={downloadAdvisorPDF}
            style={{fontSize:11,padding:'5px 11px',border:'none',borderRadius:'var(--r-sm)',
              background:'var(--c-accent)',color:'#000',cursor:'pointer',fontWeight:600,...SS}}>
            Download PDF
          </button>
        </div>
        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid var(--c-border)',background:'var(--c-surface)',flexShrink:0,overflowX:'auto'}}>
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>setAdvisorTab(t.k)}
              style={{padding:'10px 16px',fontSize:11,whiteSpace:'nowrap',
                fontWeight:advisorTab===t.k?600:400,
                color:advisorTab===t.k?'var(--c-accent)':'var(--c-text-secondary)',
                background:'none',border:'none',
                borderBottom:advisorTab===t.k?'2px solid var(--c-accent)':'2px solid transparent',
                cursor:'pointer',...SS}}>
              {t.l}
            </button>
          ))}
        </div>
        {/* Tab content */}
        <div style={{flex:1,overflowY:'auto',padding:20,background:'var(--c-canvas)',position:'relative'}}>
          {AdvisorImpactCard()}

          {/* OVERVIEW */}
          {advisorTab==='overview'&&(
            <div>
              <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,
                padding:20,marginBottom:16,fontSize:12,lineHeight:1.9,color:'#333',whiteSpace:'pre-wrap',...SS}}>
                {s.solution_overview}
              </div>
              <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',marginBottom:10,...SS}}>Platform Components</div>
              {(s.platform_components||[]).map((c: any,i: number)=>(
                <div key={i} style={{background:'#fff',border:'1px solid #e8e8e8',
                  borderRadius:10,padding:'12px 16px',marginBottom:8,display:'flex',gap:12,alignItems:'flex-start'}}>
                  <div style={{flexShrink:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#1a1a1a',...SS}}>{c.name}</div>
                    <span style={{fontSize:9,padding:'2px 7px',borderRadius:99,
                      background:'#EFF6FF',color:'#0078D4',fontWeight:600,display:'inline-block',marginTop:2,...SS}}>
                      {c.azure_service||c.service||''}
                    </span>
                    {c.zone&&<span style={{fontSize:9,padding:'2px 7px',borderRadius:99,marginLeft:4,
                      background:'#f5f5f5',color:'#737373',display:'inline-block',marginTop:2,...SS}}>
                      {c.zone}
                    </span>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:'#555',marginBottom:3,...SS}}>{c.purpose}</div>
                    <div style={{fontSize:10,color:'#888',...SS}}><strong>Why:</strong> {c.rationale}</div>
                    {c.alternatives_considered?.length > 0 && (
                      <div style={{marginTop:6,borderTop:'1px solid #f0f0f0',paddingTop:6}}>
                        <div style={{fontSize:9,fontWeight:600,color:'#aaa',
                          textTransform:'uppercase',letterSpacing:'0.05em',
                          marginBottom:4,...SS}}>
                          Also considered
                        </div>
                        {c.alternatives_considered.map((alt: any, ai: number) => (
                          <div key={ai} style={{fontSize:10,color:'#888',
                            marginBottom:2,...SS}}>
                            <span style={{fontWeight:600,color:'#555',...SS}}>
                              {alt.service}
                            </span>
                            {' — '}{alt.reason_not_chosen}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ARCHITECTURE DIAGRAM */}
          {advisorTab==='diagram'&&(
            <div>
              <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
                <div style={{display:'flex',background:'#fff',border:'1px solid #e0e0e0',borderRadius:7,padding:3,gap:2}}>
                  {(['hld','network'] as const).map(t=>(
                    <button key={t} onClick={()=>setAdvisorDiagramType(t)}
                      style={{padding:'4px 12px',fontSize:10,fontWeight:advisorDiagramType===t?600:400,
                        borderRadius:5,border:'none',cursor:'pointer',
                        background:advisorDiagramType===t?'#0078D4':'transparent',
                        color:advisorDiagramType===t?'#fff':'#666',...SS}}>
                      {t==='hld'?'HLD':'Network'}
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',background:'#fff',border:'1px solid #e0e0e0',borderRadius:7,padding:3,gap:2}}>
                  {(['topdown','leftright'] as const).map(l=>(
                    <button key={l} onClick={()=>setAdvisorDiagramLayout(l)}
                      style={{padding:'4px 12px',fontSize:10,fontWeight:advisorDiagramLayout===l?600:400,
                        borderRadius:5,border:'none',cursor:'pointer',
                        background:advisorDiagramLayout===l?'#0078D4':'transparent',
                        color:advisorDiagramLayout===l?'#fff':'#666',...SS}}>
                      {l==='topdown'?'↕ Overview':'↔ Full Detail'}
                    </button>
                  ))}
                </div>
              </div>
              {advisorDiagramType==='network'&&s.network_topology?.description&&(
                <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,
                  padding:'12px 16px',marginBottom:14,fontSize:11,lineHeight:1.8,color:'#555',...SS}}>
                  {s.network_topology.description}
                  {s.network_topology.address_sizes&&(
                    <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
                      {Object.entries(s.network_topology.address_sizes).map(([k,v])=>(
                        <span key={k} style={{fontSize:10,padding:'2px 8px',borderRadius:99,
                          background:'#EFF6FF',color:'#0078D4',border:'1px solid #d0e8ff',...SS}}>
                          {k.replace('snet_','/').replace('vnet','/16')}: {v as string}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <MermaidBlock code={activeDiagram||'# No diagram available'} height={540} layout={advisorDiagramLayout}/>
            </div>
          )}

          {/* SECURITY */}
          {advisorTab==='security'&&(
            <div>
              {[
                {k:'identity',l:'Identity & Access Management',icon:'🔑'},
                {k:'network_security',l:'Network Security',icon:'🛡️'},
                {k:'encryption',l:'Encryption',icon:'🔐'},
                {k:'secrets_management',l:'Secrets Management',icon:'🗝️'},
                {k:'compliance',l:'Compliance',icon:'✅'},
              ].map(row=>(
                <div key={row.k} style={{background:'#fff',border:'1px solid #e8e8e8',
                  borderRadius:10,padding:'13px 16px',marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:600,color:'#1a1a1a',marginBottom:5,...SS}}>
                    {row.icon} {row.l}
                  </div>
                  <div style={{fontSize:11,color:'#555',lineHeight:1.8,...SS}}>
                    {(s.security_architecture as any)?.[row.k]}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* COST */}
          {advisorTab==='cost'&&(
            <div>

              {/* Cost range header */}
              <div style={{background:'#f8f9fa',borderRadius:10,
                padding:'16px 20px',marginBottom:16,
                border:'1px solid #e8e8e8'}}>
                <div style={{fontSize:11,color:'#888',
                  marginBottom:8,...SS}}>
                  Estimated monthly total (Azure infrastructure only)
                </div>
                {s.cost_estimate?.monthly_low ? (
                  <div style={{display:'flex',
                    alignItems:'baseline',gap:16,flexWrap:'wrap'}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:10,color:'#aaa',...SS}}>Low</div>
                      <div style={{fontSize:22,fontWeight:700,
                        color:'#22c55e',...MONO}}>
                        ${(s.cost_estimate?.monthly_low||0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{fontSize:18,color:'#ccc',
                      fontWeight:300}}>—</div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:10,color:'#aaa',...SS}}>Mid</div>
                      <div style={{fontSize:22,fontWeight:700,
                        color:'#0078D4',...MONO}}>
                        ${(s.cost_estimate?.monthly_mid||0).toLocaleString()}
                      </div>
                    </div>
                    <div style={{fontSize:18,color:'#ccc',
                      fontWeight:300}}>—</div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:10,color:'#aaa',...SS}}>High</div>
                      <div style={{fontSize:22,fontWeight:700,
                        color:'#f59e0b',...MONO}}>
                        ${(s.cost_estimate?.monthly_high||0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{fontSize:22,fontWeight:700,
                    color:'#0078D4',...MONO}}>
                    {s.cost_estimate?.total_range || 'See breakdown'}
                  </div>
                )}
              </div>

              {/* Key assumptions */}
              {s.cost_estimate?.key_assumptions?.length > 0 && (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:600,
                    color:'#555',marginBottom:6,...SS}}>
                    Key assumptions
                  </div>
                  {s.cost_estimate.key_assumptions.map(
                    (a: string, i: number) => (
                    <div key={i} style={{fontSize:10,color:'#888',
                      marginBottom:3,...SS}}>
                      • {a}
                    </div>
                  ))}
                </div>
              )}

              {/* Cost breakdown table */}
              {s.cost_estimate?.breakdown?.length > 0 && (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:600,
                    color:'#555',marginBottom:6,...SS}}>
                    Cost breakdown
                  </div>
                  <div style={{border:'1px solid #e8e8e8',
                    borderRadius:8,overflow:'hidden'}}>
                    <div style={{display:'grid',
                      gridTemplateColumns:'1fr 1fr 80px 80px 80px',
                      background:'#f8f9fa',padding:'6px 12px',
                      fontSize:9,fontWeight:600,color:'#888',
                      textTransform:'uppercase',
                      letterSpacing:'0.05em',...SS}}>
                      <span>Service</span>
                      <span>Category</span>
                      <span style={{textAlign:'right'}}>Low</span>
                      <span style={{textAlign:'right'}}>Mid</span>
                      <span style={{textAlign:'right'}}>High</span>
                    </div>
                    {s.cost_estimate.breakdown.map(
                      (row: any, i: number) => (
                      <div key={i} style={{display:'grid',
                        gridTemplateColumns:'1fr 1fr 80px 80px 80px',
                        padding:'7px 12px',fontSize:10,color:'#555',
                        borderTop:'1px solid #f0f0f0',
                        background: i%2===0 ? '#fff' : '#fafafa',
                        ...SS}}>
                        <span style={{color:'#1a1a1a',
                          fontWeight:500,...SS}}>
                          {row.service}
                        </span>
                        <span style={{color:'#888',...SS}}>
                          {row.category}
                        </span>
                        <span style={{textAlign:'right',
                          color:'#22c55e',...MONO}}>
                          ${(row.low||0).toLocaleString()}
                        </span>
                        <span style={{textAlign:'right',
                          color:'#0078D4',...MONO}}>
                          ${(row.mid||0).toLocaleString()}
                        </span>
                        <span style={{textAlign:'right',
                          color:'#f59e0b',...MONO}}>
                          ${(row.high||0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimisation tips */}
              {s.cost_estimate?.optimisation_tips?.length > 0 && (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,fontWeight:600,
                    color:'#555',marginBottom:6,...SS}}>
                    Optimisation tips
                  </div>
                  {s.cost_estimate.optimisation_tips.map(
                    (t: string, i: number) => (
                    <div key={i} style={{fontSize:10,color:'#888',
                      padding:'6px 10px',background:'#f0fdf4',
                      borderRadius:6,marginBottom:4,
                      borderLeft:'3px solid #22c55e',...SS}}>
                      {t}
                    </div>
                  ))}
                </div>
              )}

              {/* Excluded costs */}
              {s.cost_estimate?.excluded && (
                <div style={{fontSize:10,color:'#aaa',
                  borderTop:'1px solid #f0f0f0',
                  paddingTop:10,...SS}}>
                  <strong style={{color:'#888',...SS}}>
                    Not included:
                  </strong>{' '}
                  {s.cost_estimate.excluded}
                </div>
              )}

            </div>
          )}

          {/* IAC STARTER */}
          {advisorTab==='iac'&&(
            <div>
              <div style={{fontSize:11,color:'#888',marginBottom:12,lineHeight:1.7,...SS}}>
                Terraform resource stubs — add variables and backend config before applying.
              </div>
              {(s.iac_starter?.resources||[]).length===0
                ?<div style={{fontSize:12,color:'#bbb',textAlign:'center',marginTop:40,...SS}}>No IaC resources in this response.</div>
                :<div style={{background:'#1a1a2e',borderRadius:10,padding:'14px 16px',position:'relative'}}>
                  <button onClick={()=>navigator.clipboard.writeText(
                    (s.iac_starter.resources||[]).map((r: any)=>
                      `resource "${r.terraform_resource}" "${r.name}" {\n  # ${r.key_arguments}\n}`
                    ).join('\n\n')
                  )} style={{position:'absolute',top:10,right:10,fontSize:9,padding:'3px 8px',
                    border:'1px solid #3d3d5c',borderRadius:5,background:'#1e1e38',
                    color:'#94a3b8',cursor:'pointer',...SS}}>
                    Copy
                  </button>
                  <pre style={{margin:0,fontSize:10,color:'#94a3b8',lineHeight:1.7,whiteSpace:'pre-wrap',...SS}}>
                    {(s.iac_starter.resources||[]).map((r: any)=>
                      `resource "${r.terraform_resource}" "${r.name}" {\n  # ${r.key_arguments}\n}`
                    ).join('\n\n')}
                  </pre>
                </div>
              }
              {s.scalability_resilience&&(
                <div style={{marginTop:20}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a',marginBottom:10,...SS}}>
                    Scalability & Resilience
                  </div>
                  {[
                    {k:'scaling_strategy',l:'Scaling Strategy',icon:'📈'},
                    {k:'availability',l:'Availability',icon:'🌐'},
                    {k:'disaster_recovery',l:'Disaster Recovery',icon:'🔄'},
                  ].map(row=>(
                    <div key={row.k} style={{background:'#fff',border:'1px solid #e8e8e8',
                      borderRadius:10,padding:'12px 16px',marginBottom:8}}>
                      <div style={{fontSize:11,fontWeight:600,color:'#1a1a1a',marginBottom:4,...SS}}>
                        {row.icon} {row.l}
                      </div>
                      <div style={{fontSize:11,color:'#555',lineHeight:1.7,...SS}}>
                        {(s.scalability_resilience as any)?.[row.k]}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NEXT STEPS */}
          {advisorTab==='nextsteps'&&(
            <div>
              {(s.next_steps||[]).map((ns: string,i: number)=>(
                <div key={i} style={{background:'#fff',border:'1px solid #e8e8e8',
                  borderRadius:10,padding:'14px 18px',marginBottom:10,
                  display:'flex',gap:14,alignItems:'flex-start'}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:'var(--c-accent)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:12,fontWeight:700,color:'#000',flexShrink:0,...SS}}>{i+1}</div>
                  <div style={{fontSize:12,color:'#333',lineHeight:1.8,...SS}}>{ns}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  function AdvisorForm() {
    return (
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {/* Sidebar — AdvisorPanel */}
        <AdvisorPanel
          advisorForm={advisorForm}
          updAdvisor={updAdvisor}
          advisorSolution={advisorSolution}
          generateAdvisor={generateAdvisor}
          collapseRef={advisorPanelCollapseRef}
        />

        {/* Canvas */}
        <div className="canvas-dot-grid" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>

          {/* ERROR BANNER */}
          {advisorError&&(
            <div style={{position:'absolute',top:12,left:12,right:12,zIndex:20,
              background:'#fff0f0',border:'1px solid #ffcdd2',borderRadius:8,
              padding:'8px 12px',fontSize:12,color:'#c62828',
              display:'flex',alignItems:'flex-start',gap:8,...SS}}>
              <span style={{fontWeight:600,flexShrink:0}}>Error:</span>
              <span style={{flex:1,lineHeight:1.5}}>{advisorError}</span>
              <button onClick={()=>setAdvisorError('')}
                style={{background:'none',border:'none',cursor:'pointer',
                  color:'#c62828',fontSize:14,lineHeight:1,padding:0,flexShrink:0}}>✕</button>
            </div>
          )}

          {/* EMPTY STATE */}
          {!advisorSolution&&!advisorLoading&&!advisorChangeImpact&&(
            <div className="fade-up" style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',padding:40,pointerEvents:'none'}}>
              {/* Icon ring */}
              <div style={{width:76,height:76,borderRadius:22,background:'var(--c-surface)',
                border:'1px solid var(--c-border)',boxShadow:'0 4px 24px rgba(0,0,0,.08)',
                display:'flex',alignItems:'center',justifyContent:'center',marginBottom:24}}>
                <i className="ti ti-topology-star-3" style={{fontSize:34,color:'var(--c-accent)'}}/>
              </div>
              <div style={{...LORA,fontSize:19,fontWeight:600,color:'var(--c-text-primary)',marginBottom:10,textAlign:'center'}}>
                Your architecture will appear here
              </div>
              <div style={{fontSize:13,color:'var(--c-text-secondary)',maxWidth:380,textAlign:'center',lineHeight:1.75,...SS,marginBottom:20}}>
                Describe your platform in the sidebar and click Generate — Archon sends it to Claude with a master architect prompt and returns diagrams, costs, and next steps.
              </div>
              {/* Output pills */}
              <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center',marginBottom:16}}>
                {[
                  {icon:'ti-sitemap',label:'Mermaid diagram'},
                  {icon:'ti-currency-dollar',label:'Cost estimate'},
                  {icon:'ti-code',label:'IaC stubs'},
                  {icon:'ti-list-check',label:'Next steps'},
                ].map(p=>(
                  <div key={p.label} style={{display:'flex',alignItems:'center',gap:5,
                    padding:'5px 12px',borderRadius:20,background:'var(--c-surface)',
                    border:'1px solid var(--c-border)'}}>
                    <i className={`ti ${p.icon}`} style={{fontSize:13,color:'var(--c-accent)'}}/>
                    <span style={{fontSize:12,color:'var(--c-text-secondary)',...SS}}>{p.label}</span>
                  </div>
                ))}
              </div>
              {/* Demo pill */}
              <div style={{padding:'6px 16px',borderRadius:20,
                background:'var(--c-accent-light)',border:'1px solid var(--c-accent-mid)',
                fontSize:11,color:'var(--c-accent-deep)',...SS,pointerEvents:'auto'}}>
                Demo values are pre-filled — click Generate to see a full output
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {advisorLoading&&(
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',
              background:'rgba(250,248,245,0.88)',backdropFilter:'blur(3px)',zIndex:10}}>
              {/* Dual-ring spinner */}
              <div style={{position:'relative',width:56,height:56,marginBottom:24}}>
                <div style={{position:'absolute',inset:0,borderRadius:'50%',
                  border:'3px solid transparent',borderTopColor:'var(--c-accent)',
                  animation:'spin-cw 0.8s linear infinite'}}/>
                <div style={{position:'absolute',inset:8,borderRadius:'50%',
                  border:'3px solid transparent',borderBottomColor:'var(--c-accent-mid)',
                  animation:'spin-ccw 1.4s linear infinite'}}/>
              </div>
              <div style={{...LORA,fontSize:15,fontWeight:600,color:'var(--c-text-primary)',marginBottom:6}}>
                Designing your architecture…
              </div>
              <div style={{fontSize:12,color:'var(--c-text-muted)',...SS,marginBottom:20}}>
                Claude is consulting the master architect prompt
              </div>
              {advisorStreamText&&(
                <div style={{maxWidth:580,width:'100%',maxHeight:240,overflow:'hidden',
                  background:'var(--c-surface)',border:'1px solid var(--c-border)',
                  borderRadius:'var(--r-lg)',padding:'12px 16px',position:'relative'}}>
                  <div style={{position:'absolute',bottom:0,left:0,right:0,height:40,
                    background:`linear-gradient(transparent, var(--c-surface))`,borderRadius:'0 0 13px 13px'}}/>
                  <pre style={{...MONO,margin:0,fontSize:10,color:'var(--c-text-muted)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>
                    {advisorStreamText.slice(-800)}
                  </pre>
                </div>
              )}
              <style>{`
                @keyframes spin-cw  { to { transform: rotate(360deg);  } }
                @keyframes spin-ccw { to { transform: rotate(-360deg); } }
              `}</style>
            </div>
          )}

          {advisorChangeImpact&&!advisorSolution&&(
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
              <div style={{fontSize:12,color:'var(--c-text-muted)',...SS}}>
                Impact analysis ready — review and confirm in the panel above.
              </div>
            </div>
          )}

          {advisorSolution&&AdvisorSolutionPanel()}

          {advisorChangeImpact&&<div style={{position:'absolute',inset:0,zIndex:40}}>
            {AdvisorImpactCard()}
          </div>}
        </div>
      </div>
    )
  }

  // Topbar ghost button style
  const tbGhost: React.CSSProperties = {
    display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:'var(--r-sm)',
    fontSize:12,border:'1px solid var(--c-topbar-border)',background:'transparent',
    color:'var(--c-text-nav)',cursor:'pointer',...SS,transition:'all .15s',
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',width:'100vw',overflow:'hidden',...SS}}>

      {/* ── TOPBAR ── */}
      <div style={{height:50,background:'var(--c-topbar)',display:'flex',alignItems:'center',
        padding:'0 14px',gap:14,flexShrink:0,borderBottom:'1px solid var(--c-topbar-border)'}}>

        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:9,flexShrink:0}}>
          <div style={{width:28,height:28,borderRadius:7,background:'var(--c-accent)',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <i className="ti ti-topology-star-3" style={{fontSize:14,color:'#fff'}}/>
          </div>
          <span style={{...LORA,fontSize:15,fontWeight:600,color:'var(--c-text-nav-active)',letterSpacing:'.01em'}}>Archon</span>
          <div style={{width:1,height:18,background:'var(--c-topbar-border)',margin:'0 3px'}}/>
          <span style={{fontSize:11,color:'var(--c-accent-mid)',fontWeight:500,...SS}}>Enterprise Advisor</span>
        </div>

        {/* Nav tabs */}
        <nav style={{display:'flex',gap:1,marginLeft:8}}>
          {([
            {id:'advisor',icon:'ti-layout-sidebar',label:'Advisor'},
            {id:'history',icon:'ti-history',        label:'History'},
            {id:'settings',icon:'ti-settings',      label:'Settings'},
          ] as const).map(tab=>(
            <button key={tab.id}
              onClick={()=>tab.id==='advisor'&&setAppMode('advisor')}
              style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',
                borderRadius:'var(--r-sm)',fontSize:12,border:'none',cursor:'pointer',
                fontWeight:appMode===tab.id?500:400,...SS,
                background:appMode===tab.id?'rgba(217,119,6,0.18)':'transparent',
                color:appMode===tab.id?'var(--c-accent-mid)':'var(--c-text-nav)',
                transition:'all .15s'}}>
              <i className={`ti ${tab.icon}`} style={{fontSize:14}}/>
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{flex:1}}/>

        {/* Right actions */}
        <button style={tbGhost}>Export</button>

        {/* Theme toggle */}
        <button onClick={toggleTheme} aria-label="Toggle theme"
          style={{...tbGhost,width:32,height:32,padding:0,justifyContent:'center',gap:0}}>
          <i className={`ti ${theme==='dark'?'ti-sun':'ti-moon'}`} style={{fontSize:15}}/>
        </button>

        {/* Avatar */}
        <div style={{width:28,height:28,borderRadius:'50%',background:'var(--c-accent)',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:12,fontWeight:700,color:'#000',
          border:'1.5px solid var(--c-accent-mid)',cursor:'pointer',...SS}}>S</div>
      </div>

      {/* ── MAIN ── */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {appMode==='advisor'&&AdvisorForm()}
      </div>

      {/* ── STATUS BAR ── */}
      <div style={{height:30,background:'var(--c-sidebar)',borderTop:'1px solid var(--c-border)',
        display:'flex',alignItems:'center',padding:'0 14px',gap:12,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:5,...SS}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#22c55e'}}/>
          <span style={{fontSize:11,color:'var(--c-text-secondary)'}}>Ready</span>
        </div>
        <span style={{fontSize:11,color:'var(--c-border)'}}>|</span>
        <span style={{fontSize:11,color:'var(--c-text-muted)',...SS}}>Claude Sonnet 4.6</span>
        <span style={{fontSize:11,color:'var(--c-border)'}}>|</span>
        <span style={{fontSize:11,color:'var(--c-text-muted)',...SS}}>Auto-saved</span>
        <div style={{flex:1}}/>
        <div style={{display:'flex',alignItems:'center',gap:2}}>
          {(['−',`${zoomLevel}%`,'+','Fit'] as const).map(z=>(
            <button key={z}
              onClick={()=>{
                if(z==='−')setZoomLevel(l=>Math.max(50,l-10))
                else if(z==='+')setZoomLevel(l=>Math.min(200,l+10))
                else if(z==='Fit')setZoomLevel(100)
              }}
              style={{padding:'2px 7px',fontSize:11,border:'1px solid var(--c-border)',
                borderRadius:4,background:'transparent',color:'var(--c-text-muted)',
                cursor:'pointer',...SS}}>
              {z}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
