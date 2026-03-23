
function parseCSV(text){
  var rows = [];
  var row = [];
  var cell = '';
  var inQ = false;

  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    var next = text[i + 1];

    if (inQ) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQ = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQ = true;
      } else if (ch === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (ch === '\n') {
        row.push(cell.trim());
        rows.push(row);
        row = [];
        cell = '';
      } else if (ch === '\r') {
      } else {
        cell += ch;
      }
    }
  }

  row.push(cell.trim());
  if (row.length) rows.push(row);

  return rows;
}
