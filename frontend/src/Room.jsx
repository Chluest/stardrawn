import { useNavigate, useParams} from 'react-router-dom';
import { useEffect, useRef, useState} from 'react';
import './Room.css';

function Room() {
    const ws = useRef(null);
    const navigate = useNavigate();
    const {roomId} = useParams()
    const [entries, setEntries] = useState([]);
    const [newEntry, setNewEntry] = useState("");
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const [copyMessage, setCopyMessage] = useState('');
    function handleHome(){
        navigate('/');
    }
    async function fetchRoom(){
        try{
            const response = await fetch(`http://127.0.0.1:8000/rooms/${roomId}`,{method: 'GET'
            })
            if (!response.ok){
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setRoom(data);
            setEntries(data.entries);
            setLoading(false);
        } catch(error){
            setError("Failed to Load Room");
            setLoading(false);
        }
    }
    function connectWebsocket(){
        console.log("connectWebsocket called, readyState:", ws.current?.readyState)
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            return
        }
        ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/${roomId}`);
        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const action = data["type"];
            if (action == "add_entry"){
                setEntries(prev => [...prev, data.entry])
            }
            else if(action == "delete_entry"){
                setEntries(prev => prev.filter(entry => entry.id !== data.entry_id))
            }
            else if(action == "pick_random"){
                setResult(data.entry);
            }
        }

        ws.current.onclose = () => {
            console.log("WebSocket closed");
        }

        ws.current.onerror = (error) => {
            console.error("WebSocket error details:", error);
        console.log("WebSocket readyState:", ws.current.readyState);
        setError("WebSocket connection failed");
        }
    }
    function handleAdd(){
        const message = {
            type: "add_entry",
            value: newEntry,
            added_by: null
        };
        ws.current.send(JSON.stringify(message));
        setNewEntry("");
    }
    function handleDelete(entryID){
        const message = {
            type: "delete_entry",
            entry_id: entryID
        };
        ws.current.send(JSON.stringify(message));
    }
    function handlePick(){
        const message = {
            type: "pick_random",
        };
        ws.current.send(JSON.stringify(message));
    }
    function handleShare(){
        navigator.clipboard.writeText(window.location.href);
        setCopyMessage("copied!");
        setTimeout(() => setCopyMessage(''), 1000); // Hides after 3s
    }
    useEffect(() => {
        fetchRoom().then(() => {
            connectWebsocket();
        })
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        }
    }, [roomId]);
    
    if (loading) {
        return (
            <div className="room-status">
                <p>Loading room...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="room-status">
                <p className="room-error">{error}</p>
                <button className="btn-home" onClick={handleHome}>← Back to Home</button>
            </div>
        )
    }

    return (
        <div className="room">
            <nav className="room-nav">
                <button className="btn-home" onClick={handleHome}>← Home</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {copyMessage && <span className="copy-message">{copyMessage}</span>}
                    <button className="btn-share" onClick={handleShare}>⬡ Share</button>
                </div>
            </nav>

            <h1 className="room-title">{room?.room_name || "Stardrawn"}</h1>
            <p className="room-subtitle">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>

            {entries.length === 0 ? (
                <div className="entries-empty">
                    No entries yet — add something below
                </div>
            ) : (
                <div className="entries-list">
                    {entries.map(entry => (
                        <div className="entry-item" key={entry.id}>
                            <span className="entry-value">{entry.value}</span>
                            <button className="btn-delete" onClick={() => handleDelete(entry.id)}>✕</button>
                        </div>
                    ))}
                </div>
            )}

            <div className="add-row">
                <input
                    className="add-input"
                    type="text"
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Add an entry..."
                />
                <button className="btn-add" onClick={handleAdd}>Add</button>
            </div>

            <button
                className="btn-pick"
                onClick={handlePick}
                disabled={entries.length === 0}
            >
                ✦ Draw from the Stars
            </button>

            {result && (
                <div className="result-overlay">
                    <p className="result-label">✦ The stars have chosen</p>
                    <h2 className="result-value">{result.value}</h2>
                    <button className="btn-back" onClick={() => setResult(null)}>← Back</button>
                </div>
            )}
        </div>
    );
}

export default Room;