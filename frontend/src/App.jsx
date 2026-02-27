import { BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './Home';
import Room from './Room';

function App(){
  return(
    <BrowserRouter>
      <Routes>
        <Route path = "/" element = {<Home />} />
        <Route path = "/rooms/:roomId" element = {<Room />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;