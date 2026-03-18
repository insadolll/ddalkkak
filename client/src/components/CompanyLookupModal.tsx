import { useState } from 'react';
import { X, Search, Building2 } from 'lucide-react';
import api from '@/services/api';

interface LookupResult {
  name: string;
  bizNumber: string;
  representative: string;
  address: string;
  phone: string;
}

interface Props {
  onClose: () => void;
  onSelect: (company: LookupResult) => void;
}

export default function CompanyLookupModal({ onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get('/companies/lookup', { params: { q: query.trim() } });
      setResults(res.data.data || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  function handleSelect(item: LookupResult) {
    onSelect(item);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-[20px] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" strokeWidth={1.75} />
              <h3 className="text-lg font-bold text-slate-800">공공데이터 업체 검색</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100">
              <X className="w-5 h-5 text-slate-400" strokeWidth={1.75} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">회사명으로 검색하면 사업자등록번호, 대표자 등을 자동으로 불러옵니다.</p>
        </div>

        {/* Search */}
        <div className="px-6 py-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="회사명 입력 (2자 이상)"
              className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              autoFocus
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || query.trim().length < 2}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-light transition disabled:opacity-50"
          >
            {loading ? '검색중...' : '검색'}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {loading && (
            <div className="text-center py-12 text-slate-400 text-sm">검색중...</div>
          )}
          {!loading && searched && results.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">검색 결과가 없습니다.</div>
          )}
          {!loading && results.length > 0 && (
            <div className="space-y-2">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(item)}
                  className="p-4 bg-white/80 rounded-xl border border-slate-100 hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {item.bizNumber && <span>사업자번호: {item.bizNumber}</span>}
                        {item.representative && <span>대표: {item.representative}</span>}
                      </div>
                      {item.address && <p className="text-xs text-slate-400 mt-1 truncate">{item.address}</p>}
                    </div>
                    <span className="px-2.5 py-1 text-xs bg-primary/10 text-primary rounded-lg font-medium flex-shrink-0">
                      선택
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
