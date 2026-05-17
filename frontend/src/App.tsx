// ═══════════════════════════════════════════════════════════════════════
// ARCHON — Enterprise Architecture Discovery Engine
// Exhaustive 6-pillar questionnaire → JSON schema → Visual layout engine
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap, useNodesState, useEdgesState,
  addEdge, MarkerType, Panel, Handle, Position
} from 'reactflow'
import 'reactflow/dist/style.css'

const API = ''

// ═══════════════════════════════════════════════════════════════════════
// SECTION 1 — ARCHITECTURE SCHEMA
// Maps discovery answers → standard industry architecture patterns
// ═══════════════════════════════════════════════════════════════════════

interface ArchitectureSchema {
  meta: {
    project: string; client: string; industry: string; version: string
    timestamp: string; architect: string; review_date: string
  }
  // Pillar 1 — Compute
  compute: {
    archetype: 'monolith'|'n-tier'|'microservices'|'serverless'|'event-driven'|'data-driven'|'hybrid'
    primary_compute: string[]; aks_config?: AKSConfig; app_service_config?: AppServiceConfig
    functions_config?: FunctionsConfig; vm_config?: VMConfig; container_strategy: string
  }
  // Pillar 2 — Network
  network: {
    topology: 'hub-spoke'|'flat-vnet'|'virtual-wan'|'mesh'|'hybrid-connectivity'
    spoke_cidrs: string[]; hub_services: string[]; ingress_type: string
    egress_strategy: string; private_link_services: string[]
    expressroute: boolean; vpn_gateway: boolean; peering_config: string
    dns_strategy: string; traffic_manager: boolean; front_door: boolean
  }
  // Pillar 3 — Security
  security: {
    posture: 'basic'|'standard'|'zero-trust'|'defense-in-depth'
    identity_provider: string[]; mfa_required: boolean; pim_enabled: boolean
    conditional_access: boolean; rbac_model: string; key_vault_tiers: string[]
    encryption_at_rest: 'pmk'|'cmk'|'byok'; encryption_in_transit: string
    waf_ruleset: string; ddos_protection: string; defender_plans: string[]
    compliance: string[]; audit_logging: boolean; siem_integration: string
    private_endpoints_all: boolean; nsg_strategy: string
  }
  // Pillar 4 — Data
  data: {
    primary_database: string; database_tier: string; iops_requirement: number
    storage_gb: number; retention_years: number; backup_strategy: string
    replication: string; caching_tier: string; search_service: boolean
    analytics: string[]; data_lake: boolean; streaming: string
    nosql_services: string[]; sql_services: string[]
  }
  // Pillar 5 — Scaling
  scaling: {
    scale_unit: 'pod'|'instance'|'replica'|'node'; autoscale_metric: string[]
    min_instances: number; max_instances: number; target_cpu: number
    target_memory: number; scale_out_cooldown: number; scale_in_cooldown: number
    peak_concurrency: number; p95_latency_ms: number; requests_per_second: number
    burst_strategy: string; load_test_required: boolean
  }
  // Pillar 6 — HA/DR
  ha_dr: {
    rto_minutes: number; rpo_minutes: number; availability_target: string
    ha_strategy: 'zone-redundant'|'multi-region-active-passive'|'multi-region-active-active'|'single-region'
    primary_region: string; secondary_region: string; failover_type: string
    backup_frequency: string; geo_replication: boolean; traffic_routing: string
    chaos_engineering: boolean; runbook_exists: boolean
  }
  // Layout decision (computed)
  layout: {
    style: 'horizontal-tiers'|'vertical-columns'|'hybrid-grid'|'radial'
    rationale: string; tier_count: number; column_count: number
    grouping_strategy: string
  }
}

interface AKSConfig {
  node_pool_sku: string; node_count_min: number; node_count_max: number
  cni: 'azure'|'kubenet'|'cilium'; network_policy: string; ingress_controller: string
}
interface AppServiceConfig { sku: string; os: 'linux'|'windows'; slots: number }
interface FunctionsConfig { plan: 'consumption'|'premium'|'dedicated'; trigger_types: string[] }
interface VMConfig { sku: string; count: number; availability_set: boolean }

// ═══════════════════════════════════════════════════════════════════════
// SECTION 2 — LAYOUT INTELLIGENCE ENGINE
// Decides horizontal-tiers vs vertical-columns based on architecture answers
// ═══════════════════════════════════════════════════════════════════════

