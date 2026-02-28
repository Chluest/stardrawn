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
    return (
        <div className = "container">
            {loading && <p>Loading...</p>}
        
            {error &&(
                <div>
                    <button onClick = {handleHome}>Home</button>
                    <p>{error}</p> 
                </div>
            )}
            
            {!loading && !error && (
                <div>
                    <button onClick = {handleHome}>Home</button>
                    <button onClick = {handleShare}>Share URL</button>
                    {copyMessage && <div>{copyMessage}</div>}
                    <h1>{room?.room_name || "Stardrawn"}</h1>
                    {entries.map(entry => (
                        <div key={entry.id}>
                            <p>{entry.value}</p>
                            <button onClick={() => handleDelete(entry.id)}>🗑️</button>
                        </div>
                    ))}
                    <input
                        type="text"
                        value={newEntry}
                        onChange={(e) => setNewEntry(e.target.value)}
                        placeholder="Add Entry"
                    />
                    <button onClick={handleAdd}>add</button>
                    <button onClick={handlePick}>random</button>
                    {result && (
                        <div>
                            <h2>Result: {result.value}</h2>
                            <button onClick={() => setResult(null)}>back</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Room;