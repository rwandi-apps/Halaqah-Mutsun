import React from "react";

type LogoSDQProps = {
  size?: number;
  className?: string;
};

const LogoSDQ: React.FC<LogoSDQProps> = ({
  size = 80,
  className = "",
}) => {
  return (
    <div className={`flex justify-center ${className}`}>
      <img
        src="/images/logo-sdq.png"
        alt="Logo Sekolah Dasar Qur'an"
        width={size}
        height={size}
      />
    </div>
  );
};

export default LogoSDQ;
