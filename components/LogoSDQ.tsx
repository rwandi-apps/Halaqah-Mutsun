import React from 'react';

interface LogoSDQProps {
  className?: string;
  showText?: boolean;
}

const LogoSDQ: React.FC<LogoSDQProps> = ({
  className = "h-16",
  showText = false,
}) => {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/logo-sdq.png"
        alt="Logo Resmi SDQ"
        className={`${className} w-auto object-contain`}
      />

      {showText && (
        <span className="font-bold text-lg tracking-tight text-gray-800">
          SDQ
        </span>
      )}
    </div>
  );
};

export default LogoSDQ;
