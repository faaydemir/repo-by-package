export default function Spinner() {
    return (
        <div className="w-full h-0 relative z-50">
            <div className="w-full h-0.5 overflow-hidden absolute top-0 left-0">

                <div
                    className="h-full w-1/3 bg-blue-400/60 absolute left-0"
                    style={{
                        animation: "slide 2s linear infinite",
                    }}
                />
                <style>
                    {`
            @keyframes slide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100vw); }
            }
          `}
                </style>
            </div>
        </div>
    );
}