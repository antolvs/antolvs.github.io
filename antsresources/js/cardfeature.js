// Card tilt and the holographic foil overlay on .holo cards are handled in cards.html (<hover-tilt> Web Component (loaded via CDN)

// 3 rows x 3 columns
var CARDS_PER_PAGE = 9;

// tracks filter and total cards per page
var setState = {};

function getState(setEl) {
  if (!setState[setEl.id]) {
    var activeLink = setEl.querySelector('.card-subnav .navlink.active');
    var initialFilter = activeLink ? activeLink.getAttribute('data-filter') : 'all';
    setState[setEl.id] = { filter: initialFilter, page: 1 };
  }
  return setState[setEl.id];
}

function renderSet(setEl) {
  closeZoom(setEl, true);

  var state = getState(setEl);
  var allCards = Array.prototype.slice.call(setEl.querySelectorAll('.card3d:not(.zoom-clone)'));

  var filtered = allCards.filter(function (card) {
    return state.filter === 'all' || card.getAttribute('data-set') === state.filter;
  });

  var totalPages = Math.max(1, Math.ceil(filtered.length / CARDS_PER_PAGE));
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  var start = (state.page - 1) * CARDS_PER_PAGE;
  var end = start + CARDS_PER_PAGE;
  var visibleSlice = filtered.slice(start, end);

  allCards.forEach(function (card) {
    card.style.display = visibleSlice.indexOf(card) !== -1 ? '' : 'none';
  });

  renderPagination(setEl, totalPages, state.page);
}

function renderPagination(setEl, totalPages, currentPage) {
  var container = setEl.querySelector('.card-pagination');
  if (!container) return;

  container.innerHTML = '';

  for (var i = 1; i <= totalPages; i++) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = i;
    if (i === currentPage) btn.classList.add('active');

    (function (pageNum) {
      btn.addEventListener('click', function () {
        getState(setEl).page = pageNum;
        renderSet(setEl);
      });
    })(i);

    container.appendChild(btn);
  }
}

// nav switching
var cardSets = document.querySelectorAll('.card-set');
var navLinks = document.querySelectorAll('.card-nav .navlink');

navLinks.forEach((link) => {
  link.addEventListener('click', (ev) => {
    ev.preventDefault();

    navLinks.forEach((l) => l.classList.remove('active'));
    link.classList.add('active');

    var targetId = link.getAttribute('data-target');
    cardSets.forEach((set) => {
      set.classList.toggle('active', set.id === targetId);
    });
  });
});

// sub-nav switching
var subNavLinks = document.querySelectorAll('.card-subnav .navlink');

subNavLinks.forEach((link) => {
  link.addEventListener('click', (ev) => {
    ev.preventDefault();

    subNavLinks.forEach((l) => l.classList.remove('active'));
    link.classList.add('active');

    var parentSet = link.closest('.card-set');
    var state = getState(parentSet);
    state.filter = link.getAttribute('data-filter');
    state.page = 1;

    renderSet(parentSet);
  });
});

// initial render for every set, so pagination controls exist from page load
cardSets.forEach(function (setEl) {
  renderSet(setEl);
});

// click to zoom, renders original card invisible, zooms a duplicate of the card in
function animateFlip(el, startRect, onDone) {
  var endRect = el.getBoundingClientRect();

  var deltaX = (startRect.left + startRect.width / 2) - (endRect.left + endRect.width / 2);
  var deltaY = (startRect.top + startRect.height / 2) - (endRect.top + endRect.height / 2);
  var scaleX = startRect.width / endRect.width;
  var scaleY = startRect.height / endRect.height;

  el.style.transition = 'none';
  el.style.transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px) scale(' + scaleX + ', ' + scaleY + ')';

  // force the browser to show animation
  el.getBoundingClientRect();

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      el.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
      el.style.transform = 'translate(0, 0) scale(1, 1)';
    });
  });

  el.addEventListener('transitionend', function handler() {
    el.removeEventListener('transitionend', handler);
    if (onDone) onDone();
  });
}

function openZoom(setEl, cardEl) {
  var wrapper = setEl.querySelector('.card-grid-wrapper');
  if (!wrapper) return;

  var startRect = cardEl.getBoundingClientRect();

  var clone = cardEl.cloneNode(true);
  clone.classList.add('zoomed', 'zoom-clone');
  clone._zoomOriginal = cardEl;

  cardEl.classList.add('zoom-source-hidden');
  wrapper.appendChild(clone);
  wrapper.classList.add('has-zoomed');

  animateFlip(clone, startRect);
}

function closeZoom(setEl, instant) {
  var wrapper = setEl.querySelector('.card-grid-wrapper');
  if (!wrapper) return;
  var clone = wrapper.querySelector('.card3d.zoom-clone');
  if (!clone) return;

  var original = clone._zoomOriginal;

  function finish() {
    if (clone.parentNode) clone.parentNode.removeChild(clone);
    if (original) original.classList.remove('zoom-source-hidden');
    wrapper.classList.remove('has-zoomed');
  }

  if (instant) {
    finish();
    return;
  }

  // animation back to the clone
  var targetRect = original ? original.getBoundingClientRect() : wrapper.getBoundingClientRect();
  var currentRect = clone.getBoundingClientRect();

  var deltaX = (targetRect.left + targetRect.width / 2) - (currentRect.left + currentRect.width / 2);
  var deltaY = (targetRect.top + targetRect.height / 2) - (currentRect.top + currentRect.height / 2);
  var scaleX = targetRect.width / currentRect.width;
  var scaleY = targetRect.height / currentRect.height;

  clone.style.transition = 'none';
  clone.style.transform = 'translate(0, 0) scale(1, 1)';
  clone.getBoundingClientRect();

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      clone.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
      clone.style.transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px) scale(' + scaleX + ', ' + scaleY + ')';
    });
  });

  clone.addEventListener('transitionend', function handler() {
    clone.removeEventListener('transitionend', handler);
    finish();
  });
}

cardSets.forEach(function (setEl) {
  var wrapper = setEl.querySelector('.card-grid-wrapper');
  if (!wrapper) return;

  wrapper.addEventListener('click', function (ev) {
    var clone = wrapper.querySelector('.card3d.zoom-clone');

    // clicking on the zoomed card or background will unzoom the card
    if (clone) {
      closeZoom(setEl);
      return;
    }

    var cardEl = ev.target.closest('.card3d');
    if (cardEl && cardEl.style.display !== 'none' && !cardEl.classList.contains('zoom-source-hidden')) {
      openZoom(setEl, cardEl);
    }
  });
});

document.addEventListener('keydown', function (ev) {
  if (ev.key === 'Escape') {
    cardSets.forEach(function (setEl) {
      closeZoom(setEl);
    });
  }
});