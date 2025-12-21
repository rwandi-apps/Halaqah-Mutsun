import Image from "next/image";
import React from "react";

type LogoSDQProps = {
  variant?: "icon" | "image";
  size?: number;
  className?: string;
};

const LogoSDQ: React.FC<LogoSDQProps> = ({
  variant = "icon",
  size = 40,
  className = "",
}) => {
  if (variant === "image") {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <Image
          src="/images/logo-sdq.png"
          alt="Logo Sekolah Dasar Qur'an"
          width={size}
          height={size}
          priority
          className="rounded-full"
        />
        <span className="mt-2 text-sm font-semibold text-white">
          SDQ Portal
        </span>
      </div>
    );
  }

  // DEFAULT: ICON (BACKWARD COMPATIBLE)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-emerald-500 p-2 rounded-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </div>
      <span className="font-bold text-lg tracking-tight">
        SDQ Portal
      </span>
    </div>
  );
};

export default LogoSDQ;
