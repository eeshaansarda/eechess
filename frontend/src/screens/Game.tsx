import { useSocket } from "@/hooks/useSocket";
import Chessboard from "@/components/Chessboard";
import { Button } from "@/components/ui/button";

function Game() {
    const socket = useSocket();

    if(!socket) return <div>Connecting...</div>
    return (
        <div className="flex min-h-svh items-center justify-center bg-[#262522]">
            <div className="grid w-full max-w-7xl grid-cols-1 gap-8 p-8 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Chessboard />
                </div>
                <div className="rounded-lg bg-[#1c1b19] p-6 shadow-lg md:col-span-1">
                    <h2 className="mb-4 text-2xl font-bold text-white">Game Controls</h2>
                    <Button className="w-full bg-[#b58863] py-3 text-lg font-semibold text-white shadow-md transition-colors hover:bg-[#a57853]">
                        Play
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default Game;