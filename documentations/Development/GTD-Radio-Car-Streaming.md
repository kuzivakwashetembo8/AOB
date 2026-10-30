
# G.T.D — Live South African Radio System

## Comprehensive Technical Implementation Plan

**Plan ID:** GTD-RADIO-001  
**Project:** Grand Theft Division (G.T.D)  
**Target environment:** North Heights, Meridia  
**Technology:** TypeScript, HTML5 Audio, Babylon.js integration  
**Initial coverage:** South African radio stations  
**Status:** PROPOSED — AWAITING APPROVAL  
**Date:** 30 October 2026

### 1. Executive summary

We will introduce a real-world radio system into G.T.D, allowing Voight to listen to live South African radio broadcasts while driving vehicles throughout North Heights.

The objective is to reproduce the familiar experience of entering a vehicle in Grand Theft Auto and hearing its radio, with one significant distinction: **G.T.D will play actual broadcasts from South African radio stations rather than prerecorded music.**

The implementation will prioritize four requirements:

1.  Authentic live radio broadcasts.
2.  Seamless integration with the existing vehicle-entry system.
3.  Minimal impact on game performance.
4.  Reliable operation on desktop browsers and Android PWAs.

The radio will be controlled entirely through TypeScript. It will not require Supabase, user authentication, a dedicated audio server, or additional game physics.

The initial release will target five South African stations, subject to technical validation and broadcaster permissions.

**Implementation boundary:** This document is a proposal. No repository modifications, branch creation, commits, or deployments are authorized at this stage.

----------

## 2. System objectives

### 2.1 Primary objective

Enable live radio playback when Voight enters a vehicle.

The radio should behave like an integrated vehicle feature rather than an external music player.

### 2.2 Functional requirements

ID

Requirement

Priority

RAD-001

Automatically activate radio on vehicle entry

Critical

RAD-002

Stream live South African broadcasts

Critical

RAD-003

Support five radio stations initially

Critical

RAD-004

Switch between stations

Critical

RAD-005

Turn radio ON/OFF

Critical

RAD-006

Stop playback on vehicle exit

Critical

RAD-007

Remember the last selected station

High

RAD-008

Provide radio volume adjustment

High

RAD-009

Handle internet disconnections

Critical

RAD-010

Support Android PWA playback

Critical

RAD-011

Avoid interfering with engine sounds

Critical

RAD-012

Support future international expansion

Medium

### 2.3 Nonfunctional requirements

The radio must not:

-   Interrupt Babylon.js rendering.
-   Modify Rapier physics.
-   Introduce additional vehicle meshes.
-   Create a separate audio player for every car.
-   Trigger unnecessary game re-renders.
-   Require players to download music libraries.
-   Prevent the game from loading when radio services are unavailable.
-   Interfere with existing driving controls.

**Performance principle:** Radio is an independent media subsystem. Its failure must never become a gameplay failure.

----------

## 3. South African radio station selection

We will begin with five stations representing different listening preferences.

### Proposed initial lineup

Preset

Station

Programming

01

Metro FM

Urban music and entertainment

02

5FM

Contemporary music

03

947

Contemporary hits and entertainment

04

702

News and talk radio

05

Ukhozi FM

IsiZulu programming

This is a proposed lineup, not a verified list of embeddable streams.

For example, confirms that the broadcaster offers internet listening. However, the existence of a public player does not establish permission to embed its stream in G.T.D.

### Station discovery

We can use the to discover South African stations.

Its documented interface supports filtering by country code and exposes resolved streaming URLs.

Example discovery endpoint:

```typescript
const DIRECTORY_ENDPOINT =
  "https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/ZA";

```

This is an illustrative endpoint; the production implementation should use a currently available API server.

The API is only required for station discovery.

Once a playable streaming URL has been validated, the browser can connect directly to that broadcaster.

**Important distinction:** A radio directory listing is not proof that a stream is operational, browser-compatible, or authorized for embedding.

