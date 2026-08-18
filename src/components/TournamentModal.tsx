import React, { useState } from 'react';
import { X, Trophy, Swords, Users, Calendar, Medal, Play, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { isSiteOwner } from '../utils/owner';
import { OwnerBadge } from './OwnerBadge';

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinTournament?: (tournamentId: string) => void;
}

interface Tournament {
  id: string;
  title: string;
  game: string;
  type: 'Single Elimination' | 'Swiss System';
  playersJoined: number;
  maxPlayers: number;
  prizePool: string;
  status: 'Registration Open' | 'In Progress' | 'Finished';
  startTime: string;
  rounds: {
    roundNumber: number;
    title: string;
    matches: {
      id: string;
      player1: string;
      player2: string;
      score1?: number;
      score2?: number;
      winner?: string;
      status: 'upcoming' | 'live' | 'completed';
    }[];
  }[];
}

const SAMPLE_TOURNAMENTS: Tournament[] = [
  {
    id: 'tourney_chess_grand',
    title: 'Grandmasters Blitz Championship',
    game: 'Chess',
    type: 'Single Elimination',
    playersJoined: 15,
    maxPlayers: 16,
    prizePool: '5,000 XP + Master Badge',
    status: 'In Progress',
    startTime: 'Live Now',
    rounds: [
      {
        roundNumber: 1,
        title: 'Quarter Finals',
        matches: [
          { id: 'm0', player1: 'ADITYA-OWNER', player2: 'Grandmaster_Alex', score1: 1, score2: 0, winner: 'ADITYA-OWNER', status: 'completed' },
          { id: 'm1', player1: 'Magnus_Fan', player2: 'Hikaru_Bot', score1: 1, score2: 0, winner: 'Magnus_Fan', status: 'completed' },
          { id: 'm2', player1: 'TacticalWizard', player2: 'CheckmateKing', score1: 0, score2: 1, winner: 'CheckmateKing', status: 'completed' },
          { id: 'm3', player1: 'DeepBlue_V2', player2: 'QueenGambit', score1: 1, score2: 0, winner: 'DeepBlue_V2', status: 'completed' },
        ],
      },
      {
        roundNumber: 2,
        title: 'Semi Finals',
        matches: [
          { id: 'm5', player1: 'ADITYA-OWNER', player2: 'Magnus_Fan', status: 'live' },
          { id: 'm6', player1: 'DeepBlue_V2', player2: 'CheckmateKing', status: 'upcoming' },
        ],
      },
      {
        roundNumber: 3,
        title: 'Grand Finals',
        matches: [
          { id: 'm7', player1: 'TBD', player2: 'TBD', status: 'upcoming' },
        ],
      },
    ],
  },
  {
    id: 'tourney_c4_open',
    title: 'Connect Four Weekly Arena',
    game: 'Connect Four',
    type: 'Swiss System',
    playersJoined: 28,
    maxPlayers: 32,
    prizePool: '2,500 XP + Gold Medal',
    status: 'Registration Open',
    startTime: 'In 15 Mins',
    rounds: [],
  },
  {
    id: 'tourney_checkers_cup',
    title: 'Checkers Master Cup',
    game: 'Checkers',
    type: 'Single Elimination',
    playersJoined: 8,
    maxPlayers: 8,
    prizePool: '1,500 XP',
    status: 'Finished',
    startTime: 'Ended 2h ago',
    rounds: [
      {
        roundNumber: 1,
        title: 'Finals',
        matches: [
          { id: 'm8', player1: 'KingJumper', player2: 'CrownMaster', score1: 2, score2: 1, winner: 'KingJumper', status: 'completed' },
        ],
      },
    ],
  },
];

