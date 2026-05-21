import os, json, uuid, re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import anthropic

app = FastAPI(title="Archon Demo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ANTHROPIC_KEY = os.environ.get("ANTHROPIC_KEY", "")

# ─────────────────────────────────────────────────────────────────────────────
# LEGACY AZURE DIAGRAM ENDPOINT — kept intact
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are Archon, an expert Azure Solutions Architect AI.
Generate a professional Azure architecture design as VALID JSON ONLY.
No prose, no markdown, no explanation — ONLY the JSON object.

Return this exact schema:
{
  "title": "string",
  "description": "string (2-3 sentences explaining the architecture)",
  "assumptions": ["string"],
  "services": [
    {
      "id": "svc-1",
      "display_name": "App Service",
      "icon_id": "app-services",
      "category": "compute",
      "sku": "P2v3 Linux",
      "resource_group": "rg-compute",
      "subnet": "snet-appservice",
      "private_endpoint": true,
      "rationale": "Hosts the FastAPI backend with VNet integration",
      "waf_pillars": ["Reliability", "Performance"],
      "estimated_cost_aud": 140
    }
  ],
  "connections": [
    {
      "id": "conn-1",
      "from": "svc-1",
      "to": "svc-2",
      "type": "sync",
      "label": "HTTPS",
      "flow_group": "ingestion"
    }
  ],
  "boundaries": [
    {
      "id": "b-internet",
      "type": "internet",
      "label": "Internet / users",
      "contains": []
    },
    {
      "id": "b-sub",
      "type": "subscription",
      "label": "Azure Subscription",
      "contains": ["svc-1"]
    },
    {
      "id": "b-vnet",
      "type": "vnet",
      "label": "VNet 10.0.0.0/16",
      "contains": ["svc-1"]
    }
  ],
  "waf_validation": {
    "reliability": {"score": 85, "findings": ["Consider adding deployment slots"]},
    "security": {"score": 90, "findings": ["All data services use private endpoints"]},
    "performance": {"score": 80, "findings": ["Redis cache improves response times"]},
    "cost": {"score": 75, "findings": ["Consider Consumption plan for low traffic"]},
    "operations": {"score": 88, "findings": ["App Insights enabled on all services"]}
  },
  "cost_estimate": {
    "total_aud": 485,
    "breakdown": [
      {"name": "App Service P2v3", "monthly_aud": 140},
      {"name": "Azure AI Search S1", "monthly_aud": 95},
      {"name": "Azure Cache for Redis C1", "monthly_aud": 76}
    ],
    "optimisation_tips": ["Use Consumption plan for Functions to save ~A$60/mo"]
  }
}

RULES:
1. Include 6-12 Azure services relevant to the use case
2. Always include: Key Vault, Azure Monitor, Log Analytics
3. Always include security services: NSG boundaries, private endpoints where relevant
4. icon_id must be one of: app-services, function-apps, container-instances, front-doors,
   firewalls, api-management-services, virtual-networks, network-security-groups,
   private-link, key-vaults, azure-ad-b2c, microsoft-defender-for-cloud, policy,
   azure-cosmos-db, cache-redis, storage-accounts, azure-service-bus, event-grid-topics,
   cognitive-services, cognitive-search, log-analytics-workspaces, application-insights,
   resource-groups, subscriptions, monitor, alerts, ddos-protection-plans, dns-zones
5. Connection types: sync, async, msi, telemetry, external
6. Flow groups: ingestion, query, security, monitoring
7. WAF scores: 0-100, be realistic
8. Cost in AUD, Australia East pricing
9. Return ONLY valid JSON — no markdown fences, no explanation"""

class GenerateRequest(BaseModel):
    prompt: str
    industry: Optional[str] = "General"
    region: str = "Australia East"
    workload: Optional[str] = "Web application"
    compute: Optional[str] = "PaaS"
    ha: Optional[str] = "Single region"
    security: Optional[str] = "Standard"
    compliance: Optional[list] = []
    budget_aud: Optional[int] = 1000
    timeline: Optional[str] = "Production"

class ExportRequest(BaseModel):
    diagram: dict

class SolutionRequest(BaseModel):
    prompt: str

HLD_SYSTEM_PROMPT = '''You are an expert enterprise cloud architect with 20+ years of experience across AWS, Azure, and GCP. You advise Fortune 500 CTOs and enterprise architects on platform design, infrastructure strategy, and technical decision-making.

When a user describes their technical requirements, produce a structured solution document.

Always consider internally before answering: scale (users/requests), team size and cloud experience, regulatory requirements, existing systems to integrate with, preferred cloud provider, and budget range. If any are missing, make reasonable assumptions and state them in solution_overview.

Output ONLY valid JSON matching this exact schema — no prose, no markdown fences:
{
  "solution_overview": "2-3 paragraph executive summary for a CTO audience. Cover core architectural pattern and why it fits. State any assumptions made.",
  "platform_components": [
    {"name": "string", "purpose": "string", "service": "string", "rationale": "string"}
  ],
  "network_topology": {
    "description": "VPCs/VNets, subnets public/private/data tiers, peering, CDN placement, ingress/egress points",
    "mermaid": "valid Mermaid architecture-beta diagram of the network topology using group for zones"
  },
  "security_architecture": {
    "iam": "IAM strategy including roles, least privilege, federated identity",
    "encryption": "encryption at rest and in transit strategy",
    "network_security": "NSGs, firewall rules, WAF, DDoS protection",
    "secrets": "secrets management approach (Key Vault, Secrets Manager etc)",
    "compliance": "compliance posture for SOC2/GDPR/HIPAA/ISO as applicable"
  },
  "hld_diagram": {
    "mermaid": "valid Mermaid architecture-beta diagram showing all major components and interactions. Use group for logical zones/tiers."
  },
  "scalability_resilience": {
    "scaling": "horizontal scaling strategy and auto-scaling triggers",
    "availability": "multi-AZ or multi-region design and SLA targets",
    "dr": "disaster recovery approach with RTO and RPO targets"
  },
  "cost_estimate": {
    "compute": "monthly compute cost range",
    "storage": "monthly storage cost range",
    "network": "monthly network/egress cost range",
    "managed_services": "monthly managed services cost range",
    "total_range": "total monthly cost range e.g. $8,000 - $12,000/month"
  },
  "next_steps": ["concrete technical decision 1", "concrete technical decision 2", "concrete technical decision 3"]
}

MERMAID RULES — these are mandatory or the diagram will fail to render:
- Use architecture-beta syntax ONLY. Never use flowchart, graph TD, graph LR, or subgraph.
- Every diagram must start with: %%{init: {"architecture": {"padding": 20}}}%% then architecture-beta
- Use group <id>[<label>] for zones, service <id>(server|database|internet|disk)[<label>] in <group> for nodes
- IDs alphanumeric only (no hyphens, spaces, dots): AppGW APIM CosmosDB
- Labels in square brackets: [App Gateway WAF]
- Connections use port syntax: A:R --> L:B for horizontal, A:B --> T:B for vertical
- Max 4 words per label. No IPs, no SKUs.
- Return ONLY the JSON object'''

def build_user_prompt(req: GenerateRequest) -> str:
    compliance_str = ", ".join(req.compliance) if req.compliance else "None specified"
    return f"""Design an Azure architecture for the following requirements:

DESCRIPTION: {req.prompt}

TECHNICAL REQUIREMENTS:
- Industry: {req.industry}
- Region: {req.region}
- Workload type: {req.workload}
- Compute preference: {req.compute}
- High availability: {req.ha}
- Security posture: {req.security}
- Compliance requirements: {compliance_str}
- Monthly budget: A${req.budget_aud}
- Timeline: {req.timeline}

Generate a complete, production-appropriate Azure architecture following WAF best practices.
Return ONLY the JSON object."""

def clean_json_response(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'^```\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    return raw.strip()

# ─────────────────────────────────────────────────────────────────────────────
# DIAGRAM SANITISER — runs on every diagram string before it reaches the frontend
# ─────────────────────────────────────────────────────────────────────────────

_FORBIDDEN_IN_LABELS = re.compile(r'[-./:()\[\]{}&+@#!?,%]')
_FORBIDDEN_ARROWS    = re.compile(r'(-\.+->|===+>|--[ox]|o--o|\|[^|]+\|)')
_FORBIDDEN_KEYWORDS  = re.compile(r'\b(flowchart|subgraph|graph\s+(?:TD|LR|RL|BT))\b', re.I)

def sanitise_labels(diagram: str) -> str:
    """Replace forbidden characters inside [] labels only."""
    def _clean(m: re.Match) -> str:
        t = m.group(1)
        t = re.sub(r'[-–—]', ' ', t)   # hyphens / en-dash / em-dash → space
        t = re.sub(r'[/.]',            ' ', t)   # slash / dot → space
        t = re.sub(r'[:()\[\]{}]',     '',  t)   # structural chars → remove
        t = re.sub(r'[&+@#!?,%]',      ' ', t)   # symbols → space
        t = re.sub(r' {2,}',           ' ', t).strip()
        return f'[{t}]'
    return re.sub(r'\[([^\]]*)\]', _clean, diagram)

def validate_diagram(diagram: str) -> list:
    """Return list of error strings; empty list means clean."""
    errors = []
    if 'architecture-beta' not in diagram:
        errors.append('Missing architecture-beta declaration')
    if _FORBIDDEN_KEYWORDS.search(diagram):
        errors.append('Contains forbidden flowchart/subgraph/graph keyword')
    if _FORBIDDEN_ARROWS.search(diagram):
        errors.append('Contains forbidden arrow syntax (-.-> ===> --o etc)')
    for label in re.findall(r'\[([^\]]+)\]', diagram):
        if _FORBIDDEN_IN_LABELS.search(label):
            errors.append(f'Forbidden character in label: [{label}]')
    for line in diagram.splitlines():
        s = line.strip()
        if s.startswith('group ') and '(' not in s.split('[')[0]:
            errors.append(f'Group missing icon: {s[:80]}')
    return errors

def process_diagram(raw: str) -> dict:
    """Clean labels, validate, return {diagram, errors, valid}."""
    cleaned = sanitise_labels(raw)
    errors  = validate_diagram(cleaned)
    return {"diagram": cleaned, "errors": errors, "valid": len(errors) == 0}

# Paths inside the solution JSON that contain architecture-beta diagram strings.
_DIAGRAM_PATHS = [
    ["network_topology", "diagrams", "layout_topdown"],
    ["network_topology", "diagrams", "layout_leftright"],
    ["network_topology", "mermaid"],
    ["hld_diagrams", "layout_topdown"],
    ["hld_diagrams", "layout_leftright"],
    ["hld_diagram", "mermaid"],
]

def sanitise_solution_diagrams(data: dict) -> list:
    """
    Walk known diagram paths in the solution JSON, run process_diagram on each,
    replace the string in-place with the sanitised version, and return a flat
    list of any validation errors found (path + message).
    """
    all_errors = []
    for path in _DIAGRAM_PATHS:
        node = data
        for key in path[:-1]:
            if not isinstance(node, dict) or key not in node:
                node = None
                break
            node = node[key]
        last = path[-1]
        if isinstance(node, dict) and isinstance(node.get(last), str) and node[last].strip():
            result = process_diagram(node[last])
            node[last] = result["diagram"]
            for err in result["errors"]:
                all_errors.append(f"{'.'.join(path)}: {err}")
    return all_errors


@app.post("/api/generate")
async def generate_architecture(req: GenerateRequest):
    if not ANTHROPIC_KEY:
        raise HTTPException(500, "ANTHROPIC_KEY not set in Replit Secrets")

    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=16000,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": build_user_prompt(req)
            }]
        )

        raw = message.content[0].text
        cleaned = clean_json_response(raw)
        diagram = json.loads(cleaned)
        diagram["id"] = str(uuid.uuid4())
        return diagram

    except json.JSONDecodeError as e:
        raise HTTPException(500, f"AI returned invalid JSON: {str(e)}")
    except anthropic.APIError as e:
        raise HTTPException(500, f"Claude API error: {str(e)}")

@app.post("/api/solution")
async def generate_solution(req: SolutionRequest):
    """Solution Architect mode — multi-cloud HLD with Mermaid diagrams"""
    if not ANTHROPIC_KEY:
        raise HTTPException(500, "ANTHROPIC_KEY not set in Replit Secrets")

    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=16000,
            system=HLD_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": req.prompt}]
        )
        raw = message.content[0].text
        cleaned = clean_json_response(raw)
        solution = json.loads(cleaned)
        sanitise_solution_diagrams(solution)
        solution["id"] = str(uuid.uuid4())
        solution["mode"] = "solution"
        return solution
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"AI returned invalid JSON: {str(e)}")
    except anthropic.APIError as e:
        raise HTTPException(500, f"Claude API error: {str(e)}")

# ─────────────────────────────────────────────────────────────────────────────
# ADVISOR ENDPOINT — two-part prompt system with streaming
# ─────────────────────────────────────────────────────────────────────────────

ADVISOR_SYSTEM_PROMPT = """You are an expert enterprise cloud architect with 20+ years of experience across AWS,
Azure, and GCP. You advise Fortune 500 CTOs and enterprise architects on platform
design, infrastructure strategy, and technical decision-making.

When a user describes their technical requirements, produce a structured solution
document as valid JSON matching the schema below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE IMPACT ANALYSIS — ALWAYS APPLY FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If an existing solution is provided in the request context AND the user is asking
for a change, update, or addition — DO NOT modify the solution immediately.

First respond with ONLY this JSON structure:

{
  "change_impact": {
    "requested_change": "string — what the user wants to change",
    "affected_components": ["string"],
    "improvements": ["string — concrete benefit"],
    "risks": ["string — potential issue or conflict"],
    "effort_estimate": "Low | Medium | High — with reason",
    "recommendation": "PROCEED | PROCEED_WITH_CAUTION | DO_NOT_PROCEED",
    "recommendation_reason": "string — one sentence",
    "confirmation_question": "string — ask user to confirm before proceeding"
  }
}

Wait for explicit confirmation (yes / proceed / confirmed) before generating
or modifying any solution. Only skip impact analysis for brand new solutions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIAGRAM OUTPUT STANDARD — MERMAID v11.1.0+ ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL: All diagrams MUST use architecture-beta diagram type.
NEVER use: flowchart, graph TD, graph LR, subgraph, classDef, style directives.
These will cause a parse error and break the diagram renderer.

━━━━━━━━━━━━━━━
DECLARATION
━━━━━━━━━━━━━━━

Every diagram starts with exactly this header:

%%{init: {"architecture": {"padding": 20, "nodeSeparation": 80, "randomize": false}}}%%
architecture-beta

━━━━━━━━━━━━━━━
LABEL RULES — CRITICAL, TESTED AGAINST MERMAID v11.15.0 PARSER
━━━━━━━━━━━━━━━

Labels are the text inside square brackets [].
The parser enforces strict character rules — violations cause lexer errors.

LABELS [] — allowed characters:
  ✓ Letters (A-Z a-z)
  ✓ Numbers (0-9)
  ✓ Spaces
  ✓ Underscores _

LABELS [] — forbidden characters (each causes a parse error):
  ✗ Hyphen          -     →  replace with space
  ✗ Slash           /     →  remove entirely
  ✗ Dot             .     →  replace with space
  ✗ Colon           :     →  remove entirely
  ✗ Parentheses     ( )   →  remove entirely
  ✗ Brackets        [ ]   →  remove entirely
  ✗ Em dash         —     →  replace with space
  ✗ En dash         –     →  replace with space
  ✗ Any special char       →  remove

LABEL TRANSFORMATION RULES — apply these EVERY time:

  Resource group names:
    rg-myapp-network        →  [rg myapp network]
    rg-scm-platform-prod    →  [rg scm platform prod]

  VNet labels (drop the slash, keep the size number):
    vnet-myapp-prod /16     →  [vnet myapp prod 16]
    10.0.0.0/16             →  [vnet prod 16]

  Subnet labels (drop the slash, keep the size number):
    snet-app /24            →  [snet app 24]
    snet-ai /26             →  [snet ai 26]
    snet-privatelink /24    →  [snet privatelink 24]

  Subscription labels:
    Azure Subscription — Australia East   →  [Azure Subscription AU East]
    Azure Subscription (Production)       →  [Azure Subscription Production]

  Service labels with special chars:
    Front Door + WAF        →  [Front Door WAF]
    OpenAI & AI Search      →  [OpenAI and AI Search]
    SQL/NoSQL               →  [SQL and NoSQL]
    99.9% SLA               →  [99 9 pct SLA]

  Verify before output: scan every [...] and confirm zero forbidden characters.

━━━━━━━━━━━━━━━
ID RULES
━━━━━━━━━━━━━━━

IDs are the identifiers before the icon (e.g. the "front_door" in service front_door(...)).

IDs — allowed characters:
  ✓ Letters, numbers, hyphens -, underscores _

IDs — forbidden characters:
  ✗ Slash /    ✗ Dot .    ✗ Spaces    ✗ Special characters

ID examples:
  front_door    rg-network    snet-app    vnet-prod    service-bus
  ai_search     cosmos_db     key-vault   app-insights

━━━━━━━━━━━━━━━
GROUPS
━━━━━━━━━━━━━━━

Use groups for all boundaries: Subscription, Resource Groups, VNet, Subnets, External.

Syntax:
  group {id}({icon})[{label}]
  group {id}({icon})[{label}] in {parentId}

Every group MUST have an icon — omitting it causes a parse error.

Built-in icons (no registration required):
  cloud | database | disk | internet | server

Icon assignments:
  cloud     →  Subscription, Resource Groups, OpenAI, Key Vault, Defender, Monitor
  internet  →  VNet, External zone, DNS, Front Door, users, external APIs
  server    →  Subnets, App Service, Functions, Container Apps, Firewall, APIM
  database  →  Data subnets, Cosmos DB, PostgreSQL, Redis, SQL, Service Bus
  disk      →  Blob Storage, Data Lake, File Share, Backup, Storage Account

Declare parents before children — the parser errors if a child references
an undeclared parent.

Group declaration order (always follow this sequence):
  1. group internet(internet)[Internet]
  2. group external(internet)[External]
  3. group sub(cloud)[Azure Subscription {region abbreviation}]
  4. group rg_network(cloud)[rg {slug} network] in sub
  5. group vnet(internet)[vnet {slug} prod 16] in sub
  6. group snet_app(server)[snet app 24] in vnet
  7. group snet_ai(cloud)[snet ai 24] in vnet
  8. group snet_data(database)[snet data 24] in vnet
  9. group snet_pl(disk)[snet privatelink 24] in vnet
  10. group rg_security(cloud)[rg {slug} security] in sub
  11. group rg_monitor(cloud)[rg {slug} monitor] in sub

Region abbreviations for subscription label:
  Australia East    →  AU East
  East US 2         →  US East 2
  UK South          →  UK South
  Southeast Asia    →  SE Asia
  West Europe       →  West EU

━━━━━━━━━━━━━━━
SERVICES
━━━━━━━━━━━━━━━

Syntax:
  service {id}({icon})[{label}]
  service {id}({icon})[{label}] in {parentId}

Service labels follow the same character rules as group labels.
Service label = short readable name only. No SKU, no IP, no port, no version.

Max 8 services per group. If a group needs more, consolidate:
  service ai_group(cloud)[AI Services 4] in snet_ai

Max 20 total nodes (groups + services + junctions) across the entire diagram.

Service declarations by zone:

  % Networking RG
  service front_door(internet)[Front Door WAF] in rg_network
  service firewall(server)[Azure Firewall] in rg_network
  service apim(internet)[API Management] in rg_network

  % App subnet
  service app_svc(server)[App Service] in snet_app
  service functions(server)[Functions] in snet_app
  service container_apps(server)[Container Apps] in snet_app

  % AI subnet
  service openai(cloud)[Azure OpenAI] in snet_ai
  service ai_search(cloud)[AI Search] in snet_ai
  service doc_intel(cloud)[Doc Intelligence] in snet_ai

  % Data subnet
  service cosmos(database)[Cosmos DB] in snet_data
  service postgres(database)[PostgreSQL] in snet_data
  service redis(database)[Redis Cache] in snet_data
  service blob(disk)[Blob Storage] in snet_data

  % Security RG
  service keyvault(cloud)[Key Vault] in rg_security
  service managed_id(cloud)[Managed Identity] in rg_security
  service defender(cloud)[Defender] in rg_security

  % Monitor RG
  service app_insights(cloud)[App Insights] in rg_monitor
  service log_analytics(cloud)[Log Analytics] in rg_monitor

  % External
  service claude_api(internet)[Claude API] in external
  service slack(internet)[Slack] in external
  service github(internet)[GitHub] in external
  service stripe(internet)[Stripe] in external

━━━━━━━━━━━━━━━
JUNCTIONS
━━━━━━━━━━━━━━━

Use junctions when 3 or more services share one connection point.
Service Bus, Event Grid, and shared gateways are always junctions.

Syntax:
  junction {id}
  junction {id} in {parentId}

Example — Service Bus as junction:
  junction msg_bus in snet_data
  app_svc:R --> L:msg_bus
  msg_bus:R --> L:functions
  msg_bus:B --> T:erp_svc

━━━━━━━━━━━━━━━
EDGES
━━━━━━━━━━━━━━━

Every edge MUST specify exit side and entry side.

Syntax:
  {id}:{side} {arrow} {side}:{id}

Sides:
  L  left    R  right    T  top    B  bottom

Arrow types — only these three exist in architecture-beta:
  -->    one-directional (primary flow)
  <-->   bidirectional
  --     association, no arrowhead

FORBIDDEN arrow syntax — these are flowchart-only and will cause parse errors:
  ✗  -.->    -..->    ===>    --o    --x    o--o
  ✗  -->|label text|   (inline edge labels not supported)

For cross-group edges use the {group} modifier:
  app_svc{group}:B --> T:claude_api{group}

━━━━━━━━━━━━━━━
LAYOUT DIRECTION
━━━━━━━━━━━━━━━

Produce TWO complete diagram strings in the JSON output.
Groups and services are IDENTICAL in both — only edge sides differ.

Top-down layout — use B/T sides for primary flow edges:
  front_door:B --> T:apim
  apim:B --> T:app_svc
  app_svc:B --> T:cosmos

Left-to-right layout — use R/L sides for primary flow edges:
  front_door:R --> L:apim
  apim:R --> L:app_svc
  app_svc:R --> L:cosmos

Secondary edges (MSI, monitoring) always use perpendicular sides
to avoid visual overlap with primary flow:
  % In TD layout — secondary goes left/right
  app_svc:R --> L:keyvault
  % In LR layout — secondary goes top/bottom
  app_svc:B --> T:keyvault

━━━━━━━━━━━━━━━
CLARITY RULES
━━━━━━━━━━━━━━━

1. Labels: names only — no IPs, no CIDRs beyond size number, no ports, no SKUs
2. Max 8 services per group — consolidate overflow with count e.g. [AI Services 4]
3. Max 20 total nodes across the whole diagram
4. No inline edge labels — architecture-beta does not support them
5. Declare all parents before children
6. Never mix architecture-beta with flowchart syntax
7. Use % for comments (not // or #)
8. Scan every [...] before outputting — zero forbidden characters allowed

━━━━━━━━━━━━━━━
PRE-OUTPUT CHECKLIST — run mentally before writing each diagram
━━━━━━━━━━━━━━━

Before finalising the diagram string, verify:

[ ] Starts with %%{init:...}%% then architecture-beta
[ ] Every group has an icon declared
[ ] Every label [] contains only letters, numbers, spaces, underscores
[ ] No hyphens, slashes, dots, colons, parens anywhere inside []
[ ] All IDs use only letters, numbers, hyphens, underscores
[ ] All parent groups declared before child groups
[ ] No arrow types other than --> <--> --
[ ] No inline edge labels |text|
[ ] Total node count ≤ 20
[ ] Services per group ≤ 8
[ ] Two layout variants produced (TD and LR)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOLUTION DOCUMENT SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Output ONLY valid JSON. No markdown, no preamble, no code fences.

{
  "solution_overview": "string — 2-3 paragraphs, CTO-level summary. State architectural pattern and why it fits. List assumptions for missing requirements at the top.",

  "platform_components": [
    {
      "name": "string",
      "azure_service": "string — service name only, no SKU",
      "zone": "string — rg-{slug}-network | snet-app | snet-ai | snet-data | rg-{slug}-security | rg-{slug}-monitor | external",
      "purpose": "string — one sentence",
      "rationale": "string — why this over the main alternative"
    }
  ],

  "network_topology": {
    "description": "string — subnet strategy, sizes only not full CIDRs",
    "address_sizes": {
      "vnet": "/16",
      "snet_app": "/24",
      "snet_ai": "/24",
      "snet_data": "/24",
      "snet_pl": "/24"
    },
    "diagrams": {
      "layout_topdown": "string — full verified architecture-beta diagram, top-down edges using B/T sides, all label rules applied, pre-output checklist passed",
      "layout_leftright": "string — identical groups and services, left-to-right edges using R/L sides"
    }
  },

  "security_architecture": {
    "identity": "string",
    "network_security": "string",
    "encryption": "string",
    "secrets_management": "string",
    "compliance": "string"
  },

  "hld_diagrams": {
    "layout_topdown": "string — architecture-beta, high-level only, user to frontend to AI layer to data to integrations, max 20 nodes, pre-output checklist passed",
    "layout_leftright": "string — same content, LR edge sides"
  },

  "scalability_resilience": {
    "scaling_strategy": "string",
    "availability": "string",
    "disaster_recovery": "string"
  },

  "cost_estimate": {
    "assumptions": "string",
    "compute": "string — monthly USD range",
    "data_storage": "string — monthly USD range",
    "ai_services": "string — monthly USD range",
    "networking": "string — monthly USD range",
    "total_range": "string — e.g. 2400 to 4800 per month",
    "optimisation_tips": ["string", "string", "string"]
  },

  "iac_starter": {
    "resources": [
      {
        "terraform_resource": "string",
        "name": "string",
        "key_arguments": "string — 2-3 most important arguments only"
      }
    ]
  },

  "next_steps": [
    "string — concrete action, prioritised, max 5 items"
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REASONING CHECKLIST — apply before every response
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Is this a change to existing solution or a new solution?
   → Change: run change_impact first and wait for confirmation
   → New: generate full solution JSON directly

2. Traffic pattern: request/response | event-driven | batch?
3. Compliance constraints that affect service selection?
4. Which services require private endpoints?
5. Where are the scaling bottlenecks?
6. What is the single biggest risk — state it in solution_overview?
7. Diagram checklist passed for both layout variants?"""

USER_PROMPT_TEMPLATE = """## Requirements — AI Advisory Platform

Project type        : {project_type}
Scale               : {concurrent_users} users, {requests_per_day} req/day
Cloud preference    : {cloud_preference}
Compliance          : {compliance_requirements}
Team                : {team_size} engineers, maturity: {cloud_maturity}
Budget              : {budget_range} / month
Availability SLA    : {availability_sla}
Primary concern     : {primary_concern}
Preferred region    : {region_preference}

Functional requirements:
{functional_requirements}

Existing integrations:
{integrations}

## Existing solution context (if updating)
{existing_solution_json_or_null}

## Requested change (if updating)
{change_description_or_null}"""

# ── Startup validation — fail fast if old flowchart directives are present ──
# Match positive-instruction patterns only, not prohibition statements.
import re as _re
_FORBIDDEN = [
    r'(?i)(?:use|using)\s+(?:flowchart|graph)\s+(?:TD|LR)',  # "Use flowchart TD"
    r'(?i)flowchart\s+(?:TD|LR)\s*(?:—|for|to)\b',           # "flowchart TD — ..."
    r'(?i)\bsubgraph\s+\w+\s',                                # actual subgraph block
]
for _pname, _psrc in [("ADVISOR_SYSTEM_PROMPT", ADVISOR_SYSTEM_PROMPT), ("HLD_SYSTEM_PROMPT", HLD_SYSTEM_PROMPT)]:
    for _pat in _FORBIDDEN:
        _m = _re.search(_pat, _psrc)
        if _m:
            raise ValueError(f"{_pname} still contains forbidden flowchart directive: {repr(_m.group())}")


class AdvisorRequest(BaseModel):
    project_type: str
    concurrent_users: str
    requests_per_day: str
    cloud_preference: str
    compliance_requirements: str
    team_size: str
    cloud_maturity: str
    budget_range: str
    availability_sla: str
    primary_concern: str
    region_preference: str
    functional_requirements: str
    integrations: str = ""
    existing_solution_json: Optional[str] = None
    change_description: Optional[str] = None


def assemble_advisor_prompt(req: AdvisorRequest) -> str:
    prompt = USER_PROMPT_TEMPLATE.format(
        project_type=req.project_type,
        concurrent_users=req.concurrent_users,
        requests_per_day=req.requests_per_day,
        cloud_preference=req.cloud_preference,
        compliance_requirements=req.compliance_requirements,
        team_size=req.team_size,
        cloud_maturity=req.cloud_maturity,
        budget_range=req.budget_range,
        availability_sla=req.availability_sla,
        primary_concern=req.primary_concern,
        region_preference=req.region_preference,
        functional_requirements=req.functional_requirements,
        integrations=req.integrations or "None",
        existing_solution_json_or_null=req.existing_solution_json or "null",
        change_description_or_null=req.change_description or "null",
    )
    remaining = re.findall(r'\{[a-z_]+\}', prompt)
    if remaining:
        raise ValueError(f"Unfilled placeholders in assembled prompt: {remaining}")
    return prompt


@app.post("/api/advisor")
async def advisor_generate(req: AdvisorRequest):
    """Enterprise advisor — two-part prompt system with streaming JSON response."""
    if not ANTHROPIC_KEY:
        raise HTTPException(500, "ANTHROPIC_KEY not set in Replit Secrets")

    try:
        user_prompt = assemble_advisor_prompt(req)
    except ValueError as e:
        raise HTTPException(400, str(e))

    async_client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_KEY)

    async def stream_gen():
        try:
            full_text = ""
            async with async_client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=16000,
                system=ADVISOR_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            ) as stream:
                async for text in stream.text_stream:
                    full_text += text
            raw = clean_json_response(full_text)
            try:
                parsed = json.loads(raw)
                sanitise_solution_diagrams(parsed)
                raw = json.dumps(parsed)
            except (json.JSONDecodeError, Exception):
                pass  # fallback: emit unsanitized
            yield f"data: {json.dumps({'text': raw})}\n\n"
            yield "data: [DONE]\n\n"
        except anthropic.APIError as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        stream_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─────────────────────────────────────────────────────────────────────────────
# DRAW.IO EXPORT
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/export/drawio")
async def export_drawio(req: ExportRequest):
    diagram = req.diagram
    xml = generate_drawio_xml(diagram)
    return {"xml": xml, "filename": f"archon-{diagram.get('title','architecture').lower().replace(' ','-')}.drawio"}

def generate_drawio_xml(diagram: dict) -> str:
    import re, html

    def esc(s): return html.escape(str(s or ""), quote=True)

    cells = []
    cells.append('<mxCell id="0"/>')
    cells.append('<mxCell id="1" parent="0"/>')

    BSTYLES = {
        "internet":       "rounded=1;whiteSpace=wrap;fillColor=#f5f5f5;strokeColor=#8a8886;fontColor=#444444;dashed=0;fontSize=10;fontStyle=1;verticalAlign=top;arcSize=4;",
        "external":       "rounded=1;whiteSpace=wrap;fillColor=#fff5f5;strokeColor=#D13438;fontColor=#D13438;dashed=1;fontSize=10;fontStyle=1;verticalAlign=top;arcSize=4;",
        "subscription":   "rounded=1;whiteSpace=wrap;fillColor=none;strokeColor=#0078D4;strokeWidth=2;dashed=1;fontSize=11;fontColor=#0078D4;fontStyle=1;verticalAlign=top;arcSize=2;",
        "vnet":           "rounded=1;whiteSpace=wrap;fillColor=none;strokeColor=#00B4D8;strokeWidth=1.5;dashed=1;fontSize=10;fontColor=#00B4D8;fontStyle=1;verticalAlign=top;arcSize=2;",
        "subnet":         "rounded=1;whiteSpace=wrap;fillColor=rgba(248,249,250,0.5);strokeColor=#737373;strokeWidth=1;dashed=1;fontSize=9;fontColor=#555555;verticalAlign=top;arcSize=2;",
        "hub":            "rounded=1;whiteSpace=wrap;fillColor=#fff8f6;strokeColor=#F25022;strokeWidth=1.5;dashed=1;fontSize=10;fontColor=#F25022;fontStyle=1;verticalAlign=top;arcSize=2;",
        "resource_group": "rounded=1;whiteSpace=wrap;fillColor=none;strokeColor=#68217A;strokeWidth=1;dashed=1;fontSize=9;fontColor=#68217A;fontStyle=1;verticalAlign=top;arcSize=2;",
    }
    ESTYLES = {
        "sync":      "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;exitX=1;exitY=0.5;exitDx=0;exitDy=0;strokeColor=#0078D4;strokeWidth=1.5;",
        "async":     "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;dashed=1;strokeColor=#FBBA00;strokeWidth=1.5;",
        "msi":       "edgeStyle=orthogonalEdgeStyle;rounded=1;dashed=1;strokeColor=#ECD01E;strokeWidth=1;opacity=70;",
        "telemetry": "edgeStyle=orthogonalEdgeStyle;rounded=1;dashed=1;strokeColor=#84278F;strokeWidth=1;opacity=60;",
        "external":  "edgeStyle=orthogonalEdgeStyle;rounded=1;dashed=1;strokeColor=#D13438;strokeWidth=1.5;",
    }
    ICON_MAP = {
        "app-services":"App-Services","function-apps":"Function-Apps",
        "container-instances":"Container-Instances","front-doors":"Front-Doors",
        "firewalls":"Firewalls","api-management-services":"API-Management-Services",
        "virtual-networks":"Virtual-Networks","network-security-groups":"Network-Security-Groups",
        "private-link":"Private-Link","ddos-protection-plans":"DDoS-Protection-Plans",
        "dns-zones":"DNS-Zones","key-vaults":"Key-Vaults","azure-ad-b2c":"Azure-AD-B2C",
        "microsoft-defender-for-cloud":"Security-Center","policy":"Policy",
        "azure-cosmos-db":"Azure-Cosmos-DB","cache-redis":"Cache-Redis",
        "storage-accounts":"Storage-Accounts","azure-service-bus":"Service-Bus",
        "event-grid-topics":"Event-Grid-Topics","cognitive-services":"Cognitive-Services",
        "cognitive-search":"Search-Services","log-analytics-workspaces":"Log-Analytics-Workspaces",
        "application-insights":"Application-Insights","resource-groups":"Resource-Groups",
        "subscriptions":"Subscriptions","monitor":"Monitor","alerts":"Alerts",
        "application-gateway":"Application-Gateways","logic-apps":"Logic-Apps",
        "integration-accounts":"Integration-Accounts","container-registry":"Container-Registries",
    }

    def icon_url(icon_id):
        name = ICON_MAP.get(icon_id, "Cognitive-Services")
        return f"https://code.benco.io/icon-collection/azure-icons/{name}.svg"

    services   = diagram.get("services", [])
    boundaries = diagram.get("boundaries", [])
    conns      = diagram.get("connections", [])

    SHARED_IDS = {"dns","nsg","pe","appi","law","monitor","kv","defender","vnet","adb2c"}
    EXTERNAL_KEYWORDS = ["internet","partner","egress","outbound","hub shared","external","cdn","global"]

    def is_external_label(label):
        l = label.lower()
        return any(k in l for k in EXTERNAL_KEYWORDS)

    def assign_column(svc):
        icon = svc.get("icon_id","").lower()
        rg   = svc.get("resource_group","").lower()
        snet = svc.get("subnet","").lower()
        if "front-door" in icon or "application-gateway" in icon or "appgw" in snet: return 1
        if "api-management" in icon or "apim" in snet: return 2
        if "app-service" in icon or "function" in icon or "logic" in icon or "integration-account" in icon or "snet-integration" in snet or "compute" in rg: return 2
        if "service-bus" in icon or "event-grid" in icon or "storage" in icon or "cosmos" in icon or "messaging" in snet or "snet-data" in snet: return 3
        if "firewall" in icon or "hub" in rg: return 4
        return 2

    MARGIN       = 30
    TITLE_H      = 40
    PAGE_W       = 1600
    PAGE_H       = 1050

    subnet_list = [b for b in boundaries if b.get("type") == "subnet"]
    internet_bounds = [b for b in boundaries if b.get("type") == "internet" or
                       (b.get("type") == "external" and any(k in b.get("label","").lower() for k in ["internet","partner","user"]))]
    hub_bounds      = [b for b in boundaries if b.get("type") in ("hub",) or
                       (b.get("type") in ("external","vnet") and any(k in b.get("label","").lower() for k in ["hub","shared","peering"]))]
    egress_bounds   = [b for b in boundaries if b.get("type") == "external" and
                       any(k in b.get("label","").lower() for k in ["egress","outbound","firewall","internet"])]

    col_bounds_raw  = internet_bounds + subnet_list + hub_bounds + egress_bounds
    seen = set()
    col_bounds = []
    for b in col_bounds_raw:
        if b["id"] not in seen:
            seen.add(b["id"])
            col_bounds.append(b)

    if not col_bounds:
        col_bounds = boundaries

    EXT_W    = 130
    SUB_W    = max(160, (PAGE_W - MARGIN*2 - EXT_W * (len(internet_bounds) + len(hub_bounds) + len(egress_bounds))) // max(len(subnet_list), 1))
    SVG_NODE_W = 56
    SVG_NODE_H = 56
    NODE_LABEL_H = 36
    NODE_TOTAL_H = SVG_NODE_W + NODE_LABEL_H
    NODE_GAP_Y   = 20

    col_x = {}
    col_w = {}
    cursor_x = MARGIN
    for b in col_bounds:
        btype = b.get("type","subnet")
        is_ext = is_external_label(b.get("label","")) or btype in ("internet","hub","external")
        w = EXT_W if is_ext else SUB_W
        col_x[b["id"]] = cursor_x
        col_w[b["id"]] = w
        cursor_x += w + 10

    TOTAL_W  = cursor_x + MARGIN
    SUB_Y    = TITLE_H + MARGIN
    COL_TOP  = SUB_Y + 60
    COL_H    = PAGE_H - COL_TOP - MARGIN * 2

    svc_col = {}
    for svc in services:
        snet = svc.get("subnet", "").lower()
        matched = False
        for b in subnet_list:
            blabel = b.get("label","").lower()
            bsnet  = re.search(r'snet-[\w-]+', blabel)
            if bsnet and bsnet.group() in snet:
                svc_col[svc["id"]] = b["id"]
                matched = True
                break
            if snet and snet in blabel:
                svc_col[svc["id"]] = b["id"]
                matched = True
                break
        if not matched:
            col_idx = assign_column(svc)
            if col_idx <= len(subnet_list):
                svc_col[svc["id"]] = subnet_list[min(col_idx-1, len(subnet_list)-1)]["id"]
            elif subnet_list:
                svc_col[svc["id"]] = subnet_list[-1]["id"]

    col_svc_lists = {}
    for b in col_bounds:
        col_svc_lists[b["id"]] = []
    for svc in services:
        cid = svc_col.get(svc["id"])
        if cid and cid in col_svc_lists:
            col_svc_lists[cid].append(svc)
        elif subnet_list:
            col_svc_lists[subnet_list[0]["id"]].append(svc)

    svc_positions = {}
    for bid, svcs in col_svc_lists.items():
        x_center = col_x.get(bid, MARGIN) + col_w.get(bid, SUB_W) // 2 - SVG_NODE_W // 2
        for i, svc in enumerate(svcs):
            sy = COL_TOP + 50 + i * (NODE_TOTAL_H + NODE_GAP_Y)
            svc_positions[svc["id"]] = (x_center, sy)

    sub_bounds = [b for b in boundaries if b.get("type") == "subscription"]
    vnet_bounds = [b for b in boundaries if b.get("type") == "vnet" and
                   not any(k in b.get("label","").lower() for k in ["hub","shared"])]

    sub_label = sub_bounds[0].get("label","Azure Subscription") if sub_bounds else "Azure Subscription"
    cells.append(
        f'<mxCell id="b-subscription" value="{esc(sub_label)}" '
        f'style="{BSTYLES["subscription"]}" vertex="1" parent="1">'
        f'<mxGeometry x="{MARGIN}" y="{SUB_Y}" width="{TOTAL_W - MARGIN*2}" height="{COL_H + 100}" as="geometry"/>'
        f'</mxCell>'
    )

    if vnet_bounds and subnet_list:
        vnet_x = col_x[subnet_list[0]["id"]] - 10
        vnet_right = col_x[subnet_list[-1]["id"]] + col_w[subnet_list[-1]["id"]] + 10
        vnet_w = vnet_right - vnet_x
        vnet_label = vnet_bounds[0].get("label","VNet")
        cells.append(
            f'<mxCell id="b-vnet" value="{esc(vnet_label)}" '
            f'style="{BSTYLES["vnet"]}" vertex="1" parent="1">'
            f'<mxGeometry x="{vnet_x}" y="{COL_TOP - 20}" width="{vnet_w}" height="{COL_H + 40}" as="geometry"/>'
            f'</mxCell>'
        )

    for b in col_bounds:
        btype = b.get("type","subnet")
        is_ext = is_external_label(b.get("label","")) or btype in ("internet","hub","external")
        style = BSTYLES.get(btype if not is_ext else ("internet" if btype=="internet" else "hub"), BSTYLES["subnet"])
        cx = col_x[b["id"]]
        cw = col_w[b["id"]]
        label = b.get("label","")
        cells.append(
            f'<mxCell id="b-col-{b["id"]}" value="{esc(label)}" '
            f'style="{style}" vertex="1" parent="1">'
            f'<mxGeometry x="{cx}" y="{COL_TOP - 10}" width="{cw}" height="{COL_H + 20}" as="geometry"/>'
            f'</mxCell>'
        )

    rg_bounds = [b for b in boundaries if b.get("type") == "resource_group"]
    rg_count = len(rg_bounds)
    if rg_count > 0:
        rg_h = 60
        rg_y_start = COL_TOP + COL_H - rg_h * rg_count - 10
        rg_zone_w  = TOTAL_W - MARGIN * 2 - 20
        for ri, b in enumerate(rg_bounds):
            rx = MARGIN + 10
            ry = rg_y_start + ri * (rg_h + 6)
            cells.append(
                f'<mxCell id="b-rg-{b["id"]}" value="{esc(b.get("label",""))}" '
                f'style="{BSTYLES["resource_group"]}" vertex="1" parent="1">'
                f'<mxGeometry x="{rx}" y="{ry}" width="{rg_zone_w}" height="{rg_h}" as="geometry"/>'
                f'</mxCell>'
            )

    for svc in services:
        x, y = svc_positions.get(svc["id"], (MARGIN + 40, COL_TOP + 60))
        icon_id = svc.get("icon_id","cognitive-services")
        label   = esc(svc.get("display_name","Service"))
        sku     = esc(svc.get("sku",""))
        cost    = svc.get("estimated_cost_aud",0)
        rationale = esc(svc.get("rationale",""))
        tooltip = f"{rationale} | A${cost}/mo"
        style   = (
            f"shape=image;aspect=fixed;"
            f"image={icon_url(icon_id)};"
            f"whiteSpace=wrap;fontSize=9;verticalLabelPosition=bottom;"
            f"labelPosition=center;verticalAlign=top;"
        )
        cells.append(
            f'<mxCell id="svc-{svc["id"]}" value="{label}&#xa;{sku}" '
            f'style="{style}" tooltip="{tooltip}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{SVG_NODE_W}" height="{SVG_NODE_H}" as="geometry"/>'
            f'</mxCell>'
        )

    for conn in conns:
        estyle = ESTYLES.get(conn.get("type","sync"), ESTYLES["sync"])
        label  = esc(conn.get("label",""))
        src    = conn.get("from","")
        tgt    = conn.get("to","")
        cells.append(
            f'<mxCell id="conn-{conn["id"]}" value="{label}" edge="1" '
            f'source="svc-{src}" target="svc-{tgt}" style="{estyle}" parent="1">'
            f'<mxGeometry relative="1" as="geometry"/>'
            f'</mxCell>'
        )

    lx, ly = TOTAL_W - 220, PAGE_H - 160
    cells.append(
        f'<mxCell id="legend-box" value="Legend" '
        f'style="rounded=1;fillColor=#fafafa;strokeColor=#e0e0e0;fontSize=9;fontStyle=1;verticalAlign=top;" '
        f'vertex="1" parent="1">'
        f'<mxGeometry x="{lx}" y="{ly}" width="200" height="130" as="geometry"/>'
        f'</mxCell>'
    )
    legend_items = [
        ("#0078D4","none","Sync HTTPS"),
        ("#FBBA00","6 3","Async / Event"),
        ("#ECD01E","4 3","MSI / Secrets"),
        ("#84278F","4 3","Telemetry"),
        ("#D13438","6 3","External"),
    ]
    for li, (clr, dash, lbl) in enumerate(legend_items):
        ly2 = ly + 22 + li * 22
        dash_style = f"dashed=1;dashPattern={dash};" if dash != "none" else ""
        cells.append(
            f'<mxCell id="leg-{li}" value="{lbl}" edge="1" '
            f'style="edgeStyle=none;{dash_style}strokeColor={clr};strokeWidth=1.5;fontSize=9;endArrow=open;endFill=0;" '
            f'source="" target="" parent="1">'
            f'<mxGeometry x="{lx+10}" y="{ly2}" width="50" height="0" relative="0" as="geometry">'
            f'<Array as="points"/>'
            f'</mxGeometry>'
            f'</mxCell>'
        )

    cells_xml = "\n    ".join(cells)
    pw = max(TOTAL_W + 100, 1654)
    ph = max(PAGE_H + 100, 1169)

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1"
  connect="1" arrows="1" fold="1" page="1" pageScale="1"
  pageWidth="{pw}" pageHeight="{ph}" math="0" shadow="0">
  <root>
    {cells_xml}
  </root>
</mxGraphModel>"""

@app.get("/health")
def health():
    return {"status": "ok", "service": "Archon Demo API"}

# ─────────────────────────────────────────────────────────────────────────────
# STATIC FRONTEND — mount after all API routes so /api/* is never intercepted
# ─────────────────────────────────────────────────────────────────────────────
_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.isdir(_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        return FileResponse(os.path.join(_DIST, "index.html"))
