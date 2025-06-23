interface CircularProgressProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export default function CircularProgress({ 
  completed, 
  total, 
  size = 60, 
  strokeWidth = 4 
}: CircularProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle (represents todos to be done) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#D5212133"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle (represents completed todos) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#D52121"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold" style={{ color: '#D52121' }}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}
