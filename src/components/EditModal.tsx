import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export interface EditField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'tel' | 'date' | 'select';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
}

interface EditModalProps {
  title: string;
  fields: EditField[];
  data: Record<string, any>;
  onSave: (data: Record<string, any>) => void;
  onClose: () => void;
}

export default function EditModal({ title, fields, data, onSave, onClose }: EditModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>(data);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 mr-1">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  required={field.required}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">انتخاب کنید...</option>
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  value={formData[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                  required={field.required}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>
          ))}
        </form>

        <div className="flex gap-2 p-5 border-t bg-slate-50">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl hover:bg-white">
            انصراف
          </button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2">
            <Save size={16} />
            ذخیره
          </button>
        </div>
      </div>
    </div>
  );
}
