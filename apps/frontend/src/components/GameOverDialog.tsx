import { useGameStore } from "@/lib/store";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";

type Props = {
    onGoToLobby: () => void;
};

export function GameOverDialog({ onGoToLobby }: Props) {
    const { gameOver, gameResult, setGameOver } = useGameStore();

    return (
        <Dialog open={gameOver} onOpenChange={setGameOver}>
            <DialogContent className="bg-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle>{gameResult}</DialogTitle>
                    <DialogDescription>
                        The game has ended.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={onGoToLobby} size="lg" variant="secondary">Go to Lobby</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 