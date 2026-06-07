import { Edit3, Printer, Trash2 } from 'lucide-react';

interface Props {
  onEdit?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  compact?: boolean;
}

export default function RecordActions({ onEdit, onDelete, onPrint, compact = false }: Props) {
  const size = compact ? 14 : 16;
  return (
    <div className="flex items-center gap-1 print:hidden">
      {onEdit && (
        <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="ویرایش">
          <Edit3 size={size} />
        </button>
      )}
      {onPrint && (
        <button onClick={onPrint} className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50" title="پرینت">
          <Printer size={size} />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" title="حذف">
          <Trash2 size={size} />
        </button>
      )}
    </div>
  );
}
