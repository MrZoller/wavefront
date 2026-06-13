/**
 * Module registration barrel.
 *
 * Importing this module for its side effects registers every Wavefront module
 * with the registry. Add a new module by importing its `register*()` call here.
 *
 * (Modules are added per the build order in the brief, §13 — one vertical slice
 * at a time, not all at once.)
 */

// Track A — Direction Finding & Geolocation
// Layer 0 — Primitives
import './direction-finding/rotating-phasor';
import './direction-finding/phase-difference';
import './direction-finding/cross-correlation';
// Layer 1 — Angle of Arrival
import './direction-finding/interferometer';
import './direction-finding/beamforming';
// Layer 2 — Geolocation
import './direction-finding/aoa-cross-fix';
import './direction-finding/tdoa';
import './direction-finding/gdop';
