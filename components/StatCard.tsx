import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color = "bg-white" }) => (
  <div className={`${color} p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between transition-transform hover:-translate-y-1 duration-200`}>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      {trend && <p className="text-xs text-green-600 mt-2 font-medium">{trend}</p>}
    </div>
    <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
      <Icon size={24} />
    </div>
  </div>
);

export default StatCard;