import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthContext } from "../../hooks/useAuthContext";
import { FiTrash2, FiArrowRight, FiCalendar } from "react-icons/fi";
import "./CodeContainer.css";
const apiURL = import.meta.env.VITE_BACKEND_URL;

const CodeContainer = ({ title, id, time }) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const deleteCode = async () => {
    try {
      if (user) {
        const config = {
          headers: {
            Authorization: user?.accessToken,
          },
        };
        const response = await axios.delete(
          `${apiURL}/codes/delete/${id}`,
          config,
        );
        if (response && response.status === 200) {
          toast.success("Deleted Successfully");
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.message);
    }
  };

  const navigateToPlayground = () => {
    navigate(`/code/${id}`);
  };

  return (
    <div className="single__code__container">
      <div className="code__details__div">
        <div className="code__badge">Personal Workspace</div>
        <p>{title}</p>
        <p>
          <FiCalendar />
          {time?.slice(0, 10)}
        </p>
      </div>
      <div className="code__actions">
        <button className="code__container__btn" onClick={deleteCode}>
          <FiTrash2 />
        </button>

        <button className="code__container__btn" onClick={navigateToPlayground}>
          <FiArrowRight />
        </button>
      </div>
    </div>
  );
};

export default CodeContainer;
