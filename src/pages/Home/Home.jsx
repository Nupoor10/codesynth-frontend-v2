import React, { useState, useRef } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuthContext";
import HomeCard from "../../components/HomeCard/HomeCard";
import Footer from "../../components/Footer/Footer";
import Navbar from "../../components/Navbar/Navbar";
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
    <div className="home__page__wrapper">
      <div className="home__page__content__wrapper">
        <Navbar
          toggleDropdown={toggleDropdown}
          isOpen={isOpen}
          dropdownRef={dropdownRef}
          handleLogout={handleLogout}
        />

        <div className="home__hero">
          <span className="home__badge">AI-Powered Collaborative Coding</span>

          <h2>
            Build, Collaborate, and Code
            <br />
            Smarter Together
          </h2>

          <p>
            CodeSynth helps developers collaborate in real-time, manage coding
            workspaces, and build projects faster with intelligent tooling.
          </p>
        </div>

        <div className="home__page__cards">
          <HomeCard
            title={"My Codes"}
            text={
              "Manage your personal code playgrounds, revisit projects, and continue building seamlessly."
            }
            path={"/mycodes"}
          />

          <HomeCard
            title={"Collaborate"}
            text={
              "Create or join live coding rooms and work together with developers in real-time."
            }
            path={"/collab"}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