### Station admission criteria

A station will be accepted only after:

1.  Its official identity is verified.
2.  Its stream endpoint is identified.
3.  HTTPS playback is confirmed.
4.  Desktop playback succeeds.
5.  Android playback succeeds.
6.  Stream reliability is assessed.
7.  Redistribution and embedding permissions are reviewed.

If any proposed station fails, we will substitute another South African broadcaster rather than compromise the system.

----------

## 4. Technical architecture

### 4.1 High-level design

```text
                  G.T.D GAME
                      |
               Vehicle Events
                      |
           Vehicle Radio Manager
                      |
       +--------------+--------------+
       |              |              |
   Station         Playback       Preferences
   Registry         Engine          Storage
       |              |              |
   South African   HTMLAudioElement  localStorage
   Stations            |
                      |
                HTTPS Audio
                      |
               Live Broadcaster

```

The system will have one authoritative radio controller.

All vehicles will share that controller.

When Voight changes vehicles, the controller will retain his selected station.

### 4.2 Proposed TypeScript modules

```text
src/
  game/
    audio/
      radio/
        radio-types.ts
        radio-stations.ts
        radio-controller.ts
        radio-persistence.ts
        radio-events.ts
        radio-health.ts

    ui/
      radio/
        radio-controls.tsx
        radio-indicator.tsx

```

These paths are proposed, not confirmed repository locations. Before implementation, we must inspect the current audio, vehicle-entry, UI, and persistence architecture and adapt accordingly.

### 4.3 Station data model

```typescript
export interface RadioStation {
  id: string;
  name: string;
  country: "ZA";
  genre: string;
  language?: string;

  streamUrl: string;
  homepage?: string;

  enabled: boolean;
}

```

The station registry will initially contain five curated entries.

We will not query the full South African station directory whenever Voight enters a car.

That would create unnecessary network activity and introduce an external dependency into a frequent gameplay event.

Instead, station discovery and validation will be separate from playback.

----------

## 5. Vehicle-entry integration

This is the most important integration point.

G.T.D already has a functioning universal vehicle-entry system for North Heights.

The radio must attach to that existing mechanism.

### 5.1 Vehicle entry

Proposed event:

```typescript
type VehicleRadioEvent =
  | { type: "VEHICLE_ENTERED"; vehicleId: string }
  | { type: "VEHICLE_EXITED"; vehicleId: string }
  | { type: "RADIO_NEXT_STATION" }
  | { type: "RADIO_PREVIOUS_STATION" }
  | { type: "RADIO_TOGGLE" };

```

When Voight enters a vehicle:

```typescript
function onVehicleEntered(vehicleId: string) {
  radioController.onVehicleEntered(vehicleId);
}

```

The radio controller will:

1.  Confirm that Voight is now driving.
2.  Read the selected station.
3.  Check whether radio is enabled.
4.  Initiate playback.
5.  Update the radio interface.

Vehicle movement will continue regardless of whether streaming succeeds.

### 5.2 Vehicle exit

When Voight exits:

```typescript
function onVehicleExited(vehicleId: string) {
  radioController.onVehicleExited(vehicleId);
}

```

The controller will fade the audio out and release the active stream connection.

**Proposed fade duration:** 300 milliseconds.

### 5.3 Switching vehicles

Example:

Voight drives Sedan A while listening to Metro FM.

He exits Sedan A.

The radio fades out.

He enters Sedan B.

Metro FM reconnects to its current live broadcast.

The system will not attempt to resume the earlier audio position.

That would be inappropriate for live radio.

### 5.4 Playback policy

For the initial release, radio will be audible only while Voight occupies a vehicle.

We will not implement external sound propagation from parked vehicles yet.

That feature would require additional spatial audio and vehicle-specific sound sources.

----------

## 6. Radio playback engine

### 6.1 Technology selection

**Primary engine: HTMLAudioElement**

This is preferable to implementing a custom decoder or building an elaborate Web Audio graph.

