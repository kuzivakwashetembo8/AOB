# GTD-TRAFFIC-020 — Early-Morning Urban Traffic Congestion: Investigation Backlog

**Recorded:** 2026-10-31  
**Status:** DOCUMENTATION ONLY — future investigation, no congestion generation authorized  
**Affected area:** Meridia, initially North Heights; eventual city-wide policy  
**Trigger:** Unexpected stationary traffic queue observed during NH-SOLID-017 / NH-CONTACT-018 collision acceptance, followed by remediation NH-TRAFFIC-019. The user identified the scene as valuable emergent gameplay but explicitly stated that congestion should happen **intentionally, not because of broken traffic logic**.

## Product intent

Create convincing early-morning commuter congestion at appropriate city locations and times, while preserving the solid Sedan vehicle physics, authentic contact response, free driving, pedestrian safety and the current traffic population/performance standards.

**Critical separation:** The traffic simulation must move normally when there is no intentionally modeled demand imbalance or obstruction. Permanently parking an AI car after an incidental collision is a defect, NOT a congestion feature. Congestion must be a measurable outcome of plausible traffic demand exceeding the capacity of a road, junction or destination, never an artificially frozen actor or invisible blocker.

## What October's incident taught us

1. Collision bodies and exact contact can produce credible nose-to-tail queues. These shapes should be retained.
2. The previous `stepImpactBodies` lifecycle mistakenly added impacted autonomous cars to `freeParkedAgents`; this is intended only for deliberate player parking. It manufactured persistent bottlenecks.
3. NH-TRAFFIC-019 introduces an independent, bounded collision recovery state. A struck AI vehicle must physically recover and re-enter the lane; no snap-back or disabled collision is acceptable.
4. The resulting queue in the screenshot is a useful reference for *appearance and density*, not evidence that the simulation correctly models rush hour.

## Investigation questions (no implementation yet)

- **Time schedule.** Determine a plausible Meridia in-game clock and whether commute demand follows local city day/night, calendar weekday, or a scenario script. Example candidate window for study: 05:30–09:00 with a stronger 06:30–08:30 peak. This is exploratory, NOT an approved schedule.
- **Origin-destination demand.** Identify where workers, residents, deliveries and service vehicles travel: South Ward residential streets, North Heights commercial offices, transit nodes, parking areas and future Meridian Central.
- **Road capacities.** Measure two-lane road lane count, signal/intersection service rates, stop-line dwell, queue storage, turning capacity, curbside activity, parking entrance discharge and crosswalk interruptions.
- **Vehicle population.** Estimate what density is achievable with 125 simulation agents while preserving performance and visual credibility; determine whether district-scoped streaming/demand rebalancing can increase apparent flow without spawning excessive 3D meshes or Rapier actors.
- **Routing and spillback.** Investigate paths, stochastic departure distribution, safe headways, lawful intersections, queue propagation, downstream blocking and route choice under congestion. Avoid deadlocks, permanently reserved junctions and overlapping cars.
- **Pedestrian interactions.** Quantify crossing demand. Pedestrians may cause real delays, but their scripted routes must clear, yield appropriately and never create an indefinite impassable corridor.
- **World placement.** Map believable recurrent hot spots near commuter corridors and business districts; keep suburban parks, service alleys, quiet mornings and weekends context-sensitive rather than globally crowded.
- **Sensory presentation.** Consider brake lights, engine idling, natural approach/deceleration, cautious lane changes, varied stopping gaps, spatial traffic audio and eventual mission interactions. Preserve audio and FPS budgets.
- **Persistence.** Decide whether a player loading/returning during the morning peak resumes existing active queue state, or reconstructs a deterministic demand state; avoid spawn collisions.
- **Gameplay impact.** Explore whether missions may route through, avoid, observe or respond to congestion without manufacturing unavoidable frustration.

## Metrics and evidence required before choosing algorithms

Record per-route travel time, stopped duration, queue length, intersection throughput, jam-clearing time, active/recovering/parked agents, physical contact counts, route-failure count, reservation age, FPS, memory and load time (desktop + mobile). Distinguish ordinary following from temporary crash recovery and intentional congestion.

A normal-flow baseline should show that queues dissipate when demand falls and all 125 agents remain eligible for movement unless actually parked or blocked by a current real-world object. Every deliberately congested test needs a control scenario using the same road network and population without the morning demand modifier.

## Candidate experimental stages (require separate owner approval)

1. Record baseline flows and identify capacity-constrained roads and junctions.
2. Prototype optional time-of-day commuter origin/destination scheduling in an isolated branch; all dynamic demand is reversible.
3. Add distributed departure times, physically safe following and protected intersection reservations, then measure queue propagation versus a control.
4. Introduce geographically selective morning bottlenecks, with bounded spillback and eventual resolution.
5. Validate visual realism, pedestrian safety, mobile performance and FPS, then request owner acceptance. Do not enable by default without explicit approval.

## Explicit exclusions

No congestion feature shall be implemented in NH-TRAFFIC-019. Do not resurrect the accidental `freeParkedAgents` collision bug, create frozen/ghost cars, disable collision physics, globally reduce vehicle speed as a substitute for demand, block every road, or infer acceptance of the traffic system from a screenshot alone.

## Acceptance criteria for the future system

Congestion should appear at credible early-morning locations, form and dissolve according to demand and capacity, allow all cars to retain physical contact and lawful movement, respond correctly to collisions and pedestrians, and have a clear difference between ordinary off-peak traffic, isolated incidents and rush-hour peaks. The owner will review the scenario before merging.

**Next action:** After the North Heights collision/recovery defect is fixed and independently accepted, investigate demand/capacity and formulate a separate technical plan for GTD-TRAFFIC-020. No gameplay changes are authorized by this document.
