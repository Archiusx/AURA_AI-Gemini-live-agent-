import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isWebRTCActive, setIsWebRTCActive] = useState(false);
  
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const wsRef = useRef(null);

  // Initialize WebRTC and capture local media
  const initWebRTC = async () => {
    try {
      console.log("Requesting camera and microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // We don't necessarily want to play our own audio back to ourselves (causes echo),
      // but we bind it to a ref if we want to process it or visualize it later.
      if (audioRef.current) {
         // audioRef.current.srcObject = stream;
      }
      
      setIsWebRTCActive(true);
      console.log("WebRTC streams active.");
    } catch (err) {
      console.error("Error accessing media devices: ", err);
    }
  };

  // Stub function for Firebase Auth
  const initFirebaseAuth = () => {
    console.log("Initializing Firebase Authentication...");
  };

  useEffect(() => {
    initWebRTC();
    initFirebaseAuth();
    
    // Connect to Backend WebSocket
    wsRef.current = new WebSocket('ws://localhost:8000/ws');
    
    wsRef.current.onopen = () => {
      console.log('Connected to backend WebSocket');
      // Send initial authentication handshake
      wsRef.current.send(JSON.stringify({
          type: 'auth',
          token: 'mock-firebase-jwt-token',
          user_id: 'user_123',
          session_id: 'session_' + Math.floor(Math.random() * 10000)
      }));
    };
    
    wsRef.current.onmessage = (event) => {
      console.log('Message from backend:', event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'system') {
           setIsConnected(true);
           setMessages([{role: 'agent', text: 'Hello! I am your Gemini Live Agent. I can calculate simple math or search for you. How can I help?'}]);
        } else if (data.type === 'message') {
            setMessages(prev => [...prev, { role: 'agent', text: data.response }]);
        } else if (data.type === 'error') {
            setMessages(prev => [...prev, { role: 'agent', text: `Error: ${data.error}` }]);
        }
      } catch (e) {
         console.error("Error parsing message", e);
      }
    };
    
    wsRef.current.onclose = () => {
      console.log('Disconnected from backend WebSocket');
      setIsConnected(false);
    };
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      // Stop media tracks when unmounting
      if (videoRef.current && videoRef.current.srcObject) {
         videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSendMessage = () => {
    if (inputValue.trim() && isConnected) {
      setMessages(prev => [...prev, { role: 'user', text: inputValue }]);
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
         wsRef.current.send(JSON.stringify({ type: 'text', content: inputValue }));
      }
      
      setInputValue('');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Gemini Live Agent</h1>
        <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      </header>
      
      <main className="App-main">
        <div className="streams-container">
          <div className="stream-box" id="voice-stream">
            <h3>Voice Stream {isWebRTCActive ? '(Active)' : '(Inactive)'}</h3>
             <div className="audio-visualizer">
               {isWebRTCActive ? (
                  <div className="active-mic-indicator">🎤 Mic is active</div>
               ) : (
                  <div className="placeholder">Waiting for Mic...</div>
               )}
               <audio ref={audioRef} autoPlay muted></audio>
             </div>
          </div>
          <div className="stream-box" id="video-stream">
            <h3>Video Stream {isWebRTCActive ? '(Active)' : '(Inactive)'}</h3>
            {isWebRTCActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="live-video"></video>
            ) : (
                <div className="placeholder">Waiting for Camera...</div>
            )}
          </div>
        </div>

        <div className="chat-container">
          <div className="messages-area">
             {messages.map((msg, index) => (
               <div key={index} className={`message ${msg.role}`}>
                 <strong>{msg.role === 'user' ? 'You: ' : 'Agent: '}</strong>
                 {msg.text}
               </div>
             ))}
          </div>
          <div className="input-area">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
