# Window Placement Correction — FL4-VIS-A02

**Proposed; not implemented.** In architecture-plan.ts, retain current ordinary-window formula for floor heights at or below 3.8 m. For taller storeys use sill=min(1.32, floorHeight*0.30) and height=min(2.05, floorHeight*0.46). Apply floorBase to sill as before.

For generated storefront panels keep sill=0.22 and use height=min(3.1, floorHeight-sill-0.62). Preserve non-traversable decorative status.

Predicted changes: west residential sill/height/header 1.26/1.932/1.008; rear residential 1.32/2.024/1.056; corner commercial upper 1.29/1.978/1.032; corner storefront 0.22/3.10/0.98; rear shop storefront 0.22/2.26/0.62.

No floor-height or building-mass changes justified. Do not touch authored garage opening, physical rear glass, collision, portals, roof, IDs or generator seed.