export const TournamentModal: React.FC<TournamentModalProps> = ({
  isOpen,
  onClose,
  onJoinTournament,
}) => {
  const [selectedTourney, setSelectedTourney] = useState<Tournament>(SAMPLE_TOURNAMENTS[0]);
  const [joinedTourneys, setJoinedTourneys] = useState<Set<string>>(new Set(['tourney_chess_grand']));

  if (!isOpen) return null;

  const handleJoin = (tourneyId: string) => {
    setJoinedTourneys((prev) => new Set(prev).add(tourneyId));
    if (onJoinTournament) {
      onJoinTournament(tourneyId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-950/90 border border-white/10 backdrop-blur-2xl rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-950/50 via-slate-900/50 to-purple-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Tournament Arena &amp; Brackets</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                  Live Esports
                </span>
              </h2>
              <p className="text-xs text-indigo-200/60">Competitions, live Swiss &amp; knockout brackets, prize pools</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tournament List Sidebar */}
          <div className="space-y-3 md:col-span-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300/70 mb-2">
              Available Championships
            </h3>
            {SAMPLE_TOURNAMENTS.map((t) => {
              const isSelected = selectedTourney.id === t.id;
              const isJoined = joinedTourneys.has(t.id);

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTourney(t)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-400/50 shadow-lg shadow-indigo-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{t.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        t.status === 'In Progress'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 animate-pulse'
                          : t.status === 'Registration Open'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-400/30'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-indigo-200/70">
                    <span className="flex items-center gap-1">
                      <Swords className="w-3 h-3 text-indigo-400" />
                      {t.game}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-indigo-400" />
                      {t.playersJoined}/{t.maxPlayers} Players
                    </span>
                  </div>

                  {isJoined && (
                    <div className="mt-2 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Registered Participant</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bracket & Tournament Details Panel */}
          <div className="md:col-span-2 flex flex-col space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedTourney.title}</h3>
                <div className="flex items-center gap-3 text-xs text-indigo-200/70 mt-1">
                  <span className="flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-amber-400" />
                    Prize: {selectedTourney.prizePool}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    {selectedTourney.startTime}
                  </span>
                </div>
              </div>

              {joinedTourneys.has(selectedTourney.id) ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enrolled</span>
                </span>
              ) : (
                <button
                  onClick={() => handleJoin(selectedTourney.id)}
                  disabled={selectedTourney.status === 'Finished'}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 border border-indigo-400/30 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Join Tournament</span>
                </button>
              )}
            </div>

            {/* Live Bracket Visualization */}
            <div className="flex-1 p-4 rounded-2xl bg-slate-900/60 border border-white/10 overflow-x-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300/70 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Live Bracket Tree ({selectedTourney.type})</span>
              </h4>

              {selectedTourney.rounds.length === 0 ? (
                <div className="text-center py-12 text-sm text-indigo-200/50 italic">
                  Bracket generation pending registration completion. Matches start in {selectedTourney.startTime}.
                </div>
              ) : (
                <div className="flex items-start gap-6 min-w-[500px]">
                  {selectedTourney.rounds.map((round) => (
                    <div key={round.roundNumber} className="flex-1 space-y-4">
                      <div className="text-center text-xs font-bold text-indigo-300 border-b border-indigo-500/30 pb-1">
                        {round.title}
                      </div>

                      <div className="space-y-3">
                        {round.matches.map((m) => (
                          <div
                            key={m.id}
                            className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                              m.status === 'live'
                                ? 'bg-indigo-500/20 border-indigo-400/50 shadow-md shadow-indigo-500/20 animate-pulse'
                                : 'bg-white/5 border-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`font-semibold flex items-center gap-1 flex-wrap ${
                                  isSiteOwner(m.player1)
                                    ? 'text-amber-300 font-extrabold'
                                    : m.winner === m.player1
                                    ? 'text-amber-300 font-bold'
                                    : 'text-white/80'
                                }`}
                              >
                                {m.player1}
                                {isSiteOwner(m.player1) && (
                                  <OwnerBadge username={m.player1} size="xs" label="OWNER" />
                                )}
                              </span>
                              {m.score1 !== undefined && (
                                <span className="font-bold text-indigo-300">{m.score1}</span>
                              )}
                            </div>
                            <div className="h-px bg-white/10 my-1" />
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`font-semibold flex items-center gap-1 flex-wrap ${
                                  isSiteOwner(m.player2)
                                    ? 'text-amber-300 font-extrabold'
                                    : m.winner === m.player2
                                    ? 'text-amber-300 font-bold'
                                    : 'text-white/80'
                                }`}
                              >
                                {m.player2}
                                {isSiteOwner(m.player2) && (
                                  <OwnerBadge username={m.player2} size="xs" label="OWNER" />
                                )}
                              </span>
                              {m.score2 !== undefined && (
                                <span className="font-bold text-indigo-300">{m.score2}</span>
                              )}
                            </div>
                            {m.status === 'live' && (
                              <div className="text-[9px] font-bold text-emerald-400 text-center uppercase tracking-wider pt-1">
                                ● Match Live Now
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
