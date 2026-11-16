function doPost(e) {
  var params = (e && e.parameter) || {};
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (!sheet) {
    throw new Error('Підключіть Apps Script до Google Таблиці');
  }

  var isEmpty = sheet.getLastRow() === 0;
  if (isEmpty) {
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
