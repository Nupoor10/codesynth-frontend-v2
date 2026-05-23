import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer/Footer';
import "./Resources.css";

const Resources = () => {

  const navigate = useNavigate();

  return (
    <div>
      <div className='resources__page__wrapper'>
        <div className='resources__page__header'>
            <h2 onClick={() => {navigate("/home")}}>⬅️</h2>
            <h1>&nbsp;&nbsp; Info Hub 📑</h1> 
        </div>
        <div className="resources__page__content">
            <h2>HTML</h2>
            <ol>
                <li><a href="https://www.w3schools.com/html/" target="_blank">W3Schools</a></li>
                <li><a href="https://developer.mozilla.org/en-US/docs/Web/HTML" target="_blank">Mozilla Developer Network</a></li>
                <li><a href="https://www.codecademy.com/learn/learn-html" target="_blank">Codecademy</a></li>
                <li><a href="https://www.theodinproject.com/paths" target="_blank">The Odin Project</a></li>
                <li><a href="https://www.freecodecamp.org/news/html-crash-course/" target="_blank">Free Code Camp</a></li>
            </ol>
            <h2>CSS</h2>
            <ol>
                <li><a href="https://www.w3schools.com/css/" target="_blank">W3Schools</a></li>
                <li><a href="https://developer.mozilla.org/en-US/docs/Learn/CSS" target="_blank">Mozilla Developer Network</a></li>
                <li><a href="https://css-tricks.com/guides/basics/" target="_blank">CSS-Tricks</a></li>
                <li><a href="https://www.codecademy.com/learn/learn-css" target="_blank">Codecademy</a></li>
                <li><a href="https://www.freecodecamp.org/learn/responsive-web-design/#basic-css" target="_blank">Free Code Camp</a></li>
            </ol>
            <h2>Javascript</h2>
            <ol>
                <li><a href="https://javascript.info/" target="_blank">JavaScript.info</a></li>
                <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" target="_blank">Mozilla Developer Network</a></li>
                <li><a href="https://www.w3schools.com/js/" target="_blank">W3Schools</a></li>
                <li><a href="https://www.codecademy.com/learn/introduction-to-javascript" target="_blank">Codecademy</a></li>
                <li><a href="https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/" target="_blank">Free Code Camp</a></li>
            </ol>
            <h2>Project Ideas💫</h2>
            <ol>
                <li>To-Do List App: Create an interactive to-do list where users can add, remove, and mark tasks as completed.</li>
                <li>Weather App: Build a weather application that allows users to search for weather information based on location and displays the current weather conditions.</li>
                <li>Recipe Finder: Create a recipe finder app that allows users to search for recipes by ingredients they have and provides step-by-step cooking instructions.</li>
                <li>Online Quiz Game: Develop an online quiz game where users can answer questions on various topics and receive scores based on their performance.</li>
                <li>E-commerce Website: Build a simple e-commerce website with product listings, a shopping cart, and a checkout process.</li>
                <li>Portfolio Website: Create a personal portfolio website to showcase your projects, skills, and contact information.</li>
                <li>Chat Application: Design a real-time chat application that allows users to join chat rooms, send messages, and see who's online.</li>
                <li>Expense Tracker: Develop an expense tracker app to help users manage their finances by adding, categorizing, and tracking expenses.</li>
                <li>Blog Platform: Build a basic blogging platform where users can create, edit, and publish articles with rich text formatting.</li>
                <li>Online Drawing Board: Create an online drawing board that allows users to draw and share their artwork with others.</li>
            </ol>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Resources