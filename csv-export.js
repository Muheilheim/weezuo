/* Shared CSV export with a persistent download link and a visible copy fallback. */
(function () {
  "use strict";
  const dialog = document.createElement("dialog");
  dialog.id = "csv-export-dialog";
  dialog.setAttribute("aria-labelledby", "csv-export-title");
  dialog.innerHTML = '<div class="dialog-top"><span class="section-kicker">CURVE DATA</span><button type="button" class="icon-button" aria-label="Close CSV export">×</button></div>' +
    '<h2 id="csv-export-title">Your CSV is ready</h2><p id="csv-export-name"></p>' +
    '<p class="rl-small">If the download does not start, use Download CSV below. In browsers that block downloads, copy the data or save the text below as a .csv file.</p>' +
    '<div class="rl-actions"><a id="csv-export-download" class="rl-action">Download CSV ↓</a><button type="button" id="csv-export-copy" class="rl-action">Copy CSV</button></div>' +
    '<p id="csv-export-status" class="rl-small" role="status"></p>' +
    '<details><summary>View CSV data</summary><label for="csv-export-text" class="sr-only">CSV data</label><textarea id="csv-export-text" readonly spellcheck="false" rows="8"></textarea></details>';
  document.body.append(dialog);
  const link = dialog.querySelector("#csv-export-download");
  const text = dialog.querySelector("#csv-export-text");
  const status = dialog.querySelector("#csv-export-status");
  let objectURL = null;
  dialog.querySelector(".icon-button").addEventListener("click", () => dialog.close());
  dialog.querySelector("#csv-export-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text.value);
      status.textContent = "CSV copied. Paste it into a text file and save with the .csv extension.";
    } catch {
      dialog.querySelector("details").open = true;
      text.focus(); text.select();
      status.textContent = "Select and copy the CSV text below, then save it with the .csv extension.";
    }
  });
  window.CSVExport = {
    save(name, rows) {
      const csv = "\uFEFF" + rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(",")).join("\r\n");
      // Small CSVs use a self-contained URL, also usable by download handlers
      // that cannot resolve a page-owned Blob. Large datasets retain a Blob URL.
      const previousURL = objectURL;
      const dataURL = csv.length < 250000 ? "data:text/csv;charset=utf-8," + encodeURIComponent(csv) : null;
      objectURL = dataURL ? null : URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8"}));
      if (previousURL) setTimeout(() => URL.revokeObjectURL(previousURL), 60000);
      link.href = dataURL || objectURL; link.download = name;
      text.value = csv;
      dialog.querySelector("#csv-export-name").textContent = name;
      dialog.querySelector("details").open = false;
      status.textContent = "Download requested. Check your browser's downloads, or use the options above.";
      if (!dialog.open) dialog.showModal();
      link.click();
    }
  };
})();
