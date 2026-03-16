import React, { Component, useState, useEffect, useRef } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { GeminiLiveService } from './services/geminiLiveService';
import { Mic, MicOff, Video, VideoOff, LogIn, LogOut, MessageSquare, Activity, Settings, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        const currentUser = u || {
          uid: 'guest_' + Math.random().toString(36).substr(2, 9),
          displayName: 'Guest User',
          email: 'guest@example.com',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
          isAnonymous: true
        } as any;

        const userRef = doc(db, 'users', currentUser.uid);
        let userSnap;
        try {
          userSnap = await getDoc(userRef);
        } catch (err) {
          console.warn("Firestore GET users failed (Guest mode):", err);
        }

        if (!userSnap?.exists()) {
          try {
            await setDoc(userRef, {
              uid: currentUser.uid,
              displayName: currentUser.displayName,
              email: currentUser.email || 'guest@example.com',
              photoURL: currentUser.photoURL,
              createdAt: new Date().toISOString()
            });
          } catch (err) {
            console.warn("Firestore CREATE users failed (Guest mode):", err);
          }
        }

        // Ensure default conversation exists
        const convRef = doc(db, 'conversations', currentUser.uid);
        let convSnap;
        try {
          convSnap = await getDoc(convRef);
        } catch (err) {
          console.warn("Firestore GET conversations failed (Guest mode):", err);
        }

        if (!convSnap?.exists()) {
          try {
            await setDoc(convRef, {
              id: currentUser.uid,
              userId: currentUser.uid,
              title: 'My Live Session',
              createdAt: new Date().toISOString(),
              lastMessageAt: new Date().toISOString()
            });
          } catch (err) {
            console.warn("Firestore CREATE conversations failed (Guest mode):", err);
          }
        }
        
        setUser(currentUser);
      } catch (err: any) {
        console.error("Auth/Init Error:", err);
        // Don't set error state here to allow guest mode to continue
      } finally {
        setIsAuthReady(true);
      }
    });
    return unsubscribe;
  }, []);

  const login = () => {
    setError(null);
    signInWithPopup(auth, new GoogleAuthProvider())
      .catch(err => {
        console.error("Full Auth Error:", err);
        if (err.code === 'auth/network-request-failed') {
          setError("Network request failed. This often happens in the preview iframe. Please try opening the app in a NEW TAB using the button in the top right of the editor.");
        } else {
          setError(err.message);
        }
      });
  };
  const logout = () => auth.signOut().catch(err => setError(err.message));

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0502] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <Activity className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-white">System Error</h1>
          <p className="text-zinc-500 text-sm font-mono">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="px-6 py-2 bg-white text-black font-bold rounded-full text-xs uppercase"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0a0502] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
          <p className="text-orange-500/50 font-mono text-xs tracking-widest uppercase">Initializing Systems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0502] text-white font-sans selection:bg-orange-500/30">
      {user ? (
        <LiveAgent user={user} onLogout={logout} onLogin={login} />
      ) : (
        <div className="h-screen flex flex-col items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}

function LiveAgent({ user, onLogout, onLogin }: { user: User, onLogout: () => void, onLogin: () => void }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [transcript, setTranscript] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geminiRef = useRef<GeminiLiveService | null>(null);

  useEffect(() => {
    geminiRef.current = new GeminiLiveService();
    return () => geminiRef.current?.disconnect();
  }, []);

  const toggleConnection = async () => {
    if (isConnected) {
      geminiRef.current?.disconnect();
      setIsConnected(false);
      setIsMicOn(false);
      setIsVideoOn(false);
    } else {
      await geminiRef.current?.connect({
        onText: async (text) => {
          setTranscript(prev => prev + " " + text);
          // Save model response to Firestore
          try {
            await addDoc(collection(db, 'conversations', user.uid, 'messages'), {
              conversationId: user.uid,
              role: 'model',
              content: text,
              timestamp: new Date().toISOString(),
              type: 'text'
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `conversations/${user.uid}/messages`);
          }
        },
        onError: (err) => console.error("Gemini Error:", err),
        onInterrupted: () => setTranscript("")
      });
      setIsConnected(true);
      setIsMicOn(true);
    }
  };

  useEffect(() => {
    if (isVideoOn && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } else if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  }, [isVideoOn]);

  // Send video frames
  useEffect(() => {
    let interval: any;
    if (isConnected && isVideoOn) {
      interval = setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 320, 240);
            const base64 = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
            geminiRef.current?.sendVideoFrame(base64);
          }
        }
      }, 1000); // Send frame every second
    }
    return () => clearInterval(interval);
  }, [isConnected, isVideoOn]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-white/5 flex items-center justify-between bg-black/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            isConnected ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-700"
          )} />
          <h2 className="text-xs font-mono tracking-widest uppercase text-zinc-400">
            {isConnected ? "System Active • EN" : "System Standby"}
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          {user.isAnonymous ? (
            <button 
              onClick={onLogin}
              className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 text-black rounded-full font-bold text-[10px] uppercase tracking-wider hover:scale-105 transition-transform"
            >
              <LogIn className="w-3 h-3" />
              Sign In
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                <img src={user.photoURL || ""} className="w-5 h-5 rounded-full" alt="" />
                <span className="text-[10px] font-mono uppercase tracking-wider">{user.displayName}</span>
              </div>
              <button onClick={onLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <LogOut className="w-4 h-4 text-zinc-500" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-px bg-white/5">
        {/* Left: Visual Feed */}
        <div className="lg:col-span-8 relative bg-black overflow-hidden group">
          <div className="absolute inset-0 flex items-center justify-center">
            {!isVideoOn && (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full border border-white/10 flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-zinc-800" />
                </div>
                <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">Visual Feed Offline</p>
              </div>
            )}
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className={cn("w-full h-full object-cover transition-opacity duration-1000", isVideoOn ? "opacity-100" : "opacity-0")}
            />
            <canvas ref={canvasRef} width="320" height="240" className="hidden" />
          </div>

          {/* Overlay UI */}
          <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">REC</span>
                  <span className="text-[10px] font-mono text-white/50">00:00:00:00</span>
                </div>
                <div className="text-[10px] font-mono text-white/30">LATENCY: 42ms</div>
              </div>
              <Maximize2 className="w-4 h-4 text-white/20" />
            </div>

            <div className="max-w-xl">
              <AnimatePresence mode="wait">
                {transcript && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl"
                  >
                    <p className="text-lg font-light leading-relaxed text-zinc-200 italic">
                      "{transcript}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: Controls & Info */}
        <div className="lg:col-span-4 bg-[#0d0d0d] flex flex-col p-6 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Primary Controls</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setIsMicOn(!isMicOn)}
                  disabled={!isConnected}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all",
                    isMicOn ? "bg-orange-500/10 border-orange-500/50 text-orange-500" : "bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10",
                    !isConnected && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Audio</span>
                </button>
                <button 
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  disabled={!isConnected}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all",
                    isVideoOn ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" : "bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10",
                    !isConnected && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Vision</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Session Status</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={cn("w-1 h-3 rounded-full", isConnected ? "bg-orange-500" : "bg-zinc-800")} />
                  ))}
                </div>
              </div>
              <button 
                onClick={toggleConnection}
                className={cn(
                  "w-full py-4 rounded-full font-bold text-xs tracking-widest uppercase transition-all",
                  isConnected 
                    ? "bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white" 
                    : "bg-orange-500 text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                )}
              >
                {isConnected ? "Terminate Session" : "Initialize Agent"}
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-hidden flex flex-col">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Activity Log</label>
            <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-4 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-zinc-600">09:56:02 - SYSTEM</p>
                <p className="text-xs text-zinc-400">Security handshake complete. Ready for input.</p>
              </div>
              {isConnected && (
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-emerald-500">09:56:10 - LIVE</p>
                  <p className="text-xs text-zinc-400">Gemini Live session established via WebRTC.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
