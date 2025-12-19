import { Construction } from "lucide-react";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function ComingSoon({
  title = "Fitur Sedang Dikembangkan",
  description = "InsyaAllah fitur ini akan segera tersedia. Mohon bersabar ya 🙂",
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-yellow-100 text-yellow-600 p-6 rounded-full mb-6">
        <Construction size={48} />
      </div>

      <span className="text-xs font-semibold bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full mb-3">
        🚧 COMING SOON
      </span>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        {title}
      </h2>

      <p className="text-gray-500 max-w-md">
        {description}
      </p>
    </div>
  );
}
