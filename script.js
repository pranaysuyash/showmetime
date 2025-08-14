/* TimeLab — Interactive Analog Clock (Vanilla JS) */
(() => {

  const state = {
    mode: "normal", // "normal" | "interactive"
    showDigital: true,
    showSeconds: true,
    hourCycle: 24, // 12 | 24
    theme: "blue",
    timeZone: "auto", // "auto" or IANA tz string

    // interactive
    interactive: {
      showHour: true,
      showMinute: true,
      showSecond: false,
      showNumbers: true,
      allowDrag: true,
      dragMode: "independent", // "independent" | "snapped"
      spotlight: true,
      time: { h: 10, m: 10, s: 0 },
    },
  };

  const svgNS = "http://www.w3.org/2000/svg";
  const clockSvg = document.getElementById("clockSvg");
  const digitalEl = document.getElementById("digital");
  const timezoneEl = document.getElementById("timezoneLabel");

  const toggleControlsBtn = document.getElementById("toggleControls");
  const controlsPanel = document.getElementById("controlsPanel");
  const closeControlsBtn = document.getElementById("closeControls");

  const modeBtns = Array.from(document.querySelectorAll('.toolbar [data-mode]'));

  const btnHourCycle = Array.from(document.querySelectorAll('[data-hour-cycle]'));
  const toggleDigital = document.getElementById("toggleDigital");
  const toggleSeconds = document.getElementById("toggleSeconds");
  const themeSwatches = document.getElementById("themeSwatches");
  const timezoneSelect = document.getElementById("timezoneSelect");
  const toggleAds = document.getElementById("toggleAds");
  const adBanner = document.getElementById("adBanner");

  const iShowHour = document.getElementById("iShowHour");
  const iShowMinute = document.getElementById("iShowMinute");
  const iShowSecond = document.getElementById("iShowSecond");
  const iShowNumbers = document.getElementById("iShowNumbers");
  const iAllowDrag = document.getElementById("iAllowDrag");
  const iSpotlight = document.getElementById("iSpotlight");
  const dragModeBtns = Array.from(document.querySelectorAll('[data-drag-mode]'));
  const btnReadTime = document.getElementById("btnReadTime");
  const btnSetNow = document.getElementById("btnSetNow");
  const btnRandomTime = document.getElementById("btnRandomTime");
  // reserved for future quiz features

  const THEMES = ["blue", "mint", "purple", "sunset", "slate", "contrast"];

  let lastTickTs = 0;
  let components = null; // references to SVG parts
  let spot = null; // spotlight elements

  function init() {
    renderThemeSwatches();
    buildClock();
    wireUI();
    updateTimezoneLabel();
    requestAnimationFrame(tick);
  }

  function renderThemeSwatches() {
    themeSwatches.innerHTML = "";
    THEMES.forEach((t, idx) => {
      const btn = document.createElement("button");
      btn.className = "swatch";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-label", `${t} theme`);
      btn.style.background = themePreviewColor(t);
      btn.dataset.theme = t;
      if (t === state.theme) btn.setAttribute("aria-selected", "true");
      btn.addEventListener("click", () => {
        state.theme = t;
        document.body.className = `theme-${t}`;
        Array.from(themeSwatches.children).forEach((el) => el.setAttribute("aria-selected", String(el === btn)));
      });
      themeSwatches.appendChild(btn);
      if (idx === 0) document.body.className = `theme-${t}`; // default
    });
  }

  function themePreviewColor(theme) {
    switch (theme) {
      case "mint": return "linear-gradient(90deg, #67e8c9, #0c1b16)";
      case "purple": return "linear-gradient(90deg, #c084fc, #160d1d)";
      case "sunset": return "linear-gradient(90deg, #f59e0b, #1b0d0b)";
      case "slate": return "linear-gradient(90deg, #7dd3fc, #0b0f14)";
      case "contrast": return "linear-gradient(90deg, #00e5ff, #000)";
      case "blue":
      default:
        return "linear-gradient(90deg, #5eb0ef, #0b1020)";
    }
  }

  function wireUI() {
    toggleControlsBtn.addEventListener("click", () => toggleControls(true));
    closeControlsBtn.addEventListener("click", () => toggleControls(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") toggleControls(false);
    });

    modeBtns.forEach((b) => {
      b.addEventListener("click", () => {
        state.mode = b.dataset.mode;
        modeBtns.forEach((x) => x.classList.toggle("segmented--active", x === b));
        updatePanelsForMode();
      });
    });

    toggleDigital.addEventListener("change", () => {
      state.showDigital = toggleDigital.checked;
      digitalEl.style.display = state.showDigital ? "block" : "none";
    });

    toggleSeconds.addEventListener("change", () => {
      state.showSeconds = toggleSeconds.checked;
      updateVisibility();
    });

    timezoneSelect.addEventListener("change", () => {
      state.timeZone = timezoneSelect.value;
      updateTimezoneLabel();
    });

    toggleAds.addEventListener("change", () => {
      adBanner.hidden = !toggleAds.checked;
    });

    btnHourCycle.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.hourCycle = Number(btn.dataset.hour_cycle || btn.dataset.hourCycle);
        btnHourCycle.forEach((x) => x.classList.toggle("segmented--active", x === btn));
      });
    });

    // interactive controls
    iShowHour.addEventListener("change", () => { state.interactive.showHour = iShowHour.checked; updateVisibility(); });
    iShowMinute.addEventListener("change", () => { state.interactive.showMinute = iShowMinute.checked; updateVisibility(); });
    iShowSecond.addEventListener("change", () => { state.interactive.showSecond = iShowSecond.checked; updateVisibility(); });
    iShowNumbers.addEventListener("change", () => { state.interactive.showNumbers = iShowNumbers.checked; updateVisibility(); });
    iAllowDrag.addEventListener("change", () => { state.interactive.allowDrag = iAllowDrag.checked; });
    iSpotlight.addEventListener("change", () => { state.interactive.spotlight = iSpotlight.checked; if (!state.interactive.spotlight) hideSpotlight(); });

    dragModeBtns.forEach((b) => {
      b.addEventListener("click", () => {
        state.interactive.dragMode = b.dataset.dragMode;
        dragModeBtns.forEach((x) => x.classList.toggle("segmented--active", x === b));
      });
    });

    btnReadTime.addEventListener("click", speakCurrentInteractiveTime);
    btnSetNow.addEventListener("click", () => setInteractiveToNow());
    btnRandomTime.addEventListener("click", () => setInteractiveToRandom());

    updatePanelsForMode();
  }

  function toggleControls(open) {
    const next = open != null ? open : !controlsPanel.classList.contains("open");
    controlsPanel.classList.toggle("open", next);
    toggleControlsBtn.setAttribute("aria-expanded", String(next));
  }

  function updatePanelsForMode() {
    const sections = Array.from(controlsPanel.querySelectorAll('.panel'));
    sections.forEach((s) => {
      const m = s.getAttribute("data-for-mode");
      s.style.display = m === state.mode ? "grid" : "none";
    });
    if (state.mode === "interactive") {
      digitalEl.style.display = "none";
    } else {
      digitalEl.style.display = state.showDigital ? "block" : "none";
    }
  }

  function updateTimezoneLabel() {
    try {
      const tz = state.timeZone === "auto" ? Intl.DateTimeFormat().resolvedOptions().timeZone : state.timeZone;
      timezoneEl.textContent = tz ? `Timezone: ${tz}` : "";
    } catch {
      timezoneEl.textContent = "";
    }
  }

  function buildClock() {
    clockSvg.innerHTML = "";

    const defs = el("defs");
    const grad = el("radialGradient", { id: "faceGrad", cx: "50%", cy: "50%", r: "70%" });
    grad.appendChild(el("stop", { offset: "0%", stopColor: "rgba(255,255,255,0.05)" }));
    grad.appendChild(el("stop", { offset: "100%", stopColor: "rgba(0,0,0,0.35)" }));
    defs.appendChild(grad);
    clockSvg.appendChild(defs);

    const face = el("circle", { cx: 200, cy: 200, r: 188, fill: "url(#faceGrad)", stroke: "rgba(255,255,255,0.15)", strokeWidth: 2 });
    const faceRing = el("circle", { cx: 200, cy: 200, r: 194, fill: "none", stroke: "var(--accent)", strokeWidth: 2, opacity: 0.45 });
    clockSvg.append(face, faceRing);

    // minute ticks
    const ticks = el("g", { id: "ticks" });
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * 2 * Math.PI;
      const isHour = i % 5 === 0;
      const rOuter = 180;
      const rInner = isHour ? 164 : 172;
      const x1 = 200 + rInner * Math.sin(angle);
      const y1 = 200 - rInner * Math.cos(angle);
      const x2 = 200 + rOuter * Math.sin(angle);
      const y2 = 200 - rOuter * Math.cos(angle);
      const line = el("line", {
        x1, y1, x2, y2,
        stroke: isHour ? "var(--text)" : "rgba(255,255,255,0.4)",
        strokeWidth: isHour ? 2.5 : 1,
        strokeLinecap: "round",
        opacity: isHour ? 0.9 : 0.6,
      });
      ticks.appendChild(line);
    }
    clockSvg.appendChild(ticks);

    // numbers
    const numbers = el("g", { id: "numbers" });
    for (let i = 1; i <= 12; i++) {
      const angle = (i / 12) * 2 * Math.PI;
      const r = 138;
      const x = 200 + r * Math.sin(angle);
      const y = 206 - r * Math.cos(angle); // optically centering
      const text = el("text", { x, y, textAnchor: "middle", fontSize: 24, fontWeight: 700, fill: "var(--text)" });
      text.textContent = String(i);
      numbers.appendChild(text);
    }
    clockSvg.appendChild(numbers);

    // hands containers
    const hands = el("g", { id: "hands" });
    const hourHand = el("line", { x1: 200, y1: 220, x2: 200, y2: 120, stroke: "var(--text)", strokeWidth: 6, strokeLinecap: "round" });
    const minuteHand = el("line", { x1: 200, y1: 235, x2: 200, y2: 90, stroke: "var(--accent)", strokeWidth: 4, strokeLinecap: "round" });
    const secondHand = el("line", { x1: 200, y1: 240, x2: 200, y2: 70, stroke: "var(--danger)", strokeWidth: 2, strokeLinecap: "round", opacity: 0.85 });
    const cap = el("circle", { cx: 200, cy: 200, r: 6, fill: "var(--text)", stroke: "var(--accent)", strokeWidth: 2 });
    hands.append(hourHand, minuteHand, secondHand, cap);
    clockSvg.appendChild(hands);

    // spotlight elements
    const spotGroup = el("g", { id: "spotlight", opacity: 0 });
    const spotCircle = el("circle", { cx: 200, cy: 200, r: 16, fill: "none", stroke: "var(--accent-2)", strokeWidth: 3 });
    spotGroup.appendChild(spotCircle);
    clockSvg.appendChild(spotGroup);

    components = { numbers, hourHand, minuteHand, secondHand };
    spot = { group: spotGroup, circle: spotCircle };

    // drag interactions for interactive mode
    enableDrag(components.hourHand, "h");
    enableDrag(components.minuteHand, "m");
    enableDrag(components.secondHand, "s");

    updateVisibility();
  }

  function el(tag, attrs) {
    const n = document.createElementNS(svgNS, tag);
    if (attrs) for (const k of Object.keys(attrs)) {
      const v = attrs[k];
      if (v == null) continue;
      if (k === "textContent") n.textContent = v;
      else n.setAttribute(k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`), String(v));
    }
    return n;
  }

  function updateVisibility() {
    const inter = state.interactive;
    components.hourHand.style.display = state.mode === "interactive" && !inter.showHour ? "none" : "";
    components.minuteHand.style.display = state.mode === "interactive" && !inter.showMinute ? "none" : "";
    components.secondHand.style.display = (state.mode === "interactive" && !inter.showSecond) ? "none" : (state.mode === "normal" && !state.showSeconds ? "none" : "");
    components.numbers.style.display = state.mode === "interactive" && !inter.showNumbers ? "none" : "";
  }

  function tick(ts) {
    requestAnimationFrame(tick);
    if (!lastTickTs) lastTickTs = ts;
    const elapsed = ts - lastTickTs;
    if (elapsed < 16) return; // ~60fps
    lastTickTs = ts;

    if (state.mode === "normal") {
      drawNow();
    } else {
      drawInteractive();
    }
  }

  function drawNow() {
    const parts = getNowInTimeZone(state.timeZone);
    const h = parts.h;
    const m = parts.m;
    const s = parts.s; // integer seconds for stability

    const hourAngle = ((h % 12) + m / 60 + s / 3600) * 30; // 360/12
    const minuteAngle = (m + s / 60) * 6; // 360/60
    const secondAngle = s * 6;

    setRotation(components.hourHand, hourAngle);
    setRotation(components.minuteHand, minuteAngle);
    setRotation(components.secondHand, secondAngle);

    if (state.showDigital) {
      digitalEl.textContent = formatDigitalTZ(parts.date, state.hourCycle, state.showSeconds, state.timeZone);
    }
  }

  function drawInteractive() {
    const t = state.interactive.time;
    const s = t.s;
    const hourAngle = ((t.h % 12) + t.m / 60 + s / 3600) * 30;
    const minuteAngle = (t.m + s / 60) * 6;
    const secondAngle = s * 6;

    setRotation(components.hourHand, hourAngle);
    setRotation(components.minuteHand, minuteAngle);
    setRotation(components.secondHand, secondAngle);
  }

  function setRotation(lineEl, deg) {
    lineEl.setAttribute("transform", `rotate(${deg} 200 200)`);
  }

  function formatDigital(date, hourCycle, includeSeconds) {
    const opts = { hour: "2-digit", minute: "2-digit", second: includeSeconds ? "2-digit" : undefined, hour12: hourCycle === 12 };
    try {
      return new Intl.DateTimeFormat(undefined, opts).format(date);
    } catch {
      const h = date.getHours();
      const to2 = (n) => String(n).padStart(2, "0");
      if (hourCycle === 12) {
        const period = h >= 12 ? "PM" : "AM";
        const hr = h % 12 === 0 ? 12 : h % 12;
        return `${to2(hr)}:${to2(date.getMinutes())}${includeSeconds ? ":" + to2(date.getSeconds()) : ""} ${period}`;
      }
      return `${to2(h)}:${to2(date.getMinutes())}${includeSeconds ? ":" + to2(date.getSeconds()) : ""}`;
    }
  }

  function formatDigitalTZ(date, hourCycle, includeSeconds, tz) {
    const timeZone = tz === "auto" ? undefined : tz;
    const opts = { hour: "2-digit", minute: "2-digit", second: includeSeconds ? "2-digit" : undefined, hour12: hourCycle === 12, timeZone };
    try {
      return new Intl.DateTimeFormat(undefined, opts).format(date);
    } catch {
      return formatDigital(date, hourCycle, includeSeconds);
    }
  }

  function getNowInTimeZone(tz) {
    const date = new Date();
    if (tz === "auto") return { h: date.getHours(), m: date.getMinutes(), s: date.getSeconds(), date };
    try {
      const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "numeric", second: "numeric", hour12: false });
      const parts = fmt.formatToParts(date);
      const get = (t) => Number(parts.find((p) => p.type === t)?.value || "0");
      return { h: get("hour"), m: get("minute"), s: get("second"), date };
    } catch {
      return { h: date.getHours(), m: date.getMinutes(), s: date.getSeconds(), date };
    }
  }

  // Interactive helpers
  function setInteractiveToNow() {
    const d = new Date();
    state.interactive.time = { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() };
  }

  function setInteractiveToRandom() {
    state.interactive.time = { h: Math.floor(Math.random() * 24), m: Math.floor(Math.random() * 60), s: 0 };
    if (!state.interactive.showSecond) state.interactive.time.s = 0;
    if (!state.interactive.showMinute) state.interactive.time.m = 0;
  }

  function speakCurrentInteractiveTime() {
    const { h, m } = state.interactive.time;
    const sentence = `The time is ${formatDigital(new Date(2000,0,1,h,m,0), 12, false)}.`;
    try {
      const u = new SpeechSynthesisUtterance(sentence);
      u.rate = 0.95;
      u.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function angleFromPointer(evt) {
    const pt = getLocalPoint(evt);
    const dx = pt.x - 200;
    const dy = pt.y - 200;
    const angle = Math.atan2(dx, -dy) * (180 / Math.PI); // 0 at 12 o'clock
    return (angle + 360) % 360;
  }

  function getLocalPoint(evt) {
    const rect = clockSvg.getBoundingClientRect();
    const x = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const y = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return { x: ((x - rect.left) / rect.width) * 400, y: ((y - rect.top) / rect.height) * 400 };
  }

  function enableDrag(handEl, type) {
    let dragging = false;

    const start = (e) => {
      if (state.mode !== "interactive" || !state.interactive.allowDrag) return;
      dragging = true;
      e.preventDefault();
    };
    const move = (e) => {
      if (!dragging) return;
      const deg = angleFromPointer(e);
      const inter = state.interactive;
      if (type === "h") {
        // snap to nearest hour marker
        const hour = Math.round(deg / 30) % 12;
        const isPM = inter.time.h >= 12;
        inter.time.h = hour + (isPM ? 12 : 0);
      } else if (type === "m") {
        const minute = Math.round(deg / 6) % 60;
        inter.time.m = minute;
        if (inter.dragMode === "snapped") {
          // move hour proportionally with minutes
          const wholeDay = Math.floor(inter.time.h / 12) * 12;
          const baseHour = inter.time.h % 12;
          const newHour = wholeDay + (Math.floor(baseHour) + minute / 60);
          inter.time.h = newHour;
        }
      } else if (type === "s") {
        const sec = Math.round(deg / 6) % 60;
        inter.time.s = sec;
      }

      if (inter.spotlight) updateSpotlight(type, deg);
    };
    const end = () => { dragging = false; hideSpotlight(); };

    handEl.addEventListener("mousedown", start);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    handEl.addEventListener("touchstart", start, { passive: false });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
  }

  function updateSpotlight(type, deg) {
    // hand tip position along its line length
    const len = type === "h" ? 80 : type === "m" ? 110 : 130;
    const rad = (deg * Math.PI) / 180;
    const x = 200 + len * Math.sin(rad);
    const y = 200 - len * Math.cos(rad);
    spot.circle.setAttribute("cx", String(x));
    spot.circle.setAttribute("cy", String(y));
    spot.group.setAttribute("opacity", "1");

    // highlight closest number at multiples of 30deg
    const nearest = Math.round(((deg % 360) + 360) % 360 / 30) || 12;
    Array.from(components.numbers.children).forEach((n) => n.setAttribute("fill", "var(--text)"));
    const idx = nearest - 1;
    const targetText = components.numbers.children[idx];
    if (targetText) targetText.setAttribute("fill", "var(--accent-2)");
  }

  function hideSpotlight() {
    if (!spot) return;
    spot.group.setAttribute("opacity", "0");
    if (components?.numbers) Array.from(components.numbers.children).forEach((n) => n.setAttribute("fill", "var(--text)"));
  }

  // Init
  init();
})();