The browser already handles:

-   Audio decoding.
-   Network buffering.
-   Playback.
-   Volume control.
-   Media errors.

The provides the underlying browser interface.

### 6.2 Proposed controller

```typescript
type RadioStatus =
  | "off"
  | "connecting"
  | "playing"
  | "buffering"
  | "error";

class RadioController {
  private audio = new Audio();

  private status: RadioStatus = "off";

  private station: RadioStation | null = null;

  private inVehicle = false;

  private enabled = true;

  async tune(station: RadioStation): Promise<void> {
    this.station = station;

    if (!this.inVehicle || !this.enabled) {
      return;
    }

    this.audio.pause();
    this.audio.src = station.streamUrl;

    this.status = "connecting";

    try {
      await this.audio.play();

      this.status = "playing";
    } catch (error) {
      this.status = "error";
      console.error("Radio playback failed", error);
    }
  }

  async onVehicleEntered(
    _vehicleId: string
  ): Promise<void> {
    this.inVehicle = true;

    if (this.station && this.enabled) {
      await this.tune(this.station);
    }
  }

  onVehicleExited(_vehicleId: string): void {
    this.inVehicle = false;

    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();

    this.status = "off";
  }
}

```

This is an architectural example, not production-ready code.

The implementation must additionally handle cancellation, overlapping playback requests, fades, browser restrictions, and stream failures.

### 6.3 Concurrency protection

A specific failure mode requires attention.

Suppose Voight:

1.  Enters a vehicle.
2.  Selects Metro FM.
3.  Immediately switches to 5FM.
4.  Exits before the connection finishes.

An earlier asynchronous playback request could complete after a newer request.

The implementation must use a request-generation token or equivalent cancellation mechanism.

Only the latest valid request may update playback state.

**Acceptance requirement:** Rapid station switching must never produce simultaneous streams or restart radio after vehicle exit.

----------

## 7. Radio user interface

The interface must remain consistent with G.T.D's established control standards.

We will not introduce a large music player overlay that obstructs the road.

### 7.1 Desktop

When Voight enters a vehicle, a compact radio indicator becomes available.

Example:

```text
┌───────────────────────────┐
│ 📻 METRO FM          LIVE │
│                           │
│  ◀       OFF        ▶     │
└───────────────────────────┘

```

The radio interface will expose three primary actions:

-   Previous station.
-   Radio ON/OFF.
-   Next station.

Volume will be configured through the existing game settings.

### 7.2 Mobile

Mobile controls must be touch-friendly and must not overlap existing steering, acceleration, braking, or camera interactions.

The radio interface should remain compact and dismissible.

Its placement will be determined after inspecting the current three-column action grid and mobile HUD.

### 7.3 Radio states

State

Interface

Connecting

Station name + connecting indicator

Playing

Station name + LIVE

Buffering

Station name + buffering indicator

Offline

RADIO UNAVAILABLE

Disabled

RADIO OFF

Stream failure

STATION UNAVAILABLE

No permanent error modal should interrupt driving.

### 7.4 User interaction restrictions

Browser autoplay restrictions are relevant even when playback is initiated through TypeScript.

The browser may reject `audio.play()` with `NotAllowedError`. G.T.D must display a play control rather than repeatedly attempting blocked playback.

We will test whether the existing vehicle-entry interaction provides sufficient user activation on supported browsers.

----------

## 8. Audio integration and sound mixing

G.T.D already has vehicle sound requirements involving engine acceleration, braking, tires, and horns.

The radio must coexist with these sounds without replacing or interrupting them.

### 8.1 Audio channels

We propose three logical audio categories:

Channel

Audio

Independent volume

Vehicle

Engine, braking, tires, horn

Yes

Environment

Weather, footsteps, ambient sounds

Yes

Radio

Live broadcaster audio

Yes

The radio controller must never take ownership of the vehicle audio controller.

### 8.2 Volume configuration

