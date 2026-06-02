import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthContext } from "../../hooks/useAuthContext";
import toast from "react-hot-toast";
import Footer from "../../components/Footer/Footer";
import "./Login.css";
const apiURL = import.meta.env.VITE_BACKEND_URL;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { dispatch } = useAuthContext();

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const response = await axios.post(`${apiURL}/users/login`, {
        email,
        password,
      });
      if (
        response &&
        response?.status === 200 &&
        response?.data?.exisitingUser
      ) {
        dispatch({
          type: "LOGIN",
          payload: {
            accessToken: response.data.jwtToken,
            name: response.data.exisitingUser.username,
          },
        });
        localStorage.setItem(
          "User",
          JSON.stringify({
            accessToken: response.data.jwtToken,
            name: response.data.exisitingUser.username,
          }),
        );
        toast.success("Logged In Successfully!");
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.message);
    }
  };

  return (
    <div className="login__page__wrapper">
      <div className="login__container">
        <h1>Welcome Back</h1>

        <p className="login__subtitle">
          Login to continue coding and collaborating.
        </p>

        <div className="login__form">
          <form className="login__form__inner" onSubmit={handleLogin}>
            <input
              className="login__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email"
            />

            <input
              className="login__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
            />

            <button type="submit" className="login__btn">
              Sign In
            </button>
          </form>
          <h3>
            Don’t have an account? <Link to="/register">Create One</Link>
          </h3>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
