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
          <p>CodeSynth is a community driven AI-powered coding application designed to help developers - <span style={{color: '#ACFF33'}}>from complete newbies 
            to seasoned pros </span> in their development journey</p>
          <div className='home__page__cards'>
            <HomeCard title={"My Codes👩‍💻 ➡️"}
            text={"Step into your personal code haven, a place where your ingenious code creations, aka 'playgrounds' thrive. Here, you can manage your existing codes and craft fresh code playgrounds effortlessly."}
            path ={"/mycodes"}/>
            <HomeCard title={"Info Hub📑 ➡️"}
            text={"The right resources are instrumental in the journey of a newly started developer to master all necessary skills. Discover our specially curated resources alognwith a few beginner-friendly project ideas to get you started. CodeSynth was crafted to foster collaboration among coders"}
            path ={"/resources"}/>
            <HomeCard title={"Explore 🧑‍🤝‍🧑 ➡️"}
            text={"CodeSynth was crafted to foster collaboration among coders. Dive into our Explore feature to discover the incredible code projects created by others. Embrace the collaborative spirit and explore the vibrant world of coding innovations within the CodeSynth community"}
            path ={"/community"}/>
            <HomeCard title={"Collaborate 🤝 ➡️"}
            text={"Unlock the power of real time collaboration via our collaborative playgrounds. Create a new room and share the room code allowing participants to join and code together for enhanced collaboration"}
            path ={"/collab"}/>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Home;