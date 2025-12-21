import React from "react";

type LogoSDQProps = {
  size?: number;
  className?: string;
};

const LogoSDQ: React.FC<LogoSDQProps> = ({
  size = 64,
  className = "",
}) => {
  return (
    <img
      src="/images/logo-sdq.png"
      alt="Logo Sekolah Dasar Qur'an"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default LogoSDQ;
