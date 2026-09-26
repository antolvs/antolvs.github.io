var CARDS_PER_PAGE = 9; // 3 rows x 3 columns

var IS_TOUCH = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
var CARD_TILT_ATTRS = { shadow: '', 'scale-factor': '1.15', 'tilt-factor': '1.2' };

function stripGridTilt() {
  if (!IS_TOUCH) return;
  document.querySelectorAll('.card-grid-wrapper hover-tilt').forEach(function (ht) {
    var img = ht.querySelector('img');
    if (!img) return;
    var holder = document.createElement('div');
    holder.className = 'card-tilt-off';
    holder.appendChild(img);
    ht.replaceWith(holder);
  });
}

function reviveTilt(clone) {
  if (!IS_TOUCH) return;
  var holder = clone.querySelector('.card-tilt-off');
  if (!holder) return;
  var img = holder.querySelector('img');
  var ht = document.createElement('hover-tilt');
  Object.keys(CARD_TILT_ATTRS).forEach(function (attr) {
    ht.setAttribute(attr, CARD_TILT_ATTRS[attr]);
  });
  ht.appendChild(img);
  holder.replaceWith(ht);
}

// Tracks the current filter + page per card-set, keyed by set id
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

// Top-level tab switching
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

// Sub-nav filtering
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

stripGridTilt();

// Initial render for every set, so pagination controls exist from page load
cardSets.forEach(function (setEl) {
  renderSet(setEl);
});


function rectRelativeTo(rect, containerRect) {
  return {
    left: rect.left - containerRect.left,
    top: rect.top - containerRect.top,
    width: rect.width,
    height: rect.height
  };
}

function animateBox(clone, fromBox, toBox, onDone) {
  var previousPointerEvents = clone.style.pointerEvents;
  clone.style.pointerEvents = 'none';

  clone.style.transition = 'none';
  clone.style.left = fromBox.left + 'px';
  clone.style.top = fromBox.top + 'px';
  clone.style.width = fromBox.width + 'px';

  clone.getBoundingClientRect();

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      clone.style.transition = 'width 0.4s cubic-bezier(0.22, 1, 0.36, 1), left 0.4s cubic-bezier(0.22, 1, 0.36, 1), top 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
      clone.style.left = toBox.left + 'px';
      clone.style.top = toBox.top + 'px';
      clone.style.width = toBox.width + 'px';
    });
  });

  clone.addEventListener('transitionend', function handler(ev) {
    if (ev.propertyName !== 'width') return; // width/left/top all finish together, only fire once
    clone.removeEventListener('transitionend', handler);
    clone.style.pointerEvents = previousPointerEvents;
    if (onDone) onDone();
  });
}

function openZoom(setEl, cardEl) {
  var wrapper = setEl.querySelector('.card-grid-wrapper');
  if (!wrapper) return;

  var wrapperRect = wrapper.getBoundingClientRect();
  var startRect = cardEl.getBoundingClientRect();
  var startBox = rectRelativeTo(startRect, wrapperRect);

  var aspectRatio = startRect.height / startRect.width;
  var targetWidth = Math.min(wrapperRect.width * 0.7, 320);
  var targetHeight = targetWidth * aspectRatio;
  var targetBox = {
    left: (wrapperRect.width - targetWidth) / 2,
    top: (wrapperRect.height - targetHeight) / 2,
    width: targetWidth
  };

  var clone = cardEl.cloneNode(true);
  clone.classList.add('zoomed', 'zoom-clone');
  clone._zoomOriginal = cardEl;
  reviveTilt(clone);

  cardEl.classList.add('zoom-source-hidden');
  wrapper.appendChild(clone);
  wrapper.classList.add('has-zoomed');

  animateBox(clone, startBox, targetBox);
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

  var wrapperRect = wrapper.getBoundingClientRect();
  var currentRect = clone.getBoundingClientRect();
  var currentBox = rectRelativeTo(currentRect, wrapperRect);

  var targetRect = original ? original.getBoundingClientRect() : wrapper.getBoundingClientRect();
  var targetBox = rectRelativeTo(targetRect, wrapperRect);

  animateBox(clone, currentBox, targetBox, finish);
}

cardSets.forEach(function (setEl) {
  var wrapper = setEl.querySelector('.card-grid-wrapper');
  if (!wrapper) return;

  wrapper.addEventListener('click', function (ev) {
    var clone = wrapper.querySelector('.card3d.zoom-clone');

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
