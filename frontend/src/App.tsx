import { useNavigate } from "react-router";
import { Button } from "./components/ui/button";
import { Chessboard } from "react-chessboard";

function App() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#262522]">
      <div className="grid max-w-5xl grid-cols-1 items-center gap-16 p-8 md:grid-cols-2">
        <div>
          <Chessboard
            boardWidth={480}
            arePiecesDraggable={false}
          />
        </div>
        <div className="flex flex-col items-center justify-center text-center text-white">
          <h1 className="text-6xl font-bold tracking-tight">EeChess</h1>
          <p className="mt-4 text-xl text-slate-300">
            The next generation of online chess.
          </p>
          <Button onClick={() => {
            navigate('/game')
          }} className="mt-8 w-full max-w-xs bg-[#b58863] py-6 text-xl font-semibold text-white shadow-md transition-colors hover:bg-[#a57853]">
            Play Online
          </Button>
          <p className="mt-4 text-slate-400">123 users online</p>
        </div>
      </div>
    </div>
  );
}

export default App;
