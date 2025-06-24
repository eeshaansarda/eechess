import { useNavigate } from "react-router";
import { Button } from "./components/ui/button";
import { Chessboard } from "react-chessboard";

function App() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-900">
      <div className="grid max-w-5xl grid-cols-1 items-center gap-16 p-8 md:grid-cols-2">
        <div>
          <Chessboard
            boardWidth={480}
            arePiecesDraggable={false}
            customDarkSquareStyle={{
              backgroundColor: "#475569",
            }}
            customLightSquareStyle={{
                backgroundColor: "#94a3b8",
            }}
          />
        </div>
        <div className="flex flex-col items-center justify-center text-center text-white">
          <h1 className="text-6xl font-bold tracking-tight">eechess</h1>
          <p className="mt-4 text-xl text-slate-300">
            The next generation of online chess.
          </p>
          <Button onClick={() => {
            navigate('/game')
          }} size="lg" variant="secondary" className="mt-8 w-full max-w-xs py-6 text-xl font-semibold">
            Play Online
          </Button>
          <p className="mt-4 text-slate-400">{/*TODO*/}123 users online</p>
        </div>
      </div>
    </div>
  );
}

export default App;
