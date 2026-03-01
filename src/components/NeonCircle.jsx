const NeonCircle = ({ amount, theme, currencySymbol, isHidden, onToggleHidden, monthLabel }) => {
  const bars = Array.from({ length: 40 }, (_, i) => {
    const angle = (i * 360) / 40;
    const delay = Math.random() * 2;
    const radius = 140;

    return (
      <div
        key={i}
        className={`absolute rounded-full ${
          theme === 'dark' ? 'bg-cyan-400 animate-pulse' : 'bg-blue-500'
        }`}
        style={{
          width: '4px',
          height: '25px',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px)`,
          transformOrigin: 'center',
          animationDelay: theme === 'dark' ? `${delay}s` : '0s'
        }}
      />
    );
  });

  const formattedAmount = amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const displayText = isHidden ? '*****' : `${currencySymbol}${formattedAmount}`;
  const charCount = displayText.length;

  const getFontSize = () => {
    if (isHidden) return '3rem';
    if (charCount <= 8) return '3rem';
    if (charCount <= 12) return '2.5rem';
    if (charCount <= 15) return '2rem';
    if (charCount <= 18) return '1.5rem';
    return '1.2rem';
  };

  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      {bars}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
        <h3 className={`text-lg font-semibold mb-3 ${
          theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
        }`}>
          {monthLabel}
        </h3>
        <button
          onClick={onToggleHidden}
          className={`font-bold transition-colors ${
            theme === 'dark' ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'
          }`}
          style={{
            fontSize: getFontSize()
          }}
        >
          {displayText}
        </button>
      </div>
    </div>
  );
};

export default NeonCircle;