Proposed initial settings:

```typescript
interface GameAudioSettings {
  masterVolume: number;
  vehicleVolume: number;
  environmentVolume: number;
  radioVolume: number;
}

```

All values will range from `0` to `1`.

The effective radio volume will be:

```typescript
const effectiveRadioVolume =
  settings.masterVolume *
  settings.radioVolume;

```

Existing settings should be extended rather than duplicated.

### 8.3 Initial sound characteristics

For the first release, radio will use ordinary stereo playback.

We will not introduce:

-   Artificial signal interference.
-   Engine-speed-dependent distortion.
-   Simulated FM frequencies.
-   Three-dimensional speaker positioning.
-   Audio occlusion through vehicle windows.

These effects could improve realism later, but they introduce complexity without being necessary for functional live radio.

**Priority: Establish reliable live playback before simulating radio acoustics.**

----------

## 9. Network management and streaming reliability

Live radio differs from conventional game audio because it depends on an external broadcaster.

The broadcaster may interrupt service, change its stream endpoint, restrict access, or experience network congestion.

G.T.D must handle these conditions gracefully.

### 9.1 Connection lifecycle

```text
Vehicle Entry
      |
      v
Radio Enabled?
   /       \
  No       Yes
  |         |
  v         v
 OFF    CONNECTING
             |
        +----+----+
        |         |
      SUCCESS    FAILURE
        |         |
        v         v
     PLAYING     ERROR
        |         |
     BUFFERING  RETRY
        |         |
        +----+----+
             |
        Vehicle Exit
             |
             v
         DISCONNECT

```

### 9.2 Reconnection strategy

Recommended initial policy:

Attempt

Delay

First

2 seconds

Second

5 seconds

Third

10 seconds

Fourth

Stop automatic retries

Retries must stop immediately when Voight exits the vehicle, turns the radio off, or changes stations.

A stream that repeatedly fails should be marked unavailable for the current session until the player explicitly retries or the station is reselected.

### 9.3 Network interruptions

If the device loses internet connectivity:

1.  Existing gameplay continues.
2.  Radio enters an unavailable state.
3.  No blocking error dialog appears.
4.  Reconnection is attempted when appropriate.
5.  The selected station remains unchanged.

The radio must not force a game reload.

### 9.4 Stream compatibility

The first implementation should prioritize browser-compatible HTTPS MP3 and AAC streams.

Some stations use HLS, playlist redirects, or streaming protocols requiring additional processing.

Those stations should be excluded from the initial implementation unless they work through the native browser audio element.

We will not add a heavyweight streaming library solely to support one station.

### 9.5 Data consumption

Live radio consumes mobile data continuously.

Illustrative consumption rates:

Stream bitrate

Approximate data per hour

64 kbps

29 MB

96 kbps

43 MB

128 kbps

58 MB

192 kbps

86 MB

These estimates exclude protocol overhead.

For Android users, a 128 kbps radio stream could consume approximately 580 MB over ten hours.

We should therefore expose a radio preference allowing users to disable automatic playback.

----------

## 10. Persistence

The radio should remember the player's preferences between sessions.

### 10.1 Stored preferences

```typescript
interface RadioPreferences {
  enabled: boolean;
  selectedStationId: string;
  volume: number;
}

```

Example:

```typescript
const DEFAULT_RADIO_PREFERENCES: RadioPreferences = {
  enabled: true,
  selectedStationId: "metro-fm",
  volume: 0.5,
};

```

The default station ID must correspond to an admitted station. If Metro FM is not approved or technically compatible, another validated station will be selected.

### 10.2 Storage mechanism

For the initial implementation, browser `localStorage` is sufficient.

The preferences contain no sensitive information and require no server synchronization.

Example storage key:

```typescript
const RADIO_STORAGE_KEY = "gtd.radio.preferences.v1";

```

Persistence must survive:

-   Page refreshes.
-   Closing and reopening the browser.
-   Restarting the Android PWA.
-   Switching between supported game districts.

