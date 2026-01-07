import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
                {/* Text Content */}
                <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                        {title}
                    </p>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                        {value}
                    </h3>
                    {subtitle && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Icon */}
                <div className={`p-2 sm:p-2.5 lg:p-3 rounded-full ${color} flex-shrink-0`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
            </div>
        </div>
    );
};

export default StatCard;