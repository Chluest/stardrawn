import { useNavigate} from 'react-router-dom';
import { useEffect} from 'react';

function Room() {
    const navigate = useNavigate();
    function handleHome(){
        navigate('/');
    }
    function fetchRoom(){
        
    }
    useEffect(() => {
        fetchRoom()
    }, [roomId]);
    return (
        <div>
            <button onClick = {handleHome}>Home</button>
            <h1>this is a room..... probably</h1>
        </div>
    );
}

export default Room;