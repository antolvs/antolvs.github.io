(function () {
    const root = document.getElementById("timeline");
    const dataEl = document.getElementById("timeline-data");
    if (!root || !dataEl) return;

    let data;
    try { data = JSON.parse(dataEl.textContent); }
    catch (e) { console.error("timeline: bad JSON", e); return; }

    const series = data.series || {};
    const entries = data.entries || [];

    function el(tag, className, text) {
        const n = document.createElement(tag);
        if (className) n.className = className;
        if (text != null) n.textContent = text;
        return n;
    }

    // Filters
    const filters = el("div", "tl-filters");
    const active = {};
    Object.keys(series).forEach(id => {
        const s = series[id];
        active[id] = !s.filter || !!s.checked;
        if (!s.filter) return;
        const label = el("label");
        const box = document.createElement("input");
        box.type = "checkbox";
        box.checked = active[id];
        box.addEventListener("change", () => { active[id] = box.checked; update(); });
        label.appendChild(box);
        label.appendChild(document.createTextNode("Show " + s.label));
        filters.appendChild(label);
    });
    root.appendChild(filters);

    if (data.title) root.appendChild(el("h3", "tl-title", data.title));

    // Build rows
    const rows = entries.map(entry => {
        if (entry.type === "era") {
            const era = el("div", "tl-era", entry.title);
            root.appendChild(era);
            return { entry, node: era, era: true };
        }
        const item = el("div", "tl-item");
        const cover = entry.href ? el("a", "tl-cover") : el("figure", "tl-cover");
        if (entry.href) { cover.href = entry.href; cover.target = "_blank"; cover.rel = "noopener"; }

        const img = document.createElement("img");
        img.src = entry.image;
        img.alt = entry.title;
        img.loading = "lazy";
        cover.appendChild(img);

        const cap = el("figcaption", null, entry.title);
        if (entry.date) cap.appendChild(el("span", "tl-date", entry.date));
        cover.appendChild(cap);

        item.appendChild(cover);
        root.appendChild(item);
        return { entry, node: item, era: false };
    });

    function update() {
        let side = 0;
        let lastEra = null, eraHasItems = false;
        rows.forEach(r => {
            if (r.era) {
                if (lastEra) lastEra.hidden = !eraHasItems;
                lastEra = r.node; eraHasItems = false; side = 0;
                r.node.hidden = false;
                return;
            }
            const show = active[r.entry.series] !== false;
            r.node.hidden = !show;
            if (!show) return;
            eraHasItems = true;
            r.node.classList.toggle("tl-left", side === 0);
            r.node.classList.toggle("tl-right", side === 1);
            side = 1 - side;
        });
        if (lastEra) lastEra.hidden = !eraHasItems;
    }
    update();
})();
