/**
 * The glossary — Wavefront's single source of truth for jargon (the `<Term>` add-on).
 *
 * This is a deliberately **flat** `id → entry` map. The `<Term id="…">` component surfaces these
 * one-line glosses at the point of use so a strong software engineer with no RF/DSP background can
 * decode an acronym without leaving the page. It is NOT a wiki: no categories, no search, no
 * "related terms". The flat map + `<Term>` + the contributor contract (docs/ARCHITECTURE.md,
 * CONTRIBUTING.md) is the whole feature.
 *
 * Three layers of the same idea, shortest → longest:
 *   1. this `gloss`          — one sentence, surfaced inline by `<Term>`.
 *   2. the linked `moduleId` — the interactive lesson that teaches it in full.
 *   3. the `docsPage`        — the long-form `docs/dsp/<page>.md` write-up.
 * Keep the `gloss` here in sync with that page's one-liner so they can't drift.
 *
 * What earns an entry (the cutoff — see CONTRIBUTING.md "What to define"):
 * define what is domain-specific OR compresses a non-obvious concept; do NOT define general
 * scientific/SI literacy a strong engineer already has. The test is conceptual load, not the unit:
 * `Hz` is general literacy (skip it); `dB` only looks like a unit but is a logarithmic ratio that
 * genuinely trips non-EEs (define it). Gloss the concept, not the letters.
 */

export interface GlossaryEntry {
  /** Stable key used by `<Term id="…">`. URL-safe, lowercase. */
  id: string;
  /** Display form of the term (e.g. "FFT", "dB"). */
  term: string;
  /** Spelled-out form, when the term is an acronym. Omit for non-acronyms (e.g. "baseband"). */
  expansion?: string;
  /** One plain-language sentence: the single idea the reader needs here. */
  gloss: string;
  /** Optional registry id of the module that teaches this in full (powers "Learn more →"). */
  moduleId?: string;
  /** Optional `docs/dsp/<page>` (basename, no extension) that is this term's long form. */
  docsPage?: string;
}

/**
 * The canonical map. Keep entries alphabetical by id for easy scanning.
 * Seeded from the glosses already written across Tracks A–D (docs/dsp + inline doc comments).
 */
