import React from "react";

const SummaryCard = ({
  title,
  value,
  description,
  Icon,
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-500",
  //   textColor = "text-white",
  //   bgColor = "bg-blue-600", // Default background color
}) => {
  return (
    <div
      className={`flex flex-1 items-center w-64 s lg:w-80 p-3 rounded-xl shadow-md `}
    >
      {/* Icon */}
      <div className={`p-2 rounded-full ${iconBgColor} mr-3 flex-shrink-0`}>
        {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
      </div>

      {/* Text */}
      <div className="flex flex-col justify-center">
        <span className={`text-xs font-medium `}>{title}</span>
        <span className={`text-xl font-bold `}>{value}</span>
        {description && (
          <span className="text-[10px] text-gray-700 truncate">
            {description}
          </span>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
