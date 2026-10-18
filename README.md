# Weiwei Zuo — research homepage

English, German and Chinese academic homepage for Weiwei Zuo, Institute for Photovoltaics, University of Stuttgart.

Website: https://muheilheim.github.io/weezuo/ (English), https://muheilheim.github.io/weezuo/de.html (Deutsch), https://muheilheim.github.io/weezuo/zh.html (中文)

## Site contents

Biography, a compact tabbed calculator for combined resistance effects, bandgap–Jsc, EQE integration, PL-derived internal voltage and TRPL decay fitting with interactive plots and CSV export, three illustrated research themes, 44 journal publications, eight selected papers, citation details and BibTeX, Google Scholar statistics, university news, and public professional contact information.

The PL calculator accepts multi-column steady-state CSV/TSV/TXT spectra or pasted data, integrates them over a common wavelength interval, and compares them against a selected reference. Arbitrary-unit PL gives relative voltage changes; absolute internal voltage requires independent calibration. TRPL accepts time–intensity columns, fits empirical single/double exponentials and estimates relative transient internal voltage; absolute voltage requires an independently calibrated value at the transient reference time. Data stays in the browser.

Bandgap analysis reuses the existing EQE and PL imports and adds UV–Vis–NIR Tauc fitting and UPS/IPES onset arithmetic within the existing five calculator tabs. It distinguishes optical intercepts, response edges, PL emission energies and electronic bandgaps, with explicit units, assumptions and independent energy offsets. PL includes clearly labelled synthetic reference spectra. Graph legends identify measured curves, fits and analysis conditions. TRPL uses joint multi-start double-exponential optimization; explicit header-unit conflicts are rejected. These calculators support model-based analysis, not instrument calibration or a guarantee of experimental accuracy.

The website uses static HTML, CSS, and JavaScript with no frontend framework or external tracking script. German and Chinese static pages are generated from index.html with node qa/generate-language-pages.mjs; dynamic interface translations are in i18n.js. Publication titles and citation data retain their original wording. All website assets are stored in this repository. GitHub Pages can publish from the main branch and repository root. The .nojekyll file disables Jekyll processing.

## Sources and maintenance

- Institutional profile: https://www.ipv.uni-stuttgart.de/en/institute/team/Zuo/
- Google Scholar: https://scholar.google.com/citations?user=ynl-iTQAAAAJ&hl=en
- ORCID: https://orcid.org/0000-0002-9135-1628

The current bibliography was checked on 31 August 2026; citation statistics were checked on 2026-09-29. Duplicate records were consolidated, and two corrections are linked to the original papers. Author names follow publisher metadata; the 2014 Wei Zuo name variant is explained in its citation dialog.

Edit profile.js and the corresponding static text in index.html to update the biography. Citation statistics are loaded from scholar-metrics.json; no scheduled metric refresh is configured in this initial publication. API credentials must never be committed to this repository. Publication records and the downloadable bibliography require separate review when updated.

The portrait is from the institutional team profile. The three research-card images are conceptual illustrations generated with OpenAI's built-in image-generation tool and do not represent measured data. This repository does not grant rights to third-party images or article content.
