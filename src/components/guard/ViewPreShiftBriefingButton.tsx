import React from 'react';
import { FileText } from 'lucide-react';

interface ViewPreShiftBriefingButtonProps {
  onClick: () => void;
  className?: string;
}

export function ViewPreShiftBriefingButton({
  onClick,
  className = '',
}: ViewPreShiftBriefingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full app-button-primary app-btn-md gap-2 ${className}`.trim()}
    >
      <FileText className="w-4 h-4" />
      View briefing
    </button>
  );
}
