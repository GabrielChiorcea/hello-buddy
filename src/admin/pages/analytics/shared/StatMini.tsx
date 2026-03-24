import { cn } from '@/lib/utils';

export function StatMini({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="text-center p-2 rounded-lg bg-muted/50">
      <div className={cn('text-lg font-bold', highlight ? 'text-success' : 'text-foreground')}>
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
