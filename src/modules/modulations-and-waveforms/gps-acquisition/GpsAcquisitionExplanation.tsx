import { GlossedText } from '@/components/GlossedText';

/** "Go deeper" content for the GPS Acquisition synthesis module. */
export function GpsAcquisitionExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">Receiving a signal you can&rsquo;t see</h3>
          <p>
            The GPS signal arrives <em>below the noise floor</em> — plot the received samples and
            they are indistinguishable from noise (a negative SNR). So how do you receive something
            you can&rsquo;t even see? That is the one genuinely new idea here; everything else is
            tools you have already built.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Correlate against a code you already know</h3>
          <p>
            Each satellite transmits a known pseudo-random (PRN) spreading code — the same kind of
            code the Spread Spectrum module spread data with. Correlate the received samples against
            that code and the <em>processing gain</em> lifts a sharp peak out of the noise. This is
            the spread-spectrum &ldquo;hide under the noise floor&rdquo; trick run in reverse: the
            despreader you already saw, used now to <em>acquire</em>. Integrate over more code
            periods and the peak climbs further out of the noise (the gain grows ~10·log₁₀ of the
            samples integrated), so a signal that vanished at one length reappears at another.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Where the peak sits is a distance</h3>
          <p>
            The <em>code phase</em> — how far the local code had to slide to line up with the buried
            one — is the signal&rsquo;s travel time, and travel time times the speed of light is a
            range. So the correlation isn&rsquo;t only detecting the signal; the peak&rsquo;s{' '}
            <em>position</em> is a ranging measurement, a <em>pseudorange</em>. It is the same
            cross-correlation-as-lag-finder you met in Cross-Correlation and TDOA, now read as a
            distance.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Two unknowns → a 2D search</h3>
          <p>
            You don&rsquo;t know the code phase (range) <em>or</em> the Doppler (which satellite,
            and its relative velocity), so acquisition searches both at once: a code-phase × Doppler
            correlation surface with a bright peak rising out of a flat, sub-noise field. Drag the
            true target and watch the peak move; drop the SNR or shorten the integration and watch
            it sink back into the noise. This surface is the radar range-Doppler map&rsquo;s sibling
            — the same 2D correlation search → peak → measurement, which is why both scenes draw it
            with the same component.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Four satellites → a position</h3>
          <p>
            Each acquired satellite gives one pseudorange; intersecting four of them fixes a
            position. That intersection is exactly the multilateration the GDOP Heatmap and TDOA
            Multilateration modules already teach (and GDOP describes how the satellite geometry
            sets the accuracy). The GPS fix reuses the positioning geometry you have already learned
            — this module stops at acquiring one satellite and links out rather than rebuilding it.
          </p>
        </section>

        <section className="rounded-md border border-signal-dim bg-surface-raised p-3 text-text">
          The &ldquo;aha&rdquo;: the signal is too weak to see — it&rsquo;s under the noise. You
          find it anyway by correlating against a code you already know, and <em>where</em> the
          correlation peaks tells you a distance.
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">Beyond this module</h3>
          <p>
            A real receiver layers much more on top: tracking loops (DLL/PLL) that lock and follow
            the code and carrier after acquisition, decoding the navigation message, and ionospheric
            and tropospheric range corrections. Those are whole topics of their own, left here as
            named directions rather than built. Restricted/encrypted signals and anything about
            spoofing or jamming are out of scope.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          The open civilian (C/A-style) spreading-code acquisition only. All signals and parameters
          are synthetic and illustrative — a synthetic PRN code, code phase in chips, Doppler
          normalized — with no real PRN assignments, frequencies, or ephemeris.
        </section>
      </div>
    </GlossedText>
  );
}
