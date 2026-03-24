export function EmptyState({ title = 'Nothing here yet', description = 'Come back soon for updates', action }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center shadow-soft">
      <p className="font-heading text-lg font-semibold text-charcoal">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
