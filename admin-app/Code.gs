const SPREADSHEET_ID = '1mR6mDkEC7BDbHRRZAAnyuhBTwdbRDAL1UrOM3ooKcNY';
const SHEET_NAME = 'إدارة المنتجات';
const CATEGORIES = ['مشروبات','بقالة','مقبلات','حلويات','أجبان ولحوم','بهارات','خضار وفواكه'];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('إدارة ماركت بلدنا')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function productSheet_() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('لم أجد تبويب إدارة المنتجات.');
  return sheet;
}

function listProducts() {
  const sheet = productSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, Math.min(last - 1, 499), 8).getValues()
    .filter(row => row[0] !== '' && row[0] !== null && String(row[2] || '').trim() !== '')
    .map(row => ({
      id: Number(row[0]), category: String(row[1] || ''),
      name: String(row[2] || ''), description: String(row[3] || ''),
      price: Number(row[4]) || 0, emoji: String(row[5] || ''),
      image: String(row[6] || ''), visible: row[7] === true
    }));
}

function cleanText_(value, max) {
  const text = String(value == null ? '' : value).trim().slice(0, max);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function saveProduct(input) {
  if (!input || typeof input !== 'object') throw new Error('بيانات المنتج غير صالحة.');
  const category = String(input.category || '');
  if (CATEGORIES.indexOf(category) === -1) throw new Error('اختر قسمًا من القائمة.');
  const name = cleanText_(input.name, 150);
  if (!name) throw new Error('اكتب اسم المنتج.');
  const description = cleanText_(input.description, 250);
  const price = Number(input.price);
  if (!Number.isSafeInteger(price) || price < 0 || price > 1000000000)
    throw new Error('اكتب سعرًا صحيحًا بالليرة السورية.');
  const emoji = cleanText_(input.emoji, 8);
  const image = String(input.image || '').trim();
  if (image && !/^https:\/\/[^\s"'<>]+$/i.test(image) &&
      !/^[a-z0-9][a-z0-9._-]*\.(webp|png|jpe?g)$/i.test(image))
    throw new Error('الصورة تحتاج رابط https أو اسم ملف صورة موجود في الموقع.');
  const visible = input.visible === true;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = productSheet_();
    const last = sheet.getLastRow();
    const idCells = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues() : [];
    const ids = idCells.map(row => row[0] === '' || row[0] === null ? null : Number(row[0]));
    let id, rowNumber;
    if (input.id === null || input.id === undefined || input.id === '') {
      id = Math.max(-1, ...ids.filter(Number.isFinite)) + 1;
      const emptyIndex = ids.indexOf(null);
      rowNumber = emptyIndex >= 0 ? emptyIndex + 2 : last + 1;
      if (rowNumber > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), Math.max(100, rowNumber - sheet.getMaxRows()));
    } else {
      id = Number(input.id);
      if (!Number.isSafeInteger(id) || id < 0) throw new Error('رقم المنتج غير صالح.');
      const index = ids.indexOf(id);
      if (index < 0) throw new Error('لم أجد المنتج. أعد تحميل الصفحة.');
      rowNumber = index + 2;
    }
    sheet.getRange(rowNumber, 1, 1, 8)
      .setValues([[id, category, name, description, price, emoji, image, visible]]);
    SpreadsheetApp.flush();
    return { id, message: input.id === null || input.id === undefined || input.id === ''
      ? 'تمت إضافة المنتج.' : 'تم حفظ التعديل.' };
  } finally {
    lock.releaseLock();
  }
}
