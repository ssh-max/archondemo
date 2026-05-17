import os, json, uuid, re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

@app.post("/api/generate")
async def generate_architecture(req: GenerateRequest):
    if not ANTHROPIC_KEY:
        raise HTTPException(500, "ANTHROPIC_KEY not set in Replit Secrets")
    
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    
    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=8000,
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

@app.post("/api/export/drawio")
async def export_drawio(req: ExportRequest):
    diagram = req.diagram
    xml = generate_drawio_xml(diagram)
    return {"xml": xml, "filename": f"archon-{diagram.get('title','architecture').lower().replace(' ','-')}.drawio"}

def generate_drawio_xml(diagram: dict) -> str:
    cells = []
    cells.append('<mxCell id="0"/>')
    cells.append('<mxCell id="1" parent="0"/>')
    
    BOUNDARY_STYLES = {
        "internet":      "rounded=1;whiteSpace=wrap;fillColor=#f5f5f5;strokeColor=#666666;fontColor=#333333;dashed=0;fontSize=11;fontStyle=1;verticalAlign=top;",
        "subscription":  "rounded=1;whiteSpace=wrap;fillColor=none;strokeColor=#0078D4;strokeWidth=2;dashed=1;fontSize=11;fontColor=#0078D4;fontStyle=1;verticalAlign=top;",
        "vnet":          "rounded=1;whiteSpace=wrap;fillColor=none;strokeColor=#00B4D8;strokeWidth=1;dashed=1;fontSize=10;fontColor=#00B4D8;fontStyle=1;verticalAlign=top;",
        "subnet":        "rounded=1;whiteSpace=wrap;fillColor=none;strokeColor=#737373;strokeWidth=1;dashed=1;fontSize=9;verticalAlign=top;",
        "resource_group":"rounded=1;whiteSpace=wrap;fillColor=none;strokeColor=#68217A;strokeWidth=1;dashed=1;fontSize=9;fontColor=#68217A;fontStyle=1;verticalAlign=top;",
        "external":      "rounded=1;whiteSpace=wrap;fillColor=none;strokeColor=#D13438;strokeWidth=1;dashed=1;fontSize=9;fontColor=#D13438;verticalAlign=top;",
    }
    
    EDGE_STYLES = {
        "sync":      "edgeStyle=orthogonalEdgeStyle;rounded=0;strokeColor=#0078D4;strokeWidth=1.5;",
        "async":     "edgeStyle=orthogonalEdgeStyle;dashed=1;strokeColor=#FBBA00;strokeWidth=1.5;",
        "msi":       "edgeStyle=orthogonalEdgeStyle;dashed=1;strokeColor=#ECD01E;strokeWidth=1;opacity=60;",
        "telemetry": "edgeStyle=orthogonalEdgeStyle;dashed=1;strokeColor=#84278F;strokeWidth=1;opacity=50;",
        "external":  "edgeStyle=orthogonalEdgeStyle;dashed=1;strokeColor=#D13438;strokeWidth=1.5;",
    }
    
    # Layout: auto-position services in a grid
    services = diagram.get("services", [])
    cols = 4
    x_start, y_start, x_gap, y_gap = 160, 200, 160, 160
    
    svc_positions = {}
    for i, svc in enumerate(services):
        row, col = divmod(i, cols)
        x = x_start + col * x_gap
        y = y_start + row * y_gap
        svc_positions[svc["id"]] = (x, y)
    
    # Render boundaries
    boundary_positions = {
        "internet":     (20, 20, 1400, 120),
        "subscription": (20, 100, 1400, 900),
        "vnet":         (40, 160, 1360, 820),
        "subnet":       (60, 200, 400, 300),
        "resource_group":(60, 520, 600, 200),
        "external":     (20, 1010, 1400, 100),
    }
    
    for b in diagram.get("boundaries", []):
        btype = b.get("type", "subnet")
        style = BOUNDARY_STYLES.get(btype, BOUNDARY_STYLES["subnet"])
        px, py, pw, ph = boundary_positions.get(btype, (60, 200, 300, 200))
        label = b.get("label", "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        cells.append(
            f'<mxCell id="b-{b["id"]}" value="{label}" style="{style}" '
            f'vertex="1" parent="1">'
            f'<mxGeometry x="{px}" y="{py}" width="{pw}" height="{ph}" as="geometry"/>'
            f'</mxCell>'
        )
    
    # Render services
    for svc in services:
        x, y = svc_positions.get(svc["id"], (200, 200))
        icon_id = svc.get("icon_id", "cognitive-services")
        label = svc.get("display_name", "Service").replace("&","&amp;")
        sku = svc.get("sku", "").replace("&","&amp;")
        cost = svc.get("estimated_cost_aud", 0)
        tooltip = f"{svc.get('rationale','')} | A${cost}/mo"
        style = (
            f"shape=image;aspect=fixed;"
            f"image=https://code.benco.io/icon-collection/azure-icons/{icon_id}.svg;"
            f"whiteSpace=wrap;fontSize=9;verticalLabelPosition=bottom;"
            f"labelPosition=center;verticalAlign=top;"
        )
        cells.append(
            f'<mxCell id="svc-{svc["id"]}" value="{label}&#xa;{sku}" '
            f'style="{style}" tooltip="{tooltip}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="56" height="56" as="geometry"/>'
            f'</mxCell>'
        )
    
    # Render connections
    for conn in diagram.get("connections", []):
        style = EDGE_STYLES.get(conn.get("type","sync"), EDGE_STYLES["sync"])
        label = conn.get("label","").replace("&","&amp;")
        src = conn.get("from","")
        tgt = conn.get("to","")
        cells.append(
            f'<mxCell id="conn-{conn["id"]}" value="{label}" edge="1" '
            f'source="svc-{src}" target="svc-{tgt}" style="{style}" parent="1">'
            f'<mxGeometry relative="1" as="geometry"/>'
            f'</mxCell>'
        )
    
    cells_xml = "\n    ".join(cells)
    
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1"
  connect="1" arrows="1" fold="1" page="1" pageScale="1"
  pageWidth="1654" pageHeight="1169" math="0" shadow="0">
  <root>
    {cells_xml}
  </root>
</mxGraphModel>"""

@app.get("/health")
def health():
    return {"status": "ok", "service": "Archon Demo API"}
