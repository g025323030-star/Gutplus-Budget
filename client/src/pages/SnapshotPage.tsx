import { LayoutDashboard } from 'lucide-react';

export default function SnapshotPage() {
  return (
    <div className="p-6 md:p-8">
      <header className="flex items-center gap-3 mb-2">
        <LayoutDashboard className="text-accent" size={28} strokeWidth={1.5} />
        <h1 className="heading-2">תמונת מצב</h1>
      </header>
      <p className="body-text-sm leading-relaxed">
        סקירה כוללת של ההכנסות וההוצאות שלך — חודשית או שנתית.
      </p>
      <div className="mt-8 bg-surface rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <p className="body-text">המסך יבנה במשימה TASK-02b-3.</p>
      </div>
    </div>
  );
}