Radio preferences should be independent of vehicle identity.

### 10.3 Relationship to existing save/resume

G.T.D already has local game-state persistence requirements.

Before implementation, we must inspect the current persistence architecture to determine whether the radio should use its existing settings store.

We should avoid introducing competing storage mechanisms where the game already provides an appropriate abstraction.

----------

## 11. Android PWA requirements

Android is a primary acceptance platform for G.T.D.

The radio must therefore be designed for mobile browsers rather than treated as a desktop feature that happens to run on mobile.

### 11.1 Required behavior

Scenario

Expected result

Enter vehicle

Radio attempts playback

Switch stations

Previous stream stops

Exit vehicle

Radio fades out

Pause game

Radio pauses

Resume game

Radio reconnects if appropriate

Minimize PWA

Radio pauses

Return to PWA

Radio restores according to gameplay state

Lose internet

Gameplay continues

Restore internet

Radio can reconnect

Close PWA

Radio stops

### 11.2 Background playback

**Decision proposed: Disable background radio playback.**

G.T.D is a game, not a dedicated radio application.

If the player minimizes the PWA, the radio should not continue consuming mobile data unnecessarily.

This behavior should be coordinated with the game's existing pause and visibility handling.

### 11.3 Service worker behavior

The PWA service worker must not cache live audio streams.

Radio streams should bypass offline asset caching.

The offline game should remain playable without attempting to retrieve radio audio.

We should also ensure that adding radio functionality does not increase the existing game's initial asset download.

----------

## 12. Performance engineering

G.T.D has previously experienced performance degradation from excessive vehicle assets, high scene complexity, and inefficient rendering.

The radio subsystem must not repeat these problems.

### 12.1 Resource allocation

Resource

Design

Audio players

One active player

Active streams

Maximum one

Additional GLBs

Zero

Additional physics bodies

Zero

Additional render loops

Zero

Station metadata

Small static configuration

Stream audio

Downloaded incrementally

Supabase dependency

None

Continuous station polling

None

### 12.2 Main-thread considerations

HTML5 Audio handles media playback through browser-managed facilities.

The implementation should not decode radio streams manually through JavaScript.

React or other UI components should subscribe to meaningful radio state changes rather than continuously polling the player.

### 12.3 Performance acceptance

The radio will be considered performant when:

1.  It does not introduce observable gameplay stuttering.
2.  Station changes do not freeze the interface.
3.  Vehicle acceleration and steering remain responsive.
4.  Only one stream is active.
5.  Radio remains functional during extended driving.
6.  Repeated vehicle entry and exit do not cause accumulating resource usage.

We will compare radio-enabled and radio-disabled sessions using the same gameplay route and device.

A useful quantitative target is less than a 3% sustained change in median frame time, with no material regression in frame-time spikes. This is a proposed acceptance threshold, not a measured result.

----------

## 13. Security, privacy, and licensing

This section is essential because G.T.D would be integrating third-party broadcasts into a publicly accessible game.

### 13.1 Stream security

Only approved HTTPS endpoints should be used.

The implementation must not allow arbitrary untrusted URLs to be inserted into the player through gameplay inputs.

We should maintain a curated station registry.

### 13.2 Privacy

Direct streaming exposes the player's network address and ordinary request metadata to the broadcaster or its streaming provider.

This is a consequence of direct media connections.

We should disclose this behavior in the game's privacy information before public release.

### 13.3 Licensing and broadcaster permissions

A publicly accessible radio stream is not necessarily licensed for incorporation into a third-party game.

The following distinctions matter:

-   Public listening access.
-   Permission to embed the stream.
-   Permission to redistribute the broadcast.
-   Rights associated with copyrighted music and programming.

For the initial preview, we should use streams whose terms permit the intended integration or obtain appropriate authorization.

We should not assume that a stream appearing in Radio Browser establishes those rights.

### 13.4 No audio redistribution

