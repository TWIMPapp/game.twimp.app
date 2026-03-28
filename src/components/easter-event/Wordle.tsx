import { useState, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';

interface WordleProps {
    answer: string;
    onSolved: (answer: string) => void;
}

type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'pending';

interface CellData {
    letter: string;
    state: LetterState;
}

const MAX_GUESSES = 6;

function evaluateGuess(guess: string, answer: string): CellData[] {
    const result: CellData[] = guess.split('').map(l => ({ letter: l, state: 'absent' as LetterState }));
    const answerChars = answer.split('');
    const used = new Array(answer.length).fill(false);

    // First pass: correct positions (green)
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === answerChars[i]) {
            result[i].state = 'correct';
            used[i] = true;
        }
    }

    // Second pass: present but wrong position (yellow)
    for (let i = 0; i < guess.length; i++) {
        if (result[i].state === 'correct') continue;
        for (let j = 0; j < answerChars.length; j++) {
            if (!used[j] && guess[i] === answerChars[j]) {
                result[i].state = 'present';
                used[j] = true;
                break;
            }
        }
    }

    return result;
}

const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

const STATE_COLORS: Record<LetterState, string> = {
    correct: '#22c55e',
    present: '#eab308',
    absent: '#6b7280',
    empty: '#e5e7eb',
    pending: '#d1d5db'
};

export default function Wordle({ answer, onSolved }: WordleProps) {
    const wordLength = answer.length;
    const [guesses, setGuesses] = useState<CellData[][]>([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [solved, setSolved] = useState(false);
    const [shake, setShake] = useState(false);
    const [message, setMessage] = useState('');

    // Track best known state for each keyboard letter
    const keyStates: Record<string, LetterState> = {};
    guesses.forEach(guess => {
        guess.forEach(cell => {
            const prev = keyStates[cell.letter];
            if (cell.state === 'correct') {
                keyStates[cell.letter] = 'correct';
            } else if (cell.state === 'present' && prev !== 'correct') {
                keyStates[cell.letter] = 'present';
            } else if (cell.state === 'absent' && !prev) {
                keyStates[cell.letter] = 'absent';
            }
        });
    });

    const submitGuess = useCallback(() => {
        if (currentGuess.length !== wordLength) {
            setShake(true);
            setMessage('Not enough letters');
            setTimeout(() => { setShake(false); setMessage(''); }, 600);
            return;
        }

        const upperGuess = currentGuess.toUpperCase();
        const upperAnswer = answer.toUpperCase();
        const result = evaluateGuess(upperGuess, upperAnswer);
        const newGuesses = [...guesses, result];
        setGuesses(newGuesses);
        setCurrentGuess('');

        if (upperGuess === upperAnswer) {
            setSolved(true);
            setMessage('Well done!');
            setTimeout(() => onSolved(answer), 1500);
        } else if (newGuesses.length >= MAX_GUESSES) {
            setMessage(`The answer was ${answer.toUpperCase()}`);
            // Still call onSolved after a failed attempt — the backend validates
            setTimeout(() => onSolved(answer), 2500);
        }
    }, [currentGuess, answer, guesses, wordLength, onSolved]);

    const handleKey = useCallback((key: string) => {
        if (solved || guesses.length >= MAX_GUESSES) return;

        if (key === 'ENTER') {
            submitGuess();
        } else if (key === '⌫' || key === 'BACKSPACE') {
            setCurrentGuess(prev => prev.slice(0, -1));
        } else if (key.length === 1 && /[A-Z]/i.test(key) && currentGuess.length < wordLength) {
            setCurrentGuess(prev => prev + key.toUpperCase());
        }
    }, [solved, guesses.length, currentGuess.length, wordLength, submitGuess]);

    // Physical keyboard support
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            handleKey(e.key.toUpperCase());
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleKey]);

    // Build grid rows
    const rows: CellData[][] = [];
    for (let i = 0; i < MAX_GUESSES; i++) {
        if (i < guesses.length) {
            rows.push(guesses[i]);
        } else if (i === guesses.length) {
            // Current input row
            const cells: CellData[] = [];
            for (let j = 0; j < wordLength; j++) {
                cells.push({
                    letter: currentGuess[j] || '',
                    state: currentGuess[j] ? 'pending' : 'empty'
                });
            }
            rows.push(cells);
        } else {
            // Empty future row
            rows.push(Array.from({ length: wordLength }, () => ({ letter: '', state: 'empty' as LetterState })));
        }
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 1 }}>
            {/* Message */}
            <Box sx={{ minHeight: 24 }}>
                {message && (
                    <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: solved ? '#22c55e' : '#6b7280' }}>
                        {message}
                    </Typography>
                )}
            </Box>

            {/* Grid */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {rows.map((row, rowIdx) => (
                    <Box
                        key={rowIdx}
                        sx={{
                            display: 'flex',
                            gap: 0.5,
                            animation: shake && rowIdx === guesses.length ? 'shake 0.5s ease' : 'none',
                            '@keyframes shake': {
                                '0%, 100%': { transform: 'translateX(0)' },
                                '25%': { transform: 'translateX(-4px)' },
                                '75%': { transform: 'translateX(4px)' }
                            }
                        }}
                    >
                        {row.map((cell, cellIdx) => (
                            <Box
                                key={cellIdx}
                                sx={{
                                    width: 48,
                                    height: 48,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '8px',
                                    border: cell.state === 'empty' || cell.state === 'pending'
                                        ? '2px solid #d1d5db'
                                        : 'none',
                                    backgroundColor: cell.state === 'empty' || cell.state === 'pending'
                                        ? 'white'
                                        : STATE_COLORS[cell.state],
                                    transition: 'all 0.3s ease',
                                    animation: rowIdx < guesses.length ? `flip 0.5s ease ${cellIdx * 0.1}s` : 'none',
                                    '@keyframes flip': {
                                        '0%': { transform: 'scaleY(1)' },
                                        '50%': { transform: 'scaleY(0)' },
                                        '100%': { transform: 'scaleY(1)' }
                                    }
                                }}
                            >
                                <Typography sx={{
                                    fontWeight: 800,
                                    fontSize: '1.25rem',
                                    color: cell.state === 'empty' || cell.state === 'pending' ? '#1f2937' : 'white',
                                    lineHeight: 1
                                }}>
                                    {cell.letter}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                ))}
            </Box>

            {/* Keyboard */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', mt: 1, width: '100%' }}>
                {KEYBOARD_ROWS.map((row, rowIdx) => (
                    <Box key={rowIdx} sx={{ display: 'flex', justifyContent: 'center', gap: '3px', px: 0.5 }}>
                        {row.map(key => {
                            const isWide = key === 'ENTER' || key === '⌫';
                            const state = keyStates[key];
                            const bgColor = state ? STATE_COLORS[state] : '#e5e7eb';
                            const textColor = state && state !== 'empty' ? 'white' : '#1f2937';

                            return (
                                <Box
                                    key={key}
                                    onClick={() => handleKey(key)}
                                    sx={{
                                        flex: isWide ? 1.5 : 1,
                                        height: 42,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '6px',
                                        backgroundColor: bgColor,
                                        color: textColor,
                                        fontWeight: 700,
                                        fontSize: isWide ? '0.6rem' : '0.8rem',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        transition: 'background-color 0.2s',
                                        '&:active': { transform: 'scale(0.95)' }
                                    }}
                                >
                                    {key}
                                </Box>
                            );
                        })}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
