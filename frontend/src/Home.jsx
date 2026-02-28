import { useState } from 'react';
import { useNavigate} from 'react-router-dom';
import './Home.css';

function Home() {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState("");
    const [showModal, setModal] = useState(false);
    const [roomName, setRoomName] = useState("");
    const [joinError, setJoinError] = useState("");
    const url = 'http://127.0.0.1:8000/rooms';
    async function handleSolo(){
        try{
            const response = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });
            if (!response.ok) {
            // Handle HTTP errors, e.g., 404, 500
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            navigate(`/rooms/${data.id}`);
        } catch(error){
            console.error("Error Creating Room");
            alert('Failed to Create Room');
        }
    }
    function handleGetRoomName(){
        setModal(true);
    }
    async function handleCreateRoom(){
        try{
            const response = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({room_name: roomName || null})
            });
            if (!response.ok) {
            // Handle HTTP errors, e.g., 404, 500
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            navigate(`/rooms/${data.id}`);
            setModal(false);
        } catch(error){
            console.error("Error Creating Room");
            alert('Failed to Create Room');
        }
    }
    function handleJoinRoom(){
        if(!roomId.trim()){
            setJoinError("please enter a valid room id");
            return
        }
        setJoinError("");
        navigate(`/rooms/${roomId.trim()}`);
    }
    return (
        <div className="home">
            <h1 className="home-logo">✦ Stardrawn</h1>
            <p className="home-tagline">Let the stars decide</p>

            <div className="home-card">
                <button className="btn-solo" onClick={handleSolo}>
                    Solo — Quick Pick
                </button>

                <button className="btn-create" onClick={handleGetRoomName}>
                    Create a Room
                </button>

                <div className="home-divider">or join</div>

                <div className="join-row">
                    <input
                        className="join-input"
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter Room ID"
                        onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                    />
                    <button className="btn-join" onClick={handleJoinRoom}>
                        Join →
                    </button>
                </div>
                {joinError && <p className="join-error">{joinError}</p>}
            </div>

            {showModal && (
                <div className="overlay">
                    <div className="modal">
                        <h2>Name your room</h2>
                        <div className="modal-row">
                            <input
                                className="modal-input"
                                type="text"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                placeholder="Room name (optional)"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                                autoFocus
                            />
                            <button className="btn-confirm" onClick={handleCreateRoom}>→</button>
                        </div>
                        <button className="btn-cancel" onClick={() => setModal(false)}>
                            cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Home