The proposed architecture does not involve:

-   Recording broadcasts.
-   Hosting copies of music.
-   Downloading complete programs.
-   Rebroadcasting audio through G.T.D servers.

The browser connects to the broadcaster's authorized endpoint.

This minimizes infrastructure requirements, but does not eliminate the need to assess embedding rights.

----------

# 14. Implementation stages

I recommend six sequential stages, each with an explicit acceptance gate.

All stages should occur on **one dedicated feature branch**, avoiding unnecessary branch proliferation.

## Stage 1 — Repository inspection and integration mapping

**Objective:** Establish the actual implementation baseline.

Tasks:

1.  Inspect the latest G.T.D main branch.
2.  Locate the universal vehicle-entry implementation.
3.  Identify vehicle-entry and vehicle-exit events.
4.  Inspect the existing audio architecture.
5.  Identify current settings persistence.
6.  Inspect desktop and mobile HUD controls.
7.  Inspect Android PWA lifecycle handling.
8.  Identify relevant performance diagnostics.
9.  Confirm the correct North Heights integration points.

Deliverable: Verified integration map and implementation-specific file list.

**Acceptance:** No proposed integration should require replacing working vehicle controls.

## Stage 2 — Station validation

**Objective:** Establish five working South African radio streams.

Tasks:

1.  Identify candidate broadcaster streams.
2.  Verify broadcaster identity.
3.  Validate HTTPS endpoints.
4.  Confirm supported audio formats.
5.  Test playback on desktop.
6.  Test playback on Android.
7.  Review permissions.
8.  Create the station registry.

Deliverable: Five approved stations with validated stream endpoints.

**Acceptance:** Each station can independently play live audio on the target platforms.

## Stage 3 — Radio controller

**Objective:** Implement the underlying playback engine.

Tasks:

1.  Create the radio types.
2.  Implement the station registry.
3.  Implement the shared audio player.
4.  Implement station switching.
5.  Implement ON/OFF behavior.
6.  Implement volume control.
7.  Implement connection-state reporting.
8.  Implement retry handling.
9.  Implement asynchronous request cancellation.
10.  Implement resource cleanup.

Deliverable: A functioning radio controller independent of gameplay.

**Acceptance:** One stream at a time, reliable station switching, and no leaked playback sessions.

## Stage 4 — Vehicle integration

**Objective:** Connect radio to existing driving mechanics.

Tasks:

1.  Subscribe to vehicle-entry events.
2.  Subscribe to vehicle-exit events.
3.  Activate radio on entry.
4.  Fade out radio on exit.
5.  Preserve selected station across vehicles.
6.  Respect game pause state.
7.  Respect browser visibility state.
8.  Prevent duplicate event subscriptions.
9.  Test repeated entry and exit.

Deliverable: Functional in-vehicle radio.

**Acceptance:** Radio follows Voight's vehicle occupancy without affecting driving.

## Stage 5 — User interface and persistence

**Objective:** Make radio accessible without compromising gameplay controls.

Tasks:

1.  Add compact station indicator.
2.  Add previous-station control.
3.  Add next-station control.
4.  Add ON/OFF control.
5.  Add radio volume setting.
6.  Persist radio preferences.
7.  Integrate with existing settings.
8.  Test desktop layout.
9.  Test mobile landscape layout.
10.  Test accessibility and touch interactions.

Deliverable: Complete radio interaction interface.

**Acceptance:** Radio controls remain usable without obstructing driving controls.

## Stage 6 — Performance testing and preview

**Objective:** Validate the complete system before merging.

Testing will cover:

Test

Acceptance

Vehicle entry

Radio activates

Vehicle exit

Radio stops

Station switching

Correct broadcast plays

Radio OFF

No active audio stream

Volume adjustment

Correct output level

Refresh

Preferences persist

Internet loss

No gameplay interruption

Internet recovery

Radio can reconnect

Android PWA

Playback works

Desktop browser

