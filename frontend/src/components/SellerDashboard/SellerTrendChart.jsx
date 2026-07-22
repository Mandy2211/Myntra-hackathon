import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { useTheme } from '../../context/ThemeContext';

export function SellerTrendChart({ trend }) {
  const { theme } = useTheme();
  if (!trend || trend.length === 0) return null;
  
  const isDark = theme === 'dark';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full">
      <h3 className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-4">Demand Trend (Last 14 Days)</h3>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
            <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} tickLine={false} />
            <YAxis allowDecimals={false} stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#334155' : '#cbd5e1', borderRadius: '8px' }}
              itemStyle={{ color: '#f472b6' }}
            />
            <Line type="monotone" dataKey="units" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899', strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#64748b'];

export function SellerCategoryPieChart({ data }) {
  const { theme } = useTheme();
  if (!data || data.length === 0) return null;
  
  const isDark = theme === 'dark';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full">
      <h3 className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-4">Sales by Category</h3>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip 
              contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#334155' : '#cbd5e1', borderRadius: '8px', border: isDark ? 'none' : '1px solid #e2e8f0', color: isDark ? '#fff' : '#1e293b' }}
              itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 'bold' }}
              formatter={(value, name) => [`${value} Units`, name]}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MarketGapChart({ insights }) {
  const { theme } = useTheme();
  if (!insights || insights.length === 0) return null;
  
  const isDark = theme === 'dark';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl w-full mt-6">
      <h3 className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-4">Supply vs Demand Analysis</h3>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={insights} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
            <XAxis dataKey="keyword" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} tickLine={false} axisLine={false} style={{ textTransform: 'uppercase' }} />
            <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#334155' : '#cbd5e1', borderRadius: '8px', border: isDark ? 'none' : '1px solid #e2e8f0', color: isDark ? '#fff' : '#1e293b' }}
              itemStyle={{ fontWeight: 'bold', color: isDark ? '#fff' : '#1e293b' }}
              cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }} />
            <Bar dataKey="searchVolume" name="Recently Bought" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="availableProducts" name="Local Supply" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
