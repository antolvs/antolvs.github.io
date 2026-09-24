var RECORDS_PER_PAGE = 9; // 3 rows x 3 columns

var recordWrapper = document.querySelector('.record-grid-wrapper');
var recordPaginationEl = document.querySelector('.record-pagination');
var recordPage = 1;

function renderRecords() {
  if (!recordWrapper) return;

  closeZoom(true);

  var allRecords = Array.prototype.slice.call(recordWrapper.querySelectorAll('.record-item:not(.zoom-clone)'));
  var totalPages = Math.max(1, Math.ceil(allRecords.length / RECORDS_PER_PAGE));
  if (recordPage > totalPages) recordPage = totalPages;
  if (recordPage < 1) recordPage = 1;

  var start = (recordPage - 1) * RECORDS_PER_PAGE;
  var end = start + RECORDS_PER_PAGE;

  allRecords.forEach(function (record, i) {
    record.style.display = (i >= start && i < end) ? '' : 'none';
  });

  renderRecordPagination(totalPages);
}

function renderRecordPagination(totalPages) {
  if (!recordPaginationEl) return;

  recordPaginationEl.innerHTML = '';

  for (var i = 1; i <= totalPages; i++) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = i;
    if (i === recordPage) btn.classList.add('active');

    (function (pageNum) {
      btn.addEventListener('click', function () {
        recordPage = pageNum;
        renderRecords();
      });
    })(i);

    recordPaginationEl.appendChild(btn);
  }
}

renderRecords();

function rectRelativeTo(rect, containerRect) {
  return {
    left: rect.left - containerRect.left,
    top: rect.top - containerRect.top,
    width: rect.width,
    height: rect.height
  };
}

function animateRecordBox(clone, fromBox, toBox, onDone) {
  clone.style.transition = 'none';
  clone.style.left = fromBox.left + 'px';
  clone.style.top = fromBox.top + 'px';
  clone.style.width = fromBox.width + 'px';

  // Force the browser to actually paint the line above before animating
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
    if (ev.propertyName !== 'width') return; // width/left/top finish together; only fire once
    clone.removeEventListener('transitionend', handler);
    if (onDone) onDone();
  });
}

var VINYL_IMAGE_SRC = 'antsresources/images/records/vinyl-record.png';
var currentAlbumAudio = null;

function openRecordZoom(recordEl) {
  if (!recordWrapper) return;

  var wrapperRect = recordWrapper.getBoundingClientRect();
  var wrapperStyle = getComputedStyle(recordWrapper);
  var paddingLeft = parseFloat(wrapperStyle.paddingLeft) || 0;
  var paddingTop = parseFloat(wrapperStyle.paddingTop) || 0;
  var innerWidth = wrapperRect.width - paddingLeft - (parseFloat(wrapperStyle.paddingRight) || 0);
  var innerHeight = wrapperRect.height - paddingTop - (parseFloat(wrapperStyle.paddingBottom) || 0);

  var startRect = recordEl.getBoundingClientRect();
  var startBox = rectRelativeTo(startRect, wrapperRect);

  var aspectRatio = startRect.height / startRect.width;

  var maxWidthForVinyl = innerWidth / 1.5;
  var maxWidthFromHeight = (innerHeight * 0.9) / aspectRatio;
  var targetWidth = Math.min(innerWidth * 0.7, maxWidthForVinyl, maxWidthFromHeight, 320);
  var targetHeight = targetWidth * aspectRatio;

  var targetBox = {
    left: paddingLeft + (innerWidth - targetWidth) / 2,
    top: paddingTop + (innerHeight - targetHeight) / 2,
    width: targetWidth
  };

  var clone = recordEl.cloneNode(true);
  clone.classList.add('zoomed', 'zoom-clone');
  clone._zoomOriginal = recordEl;
  clone._audioSrc = recordEl.getAttribute('data-audio');

  // Tag the cover image and add a hidden vinyl layer behind it
  var coverImg = clone.querySelector('img');
  if (coverImg) coverImg.classList.add('record-cover-img');

  var slideWrapper = document.createElement('div');
  slideWrapper.className = 'vinyl-slide-wrapper';
  var vinylImg = document.createElement('img');
  vinylImg.className = 'vinyl-spin-img';
  vinylImg.src = VINYL_IMAGE_SRC;
  vinylImg.alt = 'Vinyl record';
  slideWrapper.appendChild(vinylImg);
  clone.appendChild(slideWrapper);

  recordEl.classList.add('zoom-source-hidden');
  recordWrapper.appendChild(clone);
  recordWrapper.classList.add('has-zoomed');

  animateRecordBox(clone, startBox, targetBox, function () {
    playVinylReveal(clone);
  });
}

