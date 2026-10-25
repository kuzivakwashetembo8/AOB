/** Canonical South Ward pause-actions and settings shell shared by every GTD district. */
import {Link} from "@tanstack/react-router";
import {ArrowRight,X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {SettingsEditor} from "@/ui/menus/settings-editor";
import type {Settings} from "@/ui/menus/settings-state";

export function GTDSessionPauseActions({onResume,onObjectives,onSettings,onSave,onLocomotion}:{
  onResume:()=>void;onObjectives:()=>void;onSettings:()=>void;
  onSave:()=>void;onLocomotion?:()=>void;
}){
  return <nav className="pause-list" aria-label="Pause actions">
    <Button autoFocus variant="menu" onClick={onResume}>Resume <ArrowRight/></Button>
    <Button variant="menu" asChild><Link to="/world">Map <ArrowRight/></Link></Button>
    <Button variant="menu" onClick={onObjectives}>Objectives <ArrowRight/></Button>
    <Button variant="menu" onClick={onSettings}>Settings <ArrowRight/></Button>
    {onLocomotion&&<Button variant="menu" onClick={onLocomotion}>
      Character locomotion (L1) <ArrowRight/>
    </Button>}
    <Button variant="menu" onClick={onSave}>Save / Load <ArrowRight/></Button>
    <Button variant="menu" asChild><Link to="/">Return to Main Menu <ArrowRight/></Link></Button>
  </nav>;
}

/** The same full-screen pause settings shell AND the same editor at every location.
 * No district-specific modal frame, toolbar or extra settings chrome. */
export function GTDSettingsOverlay({location,settings,onApply,onClose,onBack}:{
  location:string;settings:Settings;onApply:(next:Settings)=>void;
  onClose:()=>void;onBack:()=>void;
}){
  return <div className="overlay" role="dialog" aria-modal="true" aria-label="Settings">
    <div className="overlay-content game-settings-dialog max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center">
        <span className="system-label text-primary">{location} // SESSION PAUSED</span>
        <Button variant="control" aria-label="Close pause menu" onClick={onClose}><X/></Button>
      </div>
      <h1 className="overlay-title">SETTINGS.</h1>
      <SettingsEditor initialSettings={settings} inGame onApply={onApply}/>
      <Button variant="menu" className="mt-3" onClick={onBack}>
        Back to pause menu <ArrowRight/>
      </Button>
    </div>
  </div>;
}
