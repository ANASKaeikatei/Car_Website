
var NAME_RE = /^[\u0621-\u063A\u0641-\u064A]+( +[\u0621-\u063A\u0641-\u064A]+)*$/;
var PHONE_RE = /^09[3-689][0-9]{7}$/;
var EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;

function isValidNationalId(s) {
  if (!/^[0-9]{11}$/.test(s)) { return false; }
  var p = parseInt(s.substring(0, 2), 10);
  return p >= 1 && p <= 14;
}


function parseDate(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) { return null; }
  var y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
  var t = Date.UTC(y, mo - 1, d), c = new Date(t);
  if (c.getUTCFullYear() === y && c.getUTCMonth() === mo - 1 && c.getUTCDate() === d) { return t; }
  return null;
}

function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

function formatSYP(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ل.س'; }

function setError(id, msg) { $('#err-' + id).text(msg); return msg === ''; }

function val(id) { return $.trim($('#' + id).val()); }


function validateForm() {
  var ok = true;
  var name = val('fullName'), nid = val('nationalId'), s = val('startDate'), e = val('endDate');
  var ph = val('phone'), em = val('email');
  var ts = parseDate(s), te = parseDate(e);

  ok = setError('fullName', (name === '' || NAME_RE.test(name)) ? '' : 'الاسم يجب أن يتكون من أحرف عربية ومسافات فقط.') && ok;
  ok = setError('nationalId', nid === '' ? 'الرقم الوطني مطلوب.' :
    (isValidNationalId(nid) ? '' : 'يجب أن يتكون من 11 رقماً، وأول خانتين بين 01 و14.')) && ok;
  ok = setError('startDate', s === '' ? 'تاريخ البداية مطلوب.' :
    (ts === null ? 'تاريخ غير صحيح. الصيغة المطلوبة yyyy-mm-dd.' : '')) && ok;
  var msgEnd = '';
  if (e === '') { msgEnd = 'تاريخ النهاية مطلوب.'; }
  else if (te === null) { msgEnd = 'تاريخ غير صحيح. الصيغة المطلوبة yyyy-mm-dd.'; }
  else if (ts !== null && te <= ts) { msgEnd = 'يجب أن يكون تاريخ النهاية لاحقاً لتاريخ البداية.'; }
  ok = setError('endDate', msgEnd) && ok;
  ok = setError('phone', (ph === '' || PHONE_RE.test(ph)) ? '' : 'رقم غير مطابق لشبكتي Syriatel/MTN (مثال: 0933123456).') && ok;
  ok = setError('email', (em === '' || EMAIL_RE.test(em)) ? '' : 'صيغة البريد الإلكتروني غير صحيحة.') && ok;

  return ok ? daysBetween(ts, te) : 0;
}

function showResult(days, s, e) {
  var rows = '', total = 0;
  $('input.sel:checked').each(function () {
    var tr = $(this).closest('tr');
    var price = parseInt(tr.find('.price').text().replace(/\D/g, ''), 10);
    var cost = price * days;
    total += cost;
    rows += '<tr><td>' + tr.find('td:eq(0)').text() + ' - ' + tr.find('td:eq(2)').text() + '</td><td>' +
      days + '</td><td>' + formatSYP(price) + '</td><td>' + formatSYP(cost) + '</td></tr>';
  });
  var discount = days > 10 ? Math.round(total * 0.05) : 0;
  $('#resultBody').html(
    '<p>مدة التأجير: من <span dir="ltr">' + s + '</span> إلى <span dir="ltr">' + e + '</span> (' + days + ' يوماً)</p>' +
    '<table class="grid"><tr><th>السيارة</th><th>عدد الأيام</th><th>السعر اليومي</th><th>التكلفة</th></tr>' + rows + '</table>' +
    '<p>المجموع قبل الخصم: ' + formatSYP(total) + '</p>' +
    '<p>الخصم (' + (days > 10 ? '5% لتجاوز 10 أيام' : 'لا ينطبق، المدة 10 أيام أو أقل') + '): ' + formatSYP(discount) + '</p>' +
    '<p class="total">المبلغ النهائي المطلوب: ' + formatSYP(total - discount) + '</p>');
  $('#resultBox').fadeIn();
}

$(document).ready(function () {
 
  $('.intro').hide().fadeIn(800);
  $('#nav a').on('mouseenter', function () { $(this).fadeTo(100, 0.75); })
             .on('mouseleave', function () { $(this).fadeTo(100, 1); });
  $('h3.branch').on('click', function () { $(this).next().slideToggle(); });

  
  $('input.tog').on('click', function () { $('#det' + $(this).val()).toggle(this.checked); });
  $('input.sel').on('click', function () { $(this).closest('tr').toggleClass('picked', this.checked); });

  $('#btnContinue').on('click', function () {
    if ($('input.sel:checked').length === 0) {
      $('#selMsg').text('الرجاء اختيار سيارة واحدة على الأقل قبل المتابعة.');
      $('#bookingBox').slideUp();
    } else {
      $('#selMsg').text('');
      $('#bookingBox').slideDown();
    }
  });

  $('#bookingForm').on('submit', function (ev) {
    ev.preventDefault();
    if ($('input.sel:checked').length === 0) {
      $('#selMsg').text('الرجاء اختيار سيارة واحدة على الأقل قبل المتابعة.');
      return;
    }
    var days = validateForm();
    if (days > 0) { showResult(days, val('startDate'), val('endDate')); }
  });

  $('#btnClose').on('click', function () { $('#resultBox').fadeOut(); });
});