function playVinylReveal(clone) {
  var cover = clone.querySelector('.record-cover-img');
  var slideWrapper = clone.querySelector('.vinyl-slide-wrapper');
  var vinylImg = clone.querySelector('.vinyl-spin-img');
  if (!cover || !slideWrapper || !vinylImg) return;

  cover.classList.add('shift-left');
  slideWrapper.classList.add('slide-out');

  slideWrapper.addEventListener('transitionend', function handler(ev) {
    if (ev.propertyName !== 'transform') return;
    slideWrapper.removeEventListener('transitionend', handler);
    vinylImg.classList.add('spinning');

    if (!clone._audioSrc) return; // this record has no audio clip set yet

    currentAlbumAudio = new Audio(clone._audioSrc);
    currentAlbumAudio.loop = false; // play once, then stop
    currentAlbumAudio.volume = 0.05;
    currentAlbumAudio.play().catch(function (err) {

      if (err && err.name === 'NotAllowedError') {
        document.addEventListener('click', function onceClick() {
          if (currentAlbumAudio) currentAlbumAudio.play();
        }, { once: true });
      } else {
        console.error('Record audio failed to play:', clone._audioSrc, err);
      }
    });
  });
}

function reverseVinylReveal(clone, onDone) {
  var cover = clone.querySelector('.record-cover-img');
  var slideWrapper = clone.querySelector('.vinyl-slide-wrapper');
  var vinylImg = clone.querySelector('.vinyl-spin-img');

  if (!cover || !slideWrapper || !vinylImg || !slideWrapper.classList.contains('slide-out')) {
    // Vinyl was never revealed (closed before the reveal finished)
    if (onDone) onDone();
    return;
  }

  if (vinylImg.classList.contains('spinning')) {
    var computedTransform = getComputedStyle(vinylImg).transform;
    vinylImg.classList.remove('spinning');
    vinylImg.style.transform = computedTransform === 'none' ? 'rotate(0deg)' : computedTransform;
  }

  cover.classList.remove('shift-left');
  slideWrapper.classList.remove('slide-out');

  slideWrapper.addEventListener('transitionend', function handler(ev) {
    if (ev.propertyName !== 'transform') return;
    slideWrapper.removeEventListener('transitionend', handler);
    if (onDone) onDone();
  });
}

function closeZoom(instant) {
  if (!recordWrapper) return;
  var clone = recordWrapper.querySelector('.record-item.zoom-clone');
  if (!clone) return;

  if (currentAlbumAudio) {
    currentAlbumAudio.pause();
    currentAlbumAudio.currentTime = 0;
    currentAlbumAudio = null;
  }

  var original = clone._zoomOriginal;

  function finish() {
    if (clone.parentNode) clone.parentNode.removeChild(clone);
    if (original) original.classList.remove('zoom-source-hidden');
    recordWrapper.classList.remove('has-zoomed');
  }

  if (instant) {
    finish();
    return;
  }

  function shrinkBack() {
    var wrapperRect = recordWrapper.getBoundingClientRect();
    var currentRect = clone.getBoundingClientRect();
    var currentBox = rectRelativeTo(currentRect, wrapperRect);

    var targetRect = original ? original.getBoundingClientRect() : recordWrapper.getBoundingClientRect();
    var targetBox = rectRelativeTo(targetRect, wrapperRect);

    animateRecordBox(clone, currentBox, targetBox, finish);
  }

  reverseVinylReveal(clone, shrinkBack);
}

if (recordWrapper) {
  recordWrapper.addEventListener('click', function (ev) {
    var clone = recordWrapper.querySelector('.record-item.zoom-clone');

    if (clone) {
      closeZoom();
      return;
    }

    var recordEl = ev.target.closest('.record-item');
    if (recordEl && recordEl.style.display !== 'none' && !recordEl.classList.contains('zoom-source-hidden')) {
      openRecordZoom(recordEl);
    }
  });
}

document.addEventListener('keydown', function (ev) {
  if (ev.key === 'Escape') closeZoom();
});
