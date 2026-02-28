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
        <div className = "container">
            <button onClick = {handleSolo}>Solo</button>
            <button onClick = {handleGetRoomName}>Create Room</button>
            <input
                type = "text"
                value = {roomId}
                onChange = {(e) => setRoomId(e.target.value)}
                placeholder = "Enter Room Id"
            />
            {joinError && <p className = "error">{joinError}</p>}
            <button onClick = {handleJoinRoom}>Join Room</button>
            {showModal && (
                <div className="overlay">
                    <div className="modal">
                        <input
                            type = "text"
                            value = {roomName}
                            onChange = {(e) => setRoomName(e.target.value)}
                            placeholder = "Room Name (Optional)"
                        />
                        <button onClick={handleCreateRoom}>→</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home