export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        {/* Spinning circle */}
        <div className="w-10 h-10 border-4 border-gray-700 border-t-red-500 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading F1 data...</p>
      </div>
    </div>
  );
}