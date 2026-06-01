import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { FaUserCircle } from "react-icons/fa";
import { FiHome, FiCodepen } from "react-icons/fi";
import { FaHandshakeSimple } from "react-icons/fa6";

import { useAuthContext } from "../../hooks/useAuthContext";

import "./Navbar.css";

const Navbar = ({
    toggleDropdown,
    isOpen,
    dropdownRef,
    handleLogout
}) => {

    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthContext();

    return (

        <div className="home__navbar">

            <div className="home__navbar__left">

                <div
                    className="home__logo"
                    onClick={() => navigate("/home")}
                >

                    <div className="home__logo__icon">

                        <img
                            src="/code.svg"
                            alt="CodeSynth Logo"
                            className="home__logo__image"
                        />

                    </div>

                    <h1>CodeSynth</h1>

                </div>

                <div className="home__navbar__links">

                    <button
                        className={`nav__link ${
                            location.pathname === "/home"
                                ? "active"
                                : ""
                        }`}
                        onClick={() => navigate("/home")}
                    >

                        <FiHome />
                        Dashboard

                    </button>

                    <button
                        className={`nav__link ${
                            location.pathname === "/mycodes"
                                ? "active"
                                : ""
                        }`}
                        onClick={() => navigate("/mycodes")}
                    >

                        <FiCodepen />
                        My Codes

                    </button>

                    <button
                        className={`nav__link ${
                            location.pathname.startsWith("/collab")
                                ? "active"
                                : ""
                        }`}
                        onClick={() => navigate("/collab")}
                    >

                        <FaHandshakeSimple />
                        Collaborate

                    </button>

                </div>

            </div>

            <div className="home__navbar__right">

                <div className="dashboard__header__icons__container">

                    <button
                        type="button"
                        className="dashboard__header__profile"
                        onClick={toggleDropdown}
                    >
                        <FaUserCircle
                            className="dashboard__header__icons"
                        />

                        <span className="navbar__username">
                            {user?.name || "Guest"}
                        </span>
                    </button>

                    <div
                        style={{
                            display: isOpen ? "flex" : "none"
                        }}
                        className="user-dropdown"
                        ref={dropdownRef}
                        onClick={handleLogout}
                    >

                        Logout

                    </div>

                </div>

            </div>

        </div>

    );
};

export default Navbar;