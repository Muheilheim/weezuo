# Weiwei Zuo — research homepage

English, German and Chinese academic homepage for Weiwei Zuo, Institute for Photovoltaics, University of Stuttgart.

Website: https://muheilheim.github.io/weezuo/ (English), https://muheilheim.github.io/weezuo/de.html (Deutsch), https://muheilheim.github.io/weezuo/zh.html (中文)

## Site contents

Biography, a compact tabbed calculator for combined resistance effects, bandgap–Jsc, EQE integration, PL-derived internal voltage and TRPL decay fitting with interactive plots and CSV export, three illustrated research themes, 44 journal publications, eight selected papers, citation details and BibTeX, Google Scholar statistics, university news, and public professional contact information.

The PL calculator accepts multi-column steady-state CSV/TSV/TXT spectra or pasted data, integrates them over a common wavelength interval, and compares them against a selected reference. Arbitrary-unit PL gives relative voltage changes; absolute internal voltage requires independent calibration. TRPL accepts time–intensity columns, fits empirical single/double exponentials and estimates relative transient internal voltage; absolute voltage requires an independently calibrated value at the transient reference time. Data stays in the browser.

Bandgap analysis reuses the existing EQE and PL imports and adds UV–Vis–NIR Tauc fitting and UPS/IPES onset arithmetic within the six calculator tabs. It distinguishes optical intercepts, response edges, PL emission energies and electronic bandgaps, with explicit units, assumptions and independent energy offsets. PL includes clearly labelled synthetic reference spectra. Graph legends identify measured curves, fits and analysis conditions. TRPL uses joint multi-start double-exponential optimization; explicit header-unit conflicts are rejected. These calculators support model-based analysis, not instrument calibration or a guarantee of experimental accuracy.

The PL tab also provides PLQY-derived internal-voltage pseudo J-V: a single calibrated PLQY point with an assumed constant recombination ideality factor, or reconstruction from intensity-dependent PLQY. It reports iVoc, JG-normalized pFF, maximum power and pseudo-efficiency with labelled curves, measured-range coverage, synthetic reference data and CSV export. The method requires steady-state open-circuit measurements, consistent temperature/optics and an independently supplied radiative saturation current. A single PLQY point alone does not determine the curve shape; pseudo-efficiency is a model-derived quantity. Explicit CSV units are checked and unsupported or conflicting units are rejected.

The website uses static HTML, CSS, and JavaScript with no frontend framework or external tracking script. German and Chinese static pages are generated from index.html with node qa/generate-language-pages.mjs; dynamic interface translations are in i18n.js. Publication titles and citation data retain their original wording. All website assets are stored in this repository. GitHub Pages can publish from the main branch and repository root. The .nojekyll file disables Jekyll processing.

## Sources and maintenance

- Institutional profile: https://www.ipv.uni-stuttgart.de/en/institute/team/Zuo/
- Google Scholar: https://scholar.google.com/citations?user=ynl-iTQAAAAJ&hl=en
- ORCID: https://orcid.org/0000-0002-9135-1628

The current bibliography was checked on 31 August 2026; citation statistics were checked on 2026-09-29. Duplicate records were consolidated, and two corrections are linked to the original papers. Author names follow publisher metadata; the 2014 Wei Zuo name variant is explained in its citation dialog.

Edit profile.js and the corresponding static text in index.html to update the biography. Citation statistics are loaded from scholar-metrics.json; no scheduled metric refresh is configured in this initial publication. API credentials must never be committed to this repository. Publication records and the downloadable bibliography require separate review when updated.

The portrait is from the institutional team profile. The three research-card images are conceptual illustrations generated with OpenAI's built-in image-generation tool and do not represent measured data. This repository does not grant rights to third-party images or article content.

## Calculator update — 8 November 2026

File controls now precede pasted data in UV–Vis, PL, EQE, TRPL and PLQY pseudo J–V. PL imports are expanded above calibration settings. Main calculations share a consistent button style, 44 px minimum height and keyboard-focus feedback. Recalculating loaded PL spectra preserves the selected interval and calibration values. PL guidance explains single-spectrum references and high backgrounds; explicit UV absorbance headers initialize the signal and axis controls. The underlying numerical equations are unchanged. Raw measurement files and local test reports are not included in this repository.

