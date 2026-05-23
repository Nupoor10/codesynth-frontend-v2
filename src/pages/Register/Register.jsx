import React, { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast';
import Footer from '../../components/Footer/Footer';
import './Register.css'
const apiURL = import.meta.env.VITE_BACKEND_URL;

const Register = () => {
  const [username, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate();

  const handleRegistration = async () => {
	try {
		const response = await axios.post(`${apiURL}/users/register`, {
			username,
			email,
			password
		})
		if ( response && response?.status === 201 && response?.data?.newUser) {
            toast.success("Registered Successfully!");
			setTimeout(() => {
                navigate("/");
            }, 2000)
			
		}
	} catch(error) {
		console.log(error);
        toast.error(error?.message)
	}
  }

  return (
    <div className='register__page__wrapper'>
      	<div className='register__container'>
			<h1>Register on CodeSynth</h1>
			<div className='register__form'>
				<div>
					<input
						className='register__input'
						value={username}
						onChange={(e) => setUserName(e.target.value)}
						type="text"
						placeholder="Username"
					/>
					<br />
					<input
						className='register__input'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						type="email"
						placeholder="Email"
					/>
					<br />
					<input
						className='register__input'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						type="password"
						placeholder="Password"
					/>
					<br />
					<input type="submit" className="register__btn" value="Register" onClick={handleRegistration}></input>
					<br />
					<h3>Already Registered? <Link to='/'>Click Here</Link> to Login</h3>
				</div>
			</div>
		  </div>
		<Footer />
    </div>   
  )
}

export default Register