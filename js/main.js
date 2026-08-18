// ハーフイット（DARTSLIVE 版）のカウント処理（依存ライブラリなし）

const START_SCORE = 40;
const BULL_MARK_POINT = 25;
const DARTS_PER_ROUND = 3;
// インブル（BULL の 2 マーク分）はダブル判定なので、DOUBLE のラウンドの 1 投の最高は 50 点
const DOUBLE_MAX_POINT = BULL_MARK_POINT * 2;

// 各ラウンドの狙う場所
const ROUNDS = [
  { target: '15', type: 'number', num: 15 },
  { target: '16', type: 'number', num: 16 },
  { target: 'DOUBLE', type: 'double' },
  { target: '17', type: 'number', num: 17 },
  { target: '18', type: 'number', num: 18 },
  { target: 'TRIPLE', type: 'triple' },
  { target: '19', type: 'number', num: 19 },
  { target: '20', type: 'number', num: 20 },
  { target: 'BULL', type: 'bull' },
];

// 画面の色の初期値。端末の設定に合わせておき、3点メニューから切り替える
function initialTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// history: [{ gained, marks, scoreAfter, halved }]
// 持ち点は START_SCORE と history から導出するので、別に持たない
const state = {
  history: [],
  inputMode: 'marks',
  menuOpen: false,
  simple: false,
  theme: initialTheme(),
};

// マーク数で入力できるラウンドの最大マーク数（0 ならマーク数入力に対応しない）
function markLimit(round) {
  if (round.type === 'number') {
    return DARTS_PER_ROUND * 3; // 3投すべてトリプルで 9 マーク
  }
  if (round.type === 'bull') {
    return DARTS_PER_ROUND * 2; // 3投すべてインナーで 6 マーク
  }
  return 0;
}

// マーク数から加点を求める
function pointsFromMarks(round, marks) {
  return round.type === 'bull' ? marks * BULL_MARK_POINT : marks * round.num;
}

// 手入力で許容する合計得点の上限と単位
function manualRule(round) {
  switch (round.type) {
    case 'number':
      return { max: round.num * markLimit(round), unit: round.num };
    case 'double':
      return { max: DOUBLE_MAX_POINT * DARTS_PER_ROUND, unit: 2 };
    case 'triple':
      return { max: 60 * DARTS_PER_ROUND, unit: 3 };
    default:
      return { max: BULL_MARK_POINT * markLimit(round), unit: BULL_MARK_POINT };
  }
}

function currentScore() {
  const last = state.history[state.history.length - 1];
  return last ? last.scoreAfter : START_SCORE;
}

function currentRound() {
  return ROUNDS[state.history.length];
}

function isFinished() {
  return state.history.length >= ROUNDS.length;
}

// そのラウンドで実際に使う入力方式（リングのラウンドは手入力のみ）
function effectiveMode(round) {
  return markLimit(round) === 0 ? 'manual' : state.inputMode;
}

