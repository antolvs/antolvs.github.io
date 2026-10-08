
(function () {
    const PER_PAGE = 10;

    const listEl = document.getElementById("blog-list");
    const pagerEl = document.getElementById("blog-pagination");
    if (!listEl || !pagerEl) return;

    const entries = Array.from(listEl.querySelectorAll(".blog-entry"));
    const dateOf = e => e.getAttribute("data-date") || "";
    entries.sort((a, b) => (dateOf(a) < dateOf(b) ? 1 : dateOf(a) > dateOf(b) ? -1 : 0));
    entries.forEach(e => listEl.appendChild(e));

    const totalPages = Math.max(1, Math.ceil(entries.length / PER_PAGE));

    let page = parseInt(new URLSearchParams(location.search).get("page"), 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    function fmtDate(iso) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
        return m ? m[2] + "/" + m[3] + "/" + m[1] : iso;
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function renderList() {
        if (!entries.length) {
            listEl.appendChild(el("div", "blog-empty", "No posts yet. Check back soon!"));
            return;
        }
        entries.forEach((entry, i) => {
            const dateEl = entry.querySelector(".blog-entry-date");
            if (dateEl && !dateEl.textContent.trim()) dateEl.textContent = fmtDate(dateOf(entry));
            const onPage = i >= (page - 1) * PER_PAGE && i < page * PER_PAGE;
            entry.style.display = onPage ? "" : "none";
        });
    }

    function pageLink(n, label, cls) {
        const a = el("a", cls || null, label != null ? label : String(n));
        a.href = "?page=" + n;
        return a;
    }

    function renderPager() {
        pagerEl.textContent = "";
        if (totalPages <= 1) { pagerEl.hidden = true; return; }
        pagerEl.hidden = false;

        pagerEl.appendChild(page > 1
            ? pageLink(page - 1, "\u00AB PREV")
            : el("span", "page-disabled", "\u00AB PREV"));

        const show = new Set([1, totalPages]);
        for (let i = page - 2; i <= page + 2; i++) if (i >= 1 && i <= totalPages) show.add(i);
        let prev = 0;
        Array.from(show).sort((a, b) => a - b).forEach(n => {
            if (n - prev > 1) pagerEl.appendChild(el("span", "page-gap", "..."));
            pagerEl.appendChild(n === page ? el("span", "page-current", String(n)) : pageLink(n));
            prev = n;
        });

        pagerEl.appendChild(page < totalPages
            ? pageLink(page + 1, "NEXT \u00BB")
            : el("span", "page-disabled", "NEXT \u00BB"));
    }

    renderList();
    renderPager();
})();
