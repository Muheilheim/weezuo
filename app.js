(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const profile = window.RESEARCH_PROFILE;
  const bibliography = window.RESEARCH_PUBLICATIONS;
  const node = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  };
  const externalLink = (label, value, className = "") => {
    const link = node("a", className, label);
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") return null;
      link.href = url.href;
    } catch { return null; }
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  };
  const addLink = (parent, label, url, className) => {
    const link = externalLink(label, url, className);
    if (link) parent.append(link);
  };
  const readPreference = (key, fallback) => {
    try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
  };
  let theme = readPreference("weiwei-research-theme", "light") === "dark" ? "dark" : "light";
  let toastTimer;
  let lastCitationTrigger;
  const dialog = $("#citation-dialog");
  function toast(message) {
    clearTimeout(toastTimer);
    $("#toast").textContent = message;
    $("#toast").classList.add("visible");
    toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 4000);
  }
  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    $("#theme-button").setAttribute("aria-pressed", String(theme === "dark"));
    $("#theme-button").setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    $('meta[name="theme-color"]').content = theme === "dark" ? "#18241f" : "#f7f7f2";
  }
  function closeMenu() {
    $("#navigation").classList.remove("open");
    $("#menu-button").setAttribute("aria-expanded", "false");
    $("#menu-button").setAttribute("aria-label", "Open navigation");
  }
  $("#theme-button").addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    try { localStorage.setItem("weiwei-research-theme", theme); } catch { /* Storage is optional. */ }
    applyTheme();
  });
  $("#menu-button").addEventListener("click", () => {
    const open = $("#navigation").classList.toggle("open");
    $("#menu-button").setAttribute("aria-expanded", String(open));
    $("#menu-button").setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  $("#navigation").addEventListener("click", (event) => { if (event.target.closest("a")) closeMenu(); });
  document.addEventListener("click", (event) => { if (!event.target.closest(".header")) closeMenu(); });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeMenu();
    if (dialog.open) { event.preventDefault(); dialog.close(); }
  });
  $("#close-dialog").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (lastCitationTrigger?.isConnected) lastCitationTrigger.focus({ preventScroll: true });
  });
  $("#copy-citation").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("#bibtex-text").value); toast("BibTeX copied to clipboard."); }
    catch {
      $("#bibtex-text").focus();
      $("#bibtex-text").select();
      toast("Copy unavailable. The BibTeX is selected for manual copying.");
    }
  });
  $("#copy-email").addEventListener("click", async () => {
    const email = $("#email-link").textContent.replace("↗", "").trim();
    try { await navigator.clipboard.writeText(email); toast("Email address copied."); }
    catch { toast("Copy unavailable. Please select the email address to copy it."); }
  });
  const photo = $("#profile-photo");
  function showPhotoFallback() { photo.hidden = true; $(".portrait-fallback").hidden = false; }
  photo.addEventListener("error", showPhotoFallback);
  if (photo.complete && !photo.naturalWidth) showPhotoFallback();
  $("#year").textContent = new Date().getFullYear();
  if (profile) {
    document.querySelectorAll("[data-profile]").forEach((element) => {
      const value = profile[element.dataset.profile];
      if (typeof value === "string") element.textContent = value;
    });
    if (/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(profile.email || "")) $("#email-link").href = "mailto:" + profile.email;
  }
  applyTheme();

  // Visitors read only our public snapshot. Provider credentials stay on the server.
  const metricsRoot = $("#metrics");
  if (metricsRoot) {
    let metrics = JSON.parse($("#metrics-fallback").textContent);
    let metricPeriod = "all";
    const validMetrics = (data) => data?.schemaVersion === 1 && data.authorId === "ynl-iTQAAAAJ" &&
      Number.isInteger(data.recentSince) && data.recentSince >= 2000 && data.recentSince <= new Date().getUTCFullYear() &&
      typeof data.checkedAt === "string" && Number.isFinite(Date.parse(data.checkedAt)) &&
      Date.parse(data.checkedAt) <= Date.now() + 86400000 &&
      ["citations", "hIndex", "i10Index"].every(key => Number.isSafeInteger(data.all?.[key]) && data.all[key] >= 0 && Number.isSafeInteger(data.recent?.[key]) && data.recent[key] >= 0 && data.recent[key] <= data.all[key]);
    function renderMetrics() {
      const values = metrics[metricPeriod];
      $("#metric-citations").textContent = values.citations.toLocaleString("en-US");
      $("#metric-h-index").textContent = values.hIndex.toLocaleString("en-US");
      $("#metric-i10-index").textContent = values.i10Index.toLocaleString("en-US");
      $("#metrics-period-label").textContent = metricPeriod === "all" ? "All time" : "Since " + metrics.recentSince;
      const checked = $("#metrics-checked");
      checked.dateTime = metrics.checkedAt;
      checked.textContent = new Intl.DateTimeFormat("en-GB", {day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(metrics.checkedAt));
      document.querySelectorAll("[data-metrics-period]").forEach(button => {
        button.setAttribute("aria-pressed", String(button.dataset.metricsPeriod === metricPeriod));
        if (button.dataset.metricsPeriod === "recent") button.textContent = "Since " + metrics.recentSince;
      });
    }
    document.querySelectorAll("[data-metrics-period]").forEach(button => button.addEventListener("click", () => {
      metricPeriod = button.dataset.metricsPeriod;
      renderMetrics();
    }));
    renderMetrics();
    metricsRoot.dataset.snapshot = "fallback";
    fetch("./scholar-metrics.json", {cache:"no-store",signal:AbortSignal.timeout(10000)})
      .then(response => { if (!response.ok) throw new Error("Snapshot unavailable"); return response.json(); })
      .then(data => {
        if (!validMetrics(data) || Date.parse(data.checkedAt) < Date.parse(metrics.checkedAt)) return;
        metrics = data;
        renderMetrics();
        metricsRoot.dataset.snapshot = "loaded";
      })
      .catch(() => { metricsRoot.dataset.snapshot = "fallback"; });
  }

  // Keep the real, static publication links usable if the bibliography does not load.
  if (!Array.isArray(bibliography?.publications) || !bibliography.publications.length) return;
  const papers = bibliography.publications;
  const search = $("#publication-search");
  const yearFilter = $("#year-filter");
  const list = $("#publication-list");
  const pageSize = 6;
  let scope = "selected";
  let visibleCount = pageSize;
  const normalize = (value) => String(value).normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
  const searchable = new Map(papers.map((paper) => [paper.id, normalize([paper.title, paper.authors.map(a => a.name).join(" "), paper.journal, paper.year, paper.doi].join(" "))]));
  const isWeiwei = (author) => author.family.toLowerCase() === "zuo" && author.given.replace(/[\s‐‑–-]/g, "").toLowerCase() === "weiwei";
  function authorText(paper, full = false) {
    const paragraph = node("p", "pub-authors");
    let indices = paper.authors.map((_, index) => index);
    if (!full && indices.length > 6) {
      indices = [...new Set([0, 1, 2, paper.authors.findIndex(isWeiwei), paper.authors.length - 1])].filter(i => i >= 0).sort((a, b) => a - b);
    }
    indices.forEach((index, position) => {
      if (position) paragraph.append(document.createTextNode(index > indices[position - 1] + 1 ? ", …, " : ", "));
      const author = paper.authors[index];
      paragraph.append(node(isWeiwei(author) ? "strong" : "span", "", author.name));
    });
    return paragraph;
  }
  function venue(paper) {
    let detail = paper.journal;
    if (paper.volume) detail += " " + paper.volume;
    if (paper.issue) detail += "(" + paper.issue + ")";
    if (paper.pages) detail += ", " + paper.pages.replace(/-/g, "–");
    return detail + " (" + paper.year + ").";
  }
  function bibtex(paper) {
    const escape = (value) => String(value).replace(/[{}]/g, "").replace(/&/g, "\\&");
    const fields = [
      "title = {{" + escape(paper.title) + "}}",
      "author = {" + paper.authors.map(a => escape(a.family) + ", " + escape(a.given)).join(" and ") + "}",
      "journal = {" + escape(paper.journal) + "}",
      "year = {" + paper.year + "}"
    ];
    if (paper.volume) fields.push("volume = {" + escape(paper.volume) + "}");
    if (paper.issue) fields.push("number = {" + escape(paper.issue) + "}");
    if (paper.pages) fields.push("pages = {" + escape(paper.pages).replace(/[–-]/g, "--") + "}");
    fields.push("doi = {" + paper.doi + "}", "url = {" + paper.url + "}");
    if (paper.correction) fields.push("note = {Correction: " + paper.correction.url + "}");
    return "@article{Zuo" + paper.year + "_" + paper.scholarIndex + ",\n  " + fields.join(",\n  ") + "\n}";
  }
  function addPublicationLinks(parent, paper) {
    addLink(parent, "DOI ↗", paper.url);
    addLink(parent, "Google Scholar ↗", paper.scholarUrl);
    if (paper.correction) addLink(parent, "Correction ↗", paper.correction.url, "correction-link");
  }
  function openCitation(paper, trigger) {
    lastCitationTrigger = trigger;
    $("#citation-title").textContent = paper.title;
    const authors = authorText(paper, true);
    $("#citation-authors").replaceChildren(...authors.childNodes);
    $("#citation-venue").textContent = venue(paper) + (paper.authorNameNote ? " " + paper.authorNameNote : "");
    $("#citation-links").replaceChildren();
    addPublicationLinks($("#citation-links"), paper);
    $("#bibtex-text").value = bibtex(paper);
    dialog.showModal();
    $("#close-dialog").focus();
  }
  function publicationRow(paper) {
    const row = node("article", "publication");
    row.id = paper.id;
    const main = node("div", "pub-main");
    const title = node("h3");
    addLink(title, paper.title, paper.url);
    main.append(node("p", "pub-journal", paper.journal.toUpperCase()), title, authorText(paper), node("p", "pub-citation", venue(paper)));
    const links = node("div", "pub-links");
    addPublicationLinks(links, paper);
    const cite = node("button", "", "Cite");
    cite.type = "button";
    cite.setAttribute("aria-haspopup", "dialog");
    cite.setAttribute("aria-label", "Citation for " + paper.title);
    cite.addEventListener("click", () => openCitation(paper, cite));
    links.append(cite);
    main.append(links);
    row.append(node("div", "pub-year", String(paper.year)), main);
    return row;
  }
  function resetFilters() {
    scope = "all";
    search.value = "";
    yearFilter.value = "all";
    visibleCount = pageSize;
    render();
    search.focus();
  }
  function render() {
    const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    const filtered = papers.filter(p => (scope === "all" || p.selected) && (yearFilter.value === "all" || p.year === Number(yearFilter.value)) && words.every(word => searchable.get(p.id).includes(word)));
    const visible = filtered.slice(0, visibleCount);
    list.replaceChildren(...visible.map(publicationRow));
    if (!visible.length) {
      const empty = node("div", "empty-state");
      const reset = node("button", "", "Reset filters");
      reset.type = "button";
      reset.addEventListener("click", resetFilters);
      empty.append(node("p", "", "No publications match these filters."), reset);
      list.append(empty);
    }
    document.querySelectorAll("[data-scope]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.scope === scope)));
    $("#clear-search").hidden = !search.value;
    $("#load-more").hidden = visible.length >= filtered.length;
    const qualifier = words.length || yearFilter.value !== "all" ? " matching" : scope === "selected" ? " selected" : "";
    $("#results-status").textContent = "Showing " + visible.length + " of " + filtered.length + qualifier + " publication" + (filtered.length === 1 ? "" : "s");
  }
  $("#selected-count").textContent = papers.filter(p => p.selected).length;
  $("#all-count").textContent = papers.length;
  [...new Set(papers.map(p => p.year))].sort((a, b) => b - a).forEach(year => {
    const option = node("option", "", String(year));
    option.value = String(year);
    yearFilter.append(option);
  });
  document.querySelectorAll("[data-scope]").forEach(button => button.addEventListener("click", () => {
    scope = button.dataset.scope;
    search.value = "";
    yearFilter.value = "all";
    visibleCount = pageSize;
    render();
  }));
  search.addEventListener("input", () => { scope = "all"; visibleCount = pageSize; render(); });
  yearFilter.addEventListener("change", () => { scope = "all"; visibleCount = pageSize; render(); });
  $("#clear-search").addEventListener("click", () => { search.value = ""; visibleCount = pageSize; render(); search.focus(); });
  $("#load-more").addEventListener("click", () => {
    const oldCount = list.children.length;
    visibleCount += pageSize;
    render();
    list.children[oldCount]?.querySelector("h3 a")?.focus({ preventScroll: true });
  });
  render();
  $("#publication-controls").hidden = false;
})();
