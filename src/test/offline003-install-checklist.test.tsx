// @vitest-environment jsdom
import {describe,expect,it} from "vitest";
import {render,screen} from "@testing-library/react";
import {OfflineInstallChecklist} from "../ui/menus/offline-install-checklist";
import {
  OFFLINE_CATEGORIES, summarizeOfflineCategories, validateOfflineManifest,
  type OfflineProgress,
} from "../lib/offline-game";
import {vehicleForResource} from "../lib/offline-install-checklist";

const release="d".repeat(40);
const sha="a".repeat(64);
const src=[
  ["/Range%20Rover%20Sports%202018%20(.GLB).glb","range-rover"],
  ["/toyota%20hilux%20002.glb","hilux"],
  ["/Land%20rover%20defender%20001.glb","defender"],
  ["/dodge_HP.glb","dodge"],
  ["/bmw_m4_competition_m_package%20(1).glb","bmw"],
  ["/Lamborghini%2BTemerario.glb","lamborghini"],
] as const;

function makeManifest() {
  const resources=[
    ...Array.from({length:100},(_,i)=>({
      url:"/assets/app-"+i+".js",bytes:10,sha256:sha,group:"app" as const,
    })),
    {url:"/offline001/character/ual.glb",bytes:10,sha256:sha,group:"character" as const},
    {url:"/offline001/draco/draco_decoder_gltf.wasm",bytes:10,sha256:sha,group:"engine" as const},
    {url:"/assets/surfaces/brick/brk-01.webp",bytes:10,sha256:sha,group:"world" as const},
    ...src.map(([url])=>({url,bytes:10,sha256:sha,group:"vehicles" as const})),
    {url:"/wheel001-generated/bmw-m4-competition.glb",bytes:10,sha256:sha,group:"vehicles" as const},
  ];
  return validateOfflineManifest({
    schema:"gtd-offline003-v1",releaseId:release,fileCount:resources.length,
    totalBytes:resources.length*10,resources,
  },release);
}
function makeProgress(overrides:Partial<OfflineProgress>={}):OfflineProgress {
  return {
    phase:"idle",done:0,total:0,bytesDone:0,bytesTotal:0,message:"",
    categories:OFFLINE_CATEGORIES.map(g=>({
      id:g.id,installed:0,total:0,bytesInstalled:0,bytesTotal:0,
    })),
    ...overrides,
  };
}
describe("OFFLINE-003 Settings installation checklist",()=>{
  it("distinguishes the six unique vehicles from individual GLBs",()=>{
    const m=makeManifest();
    const present=new Set(m.resources.map(x=>x.url));
    present.delete("/wheel001-generated/bmw-m4-competition.glb");
    const categories=summarizeOfflineCategories(m,present);
    expect(categories.find(x=>x.id==="vehicles")).toMatchObject({total:6,installed:5});
    present.add("/wheel001-generated/bmw-m4-competition.glb");
    expect(summarizeOfflineCategories(m,present).find(x=>x.id==="vehicles"))
      .toMatchObject({total:6,installed:6});
    expect(vehicleForResource("/Lamborghini%2BTemerario.glb")).toBe("lamborghini");
  });
  it("renders actual partially installed files without a false READY",()=>{
    const m=makeManifest();
    const present=new Set(m.resources.map(x=>x.url).slice(0,52));
    const status=makeProgress({
      phase:"downloading",done:present.size,total:m.fileCount,
      bytesDone:present.size*10,bytesTotal:m.totalBytes,
      categories:summarizeOfflineCategories(m,present),
    });
    render(<OfflineInstallChecklist progress={status} standalone />);
    expect(screen.getByText("GAME INSTALLATION")).toBeVisible();
    expect(screen.getByText("52 / 100")).toBeVisible();
    expect(screen.queryByText("6 / 100")).toBeNull(); // no fabricated counts
    expect(screen.getByText("0 / 6")).toBeVisible();
    expect(screen.getByText("Waiting")).toBeVisible();
  });
  it("keeps offline-play waiting in a browser even if game files are cached",()=>{
    const m=makeManifest();
    const present=new Set(m.resources.map(x=>x.url));
    const status=makeProgress({
      phase:"ready",done:m.fileCount,total:m.fileCount,
      bytesDone:m.totalBytes,bytesTotal:m.totalBytes,
      categories:summarizeOfflineCategories(m,present),
    });
    const view=render(<OfflineInstallChecklist progress={status} standalone={false}/>);
    expect(screen.getByText("Not confirmed")).toBeVisible();
    expect(screen.getByText("Waiting")).toBeVisible();
    view.rerender(<OfflineInstallChecklist progress={status} standalone />);
    expect(screen.getByText("READY")).toBeVisible();
  });
});
