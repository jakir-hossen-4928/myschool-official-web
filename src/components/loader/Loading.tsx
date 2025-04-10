
import React from 'react';

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-[200px] w-full">
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 right-0 bottom-0 m-auto w-12 h-12 border-4 border-t-school-primary border-r-school-accent border-b-school-secondary border-l-transparent rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 right-0 bottom-0 m-auto w-20 h-20 border-4 border-t-transparent border-r-school-primary border-b-school-accent border-l-school-secondary rounded-full animate-spin animation-delay-150"></div>
        </div>
        <p className="mt-4 text-school-primary font-semibold">Loading...</p>
      </div>
    </div>
  );
};

export default Loading;
