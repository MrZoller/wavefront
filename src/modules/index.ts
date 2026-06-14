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
import './direction-finding/fdoa';

// Track B — Playing a Radio Signal
// Layer 0 — The transmit chain
import './playing-a-radio-signal/symbol-mapping';
import './playing-a-radio-signal/pulse-shaping';
import './playing-a-radio-signal/upconversion';
// Layer 1 — The channel & receiver
import './playing-a-radio-signal/noisy-channel';
import './playing-a-radio-signal/matched-filter';
// Layer 2 — End to end
import './playing-a-radio-signal/send-a-message';
