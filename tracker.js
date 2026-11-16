const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwN0J6DTUOtAfWTCW7egm_FVV7pl8g6EwAxeNkHg4wBlrZknCfF5heOMzU16uRT-ClD4A/exec';
const MENU_URL = 'index.html';

(function () {
  'use strict';

  const state = {
    submitted: false,
    completed: false,
    startedAt: Date.now(),
    score: '',
    maxScore: '',
    actions: 0,
    details: '',
    game: (location.pathname.split('/').pop() || document.title || 'Гра').replace(/\.html?$/i, '')
  };

  function playerName() {
    return (localStorage.getItem('playerName') || 'Гість').trim() || 'Гість';
  }

  function progressDetails() {
    const el = document.querySelector('#cgScore, #pts, #progressText, #score, .score');
    return (el && el.textContent.trim()) || state.details || 'Спробу завершено';
  }

  function submitResult(status, overrides) {
    if (state.submitted) return Promise.resolve(false);
    state.submitted = true;
    const values = overrides || {};
    const player = playerName();
    const params = new URLSearchParams({
      player: player,
      studentName: player,
      game: state.game,
      gameName: state.game,
      score: String(values.score != null ? values.score : state.score),
      maxScore: String(values.maxScore != null ? values.maxScore : state.maxScore),
      status: status,
      answered: String(values.answered != null ? values.answered : state.actions),
      durationSec: String(Math.floor((Date.now() - state.startedAt) / 1000)),
      details: String(values.details || state.details || progressDetails()),
      timestamp: new Date().toISOString()
    });

    // URL-encoded form fields are available to Apps Script as e.parameter.
    return fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: params.toString(),
      keepalive: true
    }).catch(function (error) {
      state.submitted = false;
      console.error('Не вдалося надіслати результат:', error);
      return false;
    });
  }

  function completeGame() {
    state.completed = true;
    state.details = progressDetails();
    return submitResult('Завершено', {
      score: state.score,
      maxScore: state.maxScore,
      answered: state.actions,
      details: state.details
    });
  }

  // Compatibility with existing games: some pass (game, score, status),
  // others pass (game, score, maxScore, accuracy, duration, details).
  window.sendGameResult = function (gameName, score, third, fourth, fifth, sixth) {
    if (gameName) state.game = String(gameName).replace(/\.html?$/i, '');
    if (score != null && Number.isFinite(Number(score))) state.score = Number(score);

    if (typeof third === 'number' && Number.isFinite(third)) {
      state.maxScore = third;
      if (Number(state.score) >= third) return completeGame();
    } else if (typeof third === 'string') {
      state.details = third;
      return completeGame();
    }

    if (typeof sixth === 'string') state.details = sixth;
    return Promise.resolve(false);
  };

  function addMenuButton() {
    if (/index\.html?$/i.test(location.pathname) || document.getElementById('go-to-main-menu')) return;
    const button = document.createElement('button');
    button.id = 'go-to-main-menu';
    button.type = 'button';
    button.textContent = '⬅️ До головного меню';
    button.setAttribute('aria-label', 'Повернутися до головного меню');
    button.style.cssText = 'position:fixed;top:12px;left:12px;z-index:99999;padding:10px 14px;border:0;border-radius:12px;background:#1d4ed8;color:#fff;font:700 14px Arial,sans-serif;cursor:pointer;box-shadow:0 6px 18px #0004';
    button.addEventListener('click', function () {
      if (!state.completed) {
        state.details = progressDetails();
        submitResult('Перервано', { score: state.score, maxScore: state.maxScore, answered: state.actions, details: state.details });
      }
      location.href = MENU_URL;
    });
    document.body.appendChild(button);
  }

  document.addEventListener('click', function (event) {
    if (!event.target.closest('#go-to-main-menu')) state.actions++;
  }, true);
  document.addEventListener('change', function () { state.actions++; }, true);

  window.addEventListener('pagehide', function () {
    if (!state.submitted && !state.completed && state.actions > 0) {
      state.details = progressDetails();
      submitResult('Перервано', { score: state.score, maxScore: state.maxScore, answered: state.actions, details: state.details });
    }
  });

  document.addEventListener('DOMContentLoaded', addMenuButton);
  if (document.readyState !== 'loading') addMenuButton();
})();
