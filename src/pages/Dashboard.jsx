import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CanvasStage from "../components/Canvas/CanvasStage";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "./Dashboard.css";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [selectedRect, setSelectedRect] = useState(null);
  const [nameInput, setNameInput] = useState("");

  const handleLogout = () => {
    logout();
    toast.success("You've been Logout")
    navigate("/login");
  };

  useEffect(() => {
    if (selectedRect) {
      setNameInput(selectedRect.name || "");
    } else {
      setNameInput("");
    }
  }, [selectedRect]);

  /********Save name to backend*********/

  const saveName = async () => {
    if (!selectedRect) return;

    await api.put(`/annotations/${selectedRect.id}`, {
      name: nameInput,
    });

    setSelectedRect((prev) => ({ ...prev, name: nameInput }));
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Annotation Canvas</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="dashboard-content">
        <div className="canvas-area">
          <CanvasStage onSelect={setSelectedRect} />
        </div>

        <aside className="side-panel">
          {selectedRect ? (
            <>
              <h3>Annotation Info</h3>

              {/******Name Input*******/}

              <div className="annotation-name">
                <label>Name</label>

                <div className="annotation-name-row">
                  <input
                    type="text"
                    value={nameInput}
                    placeholder="Enter annotation name"
                    onChange={(e) => setNameInput(e.target.value)}
                  />

                  <button onClick={saveName}>Save Name</button>
                </div>
              </div>

              <hr />

              {/*****Anotation details*****/}

              <p>
                <b>X:</b> {Math.round(selectedRect.x)}
              </p>
              <p>
                <b>Y:</b> {Math.round(selectedRect.y)}
              </p>
              <p>
                <b>Width:</b> {Math.round(selectedRect.width)}
              </p>
              <p>
                <b>Height:</b> {Math.round(selectedRect.height)}
              </p>
            </>
          ) : (
            <p>Select a rectangle to see details</p>
          )}
        </aside>
      </main>
    </div>
  );
}