function computeLayoutStrategy(answers: Partial<ArchitectureSchema>): {
  style: 'horizontal-tiers'|'vertical-columns'|'hybrid-grid'|'radial'
  rationale: string; tiers: string[]; columns: string[]
} {
  const archetype = answers.compute?.archetype
  const topology  = answers.network?.topology
  const ha        = answers.ha_dr?.ha_strategy

  // RULE 1: Microservices → vertical columns (domain isolation)
  if (archetype === 'microservices') {
    return {
      style: 'vertical-columns',
      rationale: 'Microservices use vertical columns to show domain isolation and independent scaling. Each column = one bounded context.',
      tiers: [], columns: ['Internet','Ingress/Gateway','Service Mesh','Domain Services','Data per Service','Shared Services','Observability']
    }
  }
  // RULE 2: Event-driven → vertical columns (event flow left→right)
  if (archetype === 'event-driven') {
    return {
      style: 'vertical-columns',
      rationale: 'Event-driven architectures flow left to right: producers → bus → consumers → sinks. Vertical columns show this temporal sequence.',
      tiers: [], columns: ['Producers','Event Bus','Processors','Consumers','Storage','Dead-Letter','Monitoring']
    }
  }
  // RULE 3: Hub-Spoke network + enterprise → vertical columns (network boundaries)
  if (topology === 'hub-spoke' || topology === 'virtual-wan') {
    return {
      style: 'vertical-columns',
      rationale: 'Hub-spoke topology maps naturally to columns: Internet → DMZ → Spoke tiers → Hub → Egress. Shows traffic flow and network boundaries.',
      tiers: [], columns: ['Internet','DMZ/Ingress','Application','Integration','Data','Hub Shared Services','Egress/Firewall']
    }
  }
  // RULE 4: Multi-region active-active → horizontal tiers per region
  if (ha === 'multi-region-active-active') {
    return {
      style: 'horizontal-tiers',
      rationale: 'Multi-region active-active uses horizontal tiers to show mirrored regions side-by-side with Traffic Manager/Front Door at top.',
      tiers: ['Global Traffic Layer','Region A — Primary','Region B — Secondary','Shared Global Services','Observability'],
      columns: []
    }
  }
  // RULE 5: N-Tier / Monolith → horizontal tiers (classic presentation→logic→data)
  if (archetype === 'n-tier' || archetype === 'monolith') {
    return {
      style: 'horizontal-tiers',
      rationale: 'N-Tier and monolithic architectures use horizontal tiers: Presentation → Business Logic → Data. Reflects the classic layered model.',
      tiers: ['Presentation / CDN','Application Gateway / WAF','Application Tier','Cache Tier','Data Tier','Security & Key Management','Observability'],
      columns: []
    }
  }
  // RULE 6: Serverless / Functions → hybrid grid
  if (archetype === 'serverless') {
    return {
      style: 'hybrid-grid',
      rationale: 'Serverless uses a hybrid grid: horizontal event flow (trigger→function→output) with vertical grouping by function domain.',
      tiers: ['Triggers & Ingress','Function Execution','Output Bindings','Durable State'],
      columns: ['Domain A','Domain B','Domain C','Shared Infrastructure']
    }
  }
  // RULE 7: Data-driven → horizontal tiers (ingest→process→store→serve)
  if (archetype === 'data-driven') {
    return {
      style: 'horizontal-tiers',
      rationale: 'Data architectures use horizontal tiers showing the data pipeline: Ingestion → Processing → Storage → Serving → Consumption.',
      tiers: ['Data Ingestion','Stream / Batch Processing','Data Lake / Warehouse','Serving Layer','Consumption / BI','Governance & Lineage','Observability'],
      columns: []
    }
  }
  // DEFAULT
  return {
    style: 'vertical-columns',
    rationale: 'Default to vertical columns showing traffic flow from internet through application layers to data and shared services.',
    tiers: [], columns: ['Internet','Ingress','Application','Integration','Data','Shared Services','Observability']
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION 3 — PROMPT BUILDER
// Converts all 80+ form answers into a precise architectural prompt
// ═══════════════════════════════════════════════════════════════════════

function buildEnterprisePrompt(a: Partial<ArchitectureSchema>): string {
  const layout = computeLayoutStrategy(a)
  const m = a.meta||{}
  const c = a.compute||{}
  const n = a.network||{}
  const s = a.security||{}
  const d = a.data||{}
  const sc = a.scaling||{}
  const ha = a.ha_dr||{}

  return `You are an expert Azure Solutions Architect generating a production-grade architecture.

━━━ PROJECT CONTEXT ━━━
Project: ${m.project||'Enterprise Platform'}
Client: ${m.client||'Enterprise'}
Industry: ${m.industry||'General'}
Architect: ${m.architect||''}

━━━ PILLAR 1: COMPUTE & SERVICE SELECTION ━━━
Architecture archetype: ${c.archetype||'n-tier'}
Primary compute services: ${(c.primary_compute||[]).join(', ')||'App Service, Azure Functions'}
Container strategy: ${c.container_strategy||'PaaS managed'}
${c.aks_config?`AKS configuration:
  Node pool SKU: ${c.aks_config.node_pool_sku}
  Node count: ${c.aks_config.node_count_min}–${c.aks_config.node_count_max}
  CNI plugin: ${c.aks_config.cni}
  Network policy: ${c.aks_config.network_policy}
  Ingress controller: ${c.aks_config.ingress_controller}`:''}
${c.app_service_config?`App Service:
  SKU: ${c.app_service_config.sku}
  OS: ${c.app_service_config.os}
  Deployment slots: ${c.app_service_config.slots}`:''}
${c.functions_config?`Azure Functions:
  Plan: ${c.functions_config.plan}
  Triggers: ${c.functions_config.trigger_types?.join(', ')}`:''}

━━━ PILLAR 2: NETWORK TOPOLOGY ━━━
Topology pattern: ${n.topology||'hub-spoke'}
Spoke VNet CIDRs: ${(n.spoke_cidrs||['10.2.0.0/16']).join(', ')}
Hub shared services reused: ${(n.hub_services||[]).join(', ')||'Azure Firewall, Private DNS Zones'}
Internet ingress: ${n.ingress_type||'Application Gateway v2 + WAF'}
Egress strategy: ${n.egress_strategy||'Hub Azure Firewall with UDR 0.0.0.0/0'}
ExpressRoute: ${n.expressroute?'Yes — dedicated connectivity to on-premises':'No'}
VPN Gateway: ${n.vpn_gateway?'Yes — site-to-site VPN':'No'}
Azure Front Door: ${n.front_door?'Yes — global CDN + WAF + failover routing':'No'}
Traffic Manager: ${n.traffic_manager?'Yes — DNS-based global load balancing':'No'}
DNS strategy: ${n.dns_strategy||'Azure Private DNS Zones with hub DNS resolver'}
Private endpoints: ${n.private_link_services?.join(', ')||'All data services'}
VNet peering: ${n.peering_config||'Spoke to hub, no spoke-to-spoke direct peering'}

━━━ PILLAR 3: SECURITY, COMPLIANCE & IDENTITY ━━━
Security posture: ${s.posture||'zero-trust'}
Identity providers: ${(s.identity_provider||['Microsoft Entra ID']).join(', ')}
MFA required: ${s.mfa_required?'Yes — enforced via Conditional Access':'No'}
PIM (Privileged Identity Management): ${s.pim_enabled?'Yes — JIT access for all privileged roles':'No'}
Conditional Access policies: ${s.conditional_access?'Yes — device compliance, location, risk-based':'No'}
RBAC model: ${s.rbac_model||'Custom roles with least-privilege, deny assignments'}
Key Vault tiers: ${(s.key_vault_tiers||['Standard']).join(', ')}
Encryption at rest: ${s.encryption_at_rest||'cmk'} (${s.encryption_at_rest==='cmk'?'Customer-Managed Keys':s.encryption_at_rest==='byok'?'Bring Your Own Key':'Platform-Managed Keys'})
Encryption in transit: ${s.encryption_in_transit||'TLS 1.3 enforced everywhere'}
WAF ruleset: ${s.waf_ruleset||'OWASP 3.2 + custom rules'}
DDoS protection: ${s.ddos_protection||'Azure DDoS Network Protection Standard'}
Microsoft Defender plans: ${(s.defender_plans||['Defender for Cloud CSPM']).join(', ')}
Compliance frameworks: ${(s.compliance||[]).join(', ')||'None specified'}
SIEM integration: ${s.siem_integration||'Microsoft Sentinel with Log Analytics'}
Audit logging: ${s.audit_logging?'Yes — all management plane ops logged to Log Analytics':'No'}
Private endpoints on ALL data services: ${s.private_endpoints_all?'Yes — mandatory':'Selective'}
NSG strategy: ${s.nsg_strategy||'Deny-all default, explicit allow per service'}

━━━ PILLAR 4: CAPACITY PLANNING & DATA TIERS ━━━
Primary database: ${d.primary_database||'Azure Cosmos DB'}
Database tier/SKU: ${d.database_tier||'Standard S3'}
IOPS requirement: ${d.iops_requirement||5000} IOPS
Storage capacity: ${d.storage_gb||500} GB
Data retention: ${d.retention_years||7} years
Backup strategy: ${d.backup_strategy||'Geo-redundant, 35-day retention, point-in-time restore'}
Replication: ${d.replication||'Zone-redundant + geo-replication to paired region'}
Caching tier: ${d.caching_tier||'Azure Cache for Redis C3 Premium'}
Search service: ${d.search_service?'Yes — Azure AI Search Standard S1 with semantic ranker':'No'}
NoSQL services: ${(d.nosql_services||[]).join(', ')||'Cosmos DB (NoSQL API)'}
SQL services: ${(d.sql_services||[]).join(', ')||'None'}
Analytics: ${(d.analytics||[]).join(', ')||'Azure Monitor + Log Analytics'}
Data Lake: ${d.data_lake?'Yes — ADLS Gen2 with hierarchical namespace':'No'}
Streaming: ${d.streaming||'None'}

━━━ PILLAR 5: SCALING & ELASTICITY ━━━
Scale unit: ${sc.scale_unit||'instance'}
Autoscale metrics: ${(sc.autoscale_metric||['CPU %','Request queue depth']).join(', ')}
Instance range: ${sc.min_instances||2} minimum → ${sc.max_instances||20} maximum
Target CPU utilisation: ${sc.target_cpu||70}%
Target memory utilisation: ${sc.target_memory||80}%
Scale-out cooldown: ${sc.scale_out_cooldown||60} seconds
Scale-in cooldown: ${sc.scale_in_cooldown||300} seconds
Peak concurrent users: ${sc.peak_concurrency||10000}
P95 latency target: ${sc.p95_latency_ms||500}ms
Peak RPS (requests/sec): ${sc.requests_per_second||1000}
Burst strategy: ${sc.burst_strategy||'Azure CDN + Redis cache absorbs burst before compute'}
Load testing required: ${sc.load_test_required?'Yes — Azure Load Testing with JMeter scripts':'No'}

━━━ PILLAR 6: HIGH AVAILABILITY & DISASTER RECOVERY ━━━
RTO target: ${ha.rto_minutes||60} minutes
RPO target: ${ha.rpo_minutes||15} minutes
Availability SLA target: ${ha.availability_target||'99.95%'}
HA strategy: ${ha.ha_strategy||'zone-redundant'}
Primary region: ${ha.primary_region||'Australia East'}
Secondary region: ${ha.secondary_region||'Australia Southeast'}
Failover type: ${ha.failover_type||'Automated with Azure Traffic Manager health probes'}
Backup frequency: ${ha.backup_frequency||'Hourly incremental, daily full'}
Geo-replication: ${ha.geo_replication?'Yes — active geo-replication to secondary region':'No'}
Traffic routing during failover: ${ha.traffic_routing||'DNS failover via Traffic Manager (<1 min TTL)'}
Chaos engineering: ${ha.chaos_engineering?'Yes — Azure Chaos Studio experiments defined':'No'}
Runbook exists: ${ha.runbook_exists?'Yes — documented and tested quarterly':'No — create as part of this engagement'}

━━━ VISUAL LAYOUT SPECIFICATION ━━━
Layout style: ${layout.style.toUpperCase()}
Rationale: ${layout.rationale}
${layout.style==='horizontal-tiers'?`
Horizontal tiers (top → bottom):
${layout.tiers.map((t,i)=>`  TIER ${i+1}: ${t}`).join('\n')}
Rationale: Group services into horizontal bands. Top = user-facing, Bottom = infrastructure.
Each tier is a dashed rectangle spanning the full diagram width.
Services within each tier are arranged left-to-right.
`:''}
${layout.style==='vertical-columns'?`
Vertical columns (left → right):
${layout.columns.map((c,i)=>`  COLUMN ${i+1}: ${c}`).join('\n')}
Rationale: Organize by traffic flow direction. Left = internet/external, Right = internal/egress.
Each column is a dashed rectangle with services stacked top-to-bottom within it.
NSG boundaries shown on column edges.
`:''}
${layout.style==='hybrid-grid'?`
Hybrid grid layout:
Horizontal rows: ${layout.tiers.join(' → ')}
Vertical columns: ${layout.columns.join(' | ')}
Rationale: ${layout.rationale}
`:''}

RESOURCE GROUP BOUNDARIES:
Show dashed resource group boundaries around logical service clusters.
Label each RG clearly with its name and colour-coded border.

TRAFFIC FLOW ARROWS:
- Solid blue: synchronous HTTPS requests
- Dashed orange: async/event-driven messages
- Dotted gold: managed identity / secret retrieval
- Dotted purple: telemetry / monitoring
- Dashed red: external calls outside Azure boundary

GENERATE:
1. All services needed for this architecture (8–16 services minimum)
2. Correct subnet placements with CIDR blocks
3. NSG rules on each subnet boundary
4. Private endpoints for all data services
5. Complete connection topology matching the ${layout.style} layout
6. WAF validation scores for all 5 pillars
7. Detailed cost breakdown in AUD (Australia East pricing)
8. At least 3 cost optimisation recommendations
9. List all assumptions made

Return ONLY valid JSON matching the Archon diagram schema. No markdown, no prose.`
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION 4 — QUESTIONNAIRE DATA
// All 80+ questions across 6 pillars
// ═══════════════════════════════════════════════════════════════════════

const QUESTIONS = {
  meta: [
    { id:'project', label:'Project / solution name', type:'text', placeholder:'e.g. Enterprise B2B Integration Hub' },
    { id:'client', label:'Client / organisation name', type:'text', placeholder:'e.g. Contoso Financial Services' },
    { id:'architect', label:'Lead architect name', type:'text', placeholder:'Your name' },
    { id:'industry', label:'Industry vertical', type:'select', options:['Financial Services & Banking','Healthcare & Life Sciences','Legal & Professional Services','Retail & E-commerce','Transport & Logistics','Government & Public Sector','Manufacturing & Industry 4.0','Energy & Utilities','Education & Research','Media & Entertainment','Telecommunications','Insurance','Real Estate','Agriculture','Defence & Security'] },
    { id:'review_date', label:'Architecture review date', type:'date' },
  ],
  compute: [
    { id:'archetype', label:'Primary architecture archetype', type:'select',
      options:['monolith','n-tier','microservices','serverless','event-driven','data-driven','hybrid'],
      help:'Monolith = single deployable unit. N-Tier = layered (UI/Logic/Data). Microservices = independent services. Serverless = function-per-trigger. Event-driven = async messaging backbone. Data-driven = pipeline-first.' },
    { id:'primary_compute', label:'Primary Azure compute services', type:'multi',
      options:['Azure App Service','Azure Kubernetes Service (AKS)','Azure Container Apps','Azure Functions (Consumption)','Azure Functions (Premium)','Azure Functions (Dedicated)','Azure Virtual Machines','Azure Batch','Azure Spring Apps','Azure Red Hat OpenShift','Azure Container Instances'],
      help:'Select ALL compute services this solution will use.' },
    { id:'container_strategy', label:'Container & orchestration strategy', type:'select',
      options:['No containers — PaaS only','Docker containers on App Service','AKS — self-managed cluster','AKS — managed node pools only','Container Apps — serverless containers','Mixed (AKS + App Service)','OpenShift on Azure'] },
    { id:'aks_node_sku', label:'AKS node pool VM SKU (if AKS selected)', type:'select',
      options:['None — not using AKS','Standard_D4s_v5 (4 vCPU, 16 GB)','Standard_D8s_v5 (8 vCPU, 32 GB)','Standard_D16s_v5 (16 vCPU, 64 GB)','Standard_F8s_v2 (8 vCPU, 16 GB) — compute optimised','Standard_E8s_v5 (8 vCPU, 64 GB) — memory optimised','Standard_NC6s_v3 — GPU nodes (AI/ML workloads)','Standard_D4ds_v5 — with local NVMe SSD'] },
    { id:'aks_cni', label:'AKS CNI network plugin', type:'select',
      options:['Not applicable','Azure CNI (Overlay) — recommended','Azure CNI (Node subnet)','Kubenet (basic)','Azure CNI with Cilium — eBPF network policy'],
      help:'Azure CNI Overlay is recommended for most enterprise workloads. Cilium adds eBPF-based policy enforcement.' },
    { id:'aks_ingress', label:'AKS ingress controller', type:'select',
      options:['Not applicable','NGINX ingress controller','Azure Application Gateway Ingress Controller (AGIC)','Istio ingress gateway','Traefik','Contour'] },
    { id:'app_service_sku', label:'App Service plan SKU', type:'select',
      options:['Not applicable','B3 (4 vCPU, 7GB) — dev/test','P1v3 (2 vCPU, 8GB) — small production','P2v3 (4 vCPU, 16GB) — standard production','P3v3 (8 vCPU, 32GB) — high-performance','I1v2 (2 vCPU, 8GB) — isolated (ASE)','I2v2 (4 vCPU, 16GB) — isolated large','I3v2 (8 vCPU, 32GB) — isolated XL'] },
    { id:'functions_plan', label:'Azure Functions hosting plan', type:'select',
      options:['Not applicable','Consumption — pay per execution, scale to zero','Premium EP1 (1 vCPU, 3.5GB) — no cold start','Premium EP2 (2 vCPU, 7GB) — VNet, no cold start','Premium EP3 (4 vCPU, 14GB) — high throughput','Dedicated — App Service plan (always warm)'] },
    { id:'functions_triggers', label:'Azure Functions trigger types used', type:'multi',
      options:['HTTP trigger','Timer trigger','Service Bus trigger','Event Grid trigger','Blob Storage trigger','Cosmos DB change feed','Event Hub trigger','Queue Storage trigger','SignalR Service trigger','Durable Functions orchestration'] },
    { id:'deployment_slots', label:'Deployment slots / blue-green strategy', type:'select',
      options:['No slots — direct deployment','Staging slot → production swap','Blue/green with Traffic Manager','Canary via App Gateway routing rules','Feature flags + gradual rollout'] },
  ],
  network: [
    { id:'topology', label:'Network topology pattern', type:'select',
      options:['hub-spoke','flat-vnet','virtual-wan','mesh','hybrid-connectivity'],
      help:'Hub-Spoke: centralised shared services hub with spoke VNets. Virtual WAN: Microsoft-managed global transit hub. Flat: single VNet, simple workloads. Mesh: full peering, complex multi-team.' },
    { id:'is_new_sub', label:'Subscription strategy', type:'select',
      options:['New dedicated subscription for this workload','Existing shared subscription','Landing Zone — new spoke added to existing platform','Separate dev/test and production subscriptions','Management group with policy inheritance'] },
    { id:'spoke_cidrs', label:'Spoke VNet address space', type:'select',
      options:['10.1.0.0/16 (65,534 hosts)','10.2.0.0/16 (65,534 hosts)','10.3.0.0/16 (65,534 hosts)','10.4.0.0/16 (65,534 hosts)','10.10.0.0/16','172.16.0.0/16','172.20.0.0/14 (large — 262K hosts)','192.168.0.0/16 (small — 65K hosts)'] },
    { id:'hub_services', label:'Existing hub services to reuse', type:'multi',
      options:['Azure Firewall (Standard)','Azure Firewall (Premium) — IDPS, TLS inspection','Azure Firewall Manager','Private DNS Zones','Azure DNS Private Resolver','ExpressRoute Gateway','VPN Gateway (active-active)','Azure Bastion (Standard)','Network Watcher','DDoS Network Protection Standard','Azure Route Server'] },
    { id:'ingress_type', label:'Internet ingress / entry point', type:'select',
      options:['Azure Application Gateway v2 + WAF v2','Azure Front Door (Standard) — CDN + WAF','Azure Front Door (Premium) — Private Link origins','Azure API Management (external mode)','NGINX ingress on AKS','Azure Load Balancer (L4 only, no WAF)','No internet ingress — internal only'] },
    { id:'egress_strategy', label:'Outbound / egress strategy', type:'select',
      options:['Hub Azure Firewall — UDR 0.0.0.0/0 forced tunnel','NAT Gateway per spoke — direct egress','Azure Firewall + NAT Gateway hybrid','ExpressRoute forced tunnel to on-premises proxy','No restrictions — direct outbound (dev only)'] },
    { id:'expressroute', label:'ExpressRoute connectivity', type:'select',
      options:['No ExpressRoute','ExpressRoute — 1 Gbps circuit','ExpressRoute — 2 Gbps circuit','ExpressRoute — 10 Gbps circuit','ExpressRoute Direct — 100 Gbps','ExpressRoute Global Reach (multi-site)'] },
    { id:'vpn_gateway', label:'VPN Gateway', type:'select',
      options:['No VPN','VpnGw1 (650 Mbps) — basic S2S','VpnGw2 (1 Gbps) — standard S2S','VpnGw3 (1.25 Gbps) — high throughput','VpnGw1 active-active — HA configuration','P2S VPN only — remote user access'] },
    { id:'front_door', label:'Azure Front Door global load balancing', type:'select',
      options:['No Front Door','Front Door Standard — CDN + WAF','Front Door Premium — Private Link + WAF + Bot protection','Front Door + Traffic Manager combination','Already have Front Door in hub — reuse'] },
    { id:'dns_strategy', label:'DNS resolution strategy', type:'select',
      options:['Azure Private DNS Zones — hub-linked to all spokes','Azure DNS Private Resolver — conditional forwarding','Hybrid DNS — on-premises DNS + Azure DNS forwarding','Custom DNS servers (BIND/Windows DNS) on VMs','Azure-provided DNS (168.63.129.16) — dev only'] },
    { id:'peering_config', label:'VNet peering configuration', type:'select',
      options:['Hub-spoke only — no spoke-to-spoke','Spoke-to-spoke via hub (transit routing through Firewall)','Direct spoke-to-spoke peering for low-latency services','Azure Route Server for dynamic BGP routing','Virtual WAN handles all peering automatically'] },
    { id:'private_link_services', label:'Services requiring Private Endpoints', type:'multi',
      options:['Azure Storage (Blob, File, Table, Queue)','Azure Cosmos DB','Azure SQL Database / Managed Instance','Azure Key Vault','Azure Container Registry','Azure Service Bus','Azure Event Hub','Azure Cognitive Services / OpenAI','Azure AI Search','Azure Monitor / Log Analytics','Azure Redis Cache','Azure App Configuration','Azure SignalR Service','Azure API Management'] },
  ],
  security: [
    { id:'posture', label:'Overall security posture', type:'select',
      options:['basic','standard','zero-trust','defense-in-depth'],
      help:'Zero-Trust: verify explicitly, least privilege, assume breach. Defense-in-depth: multiple layered controls. Standard: NSGs + Key Vault + Defender CSPM.' },
    { id:'identity_provider', label:'Identity providers', type:'multi',
      options:['Microsoft Entra ID (Azure AD)','Microsoft Entra External ID (B2C)','SAML 2.0 federation (on-prem ADFS)','Google Workspace federation','Okta as external IdP','Ping Identity','Active Directory Domain Services (ADDS)','Entra Verified ID (decentralised identity)'] },
    { id:'mfa_required', label:'Multi-factor authentication (MFA)', type:'select',
      options:['MFA required for all users — Authenticator app','MFA required for admins only','MFA required for external/B2C users only','Passwordless — FIDO2 security keys + Authenticator','No MFA requirement (not recommended)'] },
    { id:'pim_enabled', label:'Privileged Identity Management (PIM)', type:'select',
      options:['PIM enabled — JIT access for all privileged roles','PIM enabled — admins only','PIM + PAM combined (CyberArk/BeyondTrust integration)','No PIM — permanent role assignments','Future roadmap — not current release'] },
    { id:'conditional_access', label:'Conditional Access policies', type:'multi',
      options:['Device compliance required (Intune MDM/MAM)','Location-based restrictions (geo-blocking)','Sign-in risk policy (Identity Protection)','User risk policy (compromised credentials)','App-level conditional access (per application)','Session controls (MCAS integration)','Named locations — IP allowlisting'] },
    { id:'rbac_model', label:'RBAC and authorisation model', type:'select',
      options:['Built-in Azure RBAC roles only','Custom roles with fine-grained permissions','ABAC (Attribute-Based Access Control) on Storage','Deny assignments + custom allow roles','Application-level RBAC (own role engine)','OPA/Gatekeeper policy enforcement on AKS'] },
    { id:'encryption_at_rest', label:'Encryption at rest strategy', type:'select',
      options:['pmk — Platform-Managed Keys (Microsoft manages)','cmk — Customer-Managed Keys (Azure Key Vault HSM)','byok — Bring Your Own Key (import from on-prem HSM)','Double encryption — PMK + CMK layers','Client-side encryption before upload'] },
    { id:'key_vault_tiers', label:'Azure Key Vault configuration', type:'multi',
      options:['Key Vault Standard (software keys)','Key Vault Premium (HSM-backed keys)','Managed HSM — dedicated single-tenant HSM','Separate vaults per environment (dev/staging/prod)','Separate vaults per application','Key rotation automation — 90-day policy'] },
    { id:'waf_ruleset', label:'WAF policy and ruleset', type:'select',
      options:['OWASP 3.2 — detection mode (audit only)','OWASP 3.2 — prevention mode (block)','OWASP 3.2 + Microsoft managed ruleset','OWASP 3.2 + custom rules (IP allowlist, rate limit)','Bot protection ruleset + OWASP combined','DRS 2.1 (Default Rule Set) on Front Door Premium','No WAF — internal-only application'] },
    { id:'ddos_protection', label:'DDoS protection level', type:'select',
      options:['Basic (included with Azure — infrastructure only)','DDoS Network Protection Standard (VNet-level)','DDoS IP Protection (per public IP)','Azure Front Door + WAF absorbs volumetric attacks','Third-party DDoS scrubbing (Akamai/Cloudflare)'] },
    { id:'defender_plans', label:'Microsoft Defender for Cloud plans', type:'multi',
      options:['CSPM — Cloud Security Posture Management (free)','Defender for Servers (P1 — basic)','Defender for Servers (P2 — advanced + Defender ATP)','Defender for Containers (AKS runtime protection)','Defender for App Service','Defender for Storage (malware scanning)','Defender for SQL','Defender for Cosmos DB','Defender for Key Vault','Defender for APIs','Defender for DevOps (GitHub/ADO integration)','Microsoft Sentinel (SIEM + SOAR)'] },
    { id:'compliance', label:'Compliance frameworks required', type:'multi',
      options:['SOC 2 Type II','ISO 27001:2022','GDPR (EU data protection)','HIPAA (healthcare — US)','IRAP (Australian Government)','APRA CPS 234 (Australian banking)','PCI-DSS v4.0 (payment cards)','NIST SP 800-53','FedRAMP (US federal)','Essential Eight (ASD Australia)','FISMA','HITRUST'] },
    { id:'siem_integration', label:'SIEM / SOC integration', type:'select',
      options:['Microsoft Sentinel — native Azure SIEM','Splunk (via Azure Monitor → Event Hub)','QRadar (via syslog/REST)','Elastic SIEM (via Log Analytics export)','ServiceNow Security Operations','No SIEM currently'] },
    { id:'nsg_strategy', label:'NSG (Network Security Group) strategy', type:'select',
      options:['Deny-all default + explicit allow rules per subnet','Subnet-level NSGs + NIC-level NSGs (defense-in-depth)','Azure Firewall replaces NSGs for east-west traffic','NSGs + Azure Policy to enforce deny rules','Application Security Groups (ASG) for workload tagging'] },
    { id:'audit_logging', label:'Audit and diagnostic logging', type:'multi',
      options:['Azure Activity Log → Log Analytics','Resource diagnostic logs → Log Analytics','NSG Flow Logs → Traffic Analytics','Azure AD sign-in + audit logs','Key Vault audit logs','Application-level audit logs (custom)','Microsoft Defender XDR alerts','Data access audit logs (CRUD operations)'] },
  ],
  data: [
    { id:'primary_database', label:'Primary database service', type:'select',
      options:['Azure Cosmos DB (NoSQL API)','Azure Cosmos DB (PostgreSQL)','Azure SQL Database (Hyperscale)','Azure SQL Database (General Purpose)','Azure SQL Database (Business Critical)','Azure SQL Managed Instance','Azure Database for PostgreSQL Flexible Server','Azure Database for MySQL Flexible Server','Azure Cache for Redis (primary store)','Azure Table Storage (simple KV)','Not applicable — stateless workload'] },
    { id:'database_tier', label:'Database tier / service objective', type:'select',
      options:['Dev/Test (Basic/S0/S1)','Standard S3 (100 DTUs)','Standard S6 (400 DTUs)','General Purpose — 4 vCores','General Purpose — 8 vCores','General Purpose — 16 vCores','Business Critical — 4 vCores (in-memory OLTP)','Business Critical — 8 vCores','Hyperscale — up to 100TB, read replicas','Cosmos DB Serverless','Cosmos DB Provisioned — autoscale 1000–10000 RU/s'] },
    { id:'iops_requirement', label:'Storage IOPS requirement', type:'select',
      options:['<500 IOPS (small workload)','500–2000 IOPS (standard web app)','2000–10000 IOPS (busy transactional)','10000–50000 IOPS (high-performance OLTP)','50000–160000 IOPS (Ultra Disk / Business Critical)','Unknown — needs sizing exercise'] },
    { id:'storage_capacity', label:'Total data storage capacity', type:'select',
      options:['<10 GB','10–100 GB','100 GB–1 TB','1–10 TB','10–100 TB','100 TB+ (Hyperscale / Data Lake)'] },
    { id:'retention_years', label:'Data retention requirement', type:'select',
      options:['1 year','3 years','5 years','7 years (financial/legal)','10 years (healthcare/compliance)','Indefinite — archive to cold storage'] },
    { id:'backup_strategy', label:'Backup and recovery strategy', type:'select',
      options:['Azure-managed backup — 7 day retention','Azure-managed backup — 35 day retention (max)','Geo-redundant backup to paired region','Backup + Azure Site Recovery (IaaS VMs)','Application-consistent snapshot + LTR (10 year)','Third-party backup (Veeam, Commvault)'] },
    { id:'replication', label:'Data replication strategy', type:'select',
      options:['LRS — Locally Redundant Storage (3 copies, 1 DC)','ZRS — Zone Redundant Storage (3 AZs, same region)','GRS — Geo-Redundant Storage (paired region, async)','GZRS — Geo-Zone Redundant (ZRS + geo-replication)','Active geo-replication (SQL, Cosmos DB)','Read replicas — offload analytics queries'] },
    { id:'caching_tier', label:'Caching strategy', type:'select',
      options:['No caching','Azure Cache for Redis C0 (250MB) — session store only','Azure Cache for Redis C1 (1GB) — standard','Azure Cache for Redis C3 (6GB) — high throughput','Azure Cache for Redis P1 (6GB) Premium — VNet, persistence','Azure Cache for Redis P5 (26GB) Premium — cluster mode','CDN caching (static assets only)','Multi-level: CDN + Redis + in-process'] },
    { id:'nosql_services', label:'NoSQL data services', type:'multi',
      options:['Azure Cosmos DB NoSQL API','Azure Cosmos DB Mongo API','Azure Cosmos DB Cassandra API','Azure Cosmos DB Gremlin (graph)','Azure Cosmos DB Table API','Azure Table Storage','Azure Blob Storage (unstructured)','Azure Data Lake Storage Gen2'] },
    { id:'sql_services', label:'Relational data services', type:'multi',
      options:['Azure SQL Database','Azure SQL Managed Instance','Azure Database for PostgreSQL','Azure Database for MySQL','Azure Synapse Analytics (SQL pools)','Azure SQL Data Warehouse'] },
    { id:'analytics', label:'Analytics and BI services', type:'multi',
      options:['Azure Synapse Analytics','Microsoft Fabric','Azure Databricks','Azure Data Factory (orchestration)','Azure Stream Analytics (real-time)','Power BI Embedded','Azure Analysis Services'] },
    { id:'streaming', label:'Event streaming / real-time ingestion', type:'select',
      options:['None required','Azure Event Hubs (Standard — 10 TUs)','Azure Event Hubs (Premium — dedicated)','Azure Event Hubs Kafka compatible surface','Azure IoT Hub (device telemetry)','Azure Service Bus (enterprise messaging)','Apache Kafka on AKS (self-managed)'] },
    { id:'data_lake', label:'Data Lake / big data requirements', type:'select',
      options:['Not required','ADLS Gen2 — simple blob with hierarchical namespace','ADLS Gen2 + Azure Databricks Delta Lake','ADLS Gen2 + Synapse Analytics (lakehouse pattern)','Microsoft Fabric — unified analytics platform','Azure Data Box for initial bulk load'] },
  ],
  scaling: [
    { id:'scale_unit', label:'Primary scale unit', type:'select',
      options:['instance — App Service horizontal scale','pod — Kubernetes pod autoscaling (HPA/KEDA)','replica — Container Apps replicas','node — AKS node autoscaler (Cluster Autoscaler)','RU — Cosmos DB autoscale request units'],
      help:'The unit that is added/removed during scale events.' },
    { id:'autoscale_metrics', label:'Autoscale trigger metrics', type:'multi',
      options:['CPU utilisation (%)','Memory utilisation (%)','HTTP request queue depth','Active connections count','Service Bus queue depth (KEDA)','Event Hub consumer lag (KEDA)','Custom metric (Application Insights)','Schedule-based (predictive scaling)','Azure Monitor metric alerts'] },
    { id:'min_instances', label:'Minimum instance count (always-on)', type:'select',
      options:['0 — scale to zero (cost-optimised)','1 — single instance (no HA)','2 — minimum HA (zone spread)','3 — recommended production minimum','5 — high baseline','10+ — guaranteed capacity'] },
    { id:'max_instances', label:'Maximum instance count (burst ceiling)', type:'select',
      options:['5','10','20','50','100','200','Unlimited (consumption plan)'] },
    { id:'target_cpu', label:'Target CPU utilisation for scale-out trigger', type:'select',
      options:['50% — aggressive scale out','60%','70% — recommended balance','80% — cost-efficient','90% — maximum efficiency (risk of latency spike)'] },
    { id:'peak_concurrency', label:'Peak concurrent users / sessions', type:'select',
      options:['<100','100–1,000','1,000–10,000','10,000–100,000','100,000–1,000,000','1,000,000+ (CDN + edge required)'] },
    { id:'p95_latency', label:'P95 latency SLA target', type:'select',
      options:['<100ms — real-time (gaming, trading)','<200ms — low-latency API','<500ms — standard web app','<1,000ms (1 second) — acceptable for batch-oriented','<2,000ms — background processing OK','No SLA defined yet'] },
    { id:'rps', label:'Peak requests per second (RPS)', type:'select',
      options:['<10 RPS','10–100 RPS','100–1,000 RPS','1,000–10,000 RPS','10,000–100,000 RPS (Front Door + CDN required)','100,000+ RPS (global scale, multi-region)'] },
    { id:'burst_strategy', label:'Traffic burst absorption strategy', type:'select',
      options:['CDN caches static assets — reduces origin load','Redis cache absorbs repeat read queries','Service Bus smooths burst → async processing','Azure Front Door distributes globally','Azure API Management rate-limiting + throttling','Predictive pre-scaling (schedule-based)','No burst strategy — scale-up only'] },
    { id:'load_test', label:'Load testing approach', type:'select',
      options:['Azure Load Testing (managed, JMeter-based)','k6 cloud tests','Locust (Python-based, self-managed)','Apache JMeter — on-premises','No load testing planned','Existing load test results available'] },
  ],
  ha_dr: [
    { id:'rto', label:'Recovery Time Objective (RTO)', type:'select',
      options:['<5 minutes (mission critical)','<15 minutes (tier 1)','<1 hour (tier 2)','<4 hours (standard)','<24 hours (best effort)','>24 hours (acceptable for this workload)'],
      help:'RTO = maximum acceptable downtime. How long can the system be unavailable?' },
    { id:'rpo', label:'Recovery Point Objective (RPO)', type:'select',
      options:['0 — zero data loss (synchronous replication required)','<1 minute','<15 minutes','<1 hour','<4 hours','<24 hours','Data loss acceptable (stateless workload)'],
      help:'RPO = maximum acceptable data loss. How much data can you afford to lose?' },
    { id:'availability_target', label:'Availability SLA target', type:'select',
      options:['99.9% (43.8 min/month downtime)','99.95% (21.9 min/month)','99.99% (4.38 min/month)','99.999% (26 sec/month — five nines)','No formal SLA defined'] },
    { id:'ha_strategy', label:'High availability strategy', type:'select',
      options:['single-region — no HA (dev/test only)','zone-redundant — Availability Zones within one region','multi-region-active-passive — hot standby in paired region','multi-region-active-active — traffic split across regions','global-active-active — Front Door + 3+ regions'],
      help:'Zone-redundant protects against datacenter failure. Multi-region protects against full region failure.' },
    { id:'primary_region', label:'Primary Azure region', type:'select',
      options:['Australia East (Sydney)','Australia Southeast (Melbourne)','East US 2','West US 2','UK South','West Europe','Southeast Asia','East Asia','Japan East','Canada Central'] },
    { id:'secondary_region', label:'Secondary / DR region', type:'select',
      options:['None — single region','Australia Southeast (paired with Australia East)','East US (paired with East US 2)','UK West (paired with UK South)','North Europe (paired with West Europe)','Japan West (paired with Japan East)','Custom — not using Azure paired regions'] },
    { id:'failover_type', label:'Failover mechanism', type:'select',
      options:['Automated — Azure Traffic Manager health probes (<1 min TTL)','Automated — Azure Front Door origin failover','Manual failover — runbook-driven','Chaos-tested automated — Azure Chaos Studio','Geo-replication auto-failover (SQL, Cosmos DB)','Hot standby — pre-warmed instances, manual cutover'] },
    { id:'backup_frequency', label:'Backup schedule', type:'select',
      options:['Continuous (transaction log shipping)','Every 15 minutes (RPO-driven)','Hourly incremental + daily full','Daily full + weekly long-term retention','Weekly full + monthly archive','Managed by Azure (platform default)'] },
    { id:'geo_replication', label:'Database geo-replication', type:'select',
      options:['Not required — stateless or ephemeral data','Azure SQL active geo-replication (up to 4 readable secondaries)','Cosmos DB multi-region writes (strong consistency)','Cosmos DB multi-region reads (eventual consistency)','Azure Storage GRS (async, RPO ~1hr)','Azure Storage GZRS (ZRS + geo-replication)'] },
    { id:'chaos_engineering', label:'Chaos engineering and resilience testing', type:'select',
      options:['Azure Chaos Studio — managed fault injection','Netflix Chaos Monkey equivalent (custom)','Manual failover testing quarterly','No chaos testing currently','Planned for v2 — not current release'] },
    { id:'runbook', label:'Operational runbooks', type:'select',
      options:['Full runbooks exist — tested quarterly','Partial runbooks — needs updating','No runbooks — create as output of this engagement','Automated runbooks in Azure Automation','Documented in Confluence/SharePoint'] },
  ]
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION 5 — ICON MAP & NODE
// ═══════════════════════════════════════════════════════════════════════

const ICON_MAP: Record<string,string> = {
  'app-services':'App-Services','function-apps':'Function-Apps',
  'container-instances':'Container-Instances','app-service-plans':'App-Service-Plans',
  'front-doors':'Front-Doors','firewalls':'Firewalls',
  'api-management-services':'API-Management-Services','virtual-networks':'Virtual-Networks',
  'network-security-groups':'Network-Security-Groups','private-link':'Private-Link',
  'ddos-protection-plans':'DDoS-Protection-Plans','dns-zones':'DNS-Zones',
  'key-vaults':'Key-Vaults','azure-ad-b2c':'Azure-AD-B2C',
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
const getIconUrl = (id:string) =>
  `https://code.benco.io/icon-collection/azure-icons/${ICON_MAP[id]||'Cognitive-Services'}.svg`

function AzureNode({data,selected}:any) {
  const [hov,setHov]=useState(false)
  const pc:Record<string,string>={Reliability:'#107C10',Security:'#0078D4',Performance:'#8764B8',Cost:'#004B1C',Operations:'#737373'}
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'flex',flexDirection:'column',alignItems:'center',position:'relative',cursor:'pointer'}}>
      <Handle type="target" position={Position.Left} style={{opacity:0}}/>
      <Handle type="source" position={Position.Right} style={{opacity:0}}/>
      <div style={{width:52,height:52,background:'#fff',
        border:selected?'2px solid #0078D4':'1.5px solid #E0E0E0',
        borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:hov?'0 4px 16px rgba(0,0,0,.13)':'0 1px 4px rgba(0,0,0,.06)',transition:'all .15s'}}>
        <img src={getIconUrl(data.icon_id)} alt={data.display_name} width={36} height={36} style={{objectFit:'contain'}}/>
      </div>
      <div style={{marginTop:4,fontSize:10,fontWeight:500,color:'#1a1a1a',textAlign:'center',maxWidth:80,lineHeight:1.3,fontFamily:'"Segoe UI",system-ui,sans-serif'}}>{data.display_name}</div>
      <div style={{fontSize:9,color:'#737373',textAlign:'center',maxWidth:80,fontFamily:'"Segoe UI",system-ui,sans-serif'}}>{data.sku}</div>
      {data.waf_pillars&&<div style={{display:'flex',gap:2,marginTop:2}}>
        {data.waf_pillars.map((p:string)=><div key={p} title={p} style={{width:5,height:5,borderRadius:'50%',background:pc[p]||'#ccc'}}/>)}
      </div>}
      {hov&&<div style={{position:'absolute',bottom:'110%',left:'50%',transform:'translateX(-50%)',
        background:'#1a1a2e',color:'#fff',borderRadius:8,padding:'10px 14px',fontSize:11,
        whiteSpace:'nowrap',zIndex:1000,pointerEvents:'none',
        boxShadow:'0 8px 24px rgba(0,0,0,.25)',lineHeight:1.7,
        fontFamily:'"Segoe UI",system-ui,sans-serif'}}>
        <div style={{fontWeight:600,marginBottom:4,color:'#60a5fa',fontSize:12}}>{data.display_name}</div>
        <div>SKU: {data.sku}</div><div>RG: {data.resource_group}</div>
        <div>PE: {data.private_endpoint?'✓ Private endpoint':'— Public'}</div>
        <div style={{color:'#86efac'}}>A${data.estimated_cost_aud}/mo</div>
        <div style={{marginTop:4,color:'#94a3b8',maxWidth:240,whiteSpace:'normal'}}>{data.rationale}</div>
      </div>}
    </div>
  )
}
const nodeTypes={azureService:AzureNode}

const ES:Record<string,any>={
  sync:{stroke:'#0078D4',strokeWidth:1.5},
  async:{stroke:'#FBBA00',strokeWidth:1.5,strokeDasharray:'6 3'},
  msi:{stroke:'#ECD01E',strokeWidth:1,strokeDasharray:'3 2',opacity:0.7},
  telemetry:{stroke:'#84278F',strokeWidth:1,strokeDasharray:'3 2',opacity:0.5},
  external:{stroke:'#D13438',strokeWidth:1.5,strokeDasharray:'6 3'},
}
const es=(t:string)=>ES[t]||ES.sync

function diagramToFlow(d:any){
  const svcs=d.services||[],cols=4
  const nodes=svcs.map((s:any,i:number)=>({
    id:s.id,type:'azureService',
    position:{x:80+(i%cols)*170,y:40+Math.floor(i/cols)*150},data:s
  }))
  const edges=(d.connections||[]).map((c:any)=>({
    id:c.id,source:c.from,target:c.to,label:c.label,style:es(c.type),
    markerEnd:{type:MarkerType.ArrowClosed,color:es(c.type).stroke},
    labelStyle:{fontSize:9,fill:'#555',fontFamily:'"Segoe UI",system-ui,sans-serif'},
    labelBgStyle:{fill:'#fff',opacity:0.85},data:{flow_group:c.flow_group}
  }))
  return{nodes,edges}
}

function WafBar({label,score,color}:{label:string;score:number;color:string}){
  return(
    <div style={{marginBottom:7}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3,color:'#444'}}>
        <span>{label}</span><span style={{fontWeight:600,color}}>{score}/100</span>
      </div>
      <div style={{height:5,background:'#f0f0f0',borderRadius:99,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${score}%`,background:color,borderRadius:99,transition:'width .8s ease'}}/>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION 6 — FORM RENDERER
// ═══════════════════════════════════════════════════════════════════════

const ss:React.CSSProperties={fontFamily:'"Segoe UI",system-ui,sans-serif'}
const inputStyle:React.CSSProperties={width:'100%',padding:'6px 9px',border:'1.5px solid #e0e0e0',
  borderRadius:6,fontSize:11,color:'#333',background:'#fff',...ss,outline:'none',boxSizing:'border-box'}

function Sel({value,onChange,options,disabled}:{value:string;onChange:(v:string)=>void;options:string[];disabled?:boolean}){
  return <select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}
    style={{...inputStyle,cursor:disabled?'not-allowed':'pointer',opacity:disabled?.6:1}}>
    {options.map(o=><option key={o} value={o}>{o}</option>)}
  </select>
}
function Chips({options,selected,onChange}:{options:string[];selected:string[];onChange:(v:string[])=>void}){
  function tog(o:string){onChange(selected.includes(o)?selected.filter(x=>x!==o):[...selected,o])}
  return(
    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
      {options.map(o=>(
        <button key={o} onClick={()=>tog(o)} style={{fontSize:10,padding:'3px 8px',border:'1px solid',
          borderColor:selected.includes(o)?'#0078D4':'#ddd',borderRadius:99,
          background:selected.includes(o)?'#0078D4':'#fafafa',
          color:selected.includes(o)?'#fff':'#555',cursor:'pointer',...ss,transition:'all .12s'}}>{o}</button>
      ))}
    </div>
  )
}
function Q({q,val,onChange}:{q:any;val:any;onChange:(id:string,v:any)=>void}){
  return(
    <div style={{marginBottom:12}}>
      <label style={{fontSize:11,fontWeight:600,color:'#333',display:'block',marginBottom:3,...ss}}>
        {q.label}
      </label>
      {q.help&&<div style={{fontSize:10,color:'#888',marginBottom:4,lineHeight:1.5,...ss}}>{q.help}</div>}
      {q.type==='text'&&<input value={val||''} onChange={e=>onChange(q.id,e.target.value)}
        placeholder={q.placeholder} style={inputStyle}
        onFocus={e=>{e.currentTarget.style.borderColor='#0078D4'}}
        onBlur={e=>{e.currentTarget.style.borderColor='#e0e0e0'}}/>}
      {q.type==='date'&&<input type="date" value={val||''} onChange={e=>onChange(q.id,e.target.value)} style={inputStyle}/>}
      {q.type==='select'&&<Sel value={val||q.options[0]} onChange={v=>onChange(q.id,v)} options={q.options}/>}
      {q.type==='multi'&&<Chips options={q.options} selected={val||[]} onChange={v=>onChange(q.id,v)}/>}
    </div>
  )
}

const PILLAR_CONFIG=[
  {key:'meta',     icon:'📋', label:'Project',   color:'#5C2D91'},
  {key:'compute',  icon:'⚙️',  label:'Compute',   color:'#0078D4'},
  {key:'network',  icon:'🌐',  label:'Network',   color:'#00B4D8'},
  {key:'security', icon:'🔒',  label:'Security',  color:'#107C10'},
  {key:'data',     icon:'🗄️',  label:'Data',      color:'#854F0B'},
  {key:'scaling',  icon:'📈',  label:'Scaling',   color:'#68217A'},
  {key:'ha_dr',    icon:'🛡️',  label:'HA / DR',   color:'#D13438'},
]

// ═══════════════════════════════════════════════════════════════════════
// SECTION 7 — MAIN APP
// ═══════════════════════════════════════════════════════════════════════

export default function App(){
  const [nodes,setNodes,onNodesChange]=useNodesState([])
  const [edges,setEdges,onEdgesChange]=useEdgesState([])
  const [diagram,setDiagram]=useState<any>(null)
  const [loading,setLoading]=useState(false)
  const [loadingMsg,setLoadingMsg]=useState('')
  const [error,setError]=useState('')
  const [activeFlow,setActiveFlow]=useState('all')
  const [rightPanel,setRightPanel]=useState<'waf'|'cost'|'layout'|'prompt'>('layout')
  const [selNode,setSelNode]=useState<any>(null)
  const [pillar,setPillar]=useState('meta')
  const [answers,setAnswers]=useState<Record<string,Record<string,any>>>({})
  const [genPrompt,setGenPrompt]=useState('')
  const [layoutInfo,setLayoutInfo]=useState<any>(null)

  const MSGS=['Analysing requirements...','Mapping architecture pattern...','Selecting Azure services...','Planning network topology...','Applying security controls...','Validating WAF pillars...','Estimating costs...','Finalising diagram...']
  const msgIdx=useRef(0)

  function setAns(pillarKey:string,qId:string,val:any){
    setAnswers(prev=>({...prev,[pillarKey]:{...(prev[pillarKey]||{}),[qId]:val}}))
  }
  function getAns(pillarKey:string,qId:string,def?:any){
    return answers[pillarKey]?.[qId]??def
  }

  function buildSchema():Partial<ArchitectureSchema>{
    const a=(p:string,q:string,d?:any)=>getAns(p,q,d)
    return {
      meta:{
        project: a('meta','project','Enterprise Platform'),
        client:  a('meta','client','Enterprise'),
        industry:a('meta','industry','Financial Services'),
        architect:a('meta','architect',''),
        timestamp:new Date().toISOString(),
        version:'1.0',
        review_date:a('meta','review_date',''),
      },
      compute:{
        archetype:a('compute','archetype','n-tier') as any,
        primary_compute:a('compute','primary_compute',['Azure App Service']),
        container_strategy:a('compute','container_strategy','No containers — PaaS only'),
        aks_config:a('compute','aks_node_sku','None — not using AKS')==='None — not using AKS'?undefined:{
          node_pool_sku:a('compute','aks_node_sku','Standard_D4s_v5'),
          node_count_min:2,node_count_max:20,
          cni:a('compute','aks_cni','Azure CNI (Overlay) — recommended') as any,
          network_policy:a('compute','aks_cni','Azure CNI'),
          ingress_controller:a('compute','aks_ingress','NGINX ingress controller'),
        },
        app_service_config:a('compute','app_service_sku','Not applicable')==='Not applicable'?undefined:{
          sku:a('compute','app_service_sku','P2v3 Linux'),
          os:'linux' as any,slots:a('compute','deployment_slots','Staging slot → production swap').includes('slot')?2:1
        },
        functions_config:a('compute','functions_plan','Not applicable')==='Not applicable'?undefined:{
          plan:a('compute','functions_plan','Premium EP1').toLowerCase().includes('consumption')?'consumption':'premium' as any,
          trigger_types:a('compute','functions_triggers',['HTTP trigger'])
        },
      },
      network:{
        topology:a('network','topology','hub-spoke') as any,
        spoke_cidrs:[a('network','spoke_cidrs','10.2.0.0/16').split(' ')[0]],
        hub_services:a('network','hub_services',['Azure Firewall','Private DNS Zones']),
        ingress_type:a('network','ingress_type','Azure Application Gateway v2 + WAF v2'),
        egress_strategy:a('network','egress_strategy','Hub Azure Firewall — UDR 0.0.0.0/0 forced tunnel'),
        expressroute:!a('network','expressroute','No ExpressRoute').startsWith('No'),
        vpn_gateway:!a('network','vpn_gateway','No VPN').startsWith('No'),
        front_door:!a('network','front_door','No Front Door').startsWith('No'),
        traffic_manager:false,
        dns_strategy:a('network','dns_strategy','Azure Private DNS Zones'),
        peering_config:a('network','peering_config','Hub-spoke only — no spoke-to-spoke'),
        private_link_services:a('network','private_link_services',['Azure Storage','Azure Cosmos DB','Azure Key Vault']),
      },
      security:{
        posture:a('security','posture','zero-trust') as any,
        identity_provider:a('security','identity_provider',['Microsoft Entra ID']),
        mfa_required:!a('security','mfa_required','No MFA').startsWith('No'),
        pim_enabled:!a('security','pim_enabled','No PIM').startsWith('No'),
        conditional_access:a('security','conditional_access',[]).length>0,
        rbac_model:a('security','rbac_model','Custom roles with fine-grained permissions'),
        key_vault_tiers:a('security','key_vault_tiers',['Key Vault Standard']),
        encryption_at_rest:a('security','encryption_at_rest','cmk — Customer-Managed Keys').split(' ')[0] as any,
        encryption_in_transit:'TLS 1.3 enforced everywhere',
        waf_ruleset:a('security','waf_ruleset','OWASP 3.2 — prevention mode (block)'),
        ddos_protection:a('security','ddos_protection','DDoS Network Protection Standard'),
        defender_plans:a('security','defender_plans',['CSPM — Cloud Security Posture Management (free)']),
        compliance:a('security','compliance',[]),
        audit_logging:a('security','audit_logging',[]).length>0,
        siem_integration:a('security','siem_integration','Microsoft Sentinel'),
        private_endpoints_all:a('network','private_link_services',[]).length>0,
        nsg_strategy:a('security','nsg_strategy','Deny-all default + explicit allow rules per subnet'),
      },
      data:{
        primary_database:a('data','primary_database','Azure Cosmos DB (NoSQL API)'),
        database_tier:a('data','database_tier','General Purpose — 4 vCores'),
        iops_requirement:parseInt(a('data','iops_requirement','2000–10000 IOPS').split('–')[0].replace(/\D/g,''))||5000,
        storage_gb:parseInt(a('data','storage_capacity','100 GB–1 TB').replace(/\D/g,''))||500,
        retention_years:parseInt(a('data','retention_years','7 years').replace(/\D/g,''))||7,
        backup_strategy:a('data','backup_strategy','Geo-redundant backup to paired region'),
        replication:a('data','replication','GZRS — Geo-Zone Redundant'),
        caching_tier:a('data','caching_tier','Azure Cache for Redis C1 (1GB) — standard'),
        search_service:false,
        nosql_services:a('data','nosql_services',[]),
        sql_services:a('data','sql_services',[]),
        analytics:a('data','analytics',[]),
        data_lake:!a('data','data_lake','Not required').startsWith('Not'),
        streaming:a('data','streaming','None required'),
      },
      scaling:{
        scale_unit:a('scaling','scale_unit','instance') as any,
        autoscale_metric:a('scaling','autoscale_metrics',['CPU utilisation (%)']),
        min_instances:parseInt(a('scaling','min_instances','2 — minimum HA').split(' ')[0])||2,
        max_instances:parseInt(a('scaling','max_instances','20'))||20,
        target_cpu:parseInt(a('scaling','target_cpu','70% — recommended balance'))||70,
        target_memory:80,
        scale_out_cooldown:60,scale_in_cooldown:300,
        peak_concurrency:parseInt(a('scaling','peak_concurrency','1,000–10,000').replace(/,/g,'').split('–')[0])||10000,
        p95_latency_ms:parseInt(a('scaling','p95_latency','<500ms').replace(/\D/g,''))||500,
        requests_per_second:parseInt(a('scaling','rps','100–1,000 RPS').replace(/,/g,'').split('–')[0])||1000,
        burst_strategy:a('scaling','burst_strategy','Redis cache absorbs repeat read queries'),
        load_test_required:!a('scaling','load_test','No load testing planned').startsWith('No'),
      },
      ha_dr:{
        rto_minutes:parseInt(a('ha_dr','rto','<1 hour').replace(/\D/g,''))||60,
        rpo_minutes:parseInt(a('ha_dr','rpo','<15 minutes').replace(/\D/g,''))||15,
        availability_target:a('ha_dr','availability_target','99.95% (21.9 min/month)').split(' ')[0],
        ha_strategy:a('ha_dr','ha_strategy','zone-redundant') as any,
        primary_region:a('ha_dr','primary_region','Australia East (Sydney)').split(' (')[0],
        secondary_region:a('ha_dr','secondary_region','Australia Southeast (paired with Australia East)').split(' (')[0],
        failover_type:a('ha_dr','failover_type','Automated — Azure Traffic Manager health probes'),
        backup_frequency:a('ha_dr','backup_frequency','Hourly incremental + daily full'),
        geo_replication:!a('ha_dr','geo_replication','Not required').startsWith('Not'),
        traffic_routing:'DNS failover via Traffic Manager',
        chaos_engineering:!a('ha_dr','chaos_engineering','No chaos testing').startsWith('No'),
        runbook_exists:!a('ha_dr','runbook','No runbooks').startsWith('No'),
      }
    }
  }

  const onConnect=useCallback((p:any)=>setEdges(e=>addEdge(p,e)),[setEdges])
  const onNodeClick=useCallback((_:any,node:any)=>{setSelNode(node.data);setRightPanel('waf')},[])

  function filterEdges(flow:string){
    setActiveFlow(flow)
    setEdges(prev=>prev.map(e=>({...e,style:{...es(e.data?.type||'sync'),opacity:flow==='all'?1:e.data?.flow_group===flow?1:0.07}})))
  }

  async function generate(){
    const schema=buildSchema()
    const layout=computeLayoutStrategy(schema)
    setLayoutInfo(layout)
    const prompt=buildEnterprisePrompt(schema)
    setGenPrompt(prompt)
    setError('')
    setLoading(true)
    setDiagram(null);setNodes([]);setEdges([])
    msgIdx.current=0;setLoadingMsg(MSGS[0])
    const iv=setInterval(()=>{msgIdx.current=(msgIdx.current+1)%MSGS.length;setLoadingMsg(MSGS[msgIdx.current])},2500)
    try{
      const res=await fetch(`${API}/api/generate`,{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          prompt,
          industry:schema.meta?.industry||'General',
          workload:schema.compute?.archetype||'n-tier',
          compute:(schema.compute?.primary_compute||[]).join(', '),
          ha:schema.ha_dr?.ha_strategy||'zone-redundant',
          security:schema.security?.posture||'zero-trust',
          compliance:schema.security?.compliance||[],
          budget_aud:10000,
          region:schema.ha_dr?.primary_region||'Australia East',
          timeline:'Production'
        })
      })
      if(!res.ok) throw new Error(await res.text())
      const data=await res.json()
      setDiagram(data)
      const{nodes:n,edges:e}=diagramToFlow(data)
      setNodes(n);setEdges(e);setRightPanel('layout');setActiveFlow('all')
    }catch(e:any){setError(`Generation failed: ${e.message}`)}
    finally{clearInterval(iv);setLoading(false)}
  }

  async function exportDrawio(){
    if(!diagram)return
    const res=await fetch(`${API}/api/export/drawio`,{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({diagram})})
    const data=await res.json()
    const blob=new Blob([data.xml],{type:'application/xml'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a');a.href=url;a.download=data.filename;a.click()
    URL.revokeObjectURL(url)
  }

  const waf=diagram?.waf_validation
  const cost=diagram?.cost_estimate
  const totalCost=cost?.total_aud||(diagram?.services||[]).reduce((s:number,sv:any)=>s+(sv.estimated_cost_aud||0),0)
  const pillars=[{k:'reliability',l:'Reliability',c:'#107C10'},{k:'security',l:'Security',c:'#0078D4'},
    {k:'performance',l:'Performance',c:'#8764B8'},{k:'cost',l:'Cost',c:'#004B1C'},{k:'operations',l:'Operations',c:'#737373'}]

  const currentPillarIdx=PILLAR_CONFIG.findIndex(p=>p.key===pillar)
  const currentPillarCfg=PILLAR_CONFIG[currentPillarIdx]
  const currentQs=(QUESTIONS as any)[pillar]||[]
  const totalPillars=PILLAR_CONFIG.length

  return(
    <div style={{display:'flex',height:'100vh',width:'100vw',...ss,background:'#f0f2f5',overflow:'hidden'}}>

      {/* ── PILLAR RAIL ── */}
      <div style={{width:52,background:'#1a1a2e',display:'flex',flexDirection:'column',
        alignItems:'center',padding:'12px 0',gap:4,flexShrink:0}}>
        <div style={{width:32,height:32,borderRadius:8,background:'#0078D4',
          display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12}}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" stroke="white" strokeWidth="1.5" fill="none"/>
            <circle cx="9" cy="9" r="2.5" fill="white"/>
          </svg>
        </div>
        {PILLAR_CONFIG.map((pc,i)=>(
          <div key={pc.key} onClick={()=>setPillar(pc.key)}
            title={pc.label}
            style={{width:38,height:38,borderRadius:8,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',cursor:'pointer',
              background:pillar===pc.key?pc.color+'33':'transparent',
              border:pillar===pc.key?`1px solid ${pc.color}`:'1px solid transparent',
              transition:'all .15s',gap:1}}>
            <div style={{fontSize:14}}>{pc.icon}</div>
            <div style={{fontSize:7,color:pillar===pc.key?'#fff':'#888',...ss}}>{i+1}</div>
          </div>
        ))}
      </div>

      {/* ── QUESTION PANEL ── */}
      <div style={{width:300,background:'#fff',display:'flex',flexDirection:'column',
        overflow:'hidden',borderRight:'1px solid #e8e8e8',boxShadow:'2px 0 8px rgba(0,0,0,.04)'}}>

        {/* Pillar header */}
        <div style={{padding:'14px 14px 10px',borderBottom:'1px solid #f0f0f0',
          background:currentPillarCfg?.color||'#0078D4',color:'#fff'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:18}}>{currentPillarCfg?.icon}</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,...ss}}>Pillar {currentPillarIdx+1} of {totalPillars}</div>
              <div style={{fontSize:11,opacity:.85,...ss}}>{currentPillarCfg?.label}</div>
            </div>
            <div style={{marginLeft:'auto',fontSize:10,opacity:.75,...ss}}>
              {currentQs.length} questions
            </div>
          </div>
          {/* Progress */}
          <div style={{marginTop:8,height:3,background:'rgba(255,255,255,.2)',borderRadius:99}}>
            <div style={{height:'100%',borderRadius:99,background:'rgba(255,255,255,.8)',
              width:`${((currentPillarIdx+1)/totalPillars)*100}%`,transition:'width .3s'}}/>
          </div>
        </div>

        {/* Questions */}
        <div style={{flex:1,overflow:'auto',padding:'12px 13px'}}>
          {currentQs.map((q:any)=>(
            <Q key={q.id} q={q}
              val={getAns(pillar,q.id)}
              onChange={(id,v)=>setAns(pillar,id,v)}/>
          ))}
        </div>

        {/* Nav + Generate */}
        <div style={{borderTop:'1px solid #f0f0f0',padding:'10px 13px',background:'#fafafa'}}>
          <div style={{display:'flex',gap:6,marginBottom:8}}>
            {currentPillarIdx>0&&(
              <button onClick={()=>setPillar(PILLAR_CONFIG[currentPillarIdx-1].key)}
                style={{flex:1,padding:'7px 0',fontSize:11,border:'1px solid #ddd',
                  borderRadius:6,background:'#fff',color:'#555',cursor:'pointer',...ss}}>
                ← Back
              </button>
            )}
            {currentPillarIdx<totalPillars-1?(
              <button onClick={()=>setPillar(PILLAR_CONFIG[currentPillarIdx+1].key)}
                style={{flex:2,padding:'7px 0',fontSize:11,fontWeight:600,border:'none',
                  borderRadius:6,background:currentPillarCfg?.color||'#0078D4',
                  color:'#fff',cursor:'pointer',...ss}}>
                Next: {PILLAR_CONFIG[currentPillarIdx+1].label} →
              </button>
            ):(
              <button onClick={generate} disabled={loading}
                style={{flex:2,padding:'7px 0',fontSize:11,fontWeight:600,border:'none',
                  borderRadius:6,background:loading?'#90CAF9':currentPillarCfg?.color||'#D13438',
                  color:'#fff',cursor:loading?'not-allowed':'pointer',...ss}}>
                {loading?loadingMsg:diagram?'↺ Regenerate':'⚡ Generate Architecture'}
              </button>
            )}
          </div>
          {/* Jump to any pillar */}
          <div style={{display:'flex',gap:3,justifyContent:'center'}}>
            {PILLAR_CONFIG.map((pc,i)=>(
              <div key={pc.key} onClick={()=>setPillar(pc.key)}
                title={pc.label}
                style={{width:8,height:8,borderRadius:'50%',cursor:'pointer',
                  background:pillar===pc.key?pc.color:'#ddd',transition:'all .15s'}}/>
            ))}
          </div>
          {error&&<div style={{marginTop:8,background:'#fff0f0',border:'1px solid #ffcdd2',
            borderRadius:6,padding:'7px 10px',fontSize:10,color:'#c62828',...ss}}>{error}</div>}
        </div>
      </div>

      {/* ── CANVAS ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{height:44,background:'#fff',borderBottom:'1px solid #e8e8e8',
          display:'flex',alignItems:'center',padding:'0 12px',gap:6,
          boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
          {diagram&&<div style={{fontSize:12,fontWeight:600,color:'#1a1a1a',marginRight:4}}>{diagram.title}</div>}
          {diagram&&<div style={{display:'flex',gap:3,marginLeft:'auto'}}>
            {['all','ingestion','query','security','monitoring'].map(f=>(
              <button key={f} onClick={()=>filterEdges(f)} style={{fontSize:9,padding:'3px 8px',
                border:'1px solid',borderColor:activeFlow===f?'#0078D4':'#ddd',borderRadius:99,
                background:activeFlow===f?'#0078D4':'#fff',color:activeFlow===f?'#fff':'#555',
                cursor:'pointer',fontWeight:activeFlow===f?600:400,transition:'all .15s',
                textTransform:'capitalize',...ss}}>{f}</button>
            ))}
          </div>}
          {diagram&&<button onClick={exportDrawio} style={{marginLeft:6,fontSize:10,padding:'5px 10px',
            background:'#107C10',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600,...ss}}>
            ↓ draw.io</button>}
        </div>

        <div style={{flex:1,position:'relative'}}>
          {!diagram&&!loading&&(
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',zIndex:10,pointerEvents:'none'}}>
              <div style={{fontSize:40,opacity:.1,marginBottom:12}}>⬡</div>
              <div style={{fontSize:14,fontWeight:600,color:'#bbb',marginBottom:8,...ss}}>
                Answer the 7 pillars → Generate
              </div>
              <div style={{fontSize:11,color:'#ccc',maxWidth:340,textAlign:'center',lineHeight:1.7,...ss}}>
                Work through each pillar on the left. Archon maps your answers to an architecture pattern,
                determines the optimal layout (horizontal tiers or vertical columns), then generates the diagram.
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:20,width:340}}>
                {PILLAR_CONFIG.slice(1).map((pc,i)=>(
                  <div key={pc.key} onClick={()=>setPillar(pc.key)}
                    style={{padding:'10px 8px',borderRadius:8,border:'1.5px solid #eee',
                      background:'#fff',cursor:'pointer',textAlign:'center'}}>
                    <div style={{fontSize:18,marginBottom:3}}>{pc.icon}</div>
                    <div style={{fontSize:9,color:'#888',...ss}}>{pc.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading&&(
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,.94)',zIndex:10}}>
              <div style={{width:40,height:40,borderRadius:'50%',border:'3px solid #e0e0e0',
                borderTopColor:'#0078D4',animation:'spin .8s linear infinite',marginBottom:12}}/>
              <div style={{fontSize:14,color:'#0078D4',fontWeight:500,...ss}}>{loadingMsg}</div>
              <div style={{fontSize:10,color:'#999',marginTop:4,...ss}}>
                Claude Sonnet 4.6 · Azure Well-Architected Framework · 7-pillar schema
              </div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          <ReactFlow nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onNodeClick={onNodeClick}
            nodeTypes={nodeTypes} fitView fitViewOptions={{padding:.2}}
            minZoom={.2} maxZoom={3} style={{background:'#fafbfc'}}>
            <Background color="#e8e8e8" gap={24} size={1}/>
            <Controls style={{bottom:16,right:16,left:'auto'}}/>
            <MiniMap nodeColor={()=>'#0078D4'} maskColor="rgba(0,0,0,.05)" style={{bottom:120,right:16}}/>
            {diagram&&layoutInfo&&(
              <Panel position="top-left">
                <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:8,
                  padding:'8px 12px',fontSize:10,maxWidth:220,
                  boxShadow:'0 2px 8px rgba(0,0,0,.06)',...ss}}>
                  <div style={{fontWeight:700,color:'#0078D4',marginBottom:3}}>
                    {layoutInfo.style==='horizontal-tiers'?'↕ Horizontal tiers':
                     layoutInfo.style==='vertical-columns'?'↔ Vertical columns':'⊞ Hybrid grid'}
                  </div>
                  <div style={{color:'#666',lineHeight:1.5}}>{layoutInfo.rationale}</div>
                </div>
              </Panel>
            )}
            {diagram&&<Panel position="bottom-left">
              <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:8,
                padding:'8px 12px',fontSize:10,color:'#666',
                boxShadow:'0 2px 8px rgba(0,0,0,.06)',...ss}}>
                <div style={{fontWeight:600,marginBottom:4,color:'#333'}}>Connections</div>
                {[{c:'#0078D4',d:'none',l:'Sync HTTPS'},{c:'#FBBA00',d:'6 3',l:'Async/event'},
                  {c:'#ECD01E',d:'3 2',l:'MSI/secrets'},{c:'#84278F',d:'3 2',l:'Telemetry'},
                  {c:'#D13438',d:'6 3',l:'External'}].map(l=>(
                  <div key={l.l} style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                    <svg width="20" height="7"><line x1="0" y1="3.5" x2="20" y2="3.5" stroke={l.c} strokeWidth="1.5" strokeDasharray={l.d}/></svg>
                    <span>{l.l}</span>
                  </div>
                ))}
              </div>
            </Panel>}
          </ReactFlow>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      {diagram&&(
        <div style={{width:260,background:'#fff',borderLeft:'1px solid #e8e8e8',
          display:'flex',flexDirection:'column',overflow:'hidden',
          boxShadow:'-2px 0 8px rgba(0,0,0,.04)'}}>
          <div style={{display:'flex',borderBottom:'1px solid #f0f0f0',background:'#fafafa'}}>
            {(['layout','waf','cost','prompt'] as const).map(p=>(
              <button key={p} onClick={()=>setRightPanel(p)} style={{flex:1,padding:'8px 0',fontSize:10,
                fontWeight:rightPanel===p?600:400,color:rightPanel===p?'#0078D4':'#999',
                background:'none',border:'none',
                borderBottom:rightPanel===p?'2px solid #0078D4':'2px solid transparent',
                cursor:'pointer',textTransform:'uppercase',...ss}}>
                {p==='layout'?'Layout':p==='waf'?'WAF':p==='cost'?'Cost':'Prompt'}
              </button>
            ))}
          </div>
          <div style={{flex:1,overflow:'auto',padding:'12px 13px'}}>

            {/* Layout intelligence panel */}
            {rightPanel==='layout'&&layoutInfo&&(
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'#0078D4',marginBottom:10,...ss}}>
                  Layout decision engine
                </div>
                <div style={{background:'#f0f7ff',border:'1px solid #d0e8ff',borderRadius:8,
                  padding:10,marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#0078D4',marginBottom:4,...ss}}>
                    {layoutInfo.style==='horizontal-tiers'?'↕ Horizontal tiers (N-Tier / Multi-region)':
                     layoutInfo.style==='vertical-columns'?'↔ Vertical columns (Hub-Spoke / Microservices)':
                     '⊞ Hybrid grid (Serverless / Event-driven)'}
                  </div>
                  <div style={{fontSize:11,color:'#555',lineHeight:1.7,...ss}}>{layoutInfo.rationale}</div>
                </div>
                <div style={{fontSize:11,fontWeight:600,color:'#444',marginBottom:6,...ss}}>
                  {layoutInfo.style==='horizontal-tiers'?'Tiers (top → bottom)':'Columns (left → right)'}
                </div>
                {(layoutInfo.tiers?.length>0?layoutInfo.tiers:layoutInfo.columns).map((item:string,i:number)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,
                    padding:'5px 8px',marginBottom:4,borderRadius:6,
                    background:i%2===0?'#f8f9fa':'#fff',border:'0.5px solid #eee'}}>
                    <div style={{width:20,height:20,borderRadius:4,background:'#0078D4',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:10,fontWeight:700,color:'#fff',flexShrink:0}}>{i+1}</div>
                    <div style={{fontSize:11,color:'#444',...ss}}>{item}</div>
                  </div>
                ))}
                <div style={{marginTop:12,fontSize:10,color:'#888',lineHeight:1.6,
                  background:'#fafafa',borderRadius:6,padding:'8px 10px',...ss}}>
                  <strong>When to use horizontal tiers:</strong> N-Tier, Monolith, Data pipeline, Multi-region active-active<br/>
                  <strong>When to use vertical columns:</strong> Microservices, Event-driven, Hub-Spoke networks, B2B integration
                </div>
              </div>
            )}

            {/* WAF panel */}
            {rightPanel==='waf'&&(
              <div>
                {selNode&&(
                  <div style={{background:'#f0f7ff',border:'1px solid #d0e8ff',borderRadius:8,padding:10,marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#0078D4',marginBottom:4,...ss}}>{selNode.display_name}</div>
                    <div style={{fontSize:11,color:'#555',lineHeight:1.7,...ss}}>
                      <div><strong>SKU:</strong> {selNode.sku}</div>
                      <div><strong>RG:</strong> {selNode.resource_group}</div>
                      <div><strong>PE:</strong> {selNode.private_endpoint?'✓ Yes':'✗ No'}</div>
                      <div style={{marginTop:5}}>{selNode.rationale}</div>
                    </div>
                  </div>
                )}
                {waf&&<>
                  <div style={{fontSize:11,fontWeight:600,color:'#444',marginBottom:8,...ss}}>WAF pillar scores</div>
                  {pillars.map(p=><WafBar key={p.k} label={p.l} score={waf[p.k]?.score||0} color={p.c}/>)}
                  {pillars.map(p=>waf[p.k]?.findings?.length>0&&(
                    <div key={p.k} style={{marginBottom:8,marginTop:6}}>
                      <div style={{fontSize:10,fontWeight:600,color:p.c,marginBottom:3,...ss}}>{p.l}</div>
                      {waf[p.k].findings.map((f:string,i:number)=>(
                        <div key={i} style={{fontSize:10,color:'#555',padding:'2px 0',
                          borderBottom:'1px solid #f5f5f5',lineHeight:1.5,...ss}}>• {f}</div>
                      ))}
                    </div>
                  ))}
                </>}
              </div>
            )}

            {/* Cost panel */}
            {rightPanel==='cost'&&(
              <div>
                <div style={{background:'linear-gradient(135deg,#0078D4,#005a9e)',borderRadius:10,
                  padding:'12px 14px',marginBottom:12,color:'#fff'}}>
                  <div style={{fontSize:10,opacity:.85,...ss}}>Estimated monthly</div>
                  <div style={{fontSize:22,fontWeight:700,...ss}}>A${totalCost?.toLocaleString()}</div>
                  <div style={{fontSize:9,opacity:.75,...ss}}>{answers.ha_dr?.primary_region||'Australia East'}</div>
                </div>
                {(cost?.breakdown||diagram.services)?.map((item:any,i:number)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',
                    padding:'5px 0',borderBottom:'1px solid #f0f0f0',fontSize:11,...ss}}>
                    <span style={{color:'#444'}}>{item.name||item.display_name}</span>
                    <span style={{fontWeight:600,color:'#333'}}>A${item.monthly_aud||item.estimated_cost_aud}</span>
                  </div>
                ))}
                {cost?.optimisation_tips?.length>0&&(
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:11,fontWeight:600,color:'#107C10',marginBottom:5,...ss}}>💡 Optimisation</div>
                    {cost.optimisation_tips.map((t:string,i:number)=>(
                      <div key={i} style={{fontSize:10,color:'#444',padding:'3px 0',
                        borderBottom:'1px solid #f5f5f5',lineHeight:1.5,...ss}}>• {t}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prompt panel */}
            {rightPanel==='prompt'&&(
              <div>
                <div style={{fontSize:11,fontWeight:600,color:'#444',marginBottom:6,...ss}}>
                  Generated enterprise prompt
                </div>
                <div style={{background:'#1a1a2e',borderRadius:8,padding:10,fontSize:9,
                  color:'#94a3b8',lineHeight:1.7,whiteSpace:'pre-wrap',fontFamily:'monospace',
                  maxHeight:400,overflow:'auto'}}>
                  {genPrompt}
                </div>
                <button onClick={()=>navigator.clipboard.writeText(genPrompt)}
                  style={{marginTop:8,width:'100%',fontSize:11,padding:'7px 0',
                    border:'1px solid #ddd',borderRadius:6,background:'#fafafa',
                    color:'#555',cursor:'pointer',...ss}}>
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
