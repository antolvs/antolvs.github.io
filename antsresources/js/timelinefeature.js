// ULTIMATE TIMELINE (timelinefeature.js)
// Reads <script type="application/json" id="timeline-data"> and builds the timeline.
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

    // Filters: any series with "filter": true gets a checkbox (off unless "checked": true)
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

    // Info popup: big cover on the left, text on the right (stacked on phones)
    const modal = el("div", "tl-modal");
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    const card = el("div", "tl-modal-card");
    const closeBtn = el("button", "tl-modal-close", "\u2715");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close");
    const mImg = document.createElement("img");
    mImg.className = "tl-modal-img";
    const mText = el("div", "tl-modal-text");
    const mTitle = el("h4", "tl-modal-title");
    const mDate = el("div", "tl-modal-date");
    const mBody = el("div", "tl-modal-body");
    const mLink = el("a", "tl-modal-link", "READ MORE \u00BB");
    mLink.target = "_blank"; mLink.rel = "noopener";
    mText.append(mTitle, mDate, mBody, mLink);
    card.append(closeBtn, mImg, mText);
    modal.appendChild(card);
    document.body.appendChild(modal);

    // Lock page scroll while the popup is open without the page jumping sideways
    // (hiding the scrollbar widens the page, so we keep that space reserved)
    function lockScroll() {
        const sbw = window.innerWidth - document.documentElement.clientWidth;
        if (sbw > 0) {
            if (window.CSS && CSS.supports && CSS.supports("scrollbar-gutter", "stable")) {
                document.documentElement.style.scrollbarGutter = "stable";
            } else {
                document.body.style.paddingRight = sbw + "px";
            }
        }
        document.body.style.overflow = "hidden";
    }
    function unlockScroll() {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
        document.documentElement.style.scrollbarGutter = "";
    }

    let lastFocus = null;

    function openInfo(entry, coverImg, coverEl) {
        lastFocus = coverEl;
        mImg.src = entry.image;
        mImg.alt = entry.title;
        mTitle.textContent = entry.title;
        mDate.textContent = entry.date || "";
        mDate.hidden = !entry.date;
        mBody.textContent = "";
        [].concat(entry.info).forEach(t => mBody.appendChild(el("p", null, t)));
        mLink.hidden = !entry.href;
        if (entry.href) mLink.href = entry.href;

        // give the popup image the cover's proportions so we can measure it right away
        mImg.style.aspectRatio = coverImg.naturalWidth ? coverImg.naturalWidth + " / " + coverImg.naturalHeight : "";
        modal.hidden = false;
        lockScroll();

        // "zoom": start the big image at the small cover's position/size, then animate to place
        const from = coverImg.getBoundingClientRect();
        const to = mImg.getBoundingClientRect();
        if (coverImg.naturalWidth && from.width && to.width) {
            mImg.style.transition = "none";
            mImg.style.transformOrigin = "top left";
            mImg.style.transform = "translate(" + (from.left - to.left) + "px," + (from.top - to.top) + "px) scale(" + (from.width / to.width) + ")";
            mImg.getBoundingClientRect(); // force reflow
            requestAnimationFrame(() => {
                mImg.style.transition = "transform .3s ease";
                mImg.style.transform = "";
            });
        }
        modal.classList.add("tl-open");
        closeBtn.focus();
    }

    function closeInfo() {
        if (modal.hidden) return;
        modal.hidden = true;
        modal.classList.remove("tl-open");
        mImg.style.transform = "";
        unlockScroll();
        if (lastFocus) lastFocus.focus();
    }
    closeBtn.addEventListener("click", closeInfo);
    modal.addEventListener("click", e => { if (e.target === modal) closeInfo(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeInfo(); });

    // Scrollable area: only the rows scroll; title and filters stay put above it
    const scroller = el("div", "tl-scroll");
    scroller.tabIndex = 0; // lets keyboard users scroll it
    const wrap = el("div", "tl-wrap");
    wrap.appendChild(scroller);
    root.appendChild(wrap);

    // Back-to-top button (bottom-left of the scroll box, appears after scrolling down)
    const topBtn = el("button", "tl-top", "\u2191 BACK TO TOP");
    topBtn.type = "button";
    topBtn.hidden = true;
    topBtn.addEventListener("click", () => scroller.scrollTo({ top: 0, behavior: "smooth" }));
    scroller.addEventListener("scroll", () => { topBtn.hidden = scroller.scrollTop < 200; });
    wrap.appendChild(topBtn);

    // Build rows
    const rows = entries.map(entry => {
        if (entry.type === "era") {
            const era = el("div", "tl-era", entry.title);
            scroller.appendChild(era);
            return { entry, node: era, era: true };
        }
        const item = el("div", "tl-item");
        const cover = el("figure", "tl-cover");

        const img = document.createElement("img");
        img.src = entry.image;
        img.alt = entry.title;
        img.loading = "lazy";
        cover.appendChild(img);

        const cap = el("figcaption", null, entry.title);
        if (entry.date) cap.appendChild(el("span", "tl-date", entry.date));
        cover.appendChild(cap);

        if (entry.info) {
            cover.classList.add("tl-has-info");
            cover.tabIndex = 0;
            cover.setAttribute("role", "button");
            cover.setAttribute("aria-label", "About " + entry.title);
            cover.addEventListener("click", () => openInfo(entry, img, cover));
            cover.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openInfo(entry, img, cover); }
            });
        }

        item.appendChild(cover);
        scroller.appendChild(item);
        return { entry, node: item, era: false };
    });

    // Show/hide, then alternate sides among the visible rows (restarting after each era)
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
