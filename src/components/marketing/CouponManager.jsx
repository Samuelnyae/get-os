import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, Plus, X, Copy, ToggleLeft, ToggleRight } from 'lucide-react';

const APPLICABLE_LABELS = { all: 'All', rooms: 'Rooms', food: 'Food', spa: 'Spa', events: 'Events' };

const EMPTY = {
  code: '', description: '', discount_type: 'percent', discount_value: 10,
  min_spend: 0, max_uses: 100, valid_from: '', valid_until: '', applicable_to: 'all', is_active: true,
};

function generateCode() {
  return 'DB' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

export default function CouponManager() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [copied, setCopied] = useState(null);

  const { data: coupons = [] } = useQuery({ queryKey: ['coupons'], queryFn: () => base44.entities.Coupon.list('-created_date') });

  const save = useMutation({
    mutationFn: () => base44.entities.Coupon.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); setShowForm(false); setForm(EMPTY); },
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Coupon.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.Coupon.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  const activeCoupons = coupons.filter(c => c.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Discount & Coupons</h3>
          <p className="text-white/40 text-sm">{activeCoupons} active · {coupons.length} total</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#c9a962] hover:bg-[#b8944f] text-black">
          <Plus className="w-4 h-4 mr-1" /> New Coupon
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {coupons.map(c => {
          const isExpired = c.valid_until && new Date(c.valid_until) < new Date();
          const usePct = c.max_uses ? Math.round((c.uses_count / c.max_uses) * 100) : 0;
          return (
            <div key={c.id} className={`bg-[#1a1a1a] border rounded-2xl p-5 transition-all ${c.is_active && !isExpired ? 'border-[#c9a962]/20' : 'border-white/5 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => copyCode(c.code)} className="font-mono text-[#c9a962] font-bold text-lg tracking-widest hover:text-[#e4d5a7] flex items-center gap-1">
                      {c.code}
                      <Copy className="w-3.5 h-3.5 opacity-60" />
                    </button>
                    {copied === c.code && <span className="text-xs text-emerald-400">Copied!</span>}
                  </div>
                  <div className="text-white/50 text-sm">{c.description || APPLICABLE_LABELS[c.applicable_to]}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggle.mutate({ id: c.id, is_active: !c.is_active })} className="text-white/40 hover:text-[#c9a962] transition-colors">
                    {c.is_active ? <ToggleRight className="w-6 h-6 text-[#c9a962]" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button onClick={() => del.mutate(c.id)} className="text-white/20 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#c9a962]/10 border border-[#c9a962]/20 rounded-lg px-3 py-1.5">
                  <span className="text-[#c9a962] font-bold">{c.discount_value}{c.discount_type === 'percent' ? '%' : ' KES'} OFF</span>
                </div>
                {c.min_spend > 0 && <span className="text-white/30 text-xs">Min KES {c.min_spend.toLocaleString()}</span>}
                <span className="text-white/30 text-xs capitalize">{APPLICABLE_LABELS[c.applicable_to]}</span>
              </div>

              {c.max_uses > 0 && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/40">{c.uses_count}/{c.max_uses} uses</span>
                    {isExpired && <span className="text-red-400">Expired</span>}
                    {c.valid_until && !isExpired && <span className="text-white/30">Until {c.valid_until}</span>}
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#c9a962]/60" style={{ width: `${usePct}%` }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {coupons.length === 0 && (
          <div className="col-span-full text-center py-10 text-white/30"><Tag className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No coupons yet</p></div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#c9a962]/20 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">New Coupon</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-white/40" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-white/60 text-xs mb-1 block">Code</label>
                  <Input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="SUMMER20" className="bg-[#111] border-white/10 text-white font-mono" /></div>
                <div className="flex items-end"><Button onClick={() => setForm(f=>({...f,code:generateCode()}))} variant="outline" className="border-white/10 text-white/50 bg-transparent hover:bg-white/5">Generate</Button></div>
              </div>
              <div><label className="text-white/60 text-xs mb-1 block">Description</label>
                <Input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Summer promotion" className="bg-[#111] border-white/10 text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Discount Type</label>
                  <select value={form.discount_type} onChange={e=>setForm(f=>({...f,discount_type:e.target.value}))} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed (KES)</option>
                  </select>
                </div>
                <div><label className="text-white/60 text-xs mb-1 block">Value</label>
                  <Input type="number" value={form.discount_value} onChange={e=>setForm(f=>({...f,discount_value:Number(e.target.value)}))} className="bg-[#111] border-white/10 text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-white/60 text-xs mb-1 block">Min Spend (KES)</label>
                  <Input type="number" value={form.min_spend} onChange={e=>setForm(f=>({...f,min_spend:Number(e.target.value)}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">Max Uses</label>
                  <Input type="number" value={form.max_uses} onChange={e=>setForm(f=>({...f,max_uses:Number(e.target.value)}))} className="bg-[#111] border-white/10 text-white" /></div>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">Applicable To</label>
                <select value={form.applicable_to} onChange={e=>setForm(f=>({...f,applicable_to:e.target.value}))} className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  {Object.entries(APPLICABLE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-white/60 text-xs mb-1 block">Valid From</label>
                  <Input type="date" value={form.valid_from} onChange={e=>setForm(f=>({...f,valid_from:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">Valid Until</label>
                  <Input type="date" value={form.valid_until} onChange={e=>setForm(f=>({...f,valid_until:e.target.value}))} className="bg-[#111] border-white/10 text-white" /></div>
              </div>
              <Button onClick={() => save.mutate()} disabled={!form.code || !form.discount_value || save.isPending} className="w-full bg-[#c9a962] hover:bg-[#b8944f] text-black">Create Coupon</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}