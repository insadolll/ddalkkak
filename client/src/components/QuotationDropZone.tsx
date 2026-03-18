import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { GripVertical, Plus, X } from 'lucide-react';
import api from '@/services/api';

interface MiniQuotation {
  id: string;
  quotationNo: string;
  direction: string;
  title: string | null;
  totalAmount: number;
  revision: number;
  isConfirmed: boolean;
  counterpart: { name: string } | null;
}

interface Props {
  projectId: string;
  direction: 'SALES' | 'PURCHASE';
  onLinked: () => void;
}

function DraggableCard({ q }: { q: MiniQuotation }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: q.id,
    data: q,
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-3 bg-white/80 rounded-xl border border-slate-200 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-30 border-2 border-dashed border-primary/30 bg-primary/5' : 'hover:shadow-md hover:translate-y-[-1px] transition-all'
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" strokeWidth={1.75} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono font-medium text-slate-700 truncate">{q.quotationNo}</p>
          <p className="text-[11px] text-slate-400 truncate">{q.counterpart?.name || q.title || ''}</p>
        </div>
        <p className="text-xs font-mono font-medium text-slate-600">
          ₩{q.totalAmount.toLocaleString('ko-KR')}
        </p>
      </div>
    </div>
  );
}

function OverlayCard({ q }: { q: MiniQuotation }) {
  return (
    <div className="p-3 bg-white rounded-xl border-2 border-primary shadow-2xl scale-[1.03] rotate-[2deg] cursor-grabbing w-[280px]">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-primary" strokeWidth={1.75} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono font-semibold text-primary">{q.quotationNo}</p>
          <p className="text-[11px] text-slate-500">{q.counterpart?.name || q.title || ''}</p>
        </div>
        <p className="text-xs font-mono font-semibold text-primary">
          ₩{q.totalAmount.toLocaleString('ko-KR')}
        </p>
      </div>
    </div>
  );
}

function DropArea({ direction, isOver }: { direction: string; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: `drop-${direction}` });
  const label = direction === 'SALES' ? '매출' : '매입';

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 ${
        isOver
          ? 'border-primary bg-primary/10 scale-[1.01]'
          : 'border-slate-300 bg-slate-50/50 hover:border-slate-400'
      }`}
    >
      <Plus className={`w-5 h-5 mx-auto mb-1 ${isOver ? 'text-primary' : 'text-slate-400'}`} strokeWidth={1.75} />
      <p className={`text-xs font-medium ${isOver ? 'text-primary' : 'text-slate-400'}`}>
        {isOver ? '여기에 놓기' : `독립 견적서를 드래그하여 ${label} 풀에 연결`}
      </p>
    </div>
  );
}

export default function QuotationDropZone({ projectId, direction, onLinked }: Props) {
  const [unlinked, setUnlinked] = useState<MiniQuotation[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [activeItem, setActiveItem] = useState<MiniQuotation | null>(null);
  const [isOverDrop, setIsOverDrop] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUnlinked = useCallback(async () => {
    try {
      const res = await api.get('/quotations', {
        params: { direction, limit: 50 },
      });
      // Filter only unlinked (no projectId)
      const all = res.data.data as MiniQuotation[];
      setUnlinked(all.filter((q: MiniQuotation & { projectId?: string }) => !q.projectId));
    } catch { /* ignore */ }
  }, [direction]);

  useEffect(() => {
    if (showPanel) fetchUnlinked();
  }, [showPanel, fetchUnlinked]);

  async function linkQuotation(quotationId: string) {
    setLoading(true);
    try {
      await api.put(`/quotations/${quotationId}`, { projectId });
      onLinked();
      fetchUnlinked();
    } catch {
      alert('연결에 실패했습니다.');
    }
    setLoading(false);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveItem(event.active.data.current as MiniQuotation);
  }

  function handleDragOver(event: { over: unknown }) {
    setIsOverDrop(!!event.over);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    setIsOverDrop(false);
    if (event.over && event.active.id) {
      linkQuotation(event.active.id as string);
    }
  }

  const dirLabel = direction === 'SALES' ? '매출' : '매입';

  return (
    <div className="mt-3">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="text-xs text-primary hover:text-primary-light font-medium transition flex items-center gap-1"
      >
        {showPanel ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        {showPanel ? '닫기' : `독립 ${dirLabel} 견적서 연결`}
      </button>

      {showPanel && (
        <DndContext onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Draggable unlinked quotations */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">미연결 {dirLabel} 견적서</p>
              {unlinked.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">미연결 견적서가 없습니다</p>
              ) : (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {unlinked.map(q => (
                    <DraggableCard key={q.id} q={q} />
                  ))}
                </div>
              )}
            </div>

            {/* Drop zone */}
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">드롭 영역</p>
              <DropArea direction={direction} isOver={isOverDrop} />
              {loading && <p className="text-xs text-primary mt-2 text-center">연결 중...</p>}
            </div>
          </div>

          <DragOverlay dropAnimation={null} style={{ zIndex: 9999 }}>
            {activeItem ? <OverlayCard q={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
