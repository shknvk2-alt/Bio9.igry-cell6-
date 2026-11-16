function doPost(e) {
  const params = e && e.parameter ? e.parameter : {};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Час',
      'Учень',
      'Гра',
      'Статус',
      'Результат',
      'Максимум',
      'Відповіді/дії',
      'Тривалість (с)',
      'Деталі'
    ]);
  }

  sheet.appendRow([
    new Date(),
    params.studentName || params.player || 'Гість',
    params.gameName || params.game || 'Невідома гра',
    params.status || 'Невідомий статус',
    params.score || '',
    params.maxScore || '',
    params.answered || '0',
    params.durationSec || '0',
    params.details || ''
  ]);

  return ContentService.createTextOutput('OK');
}

function doGet(e) {
  return doPost(e);
}
