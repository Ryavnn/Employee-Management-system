import { useState, useEffect } from "react";
import { Users, Phone, Mail, Calendar, Award, Briefcase } from "lucide-react";
import AddManagerModal from "./AddManagerModal";

export default function ManagersTab() {
  const [managers, setManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:5000/api/managers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setManagers(data.managers);
      } else {
        setError(data.message || "Failed to fetch managers");
      }
    } catch (err) {
      setError("Error connecting to the server");
      console.error("Error fetching managers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddManager = async (newManager) => {
    try {
      setError(null);

      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:5000/api/managers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newManager),
      });

      const data = await response.json();

      if (data.success) {
        setManagers([...managers, data.manager]);
        return true; // Return success status to modal
      } else {
        setError(data.message || "Failed to add manager");
        return false; // Return failure status to modal
      }
    } catch (err) {
      setError("Error connecting to the server");
      console.error("Error adding manager:", err);
      return false; // Return failure status to modal
    }
  };

  const handleDeleteManager = async (managerId) => {
    try {
      setError(null);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:5000/api/managers/${managerId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        // Remove the deleted manager from state
        setManagers(managers.filter((manager) => manager.id !== managerId));
      } else {
        setError(data.message || "Failed to delete manager");
      }
    } catch (err) {
      setError("Error connecting to the server");
      console.error("Error deleting manager:", err);
    }
  };

  // Format date to a more readable format
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Loading managers data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button className="retry-button" onClick={fetchManagers}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="managers-page">
      <div className="employees-header">
        <h2 className="page-title">Managers</h2>
        <button
          className="add-employee-button"
          onClick={() => setIsModalOpen(true)}
        >
          <Users size={18} className="button-icon" />
          Add Manager
        </button>
      </div>

      {managers.length === 0 ? (
        <div className="no-data-message">
          <p>No managers found. Add a manager to get started.</p>
        </div>
      ) : (
        <div className="managers-grid">
          {managers.map((manager) => (
            <div key={manager.id} className="manager-card">
              <div className="manager-header">
                <div className="manager-avatar">{manager.avatarInitial}</div>
                <div className="manager-title-info">
                  <h3 className="manager-name">{manager.name}</h3>
                  <p className="manager-title">{manager.title}</p>
                </div>
              </div>

              <div className="manager-details">
                <div className="detail-item">
                  <Briefcase size={16} className="detail-icon" />
                  <span className="detail-text">{manager.department}</span>
                </div>
                <div className="detail-item">
                  <Mail size={16} className="detail-icon" />
                  <span className="detail-text">{manager.email}</span>
                </div>
                <div className="detail-item">
                  <Phone size={16} className="detail-icon" />
                  <span className="detail-text">{manager.phone}</span>
                </div>
                <div className="detail-item">
                  <Calendar size={16} className="detail-icon" />
                  <span className="detail-text">
                    Hired {formatDate(manager.hireDate)}
                  </span>
                </div>
                <div className="detail-item direct-reports">
                  <Users size={16} className="detail-icon" />
                  <span className="detail-text">
                    {manager.directReports} Direct Reports
                  </span>
                </div>
              </div>

              <div className="manager-actions">
                <button className="action-button">View Team</button>
                <button
                  className="action-button delete"
                  onClick={() => handleDeleteManager(manager.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddManager={handleAddManager}
      />
    </div>
  );
}
