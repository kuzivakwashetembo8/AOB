# NH-OPT2 action layout completion for PED-001 release — 2026-10-28

## Scope and authorization
Owner authorized merging the accepted 100-pedestrian optimized NPC renderer, completed ground-contact and curb-material correction, and the previously accepted uniform action-button layout, followed by production deployment.

## Layout defect
The earlier priority-based CSS on main enlarged the Sprint control and placed actions at fixed coordinates, overriding the three-column equal-sized grid accepted for North Heights. Both the desktop and touch control components still carried the priority class.

## Corrective implementation
- Replace priority styling with a uniform three-column grid for available actions.
- Keep all touch action buttons equal (48 × 48 px, or 42 × 42 px on short viewports); desktop actions remain equal at 42 × 42 px.
- Preserve the existing action availability, context/proximity, input handlers, driving controls, movement controls, accessibility labels, and pause/info UI.
- Do not change the accepted pedestrian simulation, optimized NPC assets, curb material, or terrain contact offsets.
- Add regression checks for three-column layout, equal button sizes, and absence of Sprint-specific placement.

## Release verification
The PED-001 branch descends directly from main commit 6424eb15 and carries the accepted pedestrian stages and VIS-004 curb/grounding patch. The release must be merged into main without altering the validated pedestrian algorithm. Verify the production deployment's Git SHA and READY state.
