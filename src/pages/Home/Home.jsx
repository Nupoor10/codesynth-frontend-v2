import React, { useState, useRef } from 'react';
import { FaUserCircle} from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthContext';
import HomeCard from '../../components/HomeCard/HomeCard';
import Footer from "../../components/Footer/Footer";
import "./Home.css";

const Home = () => {

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { dispatch } = useAuthContext();
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  return (
    <div>
      <div className='home__page__wrapper'>
        <div className='home__page__header'>
        <div className='centered-content'>
          <h1>Welcome to CodeSynth⚙️</h1>
        </div>
        <div className='dashboard__header__icons__container'>
          <FaUserCircle className='dashboard__header__icons' onClick={toggleDropdown}/>
          <div style={{display : isOpen ? "block" : "none"}} className="user-dropdown" ref={dropdownRef} onClick={handleLogout}>Logout</div>
        </div>
        </div>
        <div className='home__page__content'>
          <p>CodeSynth is a collaborative coding platform built to help developers of every skill level.</p>
          <div className='home__page__cards'>
            <HomeCard title={"My Codes👩‍💻 ➡️"}
            text={"Manage your personal code playgrounds, update your projects, and continue building in one place."}
            path ={"/mycodes"}/>
            <HomeCard title={"Collaborate 🤝 ➡️"}
            text={"Join or create real-time coding rooms to collaborate with others and build together."}
            path ={"/collab"}/>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Home;