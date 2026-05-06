export function LoadingSkeleton() {
  return (
    <div>
      <div className="h-28 animate-pulse bg-gray-100 rounded-xl mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-48 animate-pulse bg-gray-100 rounded-xl" />
        <div className="h-48 animate-pulse bg-gray-100 rounded-xl" />
        <div className="h-48 animate-pulse bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}
