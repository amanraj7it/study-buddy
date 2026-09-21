import React from 'react';
import { motion } from 'framer-motion';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No items found',
  description = 'Get started by creating your first entry.',
  actionLabel,
  onAction,
  actionIcon,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-[#11101A]/60 border border-[#292332] rounded-2xl border-dashed ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#171421] border border-[#292332] flex items-center justify-center text-[#8B5CF6] mb-4 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-semibold text-[#F5F3F7] mb-1">{title}</h4>
      <p className="text-sm text-[#8F889D] max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} icon={actionIcon} variant="primary" size="sm">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
