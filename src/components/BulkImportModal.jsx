import { useState } from 'react';

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map((v) => v.trim().replace(/^"|"$/g, '')) ?? lines[i].split(',').map((v) => v.trim());
    const obj = {};
    headers.forEach((h, j) => { obj[h] = values[j] ?? ''; });
    rows.push(obj);
  }
  return rows;
}

function parseJSON(text) {
  const data = JSON.parse(text);
  return Array.isArray(data) ? data : data.rows ?? [];
}

const FORMATS = {
  items: {
    csv: 'itemName,supplier,unit,unitPrice,itemType\nLaptop,Dell Inc.,Piece,1299.99,Asset\nMouse,Logitech,Piece,29.99,Consumable',
    hint: 'CSV or JSON array. Columns: itemName, supplier, unit, unitPrice, itemType (optional: Asset, Consumable, Other)',
  },
  stockIn: {
    csv: 'itemName,receivedDate,quantity,specification\nLaptop,2025-02-09,10,New batch',
    hint: 'CSV or JSON. Columns: itemName (or itemId), receivedDate, quantity. Quarter is auto from date.',
  },
  stockOut: {
    csv: 'itemName,requestedDate,requestingPerson,requestReason,quantity\nLaptop,2025-02-09,John Doe,Equipment request,2',
    hint: 'CSV or JSON. Columns: itemName (or itemId), requestedDate, requestingPerson, requestReason, quantity. Quarter is auto from date.',
  },
};

export default function BulkImportModal({ type, onClose, onSuccess }) {
  const [raw, setRaw] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRaw(ev.target?.result ?? '');
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const parseInput = () => {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        return parseJSON(trimmed);
      }
      return parseCSV(trimmed);
    } catch (e) {
      setError('Invalid format. Use CSV with header row or JSON array.');
      return null;
    }
  };

  const handleImport = async () => {
    setError(null);
    setResult(null);
    const rows = parseInput();
    if (!rows || rows.length === 0) {
      setError(rows?.length === 0 ? 'No rows to import' : 'Could not parse input');
      return;
    }
    setLoading(true);
    try {
      const res = await onSuccess(rows);
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = FORMATS[type] ?? FORMATS.items;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Bulk Import - {type === 'items' ? 'Items' : type === 'stockIn' ? 'Stock In' : 'Stock Out'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 overflow-auto flex-1">
          <p className="text-sm text-slate-600 mb-2">{fmt.hint}</p>
          <label className="inline-block mb-2">
            <span className="px-3 py-2 border border-slate-300 rounded-md text-sm cursor-pointer hover:bg-slate-50">
              Choose .csv or .json file
            </span>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={fmt.csv}
            rows={10}
            className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setRaw(fmt.csv)}
            className="mt-2 text-sm text-slate-500 hover:text-slate-700"
          >
            Load example
          </button>
          {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
          {result && (
            <div className="mt-3 p-3 bg-slate-50 rounded-md text-sm">
              <span className="text-green-600 font-medium">{result.created} imported successfully.</span>
              {result.errors?.length > 0 && (
                <div className="mt-2 text-red-600">
                  {result.errors.length} error(s): {result.errors.map((e) => `Row ${e.row}: ${e.error}`).join('; ')}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
          <button
            onClick={handleImport}
            disabled={loading || !raw.trim()}
            className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
