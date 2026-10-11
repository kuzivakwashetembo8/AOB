import { describe, it, expect } from "vitest";
import { GaitContinuityController, type GaitInputs } from "../game/character/locomotion/gait-continuity";

const tick = (patch: Partial<GaitInputs> = {}): GaitInputs => ({
  intentMagnitude: 1,
  correctedPlanarSpeed: 6.4,
  rawGrounded: true,
  sprintRequested: true,
  jumpAscending: false,
  dt: 1 / 60,
  ...patch,
});

describe("GTD-CHAR-001 L2 held-movement animation stability", () => {
  it("does not stop or jump on isolated Rapier speed/contact dropouts during sprint", () => {
    const continuity = new GaitContinuityController();
    const clips: string[] = [];
    for (let i = 0; i < 180; i++) {
      const anomaly = i % 23 === 0 && i > 0;
      const step = continuity.update(tick({
        correctedPlanarSpeed: anomaly ? 0 : 6.4,
        rawGrounded: !anomaly,
      }));
      clips.push(step.state);
    }
    expect(new Set(clips)).toEqual(new Set(["sprint"]));
    expect(continuity.update(tick()).transitionCount).toBe(1);
  });

  it("holds a continuous run even if corrected speed fluctuates around 5m/s", () => {
    const continuity = new GaitContinuityController();
    const sequence = [6.4, 5.01, 4.99, 5.2, 4.1, 6.2, 3.9, 5.8, 6.1];
    expect(sequence.map((speed) => continuity.update(tick({correctedPlanarSpeed:speed})).state))
      .toEqual(sequence.map(() => "sprint"));
  });

  it("immediately stops on genuine input release", () => {
    const continuity = new GaitContinuityController();
    expect(continuity.update(tick()).state).toBe("sprint");
    const released = continuity.update(tick({intentMagnitude:0,correctedPlanarSpeed:0}));
    expect(released.state).toBe("idle");
    expect(released.lastTransition).toBe("sprint->idle");
  });

  it("stops after a sustained Rapier blockage despite a held direction", () => {
    const continuity = new GaitContinuityController();
    continuity.update(tick());
    let state = "";
    for (let i=0;i<16;i++) state=continuity.update(tick({correctedPlanarSpeed:0})).state;
    expect(state).toBe("idle");
  });

  it("enters jump immediately on deliberate ascending jump", () => {
    const continuity = new GaitContinuityController();
    continuity.update(tick());
    const decision=continuity.update(tick({rawGrounded:false,jumpAscending:true}));
    expect(decision.state).toBe("jump");
    expect(decision.lastTransition).toBe("sprint->jump");
  });

  it("classifies sustained airborne falling after grace, then lands naturally", () => {
    const continuity=new GaitContinuityController();
    continuity.update(tick({sprintRequested:false,correctedPlanarSpeed:3.8}));
    let last = continuity.update(tick({rawGrounded:false,sprintRequested:false,correctedPlanarSpeed:3.8}));
    expect(last.state).toBe("walk");
    for (let i=0;i<12;i++) last=continuity.update(tick({rawGrounded:false,sprintRequested:false,correctedPlanarSpeed:3.8}));
    expect(last.state).toBe("jump");
    expect(continuity.update(tick({rawGrounded:true,sprintRequested:false,correctedPlanarSpeed:3.8})).state).toBe("walk");
  });

  it("remains idle during start-of-turn without physical translation", () => {
    const continuity=new GaitContinuityController();
    for (let i=0;i<8;i++) expect(continuity.update(tick({correctedPlanarSpeed:0})).state).toBe("idle");
    expect(continuity.update(tick({correctedPlanarSpeed:3.8,sprintRequested:false})).state).toBe("walk");
  });

  it("does not change physics coordinates or world velocity", () => {
    const continuity=new GaitContinuityController();
    const raw=tick({correctedPlanarSpeed:0,rawGrounded:false});
    const before={...raw};
    continuity.update(raw);
    expect(raw).toEqual(before);
  });
});