Playback works

Extended driving

Stable audio and gameplay

Repeated entry/exit

No resource accumulation

Rapid station switching

No overlapping broadcasts

Game pause

Radio pauses

Game resume

Radio resumes appropriately

The final deliverable will be a working North Heights preview.

**Acceptance authority:** User review.

No merge or production deployment should occur until the preview is explicitly accepted.

----------

## 15. Failure-mode analysis

Failure

Consequence

Mitigation

Station offline

No broadcast

Show unavailable state

Autoplay blocked

Radio silent

Provide explicit play control

Network interruption

Buffering

Bounded reconnection

Unsupported codec

Playback failure

Exclude incompatible streams

Station URL changes

Broken preset

Update curated registry

Rapid station switching

Race conditions

Request-generation protection

Vehicle exit during connection

Late playback

Cancel pending activation

PWA minimized

Unwanted data usage

Pause and disconnect

Duplicate event listeners

Repeated playback requests

Centralized lifecycle ownership

Stream restrictions

Station unavailable

Substitute approved station

Radio controller error

Possible audio malfunction

Isolate failure from gameplay

The critical architectural rule is that **radio failure must never interfere with vehicle operation**.

----------

## 16. Scope exclusions

To keep the first implementation controlled, the following features are excluded:

-   International radio stations.
-   AI-generated radio presenters.
-   Custom G.T.D radio stations.
-   Recorded music playlists.
-   Radio advertisements generated by the game.
-   Vehicle-specific speaker configurations.
-   Radio audible from outside vehicles.
-   Simulated frequency interference.
-   Music identification.
-   Recording or downloading broadcasts.
-   Streaming through Supabase.
-   Background audio playback when the PWA is minimized.

These can be evaluated after the live radio foundation is accepted.

----------

## 17. Proposed branch and documentation

After approval, the implementation should begin from the latest verified main branch.

**Proposed branch:**

```text
feature/gtd-live-radio-001-20261030

```

**Proposed documentation:**

```text
documentations/
  Development/
    GTD-RADIO-001-
    South-African-Live-Radio-
    Technical-Implementation-Plan.md

```

The documentation should record:

-   Architecture.
-   Verified integration points.
-   Station registry.
-   Stream compatibility.
-   Permissions review.
-   Playback lifecycle.
-   Test results.
-   Known limitations.
-   Preview acceptance.
-   Final merge information.

The implementation should preserve G.T.D's existing documentation conventions after they have been inspected.

----------

# 18. Final implementation recommendation

The initial architecture should remain deliberately simple.

Decision

Recommendation

Radio technology

HTML5 Audio

Language

TypeScript

Initial region

South Africa

Initial stations

Five

Station discovery

Radio Browser / official broadcaster sources

Playback

Direct authorized HTTPS streams

Backend

None

Database

None

Audio instances

One

Activation

Vehicle entry

Deactivation

Vehicle exit

Preferences

Existing local settings infrastructure

Primary test environment

North Heights

Mobile support

Android landscape PWA

Implementation strategy

Six sequential stages

Deployment strategy

Preview → acceptance → merge → deploy

### Expected result

Voight enters a Sedan in North Heights.

The vehicle engine starts.

The radio connects to a real South African broadcaster.

A presenter is speaking live, or music is playing.

Voight drives through Meridia while listening.

He changes stations using the in-game controls.

The broadcast switches.

He exits the vehicle.

The radio fades out.

He enters another vehicle and reconnects to the same station.

All of this happens without downloading music assets, introducing additional vehicle geometry, or interfering with existing driving physics.

----------

## Approval gate

**GTD-RADIO-001 is ready for architectural approval, subject to repository inspection and station validation during implementation.**

No code has been changed, no branch has been created, and no deployment has been initiated.

Upon approval, the first authorized action will be to inspect the latest G.T.D main branch, establish the integration baseline, and begin Stage 1.

**Status: AWAITING APPROVAL.**
