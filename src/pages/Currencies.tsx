import { useState } from 'react';
import { supportedCurrencies, exchangeRates } from '../data/mockData';
import { dbCurrencies } from '../db/database';
import { CurrencySettings } from '../types';

const convertFromAFN = (amountAFN: number, toCode: string) => {
  const rate = exchangeRates[toCode as keyof typeof exchangeRates];
  if (!rate || toCode === 'AFN') return amountAFN;
  return amountAFN / rate;
};

export default function Currencies() {
  const [settings, setSettings] = useState<CurrencySettings>(dbCurrencies.getSettings());

  const updateBase = (code: CurrencySettings['baseCurrency']) => {
    const next = { ...settings, baseCurrency: code };
    setSettings(next);
    dbCurrencies.saveSettings(next);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">مدیریت ارزها</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">تنظیمات ارز پایه</h3>
          <p className="mt-1 text-sm text-slate-500">ارز پایه سیستم برای محاسبه قیمت‌ها</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">ارز پایه</label>
              <select
                value={settings.baseCurrency}
                onChange={(e) => updateBase(e.target.value as CurrencySettings['baseCurrency'])}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {supportedCurrencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.label} ({c.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-slate-900">نرخ‌های تبدیل (۱ واحد ارز = X افغانی)</h4>
              <div className="mt-3 space-y-2">
                {Object.entries(settings.rates).map(([code, rate]) => (
                  <div key={code} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                    <span className="text-sm text-slate-700">{supportedCurrencies.find((c) => c.code === code)?.flag} {code}</span>
                    <span className="text-xs text-slate-600">1 {code} = {rate.toFixed(2)} AFN</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">تبدیل قیمت‌ها</h3>
          <p className="mt-1 text-sm text-slate-500">معادل ۱۰۰,۰۰۰ افغانی به ارزهای جانبی</p>
          <div className="mt-5 space-y-3">
            {supportedCurrencies.filter((c) => c.code !== 'AFN').map((c) => {
              const converted = convertFromAFN(100000, c.code);
              return (
                <div key={c.code} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{c.flag} {c.label}</span>
                    <span className="text-sm font-bold text-slate-900">{converted.toFixed(2)} {c.symbol}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">معادل ۱۰۰,۰۰۰ افغانی</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
