import React from 'react'
import './Footer.css'
import { AiFillGithub, AiFillLinkedin } from "react-icons/ai";

const Footer = () => {
  return (
    <div className='footer__container'>
      <div className='footer__body'>
        <div className='footer__about'>
            <h1>ABOUT</h1>
            <p>
            Explore the future of coding with our innovative generative AI platform. Empower your coding journey, unleash creativity, and learn with AI assistance, all in one place.
            </p>
        </div>
        <div className='footer__links'>
          <a style={{color: 'white'}} target='_blank' rel='noreferrer' href='https://github.com/Nupoor10/codesynth-frontend'><AiFillGithub /></a>
          <a style={{color: 'white'}} target='_blank' rel='noreferrer' href='https://github.com/Nupoor10/codesynth-backend'><AiFillGithub /></a>
          <a style={{color: 'white'}} target='_blank' rel='noreferrer' href='https://www.linkedin.com/in/nupoor-shetye-8452111a7/'><AiFillLinkedin /></a>
          <a style={{color: 'white', textDecoration: 'none'}} target='_blank' rel='noreferrer' href='https://peerlist.io/nupoor'>🅿️</a>
        </div>
      </div>
      <hr />
      <div className='footer__copyright'>
        <h3>Copyright @ {new Date().getFullYear()} All Rights Reserved by CodeSynth⚙️</h3>
      </div>
    </div>
  )
}

export default Footer