## Layout follow-up — 9 November 2026

The measurement calculators follow the established EQE/resistance layout: data import and parameters on the left, results and plots on the right. UV–Vis and UPS/IPES use the same shared shell; PL retains the existing sidebar. On narrow screens the sections stack. File controls stay above pasted data and primary calculation actions keep their common style. Script and stylesheet URLs include content versions in English, German and Chinese pages.

## Unified calculator workspaces — 9 November 2026

English, German and Chinese share a consistent input/result layout across the five main modules and ten tools. File import remains visible above editable data; calculations and exports have consistent panel positions. Summary metrics precede plots. UV retains its fixed result window, while EQE and PL bandgap subtools appear below their respective main panels and reuse the existing spectra. Parameters and results use independent scrolling on desktop and stack naturally on narrow screens. Numerical models and equations are unchanged.

The release package passes 387 interaction/import checks. Local browser checks cover 90 distinct language/viewport/tool combinations and keyboard scrolling, mode guards, empty-data feedback and the simulated 1.55 eV UV example. Physical phones, other browser engines and completed native CSV downloads were not tested in this release.


## Measured J-V and spectrum energy conversion — 9 November 2026

The sixth calculator imports two-column measured J-V or I-V text files, separates monotonic scans, and reports PCE, Jsc, Voc, FF and apparent differential Rs/Rsh with fit windows, counts and R². It supports voltage/current units, active area, irradiance, and CSV export. Intersections are interpolated without endpoint extrapolation. Apparent slope resistances are not unique equivalent-circuit parameters.

UV-Vis and PL reuse their imported spectra for nm-to-eV preview and export, preserving the original samples in increasing energy order. UV absorbance and absorption coefficient retain their ordinate values; PL offers a per-nm-to-per-eV Jacobian or horizontal-axis-only display. Bin counts require bin-width normalization before density conversion. User files remain in the browser.

Method references: Green, Solid-State Electronics 24 (1981), DOI 10.1016/0038-1101(81)90062-9; Smestad et al., Solar Energy Materials and Solar Cells 92 (2008), DOI 10.1016/j.solmat.2008.01.003; Tada, Physica Status Solidi A 215 (2018), DOI 10.1002/pssa.201800448; Mooney and Kambhampati, J. Phys. Chem. Lett. 4 (2013), DOI 10.1021/jz401508t, together with their official 2014 absorption correction, DOI 10.1021/jz502066v.


## Measured J–V comparison (2026-11-09)

Module 06 sends the selected measured scan to module 03 as a saved comparison snapshot. J–V/P–V overlays and a live Voc/Jsc/FF/PCE table keep measured and simulated values separate. An explicit starting-model action assumes the apparent slope resistances are circuit inputs, retains user-selected n/T, and algebraically calibrates ideal reference Jph and Voc to the measured endpoints. It is not a unique full-curve fit; incompatible or out-of-range inputs are rejected without clamping. CSV preserves scan provenance, fit windows and assumptions. Governing equation: Green (1981), doi:10.1016/0038-1101(81)90062-9; apparent-resistance limitation: Tada (2018), doi:10.1002/pssa.201800448.

## Signed-voltage measured curves (2026-11-10)

Module 06 accepts either voltage polarity. Voc retains its original sign; curves, power, slope fits and module 03 comparisons use the positive generating-voltage coordinate and retain signed provenance in the interface and CSV. Extra zero crossings are accepted only if all subsequent generating-current excursions remain at or below 0.1% of Jsc; the first crossing from 0 V is used with an explicit warning. This software threshold is not a calibrated instrument uncertainty. Ambiguous branches remain rejected. Valid input remains previewable when parameters cannot be extracted; no endpoint extrapolation is applied.

## Full calculator results (2026-11-10)

Results and charts expand with their content and scroll with the page. On wider screens the result column sets the row height; longer input forms scroll within the matching left column. On narrow screens input panels have a bounded height while result panels remain fully expanded. Numerical calculations are unchanged.
