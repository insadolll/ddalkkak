import { useState } from 'react';
import { X, Send } from 'lucide-react';
import api from '@/services/api';

interface Props {
  quotationId: string;
  quotationNo: string;
  contactEmail?: string | null;
  onClose: () => void;
  onSent: () => void;
}

export default function SendMailModal({ quotationId, quotationNo, contactEmail, onClose, onSent }: Props) {
  const [to, setTo] = useState(contactEmail || '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(`견적서 송부의 건 - ${quotationNo}`);
  const [body, setBody] = useState('요청하신 견적서를 송부드립니다.');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim()) { setErr('수신자 이메일을 입력해주세요.'); return; }
    setSending(true);
    setErr('');
    try {
      await api.post(`/quotations/${quotationId}/send-mail`, {
        to: to.split(/[;,]/).map(s => s.trim()).filter(Boolean),
        cc: cc ? cc.split(/[;,]/).map(s => s.trim()).filter(Boolean) : undefined,
        subject,
        body,
      });
      onSent();
    } catch (e: unknown) {
      setErr((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || '메일 발송에 실패했습니다.');
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSend} className="relative bg-white/95 backdrop-blur-2xl rounded-[20px] shadow-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">견적서 메일 발송</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" strokeWidth={1.75} />
          </button>
        </div>
        <p className="text-xs text-slate-400">견적서 엑셀 파일이 자동 첨부됩니다.</p>
        {err && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">수신자 * (여러 명은 ; 로 구분)</label>
          <input type="text" value={to} onChange={e => setTo(e.target.value)} placeholder="email@example.com" className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">참조 (CC)</label>
          <input type="text" value={cc} onChange={e => setCc(e.target.value)} placeholder="cc@example.com" className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">제목</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">본문</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-white/60 border border-gray-200 rounded-[10px] text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition">취소</button>
          <button type="submit" disabled={sending} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-light transition disabled:opacity-50">
            <Send className="w-4 h-4" strokeWidth={1.75} />
            {sending ? '발송 중...' : '메일 발송'}
          </button>
        </div>
      </form>
    </div>
  );
}
