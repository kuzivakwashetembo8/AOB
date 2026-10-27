import {describe,it,expect} from "vitest";
import {NH012TrafficSimulator,type NH012Agent,type NH012DriverTurn} from "@/game/traffic/nh012-traffic-simulator";

const sim=()=>new NH012TrafficSimulator(125,120125);
function eligible(s:NH012TrafficSimulator) {
  const a=s.agents.find(a=>!a.connectorId&&
    s.legalDriverTurnConnector(a.id,"left")&&s.legalDriverTurnConnector(a.id,"right"));
  if(!a)throw Error("Expected a four-way approach among 125 traffic identities");
  return a;
}
function connectorCross(s:NH012TrafficSimulator,a:NH012Agent,turn:NH012DriverTurn){
  const c=s.legalDriverTurnConnector(a.id,turn)!;
  const incoming=s.graph.edges.get(a.edgeId)!;
  const outgoing=s.graph.edges.get(c.outgoing)!;
  return incoming.dx*outgoing.dz-incoming.dz*outgoing.dx;
}
describe("GTD-NH-OPT2-SDN-001 Stage 4: one legal queued turn at the next junction",()=>{
  it("preserves the exact original 125-agent AI trace without any manual turn",()=>{
    const baseline=sim(),stage4=sim();
    for(let tick=0;tick<450;tick++){
      baseline.step();stage4.step();
    }
    expect(stage4.agents).toEqual(baseline.agents);
    expect(stage4.validate()).toEqual([]);
    expect(stage4.snapshot().count).toBe(125);
  });

  it("derives relative left/right from forward ROAD heading independent of camera",()=>{
    const s=sim(),a=eligible(s);
    expect(connectorCross(s,a,"left")).toBeGreaterThan(.5);
    expect(connectorCross(s,a,"right")).toBeLessThan(-.5);
    expect(s.legalDriverTurnConnector(a.id,"left")!.junction).toBe(s.graph.edges.get(a.edgeId)!.to);
    expect(s.legalDriverTurnConnector(a.id,"right")!.junction).toBe(s.graph.edges.get(a.edgeId)!.to);
  });

  it("queues one legal turn, replaces it on next tap and clears its old cached connector",()=>{
    const s=sim(),a=eligible(s);
    const left=s.legalDriverTurnConnector(a.id,"left")!;
    const right=s.legalDriverTurnConnector(a.id,"right")!;
    expect(left.id).not.toBe(right.id);
    expect(s.setDriverTurn(a.id,"left")).toBe("queued");
    expect(s.pendingDriverTurn(a.id)).toBe("left");
    expect(a.plannedConnectorId).toBe(left.id);
    expect(s.setDriverTurn(a.id,"right")).toBe("queued");
    expect(s.pendingDriverTurn(a.id)).toBe("right");
    expect(a.plannedConnectorId).toBe(right.id);
    s.clearDriverTurn(a.id);
    expect(s.pendingDriverTurn(a.id)).toBeNull();
    expect(a.plannedConnectorId).toBeNull();
    expect(s.agents).toHaveLength(125);
  });

  it("refuses illegal junction directions without inventing U-turns or changing a queued route",()=>{
    const s=sim(),a=eligible(s);
    const edge=[...s.graph.edges.values()].find(edge=>{
      const turns=s.graph.turns.get(edge.id)??[];
      return turns.length===1;
    });
    if(!edge)throw Error("North Heights boundary must have legal one-option approaches");
    const sole=s.graph.turns.get(edge.id)![0]!;
    const next=s.graph.edges.get(sole.outgoing)!;
    const cross=edge.dx*next.dz-edge.dz*next.dx;
    const unavailable:NH012DriverTurn=cross>.5?"right":"left";
    a.edgeId=edge.id;a.connectorId=null;a.plannedConnectorId=null;
    expect(s.legalDriverTurnConnector(a.id,unavailable)).toBeNull();
    expect(s.setDriverTurn(a.id,unavailable)).toBe("unavailable");
    expect(a.plannedConnectorId).toBeNull();
    expect(s.pendingDriverTurn(a.id)).toBeNull();
    expect(s.setDriverTurn("missing sedan",unavailable)).toBe("missing");
  });

  it("consumes chosen intent only after acquiring a real exclusive junction reservation",()=>{
    const s=sim();
    // Find a legal outgoing road not currently blocked near its entry.
    const candidate=s.agents.flatMap(a=>{
      if(a.connectorId)return [];
      return (["left","right"] as const).flatMap(direction=>{
        const c=s.legalDriverTurnConnector(a.id,direction);
        if(!c)return [];
        const noBlock=s.agents.every(b=>b===a||b.connectorId!==null||
          b.edgeId!==c.outgoing||b.s>=a.length+2+3);
        return noBlock?[{a,c,direction}]:[];
      });
    })[0];
    if(!candidate)throw Error("No unblocked junction approach");
    const {a,c,direction}=candidate;
    expect(s.setDriverTurn(a.id,direction)).toBe("queued");
    const incoming=s.graph.edges.get(a.edgeId)!;
    a.s=incoming.length;a.speed=0;a.state="stopped";
    a.arrivalTick=0;a.waitTicks=4;
    s.step();
    expect(a.connectorId).toBe(c.id);
    expect(a.plannedConnectorId).toBe(c.id);
    expect(s.pendingDriverTurn(a.id)).toBeNull(); // one-shot consumed
    expect(s.setDriverTurn(a.id,direction)).toBe("locked");
    expect(s.validate()).toEqual([]);
  });

  it("only clears the controlling rider's pending intent and preserves other traffic",()=>{
    const s=sim(),a=eligible(s);
    const other=s.agents.find(b=>b.id!==a.id)!;
    expect(s.setDriverTurn(a.id,"left")).toBe("queued");
    s.clearDriverTurn(other.id);
    expect(s.pendingDriverTurn(a.id)).toBe("left");
    s.clearDriverTurn(a.id);
    expect(s.pendingDriverTurn(a.id)).toBeNull();
    expect(new Set(s.agents.map(v=>v.id)).size).toBe(125);
  });

  it("does not override already-accepted brake and throttle traffic safety",()=>{
    const s=sim(),a=eligible(s),initial=a.speed;
    expect(s.setDriverTurn(a.id,"left")).toBe("queued");
    s.setDriverThrottle(a.id,1);s.setDriverBrake(a.id,true);
    s.step();
    expect(a.speed).toBeLessThan(initial);
    expect(a.plannedConnectorId).toBe(s.legalDriverTurnConnector(a.id,"left")!.id);
    expect(s.validate()).toEqual([]);
  });
});
