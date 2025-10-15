import { IconProps } from "@/lib/utils";
import React from "react";

const TwitterIcon = ({ className }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="200"
      height="200"
      className={className}
      viewBox="0 0 16 16"
    >
      <path
        fill="currentColor"
        d="M.102 0h4.71l4.193 5.997L14.04 0h1.505L9.58 6.82L16 16h-4.71L6.911 9.738L1.504 16H0l6.337-7.083z"
      />
    </svg>
  );
};

export default TwitterIcon;
