import { JobOperationalDetails } from '../types';

export type OperationalFieldType = 'text' | 'time' | 'locationList' | 'contactList' | 'checkpointList' | 'customList';

export interface OperationalScalarFieldDef {
  key: keyof JobOperationalDetails;
  label: string;
  hint?: string;
  placeholder?: string;
  type: 'text' | 'time';
  rows?: number;
}

export interface OperationalListFieldDef {
  key: keyof JobOperationalDetails;
  label: string;
  hint?: string;
  placeholder?: string;
  addLabel: string;
  type: 'locationList' | 'contactList' | 'checkpointList' | 'customList';
}

export interface OperationalFieldSection {
  id: string;
  title: string;
  description: string;
  defaultOpen?: boolean;
  fields: OperationalScalarFieldDef[];
  lists?: OperationalListFieldDef[];
}

export const OPERATIONAL_FIELD_SECTIONS: OperationalFieldSection[] = [
  {
    id: 'venue-site',
    title: 'Venue & site layout',
    description: 'Building layout, zones, entrances, exits, and capacity by area.',
    defaultOpen: true,
    fields: [
      { key: 'venueType', label: 'Venue type', placeholder: 'e.g. Nightclub, arena, corporate campus, construction site', type: 'text', rows: 1 },
      { key: 'venueCapacity', label: 'Licensed / max capacity', placeholder: 'e.g. 1,200 standing, 800 seated', type: 'text', rows: 1 },
      { key: 'patronHeadCount', label: 'Expected patron / guest count', placeholder: 'e.g. 500 guests tonight, 21+ only', type: 'text', rows: 1 },
      { key: 'indoorOutdoorSplit', label: 'Indoor / outdoor split', placeholder: 'Which areas are in use, weather contingencies...', type: 'text', rows: 2 },
      { key: 'floorPlanNotes', label: 'Floor plan & zone map notes', placeholder: 'North hall, mezzanine, patio zones — attach map separately if needed', type: 'text', rows: 3 },
      { key: 'zoneDefinitions', label: 'Zone definitions', placeholder: 'GA floor, VIP balcony, staff-only corridors...', type: 'text', rows: 3 },
      { key: 'seatingLayout', label: 'Seating / table layout', placeholder: 'Reserved tables, GA standing, festival seating...', type: 'text', rows: 2 },
      { key: 'stageLocation', label: 'Stage / production area', placeholder: 'Main stage, DJ booth, runway, speaker stack zones...', type: 'text', rows: 2 },
      { key: 'mainEntranceDetails', label: 'Main entrance', placeholder: 'Primary guest entry, queue layout, ADA entrance...', type: 'text', rows: 2 },
      { key: 'secondaryEntrances', label: 'Secondary entrances', placeholder: 'Side doors, artist entrance, staff doors...', type: 'text', rows: 2 },
      { key: 'exitDoors', label: 'Exit doors', placeholder: 'All public exits, which stay unlocked, alarmed doors...', type: 'text', rows: 2 },
      { key: 'emergencyExits', label: 'Emergency exits', placeholder: 'Locations, must stay clear, push-bar only...', type: 'text', rows: 2 },
      { key: 'elevatorLocations', label: 'Elevators & lifts', placeholder: 'Guest elevators, freight, accessibility lifts...', type: 'text', rows: 2 },
      { key: 'stairwellLocations', label: 'Stairwells', placeholder: 'Internal stairs, fire stairs, roof access stairs...', type: 'text', rows: 2 },
      { key: 'roofAccess', label: 'Roof access', placeholder: 'Who has keys, escort required, HVAC units...', type: 'text', rows: 2 },
      { key: 'basementAccess', label: 'Basement / sub-level access', placeholder: 'Storage, mechanical, restricted levels...', type: 'text', rows: 2 },
      { key: 'loadingDockDetails', label: 'Loading dock & freight', placeholder: 'Dock hours, escorts, vehicle search at dock...', type: 'text', rows: 2 },
      { key: 'dumpsterAreas', label: 'Dumpster / refuse areas', placeholder: 'Enclosure locations, compactor keys, patrol notes...', type: 'text', rows: 2 },
      { key: 'postAssignment', label: 'Default post / assignment', placeholder: 'e.g. Main entrance, VIP lane, perimeter rover', type: 'text', rows: 1 },
    ],
  },
  {
    id: 'schedule-doors',
    title: 'Schedule & doors',
    description: 'Show times, door schedule, curfew, and key operational hours.',
    fields: [
      { key: 'doorsOpenTime', label: 'Doors open', type: 'time' },
      { key: 'doorsCloseTime', label: 'Doors close (last entry)', type: 'time' },
      { key: 'curfewTime', label: 'Curfew / hard out', type: 'time' },
      { key: 'showStartTime', label: 'Show / event start', type: 'time' },
      { key: 'showEndTime', label: 'Show / event end', type: 'time' },
      { key: 'soundcheckSchedule', label: 'Soundcheck / load-in schedule', placeholder: 'Artist load-in windows, soundcheck times...', type: 'text', rows: 2 },
      { key: 'vendorLoadInDetails', label: 'Vendor load-in / load-out', placeholder: 'Dock schedule, escorts, vehicle search policy...', type: 'text', rows: 3 },
      { key: 'shiftBriefingTime', label: 'Guard shift briefing time', type: 'time' },
      { key: 'shiftBriefingLocation', label: 'Shift briefing location', placeholder: 'Where guards meet before post', type: 'text', rows: 1 },
      { key: 'kitchenCloseTime', label: 'Kitchen / food service close', type: 'time' },
      { key: 'cleanupProcedure', label: 'Cleanup procedure', placeholder: 'When guests must leave floor, cleaning crew access...', type: 'text', rows: 2 },
      { key: 'lockupProcedure', label: 'Lockup procedure', placeholder: 'Final walkthrough, who locks which doors...', type: 'text', rows: 3 },
      { key: 'finalWalkthroughChecklist', label: 'Final walkthrough checklist', placeholder: 'Empty rooms, alarms, lights, HVAC...', type: 'text', rows: 3 },
      { key: 'alarmArmingProcedure', label: 'Alarm arming procedure', placeholder: 'Who arms, codes, delay zones...', type: 'text', rows: 2 },
      { key: 'lightsHvacShutdown', label: 'Lights & HVAC shutdown', placeholder: 'What stays on overnight, who controls...', type: 'text', rows: 2 },
    ],
  },
  {
    id: 'perimeter-tech',
    title: 'Perimeter & technology',
    description: 'Fence line, blind spots, cameras, alarms, and lighting.',
    fields: [
      { key: 'perimeterDescription', label: 'Perimeter description', placeholder: 'Fence type, gates, adjoining properties...', type: 'text', rows: 3 },
      { key: 'blindSpots', label: 'Blind spots & weak points', placeholder: 'Areas needing extra patrol or lighting...', type: 'text', rows: 2 },
      { key: 'climbPoints', label: 'Climb / breach points', placeholder: 'Walls, dumpsters, balconies, roof access risks...', type: 'text', rows: 2 },
      { key: 'fenceGates', label: 'Fence gates', placeholder: 'Which gates stay locked, padlock codes, chains...', type: 'text', rows: 2 },
      { key: 'vehicleBarriers', label: 'Vehicle barriers', placeholder: 'Bollards, planters, wedge barriers, removable posts...', type: 'text', rows: 2 },
      { key: 'bollardLocations', label: 'Bollard / barrier locations', placeholder: 'Map landmarks for each barrier', type: 'text', rows: 2 },
      { key: 'securityLighting', label: 'Security lighting', placeholder: 'Lot lights, pathway lights, dark areas to watch...', type: 'text', rows: 2 },
      { key: 'cctvCameraLocations', label: 'CCTV camera locations', placeholder: 'Camera coverage map, blind spots, monitor room...', type: 'text', rows: 3 },
      { key: 'alarmPanelLocation', label: 'Alarm panel location', placeholder: 'Where panel is, who has access, zones...', type: 'text', rows: 2 },
      { key: 'panicButtonLocations', label: 'Panic button / duress locations', placeholder: 'Bars, desks, manager offices...', type: 'text', rows: 2 },
      { key: 'itServerRoomAccess', label: 'IT / server room access', placeholder: 'Restricted, escort only, key holder...', type: 'text', rows: 2 },
      { key: 'cctvMonitoringRoom', label: 'CCTV monitoring room', placeholder: 'Who monitors, guard access, incident review...', type: 'text', rows: 2 },
    ],
  },
  {
    id: 'parking-transport',
    title: 'Parking & transportation',
    description: 'Guest, staff, VIP parking and pickup zones.',
    fields: [
      { key: 'parkingLotLayout', label: 'Parking lot layout', placeholder: 'Lot sections, one-way flow, overflow lot...', type: 'text', rows: 3 },
      { key: 'guestParkingZones', label: 'Guest parking zones', placeholder: 'Which lots are open, pricing, attendants...', type: 'text', rows: 2 },
      { key: 'staffParking', label: 'Staff parking', placeholder: 'Where staff park, permits, shuttle from lot...', type: 'text', rows: 2 },
      { key: 'vipParking', label: 'VIP / artist parking', placeholder: 'Reserved rows, motorcade staging...', type: 'text', rows: 2 },
      { key: 'accessibleParking', label: 'Accessible parking', placeholder: 'ADA spaces, shuttle, ramp access...', type: 'text', rows: 2 },
      { key: 'ridesharePickupZone', label: 'Rideshare pickup zone', placeholder: 'Uber/Lyft staging, signage, queue control...', type: 'text', rows: 2 },
      { key: 'taxiStand', label: 'Taxi stand', placeholder: 'Location, hours, dispatcher contact...', type: 'text', rows: 1 },
      { key: 'busShuttle', label: 'Bus / shuttle', placeholder: 'Shuttle stops, hotel buses, public transit access...', type: 'text', rows: 2 },
      { key: 'tourBusParking', label: 'Tour bus / coach parking', placeholder: 'Staging, artist buses, crew buses...', type: 'text', rows: 2 },
      { key: 'towCompany', label: 'Tow company', placeholder: 'Company name, when to call, unauthorized parking...', type: 'text', rows: 2 },
      { key: 'parkingEnforcement', label: 'Parking enforcement', placeholder: 'Boot policy, citations, guard authority...', type: 'text', rows: 2 },
      { key: 'oversizeVehiclePolicy', label: 'Oversize / RV / bus policy', placeholder: 'Where large vehicles go, escort required...', type: 'text', rows: 2 },
    ],
  },
  {
    id: 'screening-weapons',
    title: 'Screening & weapons',
    description: 'Bag check, metal detectors, pat-downs, and prohibited items.',
    fields: [
      { key: 'bagCheckPolicy', label: 'Bag check policy', placeholder: 'Clear bag only, size limits, exceptions...', type: 'text', rows: 3 },
      { key: 'bagCheckLocations', label: 'Bag check locations', placeholder: 'Which entrances have screening, table setup...', type: 'text', rows: 2 },
      { key: 'metalDetectorPolicy', label: 'Metal detector / wand policy', placeholder: 'When to wand, alarm procedures, secondary search...', type: 'text', rows: 3 },
      { key: 'metalDetectorLocations', label: 'Metal detector locations', placeholder: 'Lane setup at each entrance...', type: 'text', rows: 2 },
      { key: 'wandSearchPolicy', label: 'Hand-wand search policy', placeholder: 'Who performs, same-gender options, opt-out rules...', type: 'text', rows: 2 },
      { key: 'patDownPolicy', label: 'Pat-down policy', placeholder: 'When authorized, documentation, supervisor present...', type: 'text', rows: 3 },
      { key: 'prohibitedItemsList', label: 'Prohibited items', placeholder: 'Weapons, outside alcohol, professional cameras, drones...', type: 'text', rows: 4 },
      { key: 'allowedItemsList', label: 'Allowed / exceptions', placeholder: 'Medically necessary items, baby supplies, sealed water...', type: 'text', rows: 3 },
      { key: 'screeningExceptions', label: 'Screening exceptions', placeholder: 'VIP, press, artists, ADA accommodations...', type: 'text', rows: 2 },
      { key: 'weaponPolicy', label: 'Weapons policy', placeholder: 'Zero tolerance, off-duty LE, armed client staff...', type: 'text', rows: 3 },
      { key: 'offDutyLawEnforcementPolicy', label: 'Off-duty law enforcement', placeholder: 'Credential check, where they may carry, notification...', type: 'text', rows: 2 },
    ],
  },
  {
    id: 'crowd-flow',
    title: 'Crowd management',
    description: 'Lines, capacity holds, surge protocols, and pit rules.',
    fields: [
      { key: 'queueManagement', label: 'Queue / line management', placeholder: 'Queue lanes, stanchions, wristband tiers in line...', type: 'text', rows: 3 },
      { key: 'lineControlPoints', label: 'Line control points', placeholder: 'Where guards stand in queue, choke points...', type: 'text', rows: 2 },
      { key: 'capacityHoldProcedure', label: 'Capacity hold procedure', placeholder: 'When to pause entry, one-in-one-out, PA script...', type: 'text', rows: 3 },
      { key: 'crowdSurgeProtocol', label: 'Crowd surge protocol', placeholder: 'Front-of-stage surge, stop show criteria, medical push...', type: 'text', rows: 3 },
      { key: 'moshpitPitRules', label: 'Mosh pit / GA pit rules', placeholder: 'Surfing, crowd collapse, water pass-through...', type: 'text', rows: 2 },
      { key: 'balconyOverlookRules', label: 'Balcony / overlook rules', placeholder: 'No leaning, capacity per section, railing checks...', type: 'text', rows: 2 },
      { key: 'standingVsSeated', label: 'Standing vs seated sections', placeholder: 'Which sections allow standing, ushers coordination...', type: 'text', rows: 2 },
      { key: 'generalAdmissionFlow', label: 'General admission flow', placeholder: 'Entry to floor path, bathroom breaks, re-entry...', type: 'text', rows: 2 },
      { key: 'seatedSectionFlow', label: 'Seated section flow', placeholder: 'Late seating, intermission, aisle standing...', type: 'text', rows: 2 },
    ],
  },
  {
    id: 'credentialing',
    title: 'Credentialing & re-entry',
    description: 'Wristbands, laminates, ID checks, and re-entry rules.',
    fields: [
      { key: 'credentialingDetails', label: 'Credentialing overview', placeholder: 'Band colors, laminate levels, scan procedures...', type: 'text', rows: 3 },
      { key: 'wristbandColors', label: 'Wristband colors & meanings', placeholder: '21+, VIP, artist, vendor, media...', type: 'text', rows: 3 },
      { key: 'laminateLevels', label: 'Laminate / badge levels', placeholder: 'All-access, backstage, catering, production...', type: 'text', rows: 3 },
      { key: 'staffCredentialTypes', label: 'Staff credential types', placeholder: 'Venue staff, promoter staff, third-party...', type: 'text', rows: 2 },
      { key: 'artistCredentialRules', label: 'Artist / talent credentials', placeholder: 'Guest list limits, plus-ones, tour laminate...', type: 'text', rows: 2 },
      { key: 'vendorCredentialRules', label: 'Vendor credentials', placeholder: 'Load-in badges, escort rules, vehicle placards...', type: 'text', rows: 2 },
      { key: 'mediaCredentialRules', label: 'Media / press credentials', placeholder: 'Photo pit, escort, restricted areas...', type: 'text', rows: 2 },
      { key: 'ageVerificationProcedure', label: 'Age verification procedure', placeholder: 'ID check at door vs bar, vertical ID policy...', type: 'text', rows: 3 },
      { key: 'idCheckLocations', label: 'ID check locations', placeholder: 'Which doors check ID, hand stamps...', type: 'text', rows: 2 },
      { key: 'minorAccompanimentPolicy', label: 'Minor / underage policy', placeholder: 'Accompanied minors, curfew for minors, wristbands...', type: 'text', rows: 2 },
      { key: 'reEntryPolicy', label: 'Re-entry policy', placeholder: 'Hand stamp, scan out/in, no re-entry after time...', type: 'text', rows: 2 },
      { key: 'handStampPolicy', label: 'Hand stamp policy', placeholder: 'UV ink, which doors honor stamp, smudge policy...', type: 'text', rows: 2 },
      { key: 'credentialConfiscationPolicy', label: 'Fake / invalid credential policy', placeholder: 'Confiscate, report, eject, law enforcement...', type: 'text', rows: 2 },
    ],
  },
  {
    id: 'talent-production',
    title: 'Talent & production',
    description: 'Artists, green rooms, stage doors, and meet-and-greet security.',
    fields: [
      { key: 'headlinerDetails', label: 'Headliner / main talent', placeholder: 'Name, entourage size, special requirements...', type: 'text', rows: 2 },
      { key: 'openingActs', label: 'Opening acts / support', placeholder: 'Set order, overlap, shared green room...', type: 'text', rows: 2 },
      { key: 'performanceSchedule', label: 'Performance schedule', placeholder: 'Set times, changeover, encore expectations...', type: 'text', rows: 3 },
      { key: 'greenRoomLocations', label: 'Green room locations', placeholder: 'Artist rooms, catering, security at door...', type: 'text', rows: 2 },
      { key: 'vipAreaDetails', label: 'VIP / restricted areas', placeholder: 'Green room, artist lanes, backstage rules...', type: 'text', rows: 3 },
      { key: 'artistEntourageRules', label: 'Artist entourage rules', placeholder: 'Guest limits, laminate checks, no photos...', type: 'text', rows: 2 },
      { key: 'stageDoorPolicy', label: 'Stage door policy', placeholder: 'Fan line, credential check, load-in door...', type: 'text', rows: 2 },
      { key: 'meetGreetSecurity', label: 'Meet & greet security', placeholder: 'Queue control, gifts policy, photo op area...', type: 'text', rows: 2 },
      { key: 'autographAreaRules', label: 'Autograph area rules', placeholder: 'Location, time limits, crowd control...', type: 'text', rows: 2 },
      { key: 'merchandiseBoothSecurity', label: 'Merchandise booth security', placeholder: 'Cash handling, line control, after-hours...', type: 'text', rows: 2 },
    ],
  },
  {
    id: 'bar-hospitality',
    title: 'Bar & hospitality',
    description: 'Bar operations, last call, intoxication, and FOH service.',
    fields: [
      { key: 'barDetails', label: 'Bar details', placeholder: 'Which bars are active, cash vs tab, security at each bar...', type: 'text', rows: 3 },
      { key: 'barLastCallTime', label: 'Bar last call', type: 'time' },
      { key: 'barCloseTime', label: 'Bar close', type: 'time' },
      { key: 'intoxicationPolicy', label: 'Intoxication / 86 policy', placeholder: 'When to involve bar staff, cut-off, ejection routes...', type: 'text', rows: 3 },
      { key: 'kitchenAccess', label: 'Kitchen / BOH access', placeholder: 'Who may enter kitchen, escort rules...', type: 'text', rows: 2 },
      { key: 'foodTruckLocations', label: 'Food trucks / vendors', placeholder: 'Locations, hours, cash security...', type: 'text', rows: 2 },
      { key: 'allergenEmergency', label: 'Allergen / food emergency', placeholder: 'EpiPen locations, manager on duty...', type: 'text', rows: 2 },
      { key: 'cashHandlingPolicy', label: 'Cash handling policy', placeholder: 'Drops, safes, armored car, guard escort...', type: 'text', rows: 2 },
      { key: 'atmLocations', label: 'ATM locations', placeholder: 'On-site ATMs, cash-out monitoring...', type: 'text', rows: 1 },
      { key: 'cashRoomLocation', label: 'Cash room / count room', placeholder: 'Location, dual control, guard post...', type: 'text', rows: 2 },
      { key: 'safeLocation', label: 'Safe location', placeholder: 'Manager safe, drop safe, access list...', type: 'text', rows: 2 },
      { key: 'armoredCarSchedule', label: 'Armored car schedule', placeholder: 'Pickup times, staging, escort procedure...', type: 'text', rows: 2 },
    ],
  },
  {
    id: 'smoking-area',
    title: 'Smoking area',
    description: 'Designated smoking zone — location, hours, guest rules, and guard coverage.',
    fields: [
      { key: 'smokingAreaLocation', label: 'Smoking area location', placeholder: 'North patio, rear lot behind kitchen...', type: 'text', rows: 2 },
      { key: 'smokingAreaOpenTime', label: 'Smoking area opens', type: 'time' },
      { key: 'smokingAreaCloseTime', label: 'Smoking area closes', type: 'time' },
      { key: 'smokingAreaRules', label: 'Smoking rules for guests', placeholder: 'Escort required, wristband, re-entry line, distance from doors...', type: 'text', rows: 2 },
      { key: 'smokingAreaGuardNotes', label: 'Guard coverage / post notes', placeholder: 'Assigned post, patrol interval, conflict de-escalation...', type: 'text', rows: 2 },
    ],
  },
  {
    id: 'access-keys',
    title: 'Access, codes & keys',
    description: 'Gate codes, lockboxes, and key control — hidden until guards are approved.',
    fields: [
      { key: 'accessCodes', label: 'Access codes', placeholder: 'Gate, door, alarm, and radio codes...', type: 'text', rows: 3 },
      { key: 'keyLocation', label: 'Key location', placeholder: 'Lockbox location, who holds master keys, return procedure...', type: 'text', rows: 2 },
      { key: 'accessNotes', label: 'Additional access notes', placeholder: 'Escort requirements, after-hours entry, contractor access...', type: 'text', rows: 3 },
      { key: 'keysReturnProcedure', label: 'Keys return procedure', placeholder: 'End of shift key check, missing key protocol...', type: 'text', rows: 2 },
      { key: 'contractorEscortRules', label: 'Contractor escort rules', placeholder: 'Which areas need escort, badge issue, sign-in log...', type: 'text', rows: 2 },
      { key: 'utilityRoomAccess', label: 'Utility room access', placeholder: 'Electrical, gas, water shutoffs — who may access...', type: 'text', rows: 2 },
    ],
  },
  {
    id: 'emergency-medical',
    title: 'Emergency & medical',
    description: 'Protocols, shelters, hospitals, and on-site medical.',
    fields: [
      { key: 'emergencyProtocol', label: 'General emergency protocol', placeholder: 'Medical, fire, utility — order of operations...', type: 'text', rows: 4 },
      { key: 'activeShooterProtocol', label: 'Active threat / shooter protocol', placeholder: 'Run-hide-fight, venue-specific rally points...', type: 'text', rows: 4 },
      { key: 'bombThreatProtocol', label: 'Bomb threat protocol', placeholder: 'Search teams, evacuation vs shelter, law enforcement...', type: 'text', rows: 3 },
      { key: 'severeWeatherShelter', label: 'Severe weather shelter', placeholder: 'Tornado, lightning, heat — where to move guests...', type: 'text', rows: 3 },
      { key: 'weatherContingencyPlans', label: 'Weather contingency plans', placeholder: 'Rain plan, wind limits for staging, extreme heat...', type: 'text', rows: 3 },
      { key: 'earthquakeProtocol', label: 'Earthquake protocol', placeholder: 'Drop-cover-hold, post-quake evacuation...', type: 'text', rows: 2 },
      { key: 'powerOutageProtocol', label: 'Power outage protocol', placeholder: 'Generator, emergency lighting, guest communication...', type: 'text', rows: 2 },
      { key: 'gasLeakProtocol', label: 'Gas leak protocol', placeholder: 'No ignition, evacuation perimeter, utility contact...', type: 'text', rows: 2 },
      { key: 'hazmatNotes', label: 'HAZMAT notes', placeholder: 'Chemical storage, spill response, SDS location...', type: 'text', rows: 2 },
      { key: 'medicalEmergencyContacts', label: 'Medical emergency contacts', placeholder: 'On-site medic, EMT, venue nurse, 911 notes...', type: 'text', rows: 3 },
      { key: 'nearestHospital', label: 'Nearest hospital', placeholder: 'Name, address, ambulance staging...', type: 'text', rows: 2 },
      { key: 'emsStagingLocation', label: 'EMS / ambulance staging', placeholder: 'Where ambulances park, gurney access routes...', type: 'text', rows: 2 },
      { key: 'triageLocation', label: 'Triage location', placeholder: 'First-aid triage area for mass casualty...', type: 'text', rows: 2 },
      { key: 'evacuationRallyPoint', label: 'Evacuation rally point', placeholder: 'Primary and secondary muster locations...', type: 'text', rows: 3 },
      { key: 'evacuationRoutes', label: 'Evacuation routes', placeholder: 'Primary routes, alternate if blocked, ADA routes...', type: 'text', rows: 3 },
      { key: 'shelterInPlaceLocation', label: 'Shelter-in-place location', placeholder: 'Interior rooms away from windows...', type: 'text', rows: 2 },
      { key: 'firePullStationNotes', label: 'Fire pull stations', placeholder: 'Locations, when to pull vs call 911 first...', type: 'text', rows: 2 },
      { key: 'cooldownAreaDetails', label: 'Cooldown / de-escalation area', placeholder: 'Where to move guests during conflicts...', type: 'text', rows: 2 },
      { key: 'poolWaterFeatureRules', label: 'Pool / water feature rules', placeholder: 'No diving, lifeguard, after-hours access...', type: 'text', rows: 2 },
      { key: 'strobeLightWarnings', label: 'Strobe / photosensitivity warnings', placeholder: 'Epilepsy triggers, announcement script...', type: 'text', rows: 2 },
      { key: 'medicalConditionsOnSite', label: 'Known medical considerations', placeholder: 'AED training on staff, diabetic guests, etc.', type: 'text', rows: 2 },
    ],
    lists: [
      {
        key: 'fireExtinguisherLocations',
        label: 'Fire extinguishers',
        hint: 'Building maps, zones, or landmarks for each extinguisher.',
        addLabel: 'Add extinguisher location',
        placeholder: 'e.g. East wall by main bar, ABC dry chemical',
        type: 'locationList',
      },
      {
        key: 'medkitLocations',
        label: 'Med kits',
        hint: 'First-aid kits and trauma bags.',
        addLabel: 'Add med kit location',
        placeholder: 'e.g. Security desk drawer, manager office',
        type: 'locationList',
      },
      {
        key: 'narcanLocations',
        label: 'Narcan / Naloxone',
        hint: 'Opioid emergency kits if available on site.',
        addLabel: 'Add Narcan location',
        placeholder: 'e.g. Bar 2 supervisor station',
        type: 'locationList',
      },
      {
        key: 'aedLocations',
        label: 'AED units',
        hint: 'Automated external defibrillator locations.',
        addLabel: 'Add AED location',
        placeholder: 'e.g. Main lobby wall by elevators',
        type: 'locationList',
      },
      {
        key: 'eyewashStationLocations',
        label: 'Eye wash stations',
        hint: 'Emergency eye wash / safety shower locations.',
        addLabel: 'Add eye wash location',
        placeholder: 'e.g. Kitchen prep area, chemical storage',
        type: 'locationList',
      },
      {
        key: 'spillKitLocations',
        label: 'Spill kits',
        hint: 'Chemical or bio spill response kits.',
        addLabel: 'Add spill kit location',
        placeholder: 'e.g. Loading dock, janitor closet B',
        type: 'locationList',
      },
    ],
  },
  {
    id: 'communications',
    title: 'Communications & command',
    description: 'Radios, chain of command, escalation, and guard posts.',
    fields: [
      { key: 'radioChannel', label: 'Radio channel', placeholder: 'e.g. Channel 2 — Security', type: 'text', rows: 1 },
      { key: 'radioCodes', label: 'Radio codes', placeholder: '10-codes, plain-language signals...', type: 'text', rows: 2 },
      { key: 'radioCallSignPolicy', label: 'Radio call sign policy', placeholder: 'Post numbers, name use, emergency words...', type: 'text', rows: 2 },
      { key: 'communicationTree', label: 'Communication tree', placeholder: 'Who calls whom, backup if supervisor unreachable...', type: 'text', rows: 3 },
      { key: 'chainOfCommand', label: 'Chain of command', placeholder: 'Lead guard, client rep, venue GM, promoter...', type: 'text', rows: 3 },
      { key: 'clientAuthorizedContacts', label: 'Who may give guards orders', placeholder: 'Client staff authorized to direct security...', type: 'text', rows: 2 },
      { key: 'escalationTier1', label: 'Escalation — level 1', placeholder: 'First call: shift lead, venue manager...', type: 'text', rows: 2 },
      { key: 'escalationTier2', label: 'Escalation — level 2', placeholder: 'Second call: client owner, regional ops...', type: 'text', rows: 2 },
      { key: 'escalationTier3', label: 'Escalation — level 3', placeholder: 'Emergency: law enforcement liaison, 911...', type: 'text', rows: 2 },
      { key: 'guardStationLocation', label: 'Guard station / command post', placeholder: 'Where guards report, charge radios, store logs...', type: 'text', rows: 2 },
      { key: 'supervisorPostLocation', label: 'Supervisor post location', placeholder: 'Where lead guard stations during event...', type: 'text', rows: 1 },
      { key: 'patrolRouteDetails', label: 'Patrol route details', placeholder: 'Perimeter path, interior rounds, timing...', type: 'text', rows: 3 },
      { key: 'patrolIntervalMinutes', label: 'Patrol interval', placeholder: 'e.g. Every 20 minutes, randomize timing', type: 'text', rows: 1 },
      { key: 'fixedPostRoster', label: 'Fixed post roster', placeholder: 'Post 1: main door, Post 2: VIP — headcount...', type: 'text', rows: 3 },
      { key: 'roverResponsibilities', label: 'Rover / floater responsibilities', placeholder: 'Relief breaks, incident response, lot patrols...', type: 'text', rows: 2 },
      { key: 'restroomBreakPolicy', label: 'Restroom / break policy', placeholder: 'Relief procedure, max time off post...', type: 'text', rows: 2 },
      { key: 'uniformByPost', label: 'Uniform by post', placeholder: 'Suit at VIP, hi-vis at lot, plainclothes inside...', type: 'text', rows: 2 },
      { key: 'equipmentByPost', label: 'Equipment by post', placeholder: 'Radio, flashlight, metal wand, body cam...', type: 'text', rows: 2 },
      { key: 'handoffNotesFromPriorShift', label: 'Handoff from prior shift', placeholder: 'Standing issues, banned guests, open incidents...', type: 'text', rows: 3 },
    ],
    lists: [
      {
        key: 'guardPosts',
        label: 'Guard posts & checkpoints',
        hint: 'Define each post — location, schedule, and orders.',
        addLabel: 'Add guard post',
        placeholder: 'Post orders, relief, special instructions...',
        type: 'checkpointList',
      },
      {
        key: 'contacts',
        label: 'Key contacts',
        hint: 'Venue, client, promoter, and emergency contacts.',
        addLabel: 'Add contact',
        placeholder: 'Notes — when to call, after-hours...',
        type: 'contactList',
      },
    ],
  },
  {
    id: 'incidents-enforcement',
    title: 'Incidents & enforcement',
    description: 'Ejections, bans, reporting, evidence, and detention.',
    fields: [
      { key: 'incidentReportProcedure', label: 'Incident report procedure', placeholder: 'When to write up, photos, supervisor review...', type: 'text', rows: 3 },
      { key: 'evidencePreservation', label: 'Evidence preservation', placeholder: 'CCTV export, bag and tag, chain of custody...', type: 'text', rows: 2 },
      { key: 'witnessStatementProcedure', label: 'Witness statements', placeholder: 'Who takes statements, forms, client notification...', type: 'text', rows: 2 },
      { key: 'bodyCamPolicy', label: 'Body camera policy', placeholder: 'When recording, storage, privacy rules...', type: 'text', rows: 2 },
      { key: 'useOfForceReporting', label: 'Use of force reporting', placeholder: 'Client notification, documentation, medical check...', type: 'text', rows: 3 },
      { key: 'detentionHoldArea', label: 'Detention / hold area', placeholder: 'Where to wait for law enforcement, time limits...', type: 'text', rows: 2 },
      { key: 'trespassProcedure', label: 'Trespass procedure', placeholder: 'Written notice, photo, return after ban...', type: 'text', rows: 2 },
      { key: 'ejectionRoutes', label: 'Ejection routes', placeholder: 'Which exits to use, avoid main floor when possible...', type: 'text', rows: 2 },
      { key: 'ejectionDocumentation', label: 'Ejection documentation', placeholder: 'Incident form, banned list entry, witness...', type: 'text', rows: 2 },
      { key: 'bannedPersonList', label: 'Banned persons list', placeholder: 'Known bans, photos, reason, expiration...', type: 'text', rows: 3 },
      { key: 'knownProblemGuests', label: 'Known problem guests', placeholder: 'Watch list, prior incidents, description...', type: 'text', rows: 3 },
      { key: 'lostChildProcedure', label: 'Lost child / guest procedure', placeholder: 'Code word, PA announcement, reunification area...', type: 'text', rows: 3 },
      { key: 'lostAndFoundProcedure', label: 'Lost & found procedure', placeholder: 'Where items go, high-value items, claim ID...', type: 'text', rows: 2 },
      { key: 'theftResponseProcedure', label: 'Theft response', placeholder: 'Detain policy, call police, merchandise LP...', type: 'text', rows: 2 },
      { key: 'sexualHarassmentResponse', label: 'Sexual harassment response', placeholder: 'Support guest, separate parties, management...', type: 'text', rows: 3 },
      { key: 'sexualAssaultResponseProtocol', label: 'Sexual assault protocol', placeholder: 'Preserve evidence, medical, law enforcement, privacy...', type: 'text', rows: 4 },
    ],
  },
  {
    id: 'policies-compliance',
    title: 'Policies & compliance',
    description: 'Filming, ADA, animals, protests, and liquor compliance.',
    fields: [
      { key: 'filmingPhotoPolicy', label: 'Filming / photo policy', placeholder: 'Guest phones, professional cameras, artist restrictions...', type: 'text', rows: 3 },
      { key: 'socialMediaPolicy', label: 'Social media policy', placeholder: 'Staff posting, live streams, geotag rules...', type: 'text', rows: 2 },
      { key: 'dronePolicy', label: 'Drone policy', placeholder: 'No-fly, authorized production drones...', type: 'text', rows: 2 },
      { key: 'liquorLicenseCompliance', label: 'Liquor license compliance', placeholder: 'Hours, ID, server cut-off coordination...', type: 'text', rows: 2 },
      { key: 'tobaccoPolicyBeyondSmoking', label: 'Tobacco policy (beyond smoking area)', placeholder: 'Vaping indoors, chewing tobacco, sales...', type: 'text', rows: 2 },
      { key: 'cannabisPolicy', label: 'Cannabis policy', placeholder: 'State law, venue policy, medical vs recreational...', type: 'text', rows: 3 },
      { key: 'noiseCurfewCompliance', label: 'Noise / sound curfew', placeholder: 'City limits, neighbor agreements, bass cut-off...', type: 'text', rows: 2 },
      { key: 'adaAccessibilityNotes', label: 'ADA / accessibility', placeholder: 'Viewing areas, companion policies, elevator priority...', type: 'text', rows: 3 },
      { key: 'serviceAnimalPolicy', label: 'Service animal policy', placeholder: 'Two questions allowed, removal criteria...', type: 'text', rows: 2 },
      { key: 'languageTranslationNeeds', label: 'Language / translation', placeholder: 'Bilingual staff, interpreter on call...', type: 'text', rows: 2 },
      { key: 'protestUnauthorizedActivity', label: 'Protest / unauthorized activity', placeholder: 'Picket lines, chalking, amplified sound outside...', type: 'text', rows: 3 },
      { key: 'picketLineProtocol', label: 'Picket line protocol', placeholder: 'Do not engage, client legal contact...', type: 'text', rows: 2 },
      { key: 'unionStrikeRules', label: 'Union / strike rules', placeholder: 'Crossing lines, vendor access, client direction...', type: 'text', rows: 2 },
      { key: 'neighborhoodRelations', label: 'Neighborhood relations', placeholder: 'Residential neighbors, noise complaints, parking spillover...', type: 'text', rows: 2 },
      { key: 'lawEnforcementLiaison', label: 'Law enforcement liaison', placeholder: 'Beat officer, event permit officer, contact numbers...', type: 'text', rows: 2 },
      { key: 'fireMarshalContact', label: 'Fire marshal / fire department', placeholder: 'Inspector, occupancy limits, hot work permits...', type: 'text', rows: 2 },
    ],
  },
  {
    id: 'client-notes',
    title: 'Client requests & notes',
    description: 'Anything else your security team must know.',
    fields: [
      { key: 'clientSpecialRequests', label: 'Client special requests', placeholder: 'Prior incidents, problem guests, neighborhood concerns...', type: 'text', rows: 4 },
      { key: 'additionalNotes', label: 'Additional notes', placeholder: 'Anything we missed — guards see this after approval.', type: 'text', rows: 4 },
    ],
    lists: [
      {
        key: 'customBriefingFields',
        label: 'Your custom fields',
        hint: 'Add any detail we did not list — you control the label and content.',
        addLabel: 'Add custom field',
        placeholder: 'Your instructions for this item...',
        type: 'customList',
      },
    ],
  },
];

/** All scalar string keys used in briefing normalization */
export const OPERATIONAL_SCALAR_KEYS = OPERATIONAL_FIELD_SECTIONS.flatMap((section) =>
  section.fields.map((field) => field.key)
) as (keyof JobOperationalDetails)[];

export const OPERATIONAL_LOCATION_LIST_KEYS = OPERATIONAL_FIELD_SECTIONS.flatMap(
  (section) => section.lists?.filter((list) => list.type === 'locationList').map((list) => list.key) ?? []
) as (keyof JobOperationalDetails)[];
