export const districts = [
  {
    name: "North Heights",
    code: "05",
    identity: "A DIFFERENT VIEW OF THE CITY",
    description:
      "Above the noise, winding streets climb toward quiet estates. Distance does not mean safety.",
    sector: "UPLAND",
    terrain: "Hillside residential",
    landmark: "Overlook Drive",
  },
  {
    name: "Meridian Central",
    code: "01",
    identity: "THE CITY NEVER STANDS STILL",
    description:
      "Steel towers. Rain-slick avenues. A thousand lives crossing beneath the same skyline. This is the beating heart of Meridian.",
    sector: "DOWNTOWN",
    terrain: "High-density urban",
    landmark: "Division Tower",
  },
  {
    name: "South Ward",
    code: "02",
    identity: "WHERE THE CITY HOLDS ITS GROUND",
    description:
      "Close-knit blocks and late-night corner stores. South Ward remembers everyone who stood up for it.",
    sector: "RESIDENTIAL",
    terrain: "Dense neighborhood",
    landmark: "South Ward Courts",
  },
  {
    name: "Old Meridian",
    code: "03",
    identity: "EVERY STREET HAS A MEMORY",
    description:
      "Narrow brick streets and the bones of an older city. Some stories are buried. Others are waiting.",
    sector: "HISTORIC",
    terrain: "Brick-lined streets",
    landmark: "Old Union Station",
  },
  {
    name: "Harbor District",
    code: "04",
    identity: "EVERYTHING COMES IN BY WATER",
    description:
      "Container yards, deep-water docks, and fog rolling over the working waterfront. Meridian starts here.",
    sector: "WATERFRONT",
    terrain: "Port and industrial",
    landmark: "Pier 09",
  },
  {
    name: "East Market",
    code: "06",
    identity: "A CITY WITHIN THE CITY",
    description:
      "Market stalls, busy intersections, and voices from every corner of Meridia. Nothing here stays still.",
    sector: "COMMERCIAL",
    terrain: "Market streets",
    landmark: "East Arcade",
  },
  {
    name: "The Strip",
    code: "07",
    identity: "AFTER DARK, ANOTHER MERIDIAN",
    description:
      "Music behind closed doors. Headlights on the boulevard. The city keeps its own hours.",
    sector: "NIGHTLIFE",
    terrain: "Entertainment corridor",
    landmark: "Halcyon Boulevard",
  },
  {
    name: "Ironworks",
    code: "08",
    identity: "BUILT BY HAND. BUILT TO LAST.",
    description:
      "Foundries and freight lines beneath a weathered steel skyline. The machines are quieter now.",
    sector: "INDUSTRIAL",
    terrain: "Factory yards",
    landmark: "Meridian Foundry",
  },
  {
    name: "West End",
    code: "09",
    identity: "ON THE OTHER SIDE OF THE TRACKS",
    description:
      "Wide avenues, old apartments, and a neighborhood changing faster than the people who live in it.",
    sector: "MIXED USE",
    terrain: "Urban residential",
    landmark: "West End Terminal",
  },
  {
    name: "Meridian University District",
    code: "10",
    identity: "THE NEXT CHAPTER STARTS HERE",
    description:
      "Open courtyards and late library lights. A new generation asking difficult questions.",
    sector: "EDUCATION",
    terrain: "Campus and parks",
    landmark: "Meridian University",
  },
  {
    name: "Civic Square",
    code: "11",
    identity: "THE WEIGHT OF A CITY",
    description:
      "Public steps, quiet monuments, and the halls where decisions become consequences.",
    sector: "CIVIC",
    terrain: "Government plaza",
    landmark: "Meridia Hall",
  },
  {
    name: "Outer Ring",
    code: "12",
    identity: "BEYOND THE LAST STREETLIGHT",
    description:
      "The city thins into service roads, open land, and distant infrastructure. Meridian has no hard edge.",
    sector: "PERIPHERY",
    terrain: "Highways and outskirts",
    landmark: "Ring Road Interchange",
  },
] as const;

/** Only North Heights is currently open for play; retired districts retain their profiles. */
export const PLAYABLE_DISTRICT_CODE = "05" as const;
export function playableDistrictRoute(code: string): "/north-heights-preview" | null {
  return code === PLAYABLE_DISTRICT_CODE ? "/north-heights-preview" : null;
}
