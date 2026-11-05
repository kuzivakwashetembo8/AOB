/** GTD-NH-ATM-022: principal cloud genera and economical renderer parameters. */
export const CLOUD_GENERA_022=[
 "Cirrus","Cirrostratus","Cirrocumulus","Altostratus","Altocumulus",
 "Stratus","Stratocumulus","Nimbostratus","Cumulus","Cumulonimbus",
] as const;
export type CloudGenus022=typeof CLOUD_GENERA_022[number];
export type CloudChoice022="Auto"|"Mixed"|CloudGenus022;
export type WeatherCondition022="Clear"|"Partly Cloudy"|"Overcast"|"Rain"|"Thunderstorm";
export type WeatherMode022="Auto"|"Manual";
export type CloudShape022="wisps"|"veil"|"granules"|"sheet"|"islands"|"low-sheet"|"rolls"|"rain"|"puffs"|"storm";
export type CloudPreset022={shape:CloudShape022;scale:number;stretch:number;coverage:number;contrast:number;drift:number;detail:number;label:string};
export const CLOUD_PRESETS_022:Record<CloudGenus022,CloudPreset022>={
 Cirrus:{shape:"wisps",scale:8.6,stretch:4.8,coverage:.22,contrast:.78,drift:.006,detail:4,label:"High feather-like wisps"},
 Cirrostratus:{shape:"veil",scale:5.5,stretch:3.5,coverage:.49,contrast:.48,drift:.0038,detail:4,label:"Fine translucent fibratus veil"},
 Cirrocumulus:{shape:"granules",scale:14,stretch:1.3,coverage:.36,contrast:.76,drift:.004,detail:3,label:"Tiny high ripple cells"},
 Altostratus:{shape:"sheet",scale:3.8,stretch:1.5,coverage:.68,contrast:.42,drift:.0025,detail:3,label:"Broad mid-level sheet"},
 Altocumulus:{shape:"islands",scale:7.7,stretch:1.1,coverage:.50,contrast:.7,drift:.004,detail:4,label:"Mid-level rounded groups"},
 Stratus:{shape:"low-sheet",scale:2.6,stretch:1.5,coverage:.82,contrast:.35,drift:.0021,detail:3,label:"Low soft continuous cover"},
 Stratocumulus:{shape:"rolls",scale:5.2,stretch:1.3,coverage:.60,contrast:.63,drift:.003,detail:4,label:"Large irregular rolls and gaps"},
 Nimbostratus:{shape:"rain",scale:2.5,stretch:1.5,coverage:.94,contrast:.40,drift:.0019,detail:3,label:"Deep rain-bearing overcast"},
 Cumulus:{shape:"puffs",scale:6.0,stretch:1.0,coverage:.48,contrast:.83,drift:.003,detail:4,label:"Separated puffy towers"},
 Cumulonimbus:{shape:"storm",scale:3.3,stretch:1.25,coverage:.85,contrast:.72,drift:.0023,detail:4,label:"Dark convective anvil mass"},
};
export const CONDITIONS_022:readonly WeatherCondition022[]=[
 "Clear","Partly Cloudy","Overcast","Rain","Thunderstorm"
];
export function isCloudGenus022(value:unknown):value is CloudGenus022{
 return typeof value==="string"&&CLOUD_GENERA_022.some(g=>g===value);
}
export function isWeatherCondition022(value:unknown):value is WeatherCondition022{
 return typeof value==="string"&&CONDITIONS_022.some(c=>c===value);
}
export function cloudCandidates022(condition:WeatherCondition022):readonly CloudGenus022[]{
 switch(condition){
  case "Clear":return ["Cirrus","Cirrostratus","Cirrocumulus"];
  case "Partly Cloudy":return ["Cumulus","Stratocumulus","Altocumulus","Cirrostratus","Cirrus"];
  case "Overcast":return ["Altostratus","Stratus","Stratocumulus","Nimbostratus"];
  case "Rain":return ["Nimbostratus","Altostratus","Stratus"];
  case "Thunderstorm":return ["Cumulonimbus","Stratocumulus","Altostratus"];
 }
}
export function cloudCoverForCondition022(condition:WeatherCondition022):number{
 switch(condition){case "Clear":return .16;case "Partly Cloudy":return .48;case "Overcast":return .79;case "Rain":return .91;case "Thunderstorm":return .94;}
}
