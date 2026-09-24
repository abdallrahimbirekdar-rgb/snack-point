/**
 * Bound Google Apps Script for Baladna Market.
 * Create this script from the target Google Sheet (Extensions > Apps Script).
 * Opens the order spreadsheet explicitly because active-file methods are unavailable in web apps.
 * Deploy as a web app running as you, accessible to anyone, then copy /exec URL.
 */
const ORDER_HEADERS = ['وقت الاستلام','رقم الطلب','الاسم','الهاتف','اليوم','الساعة','رابط الموقع','المجموع قبل الخصم','الخصم','المجموع','عدد المنتجات'];
const ITEM_HEADERS = ['رقم الطلب','المنتج','الكمية','سعر الوحدة','الإجمالي'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const orderId = String(data.orderId || '');
    if (!/^ORD-[A-Z0-9]{5,24}$/.test(orderId)) throw new Error('Invalid order id');
    if (data.website) return response_('ignored');
    if (!Array.isArray(data.items) || !data.items.length || data.items.length > 60) throw new Error('Invalid items');

    const items = data.items.map(item => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99 ||
          !Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 1000000000) throw new Error('Invalid item');
      return {name: text_(item.name, 150), quantity, unitPrice, total: quantity * unitPrice};
    });
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = Math.min(subtotal, Math.max(0, Number(data.discount) || 0));
    const spreadsheet = SpreadsheetApp.openById('1mR6mDkEC7BDbHRRZAAnyuhBTwdbRDAL1UrOM3ooKcNY');
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const orders = sheet_(spreadsheet, 'الطلبات', ORDER_HEADERS);
      // A retry with the same id must not create a second order.
      if (orders.getLastRow() > 1 && orders.getRange(2, 2, orders.getLastRow() - 1, 1)
        .createTextFinder(orderId).matchEntireCell(true).findNext()) return response_('duplicate');
      const details = sheet_(spreadsheet, 'المنتجات المطلوبة', ITEM_HEADERS);
      orders.appendRow([new Date(), orderId, text_(data.name, 120), text_(data.phone, 60),
        text_(data.day, 30), text_(data.time, 10), text_(data.location, 300),
        subtotal, discount, subtotal - discount, items.reduce((sum, item) => sum + item.quantity, 0)]);
      items.forEach(item => details.appendRow([orderId, item.name, item.quantity, item.unitPrice, item.total]));
    } finally {
      lock.releaseLock();
    }
    return response_('ok');
  } catch (error) {
    console.error(error);
    return response_('error');
  }
}
function sheet_(spreadsheet, name, headers) {
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}
function text_(value, limit) {
  const text = String(value == null ? '' : value).trim().slice(0, limit);
  // Prevent entered text from becoming a spreadsheet formula.
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}
function response_(status) {
  return ContentService.createTextOutput(JSON.stringify({status}))
    .setMimeType(ContentService.MimeType.JSON);
}
