function map(val, minA, maxA, minB, maxB) {
  return minB + ((val - minA) * (maxB - minB)) / (maxA - minA);
}

function Card3D(card, ev) {
  let img = card.querySelector('img');
  let imgRect = card.getBoundingClientRect();
  let width = imgRect.width;
  let height = imgRect.height;
  let mouseX = ev.offsetX;
  let mouseY = ev.offsetY;
  let rotateY = map(mouseX, 0, width, -25, 25);
  let rotateX = map(mouseY, 0, height, 25, -25);
  let brightness = map(mouseY, 0, height, 1.5, 0.5);

  img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  img.style.filter = `brightness(${brightness})`;
}

function bindCards(cards) {
  cards.forEach((card) => {
    card.addEventListener('mousemove', (ev) => {
      Card3D(card, ev);
    });

    card.addEventListener('mouseleave', (ev) => {
      let img = card.querySelector('img');

      img.style.transform = 'rotateX(0deg) rotateY(0deg)';
      img.style.filter = 'brightness(1)';
    });
  });
}

bindCards(document.querySelectorAll('.card3d'));

var CARDS_PER_PAGE = 9; // 3 rows x 3 columns

// Tracks the current filter + page per card-set, keyed by set id
var setState = {};

function getState(setEl) {
  if (!setState[setEl.id]) {
    setState[setEl.id] = { filter: 'all', page: 1 };
  }
  return setState[setEl.id];
}

function renderSet(setEl) {
  var state = getState(setEl);
  var allCards = Array.prototype.slice.call(setEl.querySelectorAll('.card3d'));

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

// Top-level tab switching (Magic / Pokemon / Yu-Gi-Oh)
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

// Sub-nav filtering (All / Spider-Man / Fantastic Four / Iron Man, within Magic)
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

// Initial render for every set, so pagination controls exist from page load
cardSets.forEach(function (setEl) {
  renderSet(setEl);
});
