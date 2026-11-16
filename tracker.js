const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzbWUn49QsbN3lQspbquo5IthNO-Hfhtb6wc6KJJHP6xPgN0DvcUXNJBHCAEODgDQlHGA/exec';
const MENU_URL = 'index.html';

(function () {
  'use strict';

  const state = {
    submitted: false,
    completed: false,
    startedAt: Date.now(),
    score: '',
    maxScore: '',
    details: ''
  };

  function playerName() {
    return (localStorage.getItem('playerName') || 'Гість').trim() || 'Гість';
  }

  function gameName() {
    return decodeURIComponent(location.pathname.split('/').pop() || document.title || 'Гра')
      .replace(/\.html?$/i, '') || 'Гра';
  }

  function progressDetails() {
    const el = document.querySelector('#cgScore, #pts, #progressText, #score, .score');
    return (el && el.textContent.trim()) || state.details || 'Спробу завершено';
  }

  function sendGameAttempt(status, extra) {
    if (state.submitted) return Promise.resolve(false);
    state.submitted = true;
    extra = extra || {};

    const params = new URLSearchParams({
      player: playerName(),
      studentName: playerName(),
      game: gameName(),
      gameName: gameName(),
      score: String(extra.score != null ? extra.score : state.score),
      maxScore: String(extra.maxScore != null ? extra.maxScore : state.maxScore),
      status: status,
      answered: String(extra.answered != null ? extra.answered : ''),
      durationSec: String(Math.floor((Date.now() - state.startedAt) / 1000)),
      details: String(extra.details || state.details || progressDetails()),
      timestamp: new Date().toISOString()
    });

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

  function addMenuButton() {
    if (/index\.html?$/i.test(location.pathname) || document.getElementById('go-to-main-menu')) return;
    const button = document.createElement('button');
    button.id = 'go-to-main-menu';
    button.type = 'button';
    button.textContent = '⬅️ До головного меню';
    button.style.cssText = 'position:fixed;top:12px;left:12px;z-index:99999;padding:10px 14px;border:0;border-radius:12px;background:#1d4ed8;color:#fff;font:700 14px Arial,sans-serif;cursor:pointer;box-shadow:0 6px 18px #0004';
    button.addEventListener('click', function () {
      sendGameAttempt(state.completed ? 'Завершено' : 'Перервано', {
        score: state.score,
        maxScore: state.maxScore,
        details: progressDetails()
      }).finally(function () {
        location.href = MENU_URL;
      });
      setTimeout(function () { location.href = MENU_URL; }, 1200);
    });
    document.body.appendChild(button);
  }

  // Existing game pages call this when they reach their completion screen.
  // Support their legacy argument formats: (game, score, status) and the newer
  // (game, score, maxScore, accuracy, duration, details, status) signature.
  window.sendGameResult = function (name, score, arg3, accuracy, duration, details, status) {
    if (name) state.game = String(name);
    if (score != null) state.score = score;

    let maxScore = '';
    let completionStatus = status || 'Завершено';
    if (typeof arg3 === 'number') {
      maxScore = arg3;
    } else if (typeof arg3 === 'string') {
      completionStatus = arg3 || completionStatus;
    }
    if (maxScore !== '') state.maxScore = maxScore;
    if (details) state.details = String(details);

    state.completed = true;
    return sendGameAttempt(completionStatus, {
      score: state.score,
      maxScore: state.maxScore,
      details: state.details || progressDetails()
    });
  };

  function saveInterruptedAttempt() {
    if (!state.submitted && !state.completed) {
      sendGameAttempt('Перервано', {
        score: state.score,
        maxScore: state.maxScore,
        details: progressDetails()
      });
    }
  }

  window.addEventListener('pagehide', saveInterruptedAttempt);
  document.addEventListener('DOMContentLoaded', addMenuButton);
  if (document.readyState !== 'loading') addMenuButton();
})();

window.goBackToMenu = function () {
  window.location.href = MENU_URL;
};
