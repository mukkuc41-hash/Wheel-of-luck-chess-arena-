import React from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { isSiteOwner } from '../utils/owner';

interface OwnerBadgeProps {
  username?: string | null;
  /** Force rendering even if username check is omitted */
  forceShow?: boolean;
  /** Size tier for badge */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Custom label e.g. "OWNER", "SITE OWNER", "CREATOR" */
  label?: string;
  /** Additional custom classNames */
  className?: string;
  /** Show crown icon */
  showCrown?: boolean;
  /** Show subtle sparkle animation */
  showSparkle?: boolean;
}

export const OwnerBadge: React.FC<OwnerBadgeProps> = ({
  username,
  forceShow = false,
  size = 'sm',
  label = 'OWNER',
  className = '',
  showCrown = true,
  showSparkle = false,
}) => {
  if (!forceShow && !isSiteOwner(username)) {
    return null;
  }

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-black',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center font-black tracking-wider uppercase rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 border border-amber-200/90 shadow-[0_0_14px_rgba(245,158,11,0.55)] select-none shrink-0 transition-transform hover:scale-105 ${sizeClasses[size]} ${className}`}
      title="Verified Site Owner & Platform Creator (ADITYA-OWNER)"
    >
      {showCrown && <Crown className={`${iconSizes[size]} text-slate-950 fill-slate-950`} />}
      <span>{label}</span>
      {showSparkle && <Sparkles className={`${iconSizes[size]} text-slate-950 animate-pulse`} />}
    </span>
  );
};
