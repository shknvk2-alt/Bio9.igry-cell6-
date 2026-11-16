const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw7Rtp4l6wL_El-gR263MLrNfABY4eofkw-40SPu2R9DAR2JrZDwyt7jmJo-LZ0fVT5Xg/exec';
const MENU_URL = 'index.html';

(function () {
  'use strict';

  const state = {
    player: (localStorage.getItem('playerName') || 'Гість').trim() || 'Гість',
    game: (document.title || 'Гра').trim() || 'Гра',
    score: 0,
    maxScore: 0,
    answered: 0,
    startedAt: Date.now(),
    completed: false,
    submitted: false,
    details: 'Запуск гри',
    backButton: null
  };

  function resolvePlayerName() {
    const name = (localStorage.getItem('playerName') || 'Гість').trim() || 'Гість';
    state.player = name;
    return name;
  }

  function resolveGameName() {
    const fromUrl = (location.pathname.split('/').pop() || '').replace(/\.[^/.]+$/, '');
    const fromTitle = document.title || 'Гра';
    const fallback = fromUrl || fromTitle || 'Гра';
    state.game = fallback;
    return fallback;
  }

  function readProgressText() {
    const selectors = ['#cgScore', '#pts', '#progressText', '#score', '.score'];
    for (let i = 0; i < selectors.length; i++) {
      const el = document.querySelector(selectors[i]);
      if (el && el.textContent && el.textContent.trim()) {
        return el.textContent.trim();
      }
    }
    return state.details;
  }

  function buildPayload(status, override) {
    const payload = {
      player: resolvePlayerName(),
      studentName: resolvePlayerName(),
      game: resolveGameName(),
      gameName: resolveGameName(),
      score: String(override && override.score != null ? override.score : state.score),
      maxScore: String(override && override.maxScore != null ? override.maxScore : state.maxScore),
      status: status,
      answered: String(override && override.answered != null ? override.answered : state.answered),
      durationSec: String(Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000))),
      details: String((override && override.details) || state.details || readProgressText()),
      timestamp: new Date().toISOString()
    };
    return payload;
  }

  function sendToSheet(status, override) {
    if (state.submitted) return Promise.resolve(false);
    state.submitted = true;

    const payload = buildPayload(status, override);
    const params = new URLSearchParams(payload);
    const url = GOOGLE_SCRIPT_URL + (GOOGLE_SCRIPT_URL.indexOf('?') !== -1 ? '&' : '?') + params.toString();

    return fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: params.toString(),
      keepalive: true
    }).catch(function () {
      state.submitted = false;
      return false;
    });
  }

  function finishWithStatus(status, override) {
    state.completed = status === 'Завершено';
    state.details = override && override.details ? override.details : readProgressText();
    if (override && override.score != null) state.score = override.score;
    if (override && override.maxScore != null) state.maxScore = override.maxScore;
    if (override && override.answered != null) state.answered = override.answered;
    return sendToSheet(status, override || {});
  }

  function addBackButton() {
    if (document.querySelector('#go-to-main-menu')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'go-to-main-menu';
    btn.textContent = '⬅️ До головного меню';
    btn.setAttribute('aria-label', 'Повернутися до головного меню');
    btn.style.cssText = 'position:fixed;top:12px;left:12px;z-index:99999;padding:10px 14px;border:0;border-radius:12px;background:#1d4ed8;color:white;font:700 14px/1.2 Arial,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,0.25);';
    btn.addEventListener('click', function () {
      finishWithStatus(state.completed ? 'Завершено' : 'Перервано', {
        score: state.score,
        maxScore: state.maxScore,
        answered: state.answered,
        details: state.details || readProgressText()
      }).finally(function () {
        location.href = MENU_URL;
      });
      setTimeout(function () {
        location.href = MENU_URL;
      }, 1300);
    });
    document.body.appendChild(btn);
  }

  function attachInteractionCounter() {
    document.addEventListener('click', function () {
      state.answered += 1;
    }, true);
    document.addEventListener('change', function () {
      state.answered += 1;
    }, true);
    document.addEventListener('input', function () {
      state.answered += 1;
    }, true);
  }

  window.sendGameResult = function (name, score, maxScore, accuracy, duration, details, statusOverride) {
    if (name) state.game = String(name);
    if (score != null) state.score = Number(score) || 0;
    if (maxScore != null) state.maxScore = Number(maxScore) || 0;
    if (details) state.details = String(details);
    const status = statusOverride || (score != null && maxScore != null && Number(score) >= Number(maxScore) ? 'Завершено' : 'Завершено');
    return finishWithStatus(status, {
      score: state.score,
      maxScore: state.maxScore,
      answered: state.answered,
      details: state.details || readProgressText()
    });
  };

  window.addEventListener('beforeunload', function () {
    if (!state.submitted && !state.completed) {
      finishWithStatus('Перервано', {
        score: state.score,
        maxScore: state.maxScore,
        answered: state.answered,
        details: state.details || readProgressText()
      });
    }
  });

  window.addEventListener('pagehide', function () {
    if (!state.submitted && !state.completed) {
      finishWithStatus('Перервано', {
        score: state.score,
        maxScore: state.maxScore,
        answered: state.answered,
        details: state.details || readProgressText()
      });
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    addBackButton();
    attachInteractionCounter();
  });

  if (document.readyState !== 'loading') {
    addBackButton();
    attachInteractionCounter();
  }
})();

window.goBackToMenu = function () {
  window.location.href = MENU_URL;
};
