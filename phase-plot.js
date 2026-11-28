/* Render the raw spectrum, peak markers and an independent reference strip. */
(function () {
  "use strict";
  function create(canvas, view) {
    const ctx = canvas.getContext("2d");
    let data, projection;

    function tickStep(span, count) {
      const aim = span / count;
      const unit = 10 ** Math.floor(Math.log10(aim));
      const ratio = aim / unit;
      return [1, 2, 2.5, 5, 10].find(n => ratio <= n) * unit;
    }

    function ticks(low, high, count) {
      const step = tickStep(high - low, count);
      const plain = [];
      for (let i = Math.ceil(low / step); i * step <= high + step * 1e-8; i += 1) {
        plain.push(Number((i * step).toPrecision(12)));
      }
      return {step, plain};
    }

    function label(n, precision, locale) {
      if (!Number.isFinite(n)) return "—";
      if (Math.abs(n) >= 100000 || (n && Math.abs(n) < 0.0001)) return n.toExponential(1);
      return new Intl.NumberFormat(locale, {maximumFractionDigits: precision, useGrouping: false}).format(n);
    }

    function axisLabels(range, count, locale) {
      const {step, plain} = ticks(range[0], range[1], count);
      const precision = Math.max(0, Math.ceil(-Math.log10(step)) + 1);
      return plain.map(value => [value, label(value, Math.min(8, precision), locale)]);
    }

    function extent(points) {
      let min = Infinity, max = -Infinity;
      for (const point of points) {
        min = Math.min(min, point[1]);
        max = Math.max(max, point[1]);
      }
      return [min, max];
    }

    function segment(x1, y1, x2, y2) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    function trace(points, toX, toY) {
      ctx.beginPath();
      ctx.moveTo(toX(points[0][0]), toY(points[0][1]));
      for (let i = 1; i < points.length; i += 1) ctx.lineTo(toX(points[i][0]), toY(points[i][1]));
      ctx.stroke();
    }

    function render() {
      if (!data || !ctx) return;
      const {width, height} = canvas.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const styles = getComputedStyle(canvas);
      const color = name => styles.getPropertyValue("--" + name).trim();
      const points = data.points;
      const xFirst = points?.[0][0] ?? 0, xLast = points?.at(-1)[0] ?? 1;
      const xMargin = xFirst === xLast ? Math.max(.01, Math.abs(xFirst) * .05) : 0;
      const xMin = xFirst - xMargin, xMax = xLast + xMargin;
      let [yLow, yHigh] = points ? extent(points) : [0, 1];
      for (const curve of data.curves ?? []) {
        const [low, high] = extent(curve.points);
        yLow = Math.min(yLow, low);
        yHigh = Math.max(yHigh, high);
      }
      if (data.sticks) yLow = Math.min(0, yLow);
      const span = yHigh - yLow || Math.abs(yHigh) * .1 || 1;
      const yMin = yLow >= 0 && yLow < span * .10 ? 0 : yLow - span * .06;
      const yMax = yHigh + span * .13;
      const ref = data.reference?.inRange || [];
      const compact = width < 440;
      const labelsY = axisLabels([yMin, yMax], 5, data.locale);
      ctx.font = "11px " + styles.getPropertyValue("--sans");
      const inset = Math.max(...labelsY.map(([, text]) => ctx.measureText(text).width), 22);
      const left = inset + 26, right = width - 16, top = 16, bottom = height - (ref.length ? 68 : 44);
      const toX = x => left + (right - left) * (data.reverse ? xMax - x : x - xMin) / (xMax - xMin);
      const toY = y => bottom - (bottom - top) * (y - yMin) / (yMax - yMin);
      projection = {left, right, top, bottom, toX, toY, xMin, xMax};

      ctx.strokeStyle = color("phase-grid");
      ctx.fillStyle = color("muted");
      ctx.lineWidth = 1;
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      for (const [y, text] of labelsY) {
        const screen = toY(y);
        ctx.setLineDash([3, 4]);
        segment(left, screen, right, screen);
        if (points) ctx.fillText(text, left - 7, screen);
      }
      const xLine = ref.length ? bottom + 24 : bottom;
      ctx.textAlign = "center";
      for (const [x, text] of axisLabels([xMin, xMax], compact ? 4 : 8, data.locale)) {
        const screen = toX(x);
        ctx.setLineDash([3, 4]);
        segment(screen, top, screen, xLine);
        if (points) ctx.fillText(text, screen, xLine + 12);
      }
      ctx.setLineDash([]);
      ctx.strokeStyle = color("control");
      segment(left, top, left, bottom);
      segment(left, bottom, right, bottom);
      if (!points) return;
      ctx.fillText(data.xLabel, (left + right) / 2, height - 11);
      ctx.save();
      ctx.translate(10, (top + bottom) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(data.yLabel, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(left, top, right - left, bottom - top);
      ctx.clip();
      if (data.blank) {
        const [blankMin, blankMax] = extent(data.blank);
        const blankSpan = blankMax - blankMin || 1;
        const mapBlank = y => toY(yLow + (y - blankMin) / blankSpan * .50 * span);
        ctx.strokeStyle = color("phase-blank");
        ctx.lineWidth = 1.25;
        ctx.setLineDash([4, 3]);
        trace(data.blank, toX, mapBlank);
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = color("phase-sample");
      ctx.lineJoin = "round";
      ctx.lineWidth = 1.65;
      if (data.sticks) {
        for (const [x, y] of points) segment(toX(x), toY(0), toX(x), toY(y));
      } else if (data.scatter) {
        ctx.fillStyle = color("phase-sample");
        for (const [x, y] of points) {
          ctx.beginPath();
          ctx.arc(toX(x), toY(y), 2.7, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        trace(points, toX, toY);
      }
      for (const curve of data.curves ?? []) {
        if (!curve.points.length) continue;
        ctx.strokeStyle = color(curve.color);
        ctx.setLineDash(curve.dashed ? [5, 4] : []);
        ctx.lineWidth = 1.35;
        if (curve.sticks) {
          for (const [x, y] of curve.points) segment(toX(x), toY(0), toX(x), toY(y));
        } else {
          trace(curve.points, toX, toY);
        }
        ctx.setLineDash([]);
      }
      ctx.restore();

      if (ref.length) {
        ctx.strokeStyle = color("control");
        ctx.lineWidth = 1;
        segment(left, xLine, right, xLine);
        ctx.strokeStyle = color("phase-reference");
        ctx.fillStyle = color("phase-reference");
        for (const line of ref) {
          const center = Math.min(xMax, Math.max(xMin, line.center ?? (line.low + line.high) / 2));
          const low = Math.max(xMin, line.low), high = Math.min(xMax, line.high);
          if (line.high > line.low && line.center == null) {
            const xStart = toX(low), xEnd = toX(high);
            ctx.globalAlpha = .42;
            ctx.fillRect(Math.min(xStart, xEnd), xLine - 11, Math.max(2, Math.abs(xEnd - xStart)), 7);
            ctx.globalAlpha = 1;
          } else {
            const leg = 7 + 11 * (line.intensity == null ? .60 : Math.sqrt(line.intensity / 100));
            segment(toX(center), xLine - leg, toX(center), xLine);
          }
        }
      }

      const annotated = [];
      const ranked = data.peaks.slice().sort((a, b) => b.prominence - a.prominence);
      for (const peak of ranked) {
        if (!data.markers && peak !== data.focusPeak) continue;
        const screenX = toX(peak.x), screenY = toY(peak.y);
        const focused = peak === data.focusPeak;
        const ink = peak.blank ? color("phase-blank") : color("phase-reference");
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(screenX, screenY, focused ? 5 : 2.8, 0, Math.PI * 2);
        ctx.fill();
        if (focused) {
          ctx.strokeStyle = ink;
          ctx.setLineDash([3, 4]);
          segment(screenX, screenY + 5, screenX, bottom);
          ctx.setLineDash([]);
        }
        const text = label(peak.x, data.digits, data.locale);
        const textWidth = ctx.measureText(text).width;
        const labelY = Math.max(top + 3, screenY - 11);
        const box = [screenX - textWidth / 2 - 5, screenX + textWidth / 2 + 5, labelY];
        const overlaps = annotated.some(other =>
          box[0] < other[1] && box[1] > other[0] && Math.abs(box[2] - other[2]) < 14);
        if (focused || (!overlaps && annotated.length < (compact ? 6 : 12) && box[0] >= left && box[1] <= right)) {
          ctx.fillText(text, screenX, labelY);
          annotated.push(box);
        }
      }
    }

    canvas.addEventListener("pointermove", event => {
      if (!projection || !data?.points) return;
      const {left, right, xMin, xMax} = projection;
      const pixel = event.clientX - canvas.getBoundingClientRect().left;
      if (pixel < left || pixel > right) {
        view.textContent = "";
        return;
      }
      const fraction = (pixel - left) / (right - left);
      const x = xMin + (data.reverse ? 1 - fraction : fraction) * (xMax - xMin);
      const i = Math.min(PhaseModel.lowerBound(data.points, x), data.points.length - 1);
      const prev = data.points[Math.max(0, i - 1)], next = data.points[i];
      const point = Math.abs(prev[0] - x) < Math.abs(next[0] - x) ? prev : next;
      view.textContent = data.xLabel + " " + label(point[0], data.digits, data.locale) +
        "   ·   " + data.yLabel + " " + label(point[1], 5, data.locale);
    });
    canvas.addEventListener("pointerleave", () => { view.textContent = ""; });
    canvas.addEventListener("click", event => {
      if (!projection || !data?.points) return;
      const pixel = event.clientX - canvas.getBoundingClientRect().left;
      let selected = null, distance = 13;
      for (const peak of data.peaks) {
        const current = Math.abs(projection.toX(peak.x) - pixel);
        if (current < distance) {
          distance = current;
          selected = peak;
        }
      }
      if (selected) data.onPick?.(selected);
    });
    new ResizeObserver(render).observe(canvas);
    return {draw(options) {
      data = options;
      view.textContent = "";
      render();
    }};
  }

  window.PhasePlot = Object.assign(
    create(document.getElementById("phase-chart"), document.getElementById("phase-probe")), {create}
  );
})();
