// 動作確認用スクリプト（依存ライブラリなし）

document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('js-status');
  const button = document.getElementById('check-button');

  if (!status || !button) {
    return;
  }

  status.textContent = 'JS 読み込み済み。ボタンを押すと時刻を表示するのだ';
  status.classList.remove('status--pending');

  button.addEventListener('click', () => {
    const now = new Date().toLocaleString('ja-JP');
    status.textContent = `クリックを検知したのだ（${now}）`;
  });
});
