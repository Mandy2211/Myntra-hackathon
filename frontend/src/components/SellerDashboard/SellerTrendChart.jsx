import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function SellerTrendChart({ trend }) {
  if (!trend || trend.length === 0) return null;
  
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full mb-8">
      <h3 className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-4">Demand Trend (Last 14 Days)</h3>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
            <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke="#94a3b8" fontSize={12} tickLine={false} />
            <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
              itemStyle={{ color: '#f472b6' }}
            />
            <Line type="monotone" dataKey="units" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899', strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
