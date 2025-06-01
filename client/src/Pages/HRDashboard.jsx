import { useState, useEffect } from "react";
import {
  Search,
  Users,
  User,
  UserPlus,
  Calendar,
  BarChart2,
  Clock,
  Star,
  PieChart,
  Briefcase,
  Award,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";
import AddEmployeeModal from "../components/AddEmployee";
import { useNavigate } from "react-router";
import ManagersTab from "../components/ManagersTab";

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate(); // useHistory() if you're on React Router v5

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include", // Important to send cookies (if using cookie-based JWT)
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Clear any token or state if you stored one
      localStorage.removeItem("authToken"); // Optional: only if you're using localStorage

      // Redirect to login page
      navigate("/login");
    } catch (err) {
      setError(err.message);
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.log("No token found. Please log in first.");
          // Redirect to login if needed
          return;
        }

        const response = await fetch("http://127.0.0.1:5000/api/current_user", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!data.success) {
          console.log("Authentication failed. Please log in again.");
          // If you have a login page: window.location.href = "/login";
        }
      } catch (err) {
        console.error("Error checking login status:", err);
      }
    };

    checkLoginStatus();
  }, []);

  const handleAddEmployee = async (newEmployee) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Authentication token missing. Please log in again.");
        return;
      }

      const response = await fetch("http://127.0.0.1:5000/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEmployee),
      });

      const data = await response.json();

      if (data.success) {
        setEmployees((prevEmployees) => [...prevEmployees, data.employee]);
        alert("Employee added successfully!");
      } else {
        alert(data.message || "Failed to add employee");
      }
    } catch (err) {
      alert("Error connecting to the server");
      console.error("Error adding employee:", err);
    }
  };

  const handleAssignManager = async (employeeId, managerId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Authentication token missing. Please log in again.");
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:5000/api/employees/${employeeId}/assign_manager`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ managerId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Manager assigned successfully!");
        fetchEmployees(); // Refresh the employees list
      } else {
        alert(data.message || "Failed to assign manager");
      }
    } catch (err) {
      alert("Error connecting to the server");
      console.error("Error assigning manager:", err);
    }
  };

  // Fetch employees from the API
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token missing. Please log in again.");
        return;
      }

      const response = await fetch("http://127.0.0.1:5000/api/employees", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setEmployees(data.employees);
      } else {
        setError(data.message || "Failed to fetch employees");
      }
    } catch (err) {
      setError("Error connecting to the server");
      console.error("Error fetching employees:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch managers from the API
  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token missing. Please log in again.");
        return;
      }

      const response = await fetch("http://127.0.0.1:5000/api/managers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        console.log("Managers fetched successfully:", data.managers); // Debug log
        setManagers(data.managers);
      } else {
        console.error("Failed to fetch managers:", data.message); // Debug log
        setError(data.message || "Failed to fetch managers");
      }
    } catch (err) {
      console.error("Error fetching managers:", err); // Debug log
      setError("Error connecting to the server");
    }
  };
  useEffect(() => {
    if (isModalOpen) {
      fetchManagers();
    }
  }, [isModalOpen]);

  const fetchStats = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats([
        {
          title: "Total Employees",
          value: data.totalEmployees,
          icon: <Users size={20} />,
        },
        {
          title: "New Hires",
          value: data.newHires,
          icon: <UserPlus size={20} />,
        },
        {
          title: "Attendance Rate",
          value: data.attendanceRate,
          icon: <Clock size={20} />,
        },
        {
          title: "Managers",
          value: data.managers,
          icon: <Briefcase size={20} />,
        },
      ]);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Load employees, managers, and stats when component mounts
  useEffect(() => {
    fetchEmployees();
    fetchManagers();
    fetchStats(); // Fetch stats from the backend
  }, []);

  {
    activeTab === "recruitment" && <ManagersTab />;
  }

  {
    activeTab !== "dashboard" &&
      activeTab !== "employees" &&
      activeTab !== "recruitment" && (
        <div className="placeholder-page">
          <div className="placeholder-content">
            <h3 className="placeholder-title">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module
            </h3>
            <p className="placeholder-message">
              This module is under development
            </p>
          </div>
        </div>
      );
  }

  return (
    <>
      <style>
        {`
          /* Main Container */
          .hr-container {
            display: flex;
            height: 100vh;
            background-color: #f9fafb;
          }

          /* Sidebar Styles */
          .sidebar {
            width: 256px;
            background-color: #4338ca;
            color: white;
            padding: 16px;
            display: flex;
            flex-direction: column;
          }

          .logo-container {
            display: flex;
            align-items: center;
            margin-bottom: 32px;
          }

          .logo-icon {
            background-color: white;
            color: #4338ca;
            padding: 8px;
            border-radius: 8px;
          }

          .logo-text {
            font-size: 20px;
            font-weight: bold;
            margin-left: 8px;
          }

          .nav-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .nav-item {
            margin-bottom: 8px;
            padding: 8px;
            border-radius: 8px;
          }

          .nav-item:hover {
            background-color: #4f46e5;
          }

          .nav-item.active {
            background-color: #4f46e5;
          }

          .nav-button {
            display: flex;
            align-items: center;
            width: 100%;
            text-align: left;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0;
          }

          .nav-icon {
            margin-right: 8px;
          }

          .sidebar-footer {
            margin-top: auto;
            padding-top: 32px;
          }

          .footer-button {
            display: flex;
            align-items: center;
            padding: 8px;
            width: 100%;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            border-radius: 8px;
            margin-bottom: 8px;
          }

          .footer-button:hover {
            background-color: #4f46e5;
          }

          .footer-button.logout {
            color: #fca5a5;
          }

          /* Main Content Styles */
          .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          /* Header Styles */
          .header {
            background-color: white;
            border-bottom: 1px solid #e5e7eb;
            padding: 16px;
          }

          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .search-container {
            display: flex;
            align-items: center;
            background-color: #f3f4f6;
            padding: 8px 12px;
            border-radius: 8px;
            width: 256px;
          }

          .search-icon {
            color: #6b7280;
          }

          .search-input {
            background-color: transparent;
            border: none;
            margin-left: 8px;
            width: 100%;
          }

          .search-input:focus {
            outline: none;
          }

          .user-section {
            display: flex;
            align-items: center;
          }

          .notification-button {
            padding: 8px;
            position: relative;
            background: none;
            border: none;
            cursor: pointer;
          }

          .notification-badge {
            position: absolute;
            top: 0;
            right: 0;
            height: 16px;
            width: 16px;
            background-color: #ef4444;
            border-radius: 50%;
            font-size: 12px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .user-profile {
            display: flex;
            align-items: center;
            margin-left: 16px;
          }

          .user-avatar {
            width: 32px;
            height: 32px;
            background-color: #4338ca;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .user-name {
            margin-left: 8px;
            font-weight: 500;
          }

          /* Content Area Styles */
          .content-area {
            flex: 1;
            overflow: auto;
            padding: 24px;
          }

          .page-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 24px;
          }

          /* Dashboard Styles */
          .dashboard {
            margin-bottom: 24px;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 24px;
            margin-bottom: 32px;
          }

          @media (min-width: 768px) {
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (min-width: 1024px) {
            .stats-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }

          .stat-card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 24px;
          }

          .stat-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
          }

          .stat-title {
            color: #6b7280;
            font-weight: normal;
          }

          .stat-icon {
            background-color: #e0e7ff;
            padding: 8px;
            border-radius: 8px;
            color: #4338ca;
          }

          .stat-value {
            font-size: 30px;
            font-weight: bold;
          }

          .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
          }

          @media (min-width: 1024px) {
            .dashboard-grid {
              grid-template-columns: 1fr 1fr;
            }
          }

          .chart-card,
          .activities-card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 24px;
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }

          .card-title {
            font-size: 18px;
            font-weight: bold;
          }

          .time-filter {
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 4px;
            font-size: 14px;
          }

          .chart-container {
            height: 256px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .chart-placeholder {
            text-align: center;
          }

          .chart-icon {
            color: #818cf8;
          }

          .chart-label {
            color: #6b7280;
            margin-top: 8px;
          }

          .view-all {
            color: #4f46e5;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
          }

          .view-all:hover {
            text-decoration: underline;
          }

          .activities-list {
            display: flex;
            flex-direction: column;
          }

          .activity-item {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #f3f4f6;
          }

          .activity-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
          }

          .activity-icon {
            padding: 8px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .activity-icon.green {
            background-color: #dcfce7;
            color: #16a34a;
          }

          .activity-icon.blue {
            background-color: #dbeafe;
            color: #2563eb;
          }

          .activity-icon.purple {
            background-color: #f3e8ff;
            color: #9333ea;
          }

          .activity-details {
            margin-left: 12px;
          }

          .activity-title {
            font-weight: 500;
            margin: 0;
          }

          .activity-description {
            color: #6b7280;
            font-size: 14px;
            margin: 0;
          }

          .activity-time {
            margin-left: auto;
            color: #6b7280;
            font-size: 14px;
          }

          /* Employees Page Styles */
          .employees-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }

          .add-employee-button {
            background-color: #4f46e5;
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            display: flex;
            align-items: center;
            cursor: pointer;
          }

          .button-icon {
            margin-right: 8px;
          }

          .employees-table-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          .employees-table {
            min-width: 100%;
            border-collapse: collapse;
          }

          .employees-table th {
            padding: 12px 24px;
            text-align: left;
            font-size: 12px;
            font-weight: 500;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background-color: #f9fafb;
          }

          .employees-table td {
            padding: 16px 24px;
            white-space: nowrap;
            font-size: 14px;
          }

          .employees-table tbody tr {
            border-top: 1px solid #e5e7eb;
          }

          .employee-cell {
            display: flex;
            align-items: center;
          }

          .employee-avatar {
            width: 32px;
            height: 32px;
            background-color: #e0e7ff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #4338ca;
          }

          .employee-name {
            margin-left: 16px;
            font-weight: 500;
          }

          .status-badge {
            padding: 4px 8px;
            font-size: 12px;
            border-radius: 9999px;
          }

          .status-badge.active {
            background-color: #dcfce7;
            color: #166534;
          }

          .status-badge.on-leave {
            background-color: #fef3c7;
            color: #92400e;
          }

          .status-badge.new-hire {
            background-color: #dbeafe;
            color: #1e40af;
          }

          .actions-cell {
            color: #4f46e5;
          }

          .action-link {
            background: none;
            border: none;
            cursor: pointer;
            color: #4f46e5;
          }

          .action-link:hover {
            color: #4338ca;
          }

          .action-divider {
            margin: 0 8px;
          }

          .pagination {
            padding: 16px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid #e5e7eb;
          }

          .results-info {
            font-size: 14px;
            color: #6b7280;
          }

          .results-info span {
            font-weight: 500;
          }

          .pagination-controls {
            display: flex;
            align-items: center;
          }

          .pagination-button {
            padding: 4px 12px;
            border: 1px solid #d1d5db;
            background-color: white;
            color: #6b7280;
            cursor: pointer;
          }

          .pagination-button.active {
            background-color: #4f46e5;
            color: white;
          }

          .pagination-button.prev {
            border-top-left-radius: 6px;
            border-bottom-left-radius: 6px;
          }

          .pagination-button.next {
            border-top-right-radius: 6px;
            border-bottom-right-radius: 6px;
          }

          /* Placeholder Page Styles */
          .placeholder-page {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .placeholder-content {
            text-align: center;
          }

          .placeholder-title {
            font-size: 20px;
            font-weight: 500;
            margin-bottom: 8px;
          }

          .placeholder-message {
            color: #6b7280;
          }
        `}
      </style>

      <div className="hr-container">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="logo-container">
            <div className="logo-icon">
              <Users size={24} />
            </div>
            <h1 className="logo-text">HR Manager</h1>
          </div>

          <nav>
            <ul className="nav-list">
              <li
                className={`nav-item ${
                  activeTab === "dashboard" ? "active" : ""
                }`}
              >
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="nav-button"
                >
                  <BarChart2 size={18} className="nav-icon" />
                  Dashboard
                </button>
              </li>
              <li
                className={`nav-item ${
                  activeTab === "employees" ? "active" : ""
                }`}
              >
                <button
                  onClick={() => setActiveTab("employees")}
                  className="nav-button"
                >
                  <Users size={18} className="nav-icon" />
                  Employees
                </button>
              </li>
              <li
                className={`nav-item ${
                  activeTab === "attendance" ? "active" : ""
                }`}
              >
                <button
                  onClick={() => setActiveTab("attendance")}
                  className="nav-button"
                >
                  <Calendar size={18} className="nav-icon" />
                  Attendance
                </button>
              </li>
              <li
                className={`nav-item ${
                  activeTab === "performance" ? "active" : ""
                }`}
              >
                <button
                  onClick={() => setActiveTab("performance")}
                  className="nav-button"
                >
                  <Star size={18} className="nav-icon" />
                  Performance
                </button>
              </li>
              <li
                className={`nav-item ${
                  activeTab === "recruitment" ? "active" : ""
                }`}
              >
                <button
                  onClick={() => setActiveTab("Managers")}
                  className="nav-button"
                >
                  <Briefcase size={18} className="nav-icon" />
                  Managers
                </button>
              </li>
              <li
                className={`nav-item ${
                  activeTab === "reports" ? "active" : ""
                }`}
              >
                <button
                  onClick={() => setActiveTab("reports")}
                  className="nav-button"
                >
                  <PieChart size={18} className="nav-icon" />
                  Reports
                </button>
              </li>
            </ul>
          </nav>

          <div className="sidebar-footer">
            <button className="footer-button">
              <Settings size={18} className="nav-icon" />
              Settings
            </button>
            <button
              className="footer-button logout"
              onClick={() => handleLogout()}
            >
              <LogOut size={18} className="nav-icon" />
              Log Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Header */}
          <header className="header">
            <div className="header-container">
              <div className="search-container">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="search-input"
                />
              </div>

              <div className="user-section">
                <button className="notification-button">
                  <Bell size={20} />
                  <span className="notification-badge">3</span>
                </button>
                <div className="user-profile">
                  <div className="user-avatar">
                    <User size={16} />
                  </div>
                  <span className="user-name">Admin User</span>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="content-area">
            {activeTab === "dashboard" && (
              <div className="dashboard">
                <h2 className="page-title">HR Dashboard</h2>

                <div className="stats-grid">
                  {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                      <div className="stat-header">
                        <h3 className="stat-title">{stat.title}</h3>
                        <div className="stat-icon">{stat.icon}</div>
                      </div>
                      <p className="stat-value">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="dashboard-grid">
                  <div className="chart-card">
                    <div className="card-header">
                      <h3 className="card-title">Department Breakdown</h3>
                      <select className="time-filter">
                        <option>This Month</option>
                        <option>Last Month</option>
                        <option>This Quarter</option>
                      </select>
                    </div>
                    <div className="chart-container">
                      <div className="chart-placeholder">
                        <PieChart size={120} className="chart-icon" />
                        <p className="chart-label">Department Distribution</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Managers" && <ManagersTab />}

            {activeTab === "employees" && (
              <div className="employees-page">
                <div className="employees-header">
                  <h2 className="page-title">Employees</h2>
                  <button
                    className="add-employee-button"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <UserPlus size={18} className="button-icon" />
                    Add Employee
                  </button>
                </div>

                <div className="employees-table-container">
                  <table className="employees-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Position</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Manager</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => (
                        <tr key={employee.id}>
                          <td>
                            <div className="employee-cell">
                              <div className="employee-avatar">
                                {employee.name.charAt(0)}
                              </div>
                              <div className="employee-name">
                                <div>{employee.name}</div>
                              </div>
                            </div>
                          </td>
                          <td>{employee.position}</td>
                          <td>{employee.department}</td>
                          <td>
                            <span
                              className={`status-badge ${employee.status
                                .toLowerCase()
                                .replace(" ", "-")}`}
                            >
                              {employee.status}
                            </span>
                          </td>
                          <td>
                            {employee.manager_name
                              ? employee.manager_name
                              : "None"}
                          </td>
                          <td className="actions-cell">
                            <button className="action-link">View</button>
                            <span className="action-divider">|</span>
                            <button className="action-link">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="pagination">
                    <div className="results-info">
                      Showing <span>1</span> to <span>5</span> of{" "}
                      <span>124</span> results
                    </div>
                    <div className="pagination-controls">
                      <button className="pagination-button prev">
                        Previous
                      </button>
                      <button className="pagination-button active">1</button>
                      <button className="pagination-button">2</button>
                      <button className="pagination-button">3</button>
                      <button className="pagination-button next">Next</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== "dashboard" && activeTab !== "employees" && (
              <div className="placeholder-page">
                <div className="placeholder-content">
                  <h3 className="placeholder-title">
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{" "}
                    Module
                  </h3>
                  <p className="placeholder-message">
                    This module is under development
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddEmployee={handleAddEmployee}
        managers={managers} // Pass the managers list to the modal
      />
    </>
  );
}
