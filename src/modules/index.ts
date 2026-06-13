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
import './direction-finding/rotating-phasor';
