function doGet(e) {
  const params = (e && e.parameter) || {};
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('Скрипт має бути прив’язаний до Google Таблиці.');
  }

  let sheet = spreadsheet.getSheetByName('Результати');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Результати');
  }

  const headers = [
    'Час',
    'Учень',
    'Гра',
    'Статус',
    'Результат',
    'Максимум',
    'Відповіді/дії',
    'Тривалість (с)',
    'Деталі'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else if (sheet.getRange(1, 1).getValue() !== headers[0]) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
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

function doPost(e) {
  return doGet(e);
}
