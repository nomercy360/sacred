'use client';

const Button = ({ text, onClick }: { text: string; onClick?: () => void }) => {
  return (
    <button 
      className="bg-[#F3F3F3] cursor-pointer w-10 h-10 rounded-full flex items-center justify-center"
      onClick={onClick}
    >
      <span className="material-symbols-rounded text-[20px] text-black">{text}</span>
    </button>
  );
};

export default Button;