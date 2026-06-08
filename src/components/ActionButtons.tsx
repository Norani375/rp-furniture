import { Edit2, Trash2, Printer, Eye } from 'lucide-react';

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  onView?: () => void;
  size?: 'sm' | 'md';
}

export default function ActionButtons({ onEdit, onDelete, onPrint, onView, size = 'md' }: ActionButtonsProps) {
  const iconSize = size === 'sm' ? 14 : 16;
  const padding = size === 'sm' ? 'p-1.5' : 'p-2';
  
  return (
    <div className="flex items-center gap-1">
      {onView && (
        <button onClick={onView} title="مشاهده" className={`${padding} rounded-lg text-blue-600 hover:bg-blue-50 transition-colors`}>
          <Eye size={iconSize} />
        </button>
      )}
      {onPrint && (
        <button onClick={onPrint} title="چاپ" className={`${padding} rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors`}>
          <Printer size={iconSize} />
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} title="ویرایش" className={`${padding} rounded-lg text-slate-600 hover:bg-slate-100 transition-colors`}>
          <Edit2 size={iconSize} />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} title="حذف" className={`${padding} rounded-lg text-red-600 hover:bg-red-50 transition-colors`}>
          <Trash2 size={iconSize} />
        </button>
      )}
    </div>
  );
}
