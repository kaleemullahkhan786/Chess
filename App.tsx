import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Move as ChessMove, Square as ChessSquare } from 'chess.js';
import { PIECE_SVGS } from './constants';
import { BoardState, SavedGame } from './types';

// --- Icons ---
const RestartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
);

const UndoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
);

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={className || "text-amber-100/70"}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);

// --- Components ---

const Piece = ({ type, color }: { type: string; color: string }) => {
  const key = `${color}${type.toUpperCase()}`;
  return <div className="w-full h-full p-[2px] select-none pointer-events-none piece-real">{PIECE_SVGS[key]}</div>;
};

const Graveyard = ({ pieces, pieceColor }: { pieces: string[], pieceColor: 'w' | 'b' }) => {
  const valueMap: Record<string, number> = { q: 10, r: 5, b: 3.1, n: 3, p: 1 };
  const sorted = [...pieces].sort((a, b) => valueMap[b] - valueMap[a]);

  return (
    <div className="flex items-center h-10 sm:h-12 px-2 rounded-lg graveyard-tray w-full overflow-hidden">
        {sorted.length === 0 ? (
            <span className="text-white/10 text-[10px] uppercase font-bold tracking-widest mx-auto">No Casualties</span>
        ) : (
            <div className="flex flex-wrap gap-1 items-center justify-start w-full overflow-x-auto no-scrollbar">
                {sorted.map((p, i) => {
                    const key = `${pieceColor}${p.toUpperCase()}`;
                    return (
                        <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 -mr-2 transition-all hover:-mr-0 hover:scale-110 z-0 hover:z-10 drop-shadow-md">
                            {PIECE_SVGS[key]}
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};

const SetupScreen = ({ onStart, onLoad }: { onStart: (wName: string, bName: string, time: number) => void, onLoad: (game: SavedGame) => void }) => {
  const [wName, setWName] = useState("White Player");
  const [bName, setBName] = useState("Black Player");
  const [time, setTime] = useState(10);
  const [view, setView] = useState<'new' | 'saved'>('new');
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);

  useEffect(() => {
    const saves = localStorage.getItem('chess_saved_games');
    if (saves) {
      setSavedGames(JSON.parse(saves));
    }
  }, []);

  const deleteSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSaves = savedGames.filter(g => g.id !== id);
    setSavedGames(newSaves);
    localStorage.setItem('chess_saved_games', JSON.stringify(newSaves));
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-2 touch-none">
      <div className="wood-panel p-6 rounded-lg shadow-2xl w-[95%] sm:w-full max-w-md animate-slide-up text-amber-50 border-2 border-[#5d4037] flex flex-col max-h-[90vh]">
        
        {/* Tabs */}
        <div className="flex w-full mb-6 border-b border-[#ffffff20]">
            <button 
                onClick={() => setView('new')}
                className={`flex-1 py-3 font-serif font-bold text-lg uppercase tracking-wide transition-colors ${view === 'new' ? 'text-[#e8cfa4] border-b-2 border-[#e8cfa4]' : 'text-amber-200/40 hover:text-amber-200/70'}`}
            >
                New Game
            </button>
            <button 
                onClick={() => setView('saved')}
                className={`flex-1 py-3 font-serif font-bold text-lg uppercase tracking-wide transition-colors ${view === 'saved' ? 'text-[#e8cfa4] border-b-2 border-[#e8cfa4]' : 'text-amber-200/40 hover:text-amber-200/70'}`}
            >
                Saved Games
            </button>
        </div>

        {view === 'new' ? (
            <div className="space-y-5 overflow-y-auto pr-1">
                <div>
                    <label className="block text-xs uppercase tracking-widest text-amber-200/50 mb-2 font-bold">White Player</label>
                    <input 
                    type="text" 
                    value={wName} 
                    onChange={e => setWName(e.target.value)}
                    className="w-full bg-[#261a15] border border-[#5d4037] rounded p-4 text-[#e8cfa4] focus:border-[#deb887] outline-none shadow-inner font-serif text-lg"
                    />
                </div>
                
                <div>
                    <label className="block text-xs uppercase tracking-widest text-amber-200/50 mb-2 font-bold">Black Player</label>
                    <input 
                    type="text" 
                    value={bName} 
                    onChange={e => setBName(e.target.value)}
                    className="w-full bg-[#261a15] border border-[#5d4037] rounded p-4 text-[#e8cfa4] focus:border-[#deb887] outline-none shadow-inner font-serif text-lg"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest text-amber-200/50 mb-2 font-bold">Time Control (Minutes)</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 30].map(m => (
                        <button 
                            key={m}
                            onClick={() => setTime(m)}
                            className={`py-3 rounded font-bold border-b-4 transition-all active:mt-1 active:border-b-0 ${time === m ? 'bg-[#deb887] text-[#3e2713] border-[#8b5a2b]' : 'bg-[#3e2723] border-[#261a15] text-[#a1887f]'}`}
                        >
                            {m}
                        </button>
                        ))}
                    </div>
                </div>

                <button 
                onClick={() => onStart(wName, bName, time)}
                className="w-full mt-4 py-4 bg-[#5d4037] hover:bg-[#6d4c41] text-[#e8cfa4] font-bold rounded shadow-btn-wood active:shadow-btn-wood-active transform transition active:translate-y-1 text-xl tracking-widest uppercase border border-[#8b5a2b]"
                >
                Start Match
                </button>
            </div>
        ) : (
            <div className="flex-1 overflow-y-auto pr-1">
                {savedGames.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-amber-200/30 italic">No saved games found.</div>
                ) : (
                    <div className="space-y-3">
                        {savedGames.map(g => (
                            <div 
                                key={g.id}
                                onClick={() => onLoad(g)}
                                className="group relative bg-[#261a15] border border-[#5d4037] p-4 rounded hover:bg-[#3e2723] cursor-pointer transition-colors shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-[#e8cfa4] text-lg leading-tight">{g.name}</h3>
                                    <button 
                                        onClick={(e) => deleteSave(g.id, e)}
                                        className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                                <div className="text-sm text-amber-200/60 flex justify-between items-center">
                                    <span>{g.whiteName} vs {g.blackName}</span>
                                    <span className="text-xs opacity-50">{new Date(g.date).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-2 text-xs text-amber-200/30 font-mono">
                                    {new Date(g.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}

const SaveGameModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (name: string) => void }) => {
    const [name, setName] = useState("");

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="wood-panel p-6 rounded-lg shadow-2xl w-full max-w-sm animate-pop-in border-2 border-[#8b5a2b]">
                <h3 className="text-xl font-bold text-[#e8cfa4] mb-4 text-center uppercase tracking-wide">Save Game Session</h3>
                <input 
                    type="text" 
                    placeholder="Enter session name (e.g., Vs Dad)" 
                    value={name}
                    autoFocus
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#261a15] border border-[#5d4037] rounded p-4 text-[#e8cfa4] mb-6 focus:border-[#deb887] outline-none shadow-inner font-serif"
                />
                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 bg-[#3e2723] text-amber-200/60 font-bold rounded hover:bg-[#4e342e] border border-[#5d4037]"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => { if(name.trim()) onSave(name); }}
                        disabled={!name.trim()}
                        className="flex-1 py-3 bg-[#5d4037] text-[#e8cfa4] font-bold rounded shadow-btn-wood active:shadow-btn-wood-active transform transition active:translate-y-1 border border-[#8b5a2b] disabled:opacity-50"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

const PromotionModal = ({ isOpen, color, onSelect }: { isOpen: boolean; color: 'w' | 'b'; onSelect: (p: 'q' | 'r' | 'b' | 'n') => void }) => {
  if (!isOpen) return null;
  const pieces = ['q', 'r', 'b', 'n'] as const;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in touch-none p-4">
      <div className="wood-panel p-6 rounded-lg shadow-2xl border-2 border-[#8b5a2b] animate-pop-in">
        <h3 className="text-[#e8cfa4] text-center mb-6 font-bold text-lg tracking-wide uppercase">Promote Pawn</h3>
        <div className="flex gap-4">
          {pieces.map((p) => (
            <button
              key={p}
              onClick={() => onSelect(p)}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-[#e3c193] hover:bg-[#fff] rounded-lg flex items-center justify-center transition-all hover:scale-105 border-b-4 border-[#8b5a2b] shadow-lg active:border-b-0 active:translate-y-1"
            >
              <Piece type={p} color={color} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const GameOverModal = ({ isOpen, result, reason, onRestart }: { isOpen: boolean; result: string; reason: string; onRestart: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in px-4 touch-none">
      <div className="wood-panel p-8 rounded-lg shadow-2xl border-2 border-[#8b5a2b] w-[95%] max-w-sm text-center animate-pop-in">
        <div className="flex justify-center mb-6 drop-shadow-xl filter brightness-125">
            <TrophyIcon />
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif text-[#e8cfa4] mb-2 drop-shadow-sm">{result}</h2>
        <p className="text-amber-200/60 mb-8 font-medium tracking-wide uppercase text-sm">{reason}</p>
        <button
          onClick={onRestart}
          className="w-full py-4 bg-[#5d4037] hover:bg-[#6d4c41] text-[#e8cfa4] font-bold rounded shadow-btn-wood active:shadow-btn-wood-active transform transition active:translate-y-1 text-lg border border-[#8b5a2b]"
        >
          New Game
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState<BoardState>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [possibleMoves, setPossibleMoves] = useState<ChessMove[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [promotionSquare, setPromotionSquare] = useState<{ from: string; to: string } | null>(null);
  const [isCheck, setIsCheck] = useState(false);
  
  // Game Setup & Timer State
  const [gameStatus, setGameStatus] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [whiteName, setWhiteName] = useState("White");
  const [blackName, setBlackName] = useState("Black");
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [initialTime, setInitialTime] = useState(10);
  
  // Save State
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Captured Pieces (Casualties)
  const [lostByWhite, setLostByWhite] = useState<string[]>([]);
  const [lostByBlack, setLostByBlack] = useState<string[]>([]);

  const updateGameState = useCallback((newGame: Chess) => {
    const boardData = newGame.board().map(row => 
      row.map(piece => piece ? { square: piece.square, type: piece.type, color: piece.color } : null)
    );
    setBoard(boardData);
    setGame(newGame);
    setIsCheck(newGame.inCheck());

    const history = newGame.history({ verbose: true });
    const lostW: string[] = [];
    const lostB: string[] = [];
    
    history.forEach(move => {
        if (move.captured) {
            if (move.color === 'w') {
                lostB.push(move.captured);
            } else {
                lostW.push(move.captured);
            }
        }
    });
    setLostByWhite(lostW);
    setLostByBlack(lostB);

  }, []);

  const startGame = (w: string, b: string, t: number) => {
    setWhiteName(w || "White");
    setBlackName(b || "Black");
    setInitialTime(t);
    setWhiteTime(t * 60);
    setBlackTime(t * 60);
    setGameStatus('playing');
    
    const newGame = new Chess();
    updateGameState(newGame);
    setLastMove(null);
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const resetGame = () => {
    setGameStatus('setup');
    const newGame = new Chess();
    updateGameState(newGame);
    setWhiteTime(initialTime * 60);
    setBlackTime(initialTime * 60);
    setLastMove(null);
    setSelectedSquare(null);
    setValidMoves([]);
  };

  const handleSaveGame = (name: string) => {
      const save: SavedGame = {
          id: Date.now().toString(),
          name,
          date: Date.now(),
          pgn: game.pgn(),
          whiteName,
          blackName,
          whiteTime,
          blackTime,
          initialTime
      };

      const existing = localStorage.getItem('chess_saved_games');
      const saves: SavedGame[] = existing ? JSON.parse(existing) : [];
      saves.unshift(save); // Add to top
      localStorage.setItem('chess_saved_games', JSON.stringify(saves));
      setShowSaveModal(false);
  };

  const handleLoadGame = (save: SavedGame) => {
      const loadedGame = new Chess();
      loadedGame.loadPgn(save.pgn);
      
      setWhiteName(save.whiteName);
      setBlackName(save.blackName);
      setWhiteTime(save.whiteTime);
      setBlackTime(save.blackTime);
      setInitialTime(save.initialTime);
      
      updateGameState(loadedGame);
      setGameStatus('playing');
      setLastMove(null);
      setSelectedSquare(null);
      setValidMoves([]);
  };

  // Timer Effect
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const timer = setInterval(() => {
        if (game.isGameOver()) return;
        // Don't tick if save modal is open? Optional. 
        // For now, let it tick or we need a pause state. 
        // Let's assume friendly game, let it tick.

        if (game.turn() === 'w') {
            setWhiteTime(prev => {
                if (prev <= 0) {
                    setGameStatus('finished');
                    return 0;
                }
                return prev - 1;
            });
        } else {
            setBlackTime(prev => {
                if (prev <= 0) {
                    setGameStatus('finished');
                    return 0;
                }
                return prev - 1;
            });
        }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, game.turn()]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getSquareColor = (row: number, col: number, squareName: string) => {
    const isLight = (row + col) % 2 === 0;
    let baseClass = isLight ? 'wood-texture-light' : 'wood-texture-dark';
    
    const isSelected = selectedSquare === squareName;
    const isLastMove = lastMove && (lastMove.from === squareName || lastMove.to === squareName);
    const isKingInCheck = isCheck && game.get(squareName as ChessSquare)?.type === 'k' && game.get(squareName as ChessSquare)?.color === game.turn();

    if (isKingInCheck) {
       return 'bg-gradient-to-br from-red-600 to-red-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]'; 
    }
    
    if (isSelected) {
      return 'bg-[#fdd835] shadow-[inset_0_0_15px_rgba(0,0,0,0.4)] opacity-90'; 
    }
    
    if (isLastMove) {
      return isLight ? 'bg-[#c5e1a5]' : 'bg-[#7cb342]'; 
    }

    return baseClass;
  };

  const handleSquareClick = (squareName: string) => {
    if (gameStatus !== 'playing') return;
    if (promotionSquare) return;

    if (!selectedSquare) {
      const piece = game.get(squareName as ChessSquare);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(squareName);
        const moves = game.moves({ square: squareName as ChessSquare, verbose: true });
        setPossibleMoves(moves);
        setValidMoves(moves.map(m => m.to));
      }
      return;
    }

    if (selectedSquare === squareName) {
      setSelectedSquare(null);
      setValidMoves([]);
      setPossibleMoves([]);
      return;
    }

    const move = possibleMoves.find(m => m.to === squareName);
    
    if (move) {
      if ((move.color === 'w' && move.to[1] === '8') || (move.color === 'b' && move.to[1] === '1')) {
          if (move.piece === 'p') {
              setPromotionSquare({ from: selectedSquare, to: squareName });
              return;
          }
      }
      executeMove(selectedSquare, squareName);
    } else {
        const piece = game.get(squareName as ChessSquare);
        if (piece && piece.color === game.turn()) {
            setSelectedSquare(squareName);
            const moves = game.moves({ square: squareName as ChessSquare, verbose: true });
            setPossibleMoves(moves);
            setValidMoves(moves.map(m => m.to));
        } else {
            setSelectedSquare(null);
            setValidMoves([]);
            setPossibleMoves([]);
        }
    }
  };

  const executeMove = (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => {
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());
    
    try {
      const result = gameCopy.move({
        from: from,
        to: to,
        promotion: promotion || undefined,
      });

      if (result) {
        setLastMove({ from, to });
        updateGameState(gameCopy);
        setSelectedSquare(null);
        setValidMoves([]);
        setPossibleMoves([]);
        setPromotionSquare(null);
      }
    } catch (e) {
      console.error("Invalid move", e);
    }
  };

  const handlePromotionSelect = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (promotionSquare) {
      executeMove(promotionSquare.from, promotionSquare.to, piece);
    }
  };

  const undoMove = () => {
    if (gameStatus !== 'playing') return;
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());
    
    const move = gameCopy.undo();
    if (move) {
      updateGameState(gameCopy);
      setLastMove(null);
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const isGameOver = game.isGameOver() || whiteTime === 0 || blackTime === 0;
  let gameOverResult = '';
  let gameOverReason = '';

  if (isGameOver) {
    if (whiteTime === 0) {
        gameOverResult = `${blackName} Wins!`;
        gameOverReason = "Time Out";
    } else if (blackTime === 0) {
        gameOverResult = `${whiteName} Wins!`;
        gameOverReason = "Time Out";
    } else if (game.isCheckmate()) {
      gameOverResult = game.turn() === 'w' ? `${blackName} Wins!` : `${whiteName} Wins!`;
      gameOverReason = 'Checkmate';
    } else if (game.isDraw()) {
      gameOverResult = 'Draw';
      if (game.isStalemate()) gameOverReason = 'Stalemate';
      else if (game.isThreefoldRepetition()) gameOverReason = 'Threefold Repetition';
      else if (game.isInsufficientMaterial()) gameOverReason = 'Insufficient Material';
      else gameOverReason = '50-Move Rule';
    }
  }

  const renderBoard = () => {
    const squares = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const squareName = String.fromCharCode(97 + c) + (8 - r);
        const pieceInfo = board[r]?.[c];
        const isHighlight = validMoves.includes(squareName);
        
        squares.push(
          <div
            key={squareName}
            onClick={() => handleSquareClick(squareName)}
            className={`
              relative w-[12.5%] pb-[12.5%] 
              ${getSquareColor(r, c, squareName)}
              cursor-pointer select-none
            `}
          >
            {/* Rank/File - Subtle Engraving Look */}
            {c === 0 && (
                <span className={`absolute top-0.5 left-1 text-[8px] sm:text-[10px] font-bold opacity-70 ${
                    (r + c) % 2 === 0 ? 'text-[#3e2723]' : 'text-[#8b4513]'
                }`}>
                    {8 - r}
                </span>
            )}
            {r === 7 && (
                <span className={`absolute bottom-0 right-1 text-[8px] sm:text-[10px] font-bold opacity-70 ${
                     (r + c) % 2 === 0 ? 'text-[#3e2723]' : 'text-[#8b4513]'
                }`}>
                    {String.fromCharCode(97 + c)}
                </span>
            )}

            {/* Piece Container */}
            <div className="absolute inset-0 flex items-center justify-center p-[4%] sm:p-[6%] z-10">
              {pieceInfo && <Piece type={pieceInfo.type} color={pieceInfo.color} />}
              
              {/* Move Indicator - Indented Wood Dot */}
              {isHighlight && !pieceInfo && (
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-black/20 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]" />
              )}
              {/* Capture Indicator - BRIGHT RED RING */}
              {isHighlight && pieceInfo && (
                 <div className="absolute inset-0 border-[4px] border-red-500 rounded-full shadow-[0_0_10px_rgba(255,0,0,0.8)] z-20" />
              )}
            </div>
          </div>
        );
      }
    }
    return squares;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-2 touch-none select-none">
      
      {gameStatus === 'setup' && <SetupScreen onStart={startGame} onLoad={handleLoadGame} />}
      <SaveGameModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} onSave={handleSaveGame} />

      {/* --- Top Player (Black) --- */}
      <div className="w-full flex flex-col wood-panel p-2 rounded-lg mb-2 relative overflow-hidden min-h-[90px]">
        {/* Active Indicator */}
        <div className={`absolute left-0 top-0 bottom-0 w-2 transition-all duration-500 ${game.turn() === 'b' && gameStatus === 'playing' ? 'bg-amber-400 shadow-[0_0_20px_#fbbf24]' : 'bg-[#261a15]'}`}></div>
        
        <div className="flex items-center justify-between pl-4 mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-md bg-[#261a15] flex items-center justify-center border border-[#5d4037] shadow-inner">
                <UserIcon className="text-[#a1887f]" />
              </div>
              <div>
                  <p className="text-[#e8cfa4] font-bold text-lg font-serif tracking-wide drop-shadow-sm leading-none">{blackName}</p>
                  <span className="text-[10px] text-[#a1887f] uppercase font-bold tracking-widest">Black</span>
              </div>
            </div>
            
            <div className={`flex items-center px-3 py-1 rounded bg-[#261a15] border border-[#5d4037] shadow-inner ${
                game.turn() === 'b' && gameStatus === 'playing' ? 'text-[#ffecb3]' : 'text-[#a1887f]'
            }`}>
                <ClockIcon />
                <span className="font-mono text-xl">{formatTime(blackTime)}</span>
            </div>
        </div>

        {/* Casualties (Lost by Black) */}
        <div className="pl-4">
            <div className="text-[9px] text-[#8d6e63] uppercase font-bold mb-0.5">Casualties (Killed)</div>
            <Graveyard pieces={lostByBlack} pieceColor="b" />
        </div>
      </div>

      {/* --- Chess Board --- */}
      <div className="relative shadow-board-3d rounded border-[12px] border-[#3e2723] bg-[#21120e] touch-none">
          <div className="w-[98vw] max-w-[80vh] aspect-square">
            <div className="flex flex-wrap w-full h-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                {renderBoard()}
            </div>
          </div>
          
          <PromotionModal 
              isOpen={!!promotionSquare} 
              color={game.turn()} 
              onSelect={handlePromotionSelect} 
          />
          <GameOverModal 
              isOpen={isGameOver && gameStatus !== 'setup'} 
              result={gameOverResult} 
              reason={gameOverReason} 
              onRestart={resetGame} 
          />
      </div>

      {/* --- Bottom Player (White) --- */}
      <div className="w-full flex flex-col wood-panel p-2 rounded-lg mt-2 relative overflow-hidden min-h-[90px]">
         {/* Active Indicator */}
         <div className={`absolute left-0 top-0 bottom-0 w-2 transition-all duration-500 ${game.turn() === 'w' && gameStatus === 'playing' ? 'bg-amber-400 shadow-[0_0_20px_#fbbf24]' : 'bg-[#261a15]'}`}></div>
         
         <div className="flex items-center justify-between pl-4 mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-md bg-[#e8cfa4] flex items-center justify-center border border-[#8b5a2b] shadow-inner">
                <UserIcon className="text-[#3e2713]" />
              </div>
              <div>
                  <p className="text-[#e8cfa4] font-bold text-lg font-serif tracking-wide drop-shadow-sm leading-none">{whiteName}</p>
                  <span className="text-[10px] text-[#a1887f] uppercase font-bold tracking-widest">White</span>
              </div>
            </div>

            <div className={`flex items-center px-3 py-1 rounded bg-[#261a15] border border-[#5d4037] shadow-inner ${
                game.turn() === 'w' && gameStatus === 'playing' ? 'text-[#ffecb3]' : 'text-[#a1887f]'
            }`}>
                <ClockIcon />
                <span className="font-mono text-xl">{formatTime(whiteTime)}</span>
            </div>
         </div>

         {/* Casualties (Lost by White) */}
         <div className="pl-4">
             <div className="text-[9px] text-[#8d6e63] uppercase font-bold mb-0.5">Casualties (Killed)</div>
             <Graveyard pieces={lostByWhite} pieceColor="w" />
         </div>
      </div>

      {/* --- Controls --- */}
      <div className="w-full grid grid-cols-3 gap-3 mt-3">
        <button 
          onClick={undoMove}
          disabled={game.history().length === 0 || isGameOver || gameStatus !== 'playing'}
          className="flex items-center justify-center gap-2 py-3 bg-[#5d4037] hover:bg-[#6d4c41] disabled:opacity-50 disabled:cursor-not-allowed rounded text-[#e8cfa4] font-bold shadow-btn-wood active:shadow-btn-wood-active transform transition active:translate-y-1 border border-[#8b5a2b]"
        >
           <UndoIcon />
           <span className="hidden sm:inline">Undo</span>
        </button>
        <button 
          onClick={() => setShowSaveModal(true)}
          disabled={isGameOver || gameStatus !== 'playing'}
          className="flex items-center justify-center gap-2 py-3 bg-[#5d4037] hover:bg-[#6d4c41] disabled:opacity-50 disabled:cursor-not-allowed rounded text-[#e8cfa4] font-bold shadow-btn-wood active:shadow-btn-wood-active transform transition active:translate-y-1 border border-[#8b5a2b]"
        >
           <SaveIcon />
           <span className="hidden sm:inline">Save</span>
        </button>
        <button 
          onClick={resetGame}
          className="flex items-center justify-center gap-2 py-3 bg-[#5d4037] hover:bg-[#6d4c41] rounded text-[#e8cfa4] font-bold shadow-btn-wood active:shadow-btn-wood-active transform transition active:translate-y-1 border border-[#8b5a2b]"
        >
           <RestartIcon />
           <span className="hidden sm:inline">Restart</span>
        </button>
      </div>

    </div>
  );
}