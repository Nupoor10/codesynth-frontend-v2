import React from "react";
import "./Footer.css";
import { AiFillGithub, AiFillLinkedin } from "react-icons/ai";

const Footer = () => {
  return (
    <div className="footer__container">
      <div className="footer__content">
        <div className="footer__about">
          <h2>CodeSynth</h2>
          <p>
            Explore the future of coding with real-time collaboration.
          </p>
        </div>
        <div className="footer__links">
          <a
            target="_blank"
            rel="noreferrer"
            href="https://github.com/Nupoor10/codesynth-frontend-v2"
            aria-label="Frontend GitHub"
          >
            <AiFillGithub />
          </a>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://github.com/Nupoor10/codesynth-backend-v2"
            aria-label="Backend GitHub"
          >
            <AiFillGithub />
          </a>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://www.linkedin.com/in/nupoor-shetye-8452111a7/"
            aria-label="LinkedIn"
          >
            <AiFillLinkedin />
          </a>
        </div>
      </div>
      <div className="footer__divider"></div>
      <div className="footer__copyright">
        <p>© {new Date().getFullYear()} CodeSynth. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Footer;