export const GLOSSARY: Record<string, GlossaryEntry> = {
  adc: {
    id: 'adc',
    term: 'ADC',
    expansion: 'Analog-to-Digital Converter',
    gloss:
      'The converter that turns a continuous voltage into numbered samples — sampling it in time, then rounding each reading to a level.',
    moduleId: 'quantization',
  },
  agc: {
    id: 'agc',
    term: 'AGC',
    expansion: 'Automatic Gain Control',
    gloss:
      'A feedback loop that keeps adjusting the amplifier so the signal fills the converter’s range without clipping.',
    moduleId: 'gain-agc',
  },
  am: {
    id: 'am',
    term: 'AM',
    expansion: 'Amplitude Modulation',
    gloss: 'Encoding a message by varying the strength of the carrier wave.',
    moduleId: 'analog-modulation',
    docsPage: 'modulation',
  },
  aliasing: {
    id: 'aliasing',
    term: 'aliasing',
    gloss: 'When sampling too slowly makes a high frequency masquerade as a lower one.',
    moduleId: 'sampling-aliasing',
  },
  aoa: {
    id: 'aoa',
    term: 'AoA',
    expansion: 'Angle of Arrival',
    gloss:
      'The bearing a signal arrives from, inferred from the phase difference between antennas.',
    moduleId: 'aoa-cross-fix',
    docsPage: 'phase-difference',
  },
  awgn: {
    id: 'awgn',
    term: 'AWGN',
    expansion: 'Additive White Gaussian Noise',
    gloss: 'The standard model of random radio noise, spread evenly across all frequencies.',
    moduleId: 'noisy-channel',
  },
  baseband: {
    id: 'baseband',
    term: 'baseband',
    gloss: 'A signal sitting at low frequency, before it is shifted up onto a carrier (or after).',
    moduleId: 'upconversion',
    docsPage: 'carrier',
  },
  beamforming: {
    id: 'beamforming',
    term: 'beamforming',
    gloss: 'Combining the antennas of an array so it listens hardest in one chosen direction.',
    moduleId: 'beamforming',
    docsPage: 'steering-and-beamforming',
  },
  ber: {
    id: 'ber',
    term: 'BER',
    expansion: 'Bit Error Rate',
    gloss: 'The fraction of bits the receiver decodes wrongly.',
    moduleId: 'noisy-channel',
    docsPage: 'comms',
  },
  bpsk: {
    id: 'bpsk',
    term: 'BPSK',
    expansion: 'Binary Phase-Shift Keying',
    gloss: 'One bit per symbol, sent as one of two carrier phases.',
    moduleId: 'symbol-mapping',
  },
  carrier: {
    id: 'carrier',
    term: 'carrier',
    gloss: 'The high-frequency sine wave a baseband signal rides on to travel through the air.',
    moduleId: 'upconversion',
    docsPage: 'carrier',
  },
  'channel-estimation': {
    id: 'channel-estimation',
    term: 'channel estimation',
    gloss: "Measuring the channel's response from known pilot symbols, so it can be undone.",
    moduleId: 'channel-estimation',
    docsPage: 'equalization',
  },
  chirp: {
    id: 'chirp',
    term: 'chirp',
    expansion: 'Linear Frequency Modulation (LFM)',
    gloss: 'A pulse that sweeps its frequency over time — the classic radar waveform.',
    moduleId: 'chirp-lfm',
  },
  clipping: {
    id: 'clipping',
    term: 'clipping',
    gloss:
      'When a signal overruns the converter’s range and its peaks flatten against the rails, adding harmonic distortion.',
    moduleId: 'gain-agc',
    docsPage: 'gain',
  },
  'code-rate': {
    id: 'code-rate',
    term: 'code rate',
    gloss:
      'The fraction of transmitted bits that carry data (k/n) — the rest are redundancy that costs bandwidth.',
    moduleId: 'channel-coding',
  },
  'coding-gain': {
    id: 'coding-gain',
    term: 'coding gain',
    gloss:
      'How much less Eb/N0 a coded link needs to hit the same error rate — the coded BER curve shifted left.',
    moduleId: 'channel-coding',
    docsPage: 'coding',
  },
  'constant-envelope': {
    id: 'constant-envelope',
    term: 'constant-envelope',
    gloss:
      'A signal whose amplitude never changes — only its phase or frequency carries information (e.g. FSK, MSK), which keeps amplifiers efficient.',
    moduleId: 'modulation-zoo',
  },
  constellation: {
    id: 'constellation',
    term: 'constellation',
    gloss: 'The map of I/Q points a modulation scheme uses to encode groups of bits.',
    moduleId: 'symbol-mapping',
  },
  'cross-correlation': {
    id: 'cross-correlation',
    term: 'cross-correlation',
    gloss: 'Sliding one signal past another to find the lag where they line up best.',
    moduleId: 'cross-correlation',
    docsPage: 'cross-correlation',
  },
  dac: {
    id: 'dac',
    term: 'DAC',
    expansion: 'Digital-to-Analog Converter',
    gloss: 'The ADC run backwards — turns a stream of samples back into a continuous waveform.',
  },
  db: {
    id: 'db',
    term: 'dB',
    expansion: 'decibel',
    gloss:
      'A logarithmic ratio, not an absolute unit — every 3 dB is a doubling (or halving) of power.',
  },
  dbm: {
    id: 'dbm',
    term: 'dBm',
    expansion: 'decibel-milliwatts',
    gloss: 'A power level on a logarithmic scale, referenced to one milliwatt.',
  },
  ddc: {
    id: 'ddc',
    term: 'DDC',
    expansion: 'Digital Down-Conversion',
    gloss: 'Shifting one channel of interest down to baseband, then discarding the rest.',
    moduleId: 'channelizer',
    docsPage: 'channelization',
  },
  decimation: {
    id: 'decimation',
    term: 'decimation',
    gloss:
      'Lowering the sample rate by keeping every Nth sample (after filtering to prevent aliasing).',
    moduleId: 'multirate',
  },
  dft: {
    id: 'dft',
    term: 'DFT',
    expansion: 'Discrete Fourier Transform',
    gloss: 'The math that decomposes a sampled signal into the sine waves it is made of.',
    moduleId: 'dft-basis',
    docsPage: 'fft',
  },
  'direct-sampling': {
    id: 'direct-sampling',
    term: 'direct sampling',
    gloss:
      'An SDR architecture that digitizes the antenna signal almost immediately, doing the tuning and filtering in software.',
    moduleId: 'sdr-architectures',
  },
  dither: {
    id: 'dither',
    term: 'dither',
    gloss:
      'A sliver of noise added before quantizing; it decorrelates the rounding error, trading a slightly higher noise floor for no harmonic spurs.',
    moduleId: 'quantization',
  },
  doppler: {
    id: 'doppler',
    term: 'Doppler shift',
    gloss: 'The change in observed frequency caused by motion between transmitter and receiver.',
    moduleId: 'carrier-offset',
    docsPage: 'channel',
  },
  dsss: {
    id: 'dsss',
    term: 'DSSS',
    expansion: 'Direct-Sequence Spread Spectrum',
    gloss: 'Smearing a signal across a wide band with a code, to hide it and resist jamming.',
    moduleId: 'spread-spectrum',
  },
  equalizer: {
    id: 'equalizer',
    term: 'equalizer',
    gloss:
      "A filter that undoes the channel's distortion — reopening the eye and re-clustering the constellation.",
    moduleId: 'equalization',
    docsPage: 'equalization',
  },
  evm: {
    id: 'evm',
    term: 'EVM',
    expansion: 'Error Vector Magnitude',
    gloss: 'How far received symbols land from their ideal points, as a fraction (or percentage).',
    moduleId: 'equalization',
  },
  'dynamic-range': {
    id: 'dynamic-range',
    term: 'dynamic range',
    gloss:
      'The span between the strongest and faintest signal a system can carry at once — for an ADC, roughly 6 dB per bit.',
    moduleId: 'quantization',
  },
  fdoa: {
    id: 'fdoa',
    term: 'FDOA',
    expansion: 'Frequency Difference of Arrival',
    gloss: 'Locating a moving transmitter from the differing Doppler shifts seen at each receiver.',
    moduleId: 'fdoa',
    docsPage: 'geolocation',
  },
  fec: {
    id: 'fec',
    term: 'FEC',
    expansion: 'Forward Error Correction',
    gloss:
      'Adding structured redundancy so the receiver can correct flipped bits, not just detect them.',
    moduleId: 'channel-coding',
    docsPage: 'coding',
  },
  fft: {
    id: 'fft',
    term: 'FFT',
    expansion: 'Fast Fourier Transform',
    gloss: 'A fast algorithm that converts a signal between its time view and its frequency view.',
    moduleId: 'dft-basis',
    docsPage: 'fft',
  },
  fir: {
    id: 'fir',
    term: 'FIR',
    expansion: 'Finite Impulse Response',
    gloss:
      'A filter that blends a fixed handful of recent samples with set weights — always stable.',
    moduleId: 'fir-filter',
    docsPage: 'channelization',
  },
  fm: {
    id: 'fm',
    term: 'FM',
    expansion: 'Frequency Modulation',
    gloss: 'Encoding a message by varying the instantaneous frequency of the carrier.',
    moduleId: 'analog-modulation',
    docsPage: 'modulation',
  },
  fsk: {
    id: 'fsk',
    term: 'FSK',
    expansion: 'Frequency-Shift Keying',
    gloss: 'Sending bits by switching the carrier between distinct tones.',
    moduleId: 'modulation-zoo',
    docsPage: 'modulation',
  },
  gdop: {
    id: 'gdop',
    term: 'GDOP',
    expansion: 'Geometric Dilution of Precision',
    gloss: 'How much the geometry of the receivers amplifies the final location error.',
    moduleId: 'gdop-heatmap',
    docsPage: 'geolocation',
  },
  'grating-lobe': {
    id: 'grating-lobe',
    term: 'grating lobe',
    gloss: 'A false second mainlobe that appears when array antennas are spaced too far apart.',
    moduleId: 'beamforming',
  },
  'great-circle': {
    id: 'great-circle',
    term: 'great-circle',
    gloss:
      'The shortest path between two points on a sphere — the route a radio bearing follows over the curve of the Earth.',
  },
  'ground-wave': {
    id: 'ground-wave',
    term: 'ground wave',
    gloss:
      'A radio wave that clings to the surface and follows the curve of the Earth, dominating the low bands.',
    moduleId: 'band-explorer',
  },
  hamming: {
    id: 'hamming',
    term: 'Hamming code',
    gloss:
      'A block code whose parity bits, read back, form a pattern (the syndrome) that names which single bit flipped.',
    moduleId: 'channel-coding',
    docsPage: 'coding',
  },
  headroom: {
    id: 'headroom',
    term: 'headroom',
    gloss:
      'The margin left before a signal hits the rails and clips — what a gain stage tries to preserve.',
    moduleId: 'gain-agc',
  },
  hf: {
    id: 'hf',
    term: 'HF',
    expansion: 'High Frequency',
    gloss:
      'The 3–30 MHz band, where a skywave bounce off the ionosphere can carry a signal around the world.',
    moduleId: 'band-explorer',
  },
  ionosphere: {
    id: 'ionosphere',
    term: 'ionosphere',
    gloss:
      'The electrically charged upper atmosphere that can reflect HF radio waves back toward the ground.',
    moduleId: 'hf-skywave',
  },
  iq: {
    id: 'iq',
    term: 'IQ',
    expansion: 'In-phase / Quadrature',
    gloss: 'A signal sample as a 2D point: I is the horizontal part, Q the vertical part.',
    moduleId: 'rotating-phasor',
    docsPage: 'complex-and-phasors',
  },
  isi: {
    id: 'isi',
    term: 'ISI',
    expansion: 'Inter-Symbol Interference',
    gloss: 'When poorly shaped symbols smear in time and bleed into their neighbors.',
    moduleId: 'pulse-shaping',
  },
  lf: {
    id: 'lf',
    term: 'LF',
    expansion: 'Low Frequency',
    gloss: 'The 30–300 kHz band, where long ground waves hug the Earth for hundreds of km.',
    moduleId: 'band-explorer',
  },
  'line-of-sight': {
    id: 'line-of-sight',
    term: 'line-of-sight',
    expansion: 'LOS',
    gloss:
      'Propagation in a straight line that stops at the horizon, with nothing bending the wave back — the rule from VHF up.',
    moduleId: 'radio-horizon',
  },
  lna: {
    id: 'lna',
    term: 'LNA',
    expansion: 'Low-Noise Amplifier',
    gloss:
      'The first amplifier after the antenna, built to lift a weak signal while adding as little noise of its own as possible.',
  },
  lms: {
    id: 'lms',
    term: 'LMS',
    expansion: 'Least Mean Squares',
    gloss:
      'An adaptive filter that learns the channel inverse by nudging its tap weights downhill on its own error — gradient descent, one step per sample.',
    moduleId: 'equalization',
    docsPage: 'equalization',
  },
  'matched-filter': {
    id: 'matched-filter',
    term: 'matched filter',
    gloss:
      'The optimal filter for spotting a known pulse buried in noise — correlate against its shape.',
    moduleId: 'matched-filter',
    docsPage: 'pulse',
  },
  mf: {
    id: 'mf',
    term: 'MF',
    expansion: 'Medium Frequency',
    gloss: 'The 0.3–3 MHz band of AM broadcast — ground wave by day, skywave after dark.',
    moduleId: 'band-explorer',
  },
  mmse: {
    id: 'mmse',
    term: 'MMSE',
    expansion: 'Minimum Mean-Squared Error',
    gloss:
      "An equalizer that balances inverting the channel against amplifying noise — it backs off in the channel's deep notches.",
    moduleId: 'equalization',
    docsPage: 'equalization',
  },
  msk: {
    id: 'msk',
    term: 'MSK',
    expansion: 'Minimum-Shift Keying',
    gloss:
      'A smooth, continuous-phase form of frequency-shift keying that wastes little bandwidth.',
    moduleId: 'modulation-zoo',
  },
  muf: {
    id: 'muf',
    term: 'MUF',
    expansion: 'Maximum Usable Frequency',
    gloss:
      'The highest frequency the ionosphere will still reflect on a given path — above it, the wave escapes to space.',
    moduleId: 'hf-skywave',
  },
  multipath: {
    id: 'multipath',
    term: 'multipath',
    gloss: 'Echoes: delayed copies of a signal that arrive after bouncing off objects.',
    moduleId: 'multipath-fading',
    docsPage: 'channel',
  },
  music: {
    id: 'music',
    term: 'MUSIC',
    expansion: 'MUltiple SIgnal Classification',
    gloss: 'A high-resolution direction-finder that separates the signal and noise subspaces.',
  },
  nyquist: {
    id: 'nyquist',
    term: 'Nyquist rate',
    gloss: 'The sampling speed limit: sample above twice the highest frequency, or it aliases.',
    moduleId: 'sampling-aliasing',
  },
  ofdm: {
    id: 'ofdm',
    term: 'OFDM',
    expansion: 'Orthogonal Frequency-Division Multiplexing',
    gloss: 'Splitting data across many narrow subcarriers at once for speed and robustness.',
    moduleId: 'ofdm',
    docsPage: 'modulation',
  },
  parity: {
    id: 'parity',
    term: 'parity',
    gloss:
      'A bit set so a chosen group has an even number of 1s — the building block of error-detecting and -correcting codes.',
    moduleId: 'channel-coding',
  },
  passband: {
    id: 'passband',
    term: 'passband',
    gloss: 'The range of frequencies a filter lets through (as opposed to the stopband it blocks).',
    moduleId: 'fir-filter',
  },
  pfb: {
    id: 'pfb',
    term: 'PFB',
    expansion: 'Polyphase Filter Bank',
    gloss: 'An efficient way to split a wideband capture into many clean channels at once.',
    moduleId: 'channelizer',
    docsPage: 'channelization',
  },
  phasor: {
    id: 'phasor',
    term: 'phasor',
    gloss: 'A rotating 2D arrow that captures a sine wave’s amplitude and phase.',
    moduleId: 'rotating-phasor',
    docsPage: 'complex-and-phasors',
  },
  pilot: {
    id: 'pilot',
    term: 'pilot',
    gloss: 'A known symbol the transmitter inserts so the receiver can measure the channel.',
    moduleId: 'channel-estimation',
  },
  pm: {
    id: 'pm',
    term: 'PM',
    expansion: 'Phase Modulation',
    gloss: 'Encoding a message by varying the instantaneous phase of the carrier.',
    moduleId: 'analog-modulation',
  },
  'pulse-shaping': {
    id: 'pulse-shaping',
    term: 'pulse shaping',
    gloss: 'Rounding each symbol’s pulse so symbols don’t smear together or hog bandwidth.',
    moduleId: 'pulse-shaping',
    docsPage: 'pulse',
  },
  'q-rail': {
    id: 'q-rail',
    term: 'Q-rail',
    gloss:
      'The Q (quadrature) axis of an I/Q signal; e.g. BPSK rides only the I-rail, so its Q-rail stays near zero.',
    moduleId: 'rotating-phasor',
  },
  qam: {
    id: 'qam',
    term: 'QAM',
    expansion: 'Quadrature Amplitude Modulation',
    gloss: 'Packing several bits per symbol using both the amplitude and phase of the carrier.',
    moduleId: 'symbol-mapping',
  },
  qpsk: {
    id: 'qpsk',
    term: 'QPSK',
    expansion: 'Quadrature Phase-Shift Keying',
    gloss: 'Two bits per symbol, sent as one of four carrier phases.',
    moduleId: 'symbol-mapping',
  },
  'radio-horizon': {
    id: 'radio-horizon',
    term: 'radio horizon',
    gloss:
      "The farthest a line-of-sight signal reaches before the Earth's curve blocks it — set mostly by antenna height.",
    moduleId: 'radio-horizon',
  },
  radioml: {
    id: 'radioml',
    term: 'RadioML',
    gloss:
      'A public benchmark dataset of recorded modulated signals, widely used to train and compare modulation-recognition models.',
  },
  shf: {
    id: 'shf',
    term: 'SHF',
    expansion: 'Super High Frequency',
    gloss:
      'The 3–30 GHz microwave band — tight line-of-sight beams for radar, satellite, and point-to-point links.',
    moduleId: 'band-explorer',
  },
  skywave: {
    id: 'skywave',
    term: 'skywave',
    gloss:
      'A radio wave that reflects off the ionosphere to land far over the horizon — the HF long-distance trick.',
    moduleId: 'hf-skywave',
  },
  snr: {
    id: 'snr',
    term: 'SNR',
    expansion: 'Signal-to-Noise Ratio',
    gloss:
      'How far the signal sits above the background noise, expressed as a ratio (often in dB).',
    moduleId: 'noisy-channel',
    docsPage: 'comms',
  },
  sqnr: {
    id: 'sqnr',
    term: 'SQNR',
    expansion: 'Signal-to-Quantization-Noise Ratio',
    gloss:
      'How far a quantized signal sits above the noise its own rounding creates — about 6.02·N + 1.76 dB for N bits.',
    moduleId: 'quantization',
    docsPage: 'quantization',
  },
  'spectral-leakage': {
    id: 'spectral-leakage',
    term: 'spectral leakage',
    gloss:
      'FFT energy smearing into neighboring bins when a tone doesn’t fit a whole number of cycles.',
    moduleId: 'windowing-leakage',
  },
  'steering-vector': {
    id: 'steering-vector',
    term: 'steering vector',
    gloss: 'The set of per-antenna phases that points an array at a particular bearing.',
    moduleId: 'beamforming',
    docsPage: 'steering-and-beamforming',
  },
  superheterodyne: {
    id: 'superheterodyne',
    term: 'superheterodyne',
    gloss:
      'A receiver that mixes the signal down to a fixed intermediate frequency, where it can be filtered sharply before digitizing.',
    moduleId: 'sdr-architectures',
  },
  syndrome: {
    id: 'syndrome',
    term: 'syndrome',
    gloss:
      "The parity-check result that points at a flipped bit's position — zero means no error detected.",
    moduleId: 'channel-coding',
    docsPage: 'coding',
  },
  'tap-weights': {
    id: 'tap-weights',
    term: 'tap weights',
    gloss: 'The adjustable coefficients of an FIR filter — what an adaptive equalizer tunes.',
    moduleId: 'equalization',
  },
  tdoa: {
    id: 'tdoa',
    term: 'TDOA',
    expansion: 'Time Difference of Arrival',
    gloss:
      'Locating a transmitter from how much sooner its signal reaches one receiver than another.',
    moduleId: 'tdoa-multilateration',
    docsPage: 'geolocation',
  },
  uhf: {
    id: 'uhf',
    term: 'UHF',
    expansion: 'Ultra High Frequency',
    gloss: 'The 0.3–3 GHz band, short-range line-of-sight — cellular, Wi-Fi, and GPS.',
    moduleId: 'band-explorer',
  },
  ula: {
    id: 'ula',
    term: 'ULA',
    expansion: 'Uniform Linear Array',
    gloss: 'A straight row of equally spaced antennas — the simplest array geometry.',
    moduleId: 'interferometer',
  },
  vhf: {
    id: 'vhf',
    term: 'VHF',
    expansion: 'Very High Frequency',
    gloss: 'The 30–300 MHz band, line-of-sight and local — where FM radio and broadcast TV live.',
    moduleId: 'band-explorer',
  },
  wavelength: {
    id: 'wavelength',
    term: 'wavelength',
    gloss:
      'The physical length of one cycle of a wave — the speed of light divided by its frequency (λ = c/f).',
    moduleId: 'band-explorer',
  },
  window: {
    id: 'window',
    term: 'window',
    gloss: 'A taper applied to a signal’s edges before an FFT to cut down spectral leakage.',
    moduleId: 'windowing-leakage',
  },
  'zero-forcing': {
    id: 'zero-forcing',
    term: 'zero-forcing',
    gloss:
      'An equalizer that inverts the channel exactly (W = 1/H) — clean, but it amplifies noise wherever the channel has a deep null.',
    moduleId: 'equalization',
    docsPage: 'equalization',
  },
  'zero-if': {
    id: 'zero-if',
    term: 'zero-IF',
    expansion: 'zero intermediate frequency',
    gloss:
      'A receiver that mixes the signal straight to baseband, so a modest converter can sample it directly.',
    moduleId: 'sdr-architectures',
  },
};

/** Look up a glossary entry by id. */
export function getTerm(id: string): GlossaryEntry | undefined {
  return GLOSSARY[id];
}

/** All glossary entries, in id order. */
export function allTerms(): GlossaryEntry[] {
  return Object.values(GLOSSARY);
}