// ラウンドを確定する。1投も入らなかった場合は持ち点が半分になる
function commitRound(gained, marks) {
  const score = currentScore();
  const halved = gained === 0;

  state.history.push({
    gained,
    marks,
    halved,
    scoreAfter: halved ? Math.floor(score / 2) : score + gained,
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const el = {
    score: document.getElementById('score'),
    roundNumber: document.getElementById('round-number'),
    roundTarget: document.getElementById('round-target'),
    menu: document.getElementById('menu'),
    menuButton: document.getElementById('menu-button'),
    menuPanel: document.getElementById('menu-panel'),
    modeSwitch: document.getElementById('mode-switch'),
    simpleSwitch: document.getElementById('simple-switch'),
    themeButton: document.getElementById('theme-button'),
    inputArea: document.getElementById('input-area'),
    modeMarks: document.getElementById('mode-marks'),
    modeManual: document.getElementById('mode-manual'),
    marksArea: document.getElementById('marks-area'),
    markButtons: document.getElementById('mark-buttons'),
    manualForm: document.getElementById('manual-form'),
    manualInput: document.getElementById('manual-input'),
    manualHint: document.getElementById('manual-hint'),
    manualError: document.getElementById('manual-error'),
    resultArea: document.getElementById('result-area'),
    finalScore: document.getElementById('final-score'),
    finalHalved: document.getElementById('final-halved'),
    undoButton: document.getElementById('undo-button'),
    resetButton: document.getElementById('reset-button'),
    historyBody: document.getElementById('history-body'),
    historyEmpty: document.getElementById('history-empty'),
  };

  function showError(message) {
    el.manualError.textContent = message;
    el.manualError.hidden = false;
  }

  function clearError() {
    el.manualError.textContent = '';
    el.manualError.hidden = true;
  }

  // マーク数ボタンを組み立てる
  function renderMarkButtons(round) {
    el.markButtons.textContent = '';

    for (let marks = 0; marks <= markLimit(round); marks += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(marks);
      button.dataset.marks = String(marks);
      if (marks === 0) {
        button.classList.add('button--miss');
      }
      button.addEventListener('click', () => {
        commitRound(pointsFromMarks(round, marks), marks);
        render();
      });
      el.markButtons.append(button);
    }
  }

  function renderHistory() {
    el.historyBody.textContent = '';

    state.history.forEach((entry, index) => {
      const round = ROUNDS[index];
      const row = document.createElement('tr');
      const cells = [
        `R${index + 1}`,
        round.target,
        entry.marks === null ? `${entry.gained}点` : `${entry.marks}マーク`,
        entry.halved ? '半減' : `+${entry.gained}`,
        String(entry.scoreAfter),
      ];

      cells.forEach((text) => {
        const cell = document.createElement('td');
        cell.textContent = text;
        row.append(cell);
      });

      if (entry.halved) {
        row.classList.add('is-halved');
      }
      el.historyBody.append(row);
    });

    el.historyEmpty.hidden = state.history.length > 0;
  }

  function render() {
    // メニューと見た目はゲーム終了後も変えられるので、早期 return より前に描画する
    el.menuPanel.hidden = !state.menuOpen;
    el.menuButton.setAttribute('aria-expanded', String(state.menuOpen));
    el.modeSwitch.checked = state.inputMode === 'manual';
    el.simpleSwitch.checked = state.simple;
    el.themeButton.textContent = state.theme === 'dark' ? '白基調にする' : '黒基調にする';
    document.documentElement.dataset.theme = state.theme;
    document.body.classList.toggle('is-simple', state.simple);

    el.score.textContent = String(currentScore());
    el.undoButton.disabled = state.history.length === 0;
    el.resetButton.disabled = state.history.length === 0;
    renderHistory();

    if (isFinished()) {
      const halvedCount = state.history.filter((entry) => entry.halved).length;
      el.roundNumber.textContent = `${ROUNDS.length} / ${ROUNDS.length}`;
      el.roundTarget.textContent = '—';
      el.inputArea.hidden = true;
      el.resultArea.hidden = false;
      el.finalScore.textContent = String(currentScore());
      el.finalHalved.textContent = `半減 ${halvedCount} 回`;
      return;
    }

    const round = currentRound();
    const mode = effectiveMode(round);

    el.roundNumber.textContent = `${state.history.length + 1} / ${ROUNDS.length}`;
    el.roundTarget.textContent = round.target;
    el.inputArea.hidden = false;
    el.resultArea.hidden = true;

    // ラジオは選んだ入力方式をそのまま保つ。DOUBLE / TRIPLE のラウンドだけ
    // マーク数では得点が決まらないので、仕様として手入力を出す
    el.modeMarks.checked = state.inputMode === 'marks';
    el.modeManual.checked = state.inputMode === 'manual';

    el.marksArea.hidden = mode !== 'marks';
    el.manualForm.hidden = mode !== 'manual';

    // 手入力欄とエラーはラウンドが変わったときだけ初期化する。
    // メニューの操作でも render() が走るので、入力途中の値を消さないため
    const roundKey = String(state.history.length);
    if (el.manualInput.dataset.round !== roundKey) {
      el.manualInput.dataset.round = roundKey;
      el.manualInput.value = '';
      clearError();
    }

    if (mode === 'marks') {
      renderMarkButtons(round);
      return;
    }

    const rule = manualRule(round);
    el.manualInput.max = String(rule.max);
    el.manualHint.textContent =
      `0 〜 ${rule.max} の ${rule.unit} の倍数で入力してください（すべて外した場合は 0）。`;

    // メニューを操作している間はフォーカスを奪わない
    if (!state.menuOpen) {
      el.manualInput.focus();
    }
  }

  el.manualForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const round = currentRound();
    const rule = manualRule(round);
    const gained = Number(el.manualInput.value);

    if (el.manualInput.value === '' || !Number.isInteger(gained)) {
      showError('得点を整数で入力してください。');
      return;
    }
    if (gained < 0 || gained > rule.max) {
      showError(`このラウンドの得点は 0 〜 ${rule.max} の範囲で入力してください。`);
      return;
    }
    if (gained % rule.unit !== 0) {
      showError(`このラウンドの得点は ${rule.unit} の倍数である必要があります。`);
      return;
    }

    commitRound(gained, null);
    render();
  });

  // キーボード操作。数字キーはマーク数、b は1つ戻る、s は最初から
  document.addEventListener('keydown', (event) => {
    // Escape でメニューを閉じる。ゲーム終了後も効かせたいので他のガードより前に置く
    if (event.key === 'Escape' && state.menuOpen) {
      state.menuOpen = false;
      render();
      el.menuButton.focus();
      return;
    }

    // Cmd+S などのブラウザの操作は邪魔しない
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    // メニューを開いている間と手入力中は、キーで持ち点が動かないようにする
    if (state.menuOpen || event.target === el.manualInput) {
      return;
    }

    // やり直しはゲーム終了後も使うので、isFinished() の判定より前に置く。
    // 押せない状態（履歴が空）のボタンは click() しても何も起きない
    const key = event.key.toLowerCase();
    if (key === 'b' || key === 's') {
      event.preventDefault();
      (key === 'b' ? el.undoButton : el.resetButton).click();
      return;
    }

    if (isFinished()) {
      return;
    }

    const round = currentRound();
    if (effectiveMode(round) !== 'marks' || !/^[0-9]$/.test(event.key)) {
      return;
    }

    const button = el.markButtons.querySelector(`[data-marks="${event.key}"]`);
    if (!button) {
      return;
    }

    event.preventDefault();
    button.click();
  });

  [el.modeMarks, el.modeManual].forEach((radio) => {
    radio.addEventListener('change', () => {
      state.inputMode = radio.value;
      render();
    });
  });

  el.menuButton.addEventListener('click', () => {
    state.menuOpen = !state.menuOpen;
    render();
  });

  // メニュー内の設定は、切り替えてもメニューを開いたままにする
  el.modeSwitch.addEventListener('change', () => {
    state.inputMode = el.modeSwitch.checked ? 'manual' : 'marks';
    render();
  });

  el.simpleSwitch.addEventListener('change', () => {
    state.simple = el.simpleSwitch.checked;
    render();
  });

  el.themeButton.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    render();
  });

  document.addEventListener('click', (event) => {
    if (!state.menuOpen || el.menu.contains(event.target)) {
      return;
    }
    state.menuOpen = false;
    render();
  });

  el.undoButton.addEventListener('click', () => {
    state.history.pop();
    render();
  });

  el.resetButton.addEventListener('click', () => {
    state.history = [];
    render();
  });

  render();
});
