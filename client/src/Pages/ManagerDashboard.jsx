import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";

function EmployeeManagementDashboard() {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const navigate = useNavigate();
  const [newProject, setNewProject] = useState({
    name: "",
    deadline: "",
    status: "Not Started",
  });
  const [newTask, setNewTask] = useState({
    projectId: "",
    title: "",
    description: "",
    assignedTo: "",
    deadline: "",
    status: "Not Started",
  });
  const [activeTab, setActiveTab] = useState("projects");
  const [projectFilter, setProjectFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState({
    projects: false,
    tasks: false,
    employees: false,
  });
  const [error, setError] = useState({
    projects: null,
    tasks: null,
    employees: null,
  });

  // API base URL - replace with your actual API URL
  const API_BASE_URL = " http://127.0.0.1:5000/api";

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

  // This could be stored in localStorage, sessionStorage, or a state management solution like Redux
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  // Common fetch options with authentication
  const getRequestOptions = (method = "GET", body = null) => {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return options;
  };

  // Fetch projects from API
  const fetchProjects = async () => {
    setLoading((prev) => ({ ...prev, projects: true }));
    try {
      const response = await fetch(
        `${API_BASE_URL}/projects`,
        getRequestOptions()
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }
      const data = await response.json();
      setProjects(data);
      setError((prev) => ({ ...prev, projects: null }));
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError((prev) => ({ ...prev, projects: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, projects: false }));
    }
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    setLoading((prev) => ({ ...prev, tasks: true }));
    try {
      const response = await fetch(
        `${API_BASE_URL}/manager/tasks`,
        getRequestOptions()
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched tasks:", data.tasks); // Debug log
      setTasks(data.tasks);
      setError((prev) => ({ ...prev, tasks: null }));
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError((prev) => ({ ...prev, tasks: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, tasks: false }));
    }
  };

  // Fetch employees assigned to the manager from API
  const fetchManagerEmployees = async () => {
    setLoading((prev) => ({ ...prev, employees: true }));
    try {
      const response = await fetch(
        `${API_BASE_URL}/manager/employees`,
        getRequestOptions()
      );

      if (!response.ok) {
        throw new Error("Failed to fetch employees assigned to the manager");
      }

      const data = await response.json();
      console.log("Fetched employees:", data.employees); // Debug log
      setEmployees(data.employees);
    } catch (err) {
      console.error("Error fetching manager's employees:", err);
      setError((prev) => ({ ...prev, employees: err.message }));
    } finally {
      setLoading((prev) => ({ ...prev, employees: false }));
    }
  };

  // Add a new project
  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProject),
      });

      if (!response.ok) {
        throw new Error(`Failed to add project: ${response.status}`);
      }

      const addedProject = await response.json();
      setProjects([...projects, addedProject]);
      setNewProject({ name: "", deadline: "", status: "Not Started" });
      setShowProjectModal(false);
    } catch (err) {
      console.error("Error adding project:", err);
      alert(`Failed to add project: ${err.message}`);
    }
  };

  // Add a new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/manager/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error(`Failed to add task: ${response.status}`);
      }

      const addedTask = await response.json();
      setTasks([...tasks, addedTask]);
      setNewTask({
        projectId: "",
        title: "",
        description: "",
        assignedTo: "",
        deadline: "",
        status: "Not Started",
      });
      setShowTaskModal(false);
    } catch (err) {
      console.error("Error adding task:", err);
      alert(`Failed to add task: ${err.message}`);
    }
  };

  // Update a project
  const updateProject = async (projectId, updatedData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.status}`);
      }

      const updatedProject = await response.json();
      setProjects(
        projects.map((project) =>
          project.id === projectId ? updatedProject : project
        )
      );
    } catch (err) {
      console.error("Error updating project:", err);
      alert(`Failed to update project: ${err.message}`);
    }
  };

  // Update a task
  const updateTask = async (taskId, updatedData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.status}`);
      }

      const updatedTask = await response.json();
      setTasks(tasks.map((task) => (task.id === taskId ? updatedTask : task)));
    } catch (err) {
      console.error("Error updating task:", err);
      alert(`Failed to update task: ${err.message}`);
    }
  };

  // Update project status
  const updateProjectStatus = async (projectId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update project status: ${response.status}`);
      }

      const updatedProject = await response.json();
      setProjects(
        projects.map((project) =>
          project.id === projectId ? updatedProject : project
        )
      );
    } catch (err) {
      console.error("Error updating project status:", err);
      alert(`Failed to update project status: ${err.message}`);
    }
  };

  // Delete a project
  const deleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete project: ${response.status}`);
      }

      // Remove project from state
      setProjects(projects.filter((project) => project.id !== projectId));
    } catch (err) {
      console.error("Error deleting project:", err);
      alert(`Failed to delete project: ${err.message}`);
    }
  };

  // Delete a task
  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status}`);
      }

      // Remove task from state
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
      alert(`Failed to delete task: ${err.message}`);
    }
  };

  // Function to get employee name by ID
  const getEmployeeName = (id) => {
    const employee = employees.find((emp) => emp.id === parseInt(id));
    return employee ? employee.name : "Unassigned";
  };

  // Function to get project name by ID
  const getProjectName = (id) => {
    const project = projects.find((p) => p.id === parseInt(id));
    return project ? project.name : "Unknown Project";
  };

  // Load data when component mounts
  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchManagerEmployees();
  }, []);

  // Re-fetch tasks when project filter changes
  useEffect(() => {
    // You could also filter tasks on the server by passing the project ID as a query parameter
    // For now, we'll just use client-side filtering from the fetched tasks
    if (projectFilter !== "all") {
      // Optionally fetch filtered tasks from server
      // fetchTasksByProject(projectFilter);
    }
  }, [projectFilter]);

  // Filter tasks by project if a filter is selected
  const filteredTasks =
    projectFilter === "all"
      ? tasks
      : tasks.filter((task) => task.projectId === parseInt(projectFilter));

  // Further filter by search term
  const searchFilteredTasks = searchTerm
    ? filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getEmployeeName(task.assignedTo)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : filteredTasks;

  // Calculate days remaining for tasks and projects
  const calculateDaysRemaining = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  // Enhanced CSS Styles
  const styles = {
    dashboard: {
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "24px",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
      color: "#334155",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
      padding: "0 0 16px 0",
      borderBottom: "1px solid #e2e8f0",
    },
    headerTitle: {
      fontSize: "28px",
      fontWeight: "600",
      color: "#1e293b",
      margin: "0",
      letterSpacing: "-0.5px",
    },
    buttonGroup: {
      display: "flex",
      gap: "12px",
    },
    tabs: {
      display: "flex",
      borderBottom: "1px solid #e2e8f0",
      marginBottom: "24px",
      gap: "8px",
    },
    tab: {
      padding: "12px 20px",
      cursor: "pointer",
      border: "none",
      background: "none",
      fontSize: "15px",
      color: "#64748b",
      transition: "all 0.2s ease",
      borderRadius: "8px 8px 0 0",
      fontWeight: "500",
    },
    activeTab: {
      borderBottom: "3px solid #3b82f6",
      fontWeight: "600",
      color: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.05)",
    },
    button: {
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      padding: "10px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    },
    buttonHover: {
      backgroundColor: "#2563eb",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: "0",
      marginTop: "16px",
      backgroundColor: "white",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      borderRadius: "8px",
      overflow: "hidden",
    },
    th: {
      backgroundColor: "#f1f5f9",
      padding: "14px 16px",
      textAlign: "left",
      fontSize: "14px",
      color: "#475569",
      fontWeight: "600",
      borderBottom: "1px solid #e2e8f0",
      position: "sticky",
      top: "0",
    },
    td: {
      padding: "14px 16px",
      borderBottom: "1px solid #e2e8f0",
      fontSize: "14px",
      verticalAlign: "middle",
    },
    lastRow: {
      borderBottom: "none",
    },
    modal: {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "1000",
      backdropFilter: "blur(4px)",
    },
    modalContent: {
      backgroundColor: "white",
      padding: "28px",
      borderRadius: "12px",
      width: "550px",
      maxWidth: "90%",
      boxShadow:
        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    modalTitle: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#1e293b",
      margin: "0",
    },
    closeButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "20px",
      color: "#64748b",
    },
    form: {
      display: "flex",
      flexDirection: "column",
    },
    formGroup: {
      marginBottom: "18px",
    },
    label: {
      marginBottom: "6px",
      fontSize: "14px",
      fontWeight: "500",
      color: "#475569",
      display: "block",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: "6px",
      border: "1px solid #cbd5e1",
      fontSize: "14px",
      transition: "border-color 0.2s ease",
      backgroundColor: "#f8fafc",
    },
    inputFocus: {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
    select: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: "6px",
      border: "1px solid #cbd5e1",
      fontSize: "14px",
      backgroundColor: "#f8fafc",
      appearance: "none",
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 10px center",
      backgroundSize: "16px",
      paddingRight: "32px",
    },
    filterControls: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
      background: "white",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    filterGroup: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    searchInput: {
      padding: "10px 12px",
      borderRadius: "6px",
      border: "1px solid #cbd5e1",
      fontSize: "14px",
      width: "280px",
      backgroundColor: "#f8fafc",
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'%3E%3C/path%3E%3C/svg%3E\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "left 10px center",
      backgroundSize: "16px",
      paddingLeft: "32px",
    },
    status: {
      padding: "6px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "500",
      textAlign: "center",
      display: "inline-block",
      minWidth: "100px",
    },
    statusCompleted: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
    statusInProgress: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    statusNotStarted: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    },
    employeeCard: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "16px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    },
    employeeCardHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    employeeInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    employeeName: {
      margin: "0 0 5px 0",
      fontSize: "16px",
      fontWeight: "600",
      color: "#1e293b",
    },
    employeeRole: {
      margin: "0 0 5px 0",
      color: "#475569",
      fontSize: "14px",
    },
    employeeDepartment: {
      margin: "0",
      color: "#64748b",
      fontSize: "13px",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
      gap: "20px",
      marginTop: "20px",
    },
    badge: {
      display: "inline-block",
      padding: "4px 8px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "500",
      backgroundColor: "#e2e8f0",
      color: "#475569",
    },
    daysRemaining: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "13px",
    },
    daysNormal: {
      color: "#475569",
    },
    daysWarning: {
      color: "#b45309",
      fontWeight: "500",
    },
    daysUrgent: {
      color: "#b91c1c",
      fontWeight: "500",
    },
    formActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      marginTop: "20px",
    },
    cancelButton: {
      backgroundColor: "#f1f5f9",
      color: "#475569",
      border: "none",
      padding: "10px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
    },
    avatarContainer: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    avatar: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      backgroundColor: "#e2e8f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#475569",
      fontWeight: "500",
      fontSize: "14px",
    },
    emptyState: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 0",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    emptyStateText: {
      color: "#64748b",
      margin: "16px 0",
      fontSize: "16px",
    },
  };

  // Generate avatar initials from name
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Render different status styles
  const renderStatus = (status) => {
    let statusStyle = { ...styles.status };

    if (status === "Completed") {
      statusStyle = { ...statusStyle, ...styles.statusCompleted };
    } else if (status === "In Progress") {
      statusStyle = { ...statusStyle, ...styles.statusInProgress };
    } else {
      statusStyle = { ...statusStyle, ...styles.statusNotStarted };
    }

    return <span style={statusStyle}>{status}</span>;
  };

  // Render days remaining with color coding
  const renderDaysRemaining = (deadline) => {
    const daysRemaining = calculateDaysRemaining(deadline);
    let daysStyle = { ...styles.daysRemaining, ...styles.daysNormal };

    if (daysRemaining <= 3 && daysRemaining > 0) {
      daysStyle = { ...styles.daysRemaining, ...styles.daysWarning };
    } else if (daysRemaining <= 0) {
      daysStyle = { ...styles.daysRemaining, ...styles.daysUrgent };
    }

    return (
      <div style={daysStyle}>
        {daysRemaining <= 0 ? (
          <span>Overdue by {Math.abs(daysRemaining)} days</span>
        ) : (
          <span>{daysRemaining} days remaining</span>
        )}
      </div>
    );
  };

  return (
    <div style={styles.dashboard}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Manager Dashboard</h1>

        <div style={styles.buttonGroup}>
          <button
            style={styles.button}
            onClick={() => setShowProjectModal(true)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor =
                styles.buttonHover.backgroundColor;
              e.currentTarget.style.transform = styles.buttonHover.transform;
              e.currentTarget.style.boxShadow = styles.buttonHover.boxShadow;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor =
                styles.button.backgroundColor;
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = styles.button.boxShadow;
            }}
          >
            + New Project
          </button>
          <button
            style={styles.button}
            onClick={() => setShowTaskModal(true)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor =
                styles.buttonHover.backgroundColor;
              e.currentTarget.style.transform = styles.buttonHover.transform;
              e.currentTarget.style.boxShadow = styles.buttonHover.boxShadow;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor =
                styles.button.backgroundColor;
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = styles.button.boxShadow;
            }}
          >
            + New Task
          </button>
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "projects" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("projects")}
        >
          Projects
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "tasks" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("tasks")}
        >
          Tasks
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "employees" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("employees")}
        >
          Employees
        </button>
      </div>

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "35%" }}>Project Name</th>
                <th style={{ ...styles.th, width: "20%" }}>Deadline</th>
                <th style={{ ...styles.th, width: "20%" }}>Status</th>
                <th style={{ ...styles.th, width: "25%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr key={project.id}>
                  <td
                    style={{
                      ...styles.td,
                      ...(index === projects.length - 1 ? styles.lastRow : {}),
                    }}
                  >
                    <div style={{ fontWeight: "500", color: "#1e293b" }}>
                      {project.name}
                    </div>
                  </td>
                  <td
                    style={{
                      ...styles.td,
                      ...(index === projects.length - 1 ? styles.lastRow : {}),
                    }}
                  >
                    <div>{project.deadline}</div>
                    {renderDaysRemaining(project.deadline)}
                  </td>
                  <td
                    style={{
                      ...styles.td,
                      ...(index === projects.length - 1 ? styles.lastRow : {}),
                    }}
                  >
                    {renderStatus(project.status)}
                  </td>
                  <td
                    style={{
                      ...styles.td,
                      ...(index === projects.length - 1 ? styles.lastRow : {}),
                    }}
                  >
                    <div style={{ display: "flex", gap: "8px" }}>

                      <button
                        style={{ ...styles.button, backgroundColor: "#10b981" }}
                        onClick={() =>
                          updateProjectStatus(project.id, "In Progress")
                        }
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "#059669";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "#10b981";
                        }}
                      >
                        Mark In Progress
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <div>
          <div style={styles.filterControls}>
            <div style={styles.filterGroup}>
              <label
                style={{
                  fontWeight: "500",
                  color: "#475569",
                  fontSize: "14px",
                }}
              >
                Filter by Project:
              </label>
              <select
                style={{ ...styles.select, width: "auto", minWidth: "200px" }}
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="text"
                placeholder="Search tasks or employees..."
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {searchFilteredTasks.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Task</th>
                  <th style={styles.th}>Project</th>
                  <th style={styles.th}>Assigned To</th>
                  <th style={styles.th}>Deadline</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {searchFilteredTasks.map((task, index) => (
                  <tr key={task.id}>
                    <td
                      style={{
                        ...styles.td,
                        ...(index === searchFilteredTasks.length - 1
                          ? styles.lastRow
                          : {}),
                      }}
                    >
                      <div style={{ fontWeight: "500", color: "#1e293b" }}>
                        {task.title}
                      </div>
                    </td>
                    <td
                      style={{
                        ...styles.td,
                        ...(index === searchFilteredTasks.length - 1
                          ? styles.lastRow
                          : {}),
                      }}
                    >
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: "#e0f2fe",
                          color: "#0369a1",
                        }}
                      >
                        {getProjectName(task.projectId)}
                      </span>
                    </td>
                    <td
                      style={{
                        ...styles.td,
                        ...(index === searchFilteredTasks.length - 1
                          ? styles.lastRow
                          : {}),
                      }}
                    >
                      <div style={styles.avatarContainer}>
                        <div style={styles.avatar}>
                          {getInitials(getEmployeeName(task.assignedTo))}
                        </div>
                        <span>{getEmployeeName(task.assignedTo)}</span>
                      </div>
                    </td>
                    <td
                      style={{
                        ...styles.td,
                        ...(index === searchFilteredTasks.length - 1
                          ? styles.lastRow
                          : {}),
                      }}
                    >
                      <div>{task.deadline}</div>
                      {renderDaysRemaining(task.deadline)}
                    </td>
                    <td
                      style={{
                        ...styles.td,
                        ...(index === searchFilteredTasks.length - 1
                          ? styles.lastRow
                          : {}),
                      }}
                    >
                      {renderStatus(task.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateText}>
                No tasks match your search criteria
              </div>
              <button
                style={styles.button}
                onClick={() => {
                  setSearchTerm("");
                  setProjectFilter("all");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === "employees" && (
        <div style={styles.grid}>
          {employees.length > 0 ? (
            employees.map((employee) => (
              <div key={employee.id} style={styles.employeeCard}>
                <div style={styles.employeeInfo}>
                  <h3 style={styles.employeeName}>{employee.name}</h3>
                  <p style={styles.employeeRole}>{employee.position}</p>
                  <p style={styles.employeeDepartment}>{employee.department}</p>
                </div>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>
              <p style={styles.emptyStateText}>No employees assigned to you.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Project Modal */}
      {showProjectModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add New Project</h2>
              <button
                style={styles.closeButton}
                onClick={() => setShowProjectModal(false)}
              >
                ×
              </button>
            </div>
            <form style={styles.form} onSubmit={handleAddProject}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Project Name:</label>
                <input
                  type="text"
                  style={styles.input}
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.inputFocus.borderColor;
                    e.currentTarget.style.boxShadow =
                      styles.inputFocus.boxShadow;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.input.border.split(" ")[2];
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Deadline:</label>
                <input
                  type="date"
                  style={styles.input}
                  value={newProject.deadline}
                  onChange={(e) =>
                    setNewProject({ ...newProject, deadline: e.target.value })
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.inputFocus.borderColor;
                    e.currentTarget.style.boxShadow =
                      styles.inputFocus.boxShadow;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.input.border.split(" ")[2];
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status:</label>
                <select
                  style={styles.select}
                  value={newProject.status}
                  onChange={(e) =>
                    setNewProject({ ...newProject, status: e.target.value })
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.inputFocus.borderColor;
                    e.currentTarget.style.boxShadow =
                      styles.inputFocus.boxShadow;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.input.border.split(" ")[2];
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div style={styles.formActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowProjectModal(false)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#e2e8f0";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor =
                      styles.cancelButton.backgroundColor;
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.button}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor =
                      styles.buttonHover.backgroundColor;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor =
                      styles.button.backgroundColor;
                  }}
                >
                  Add Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add New Task</h2>
              <button
                style={styles.closeButton}
                onClick={() => setShowTaskModal(false)}
              >
                ×
              </button>
            </div>
            <form style={styles.form} onSubmit={handleAddTask}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Project:</label>
                <select
                  style={styles.select}
                  value={newTask.projectId}
                  onChange={(e) =>
                    setNewTask({ ...newTask, projectId: e.target.value })
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.inputFocus.borderColor;
                    e.currentTarget.style.boxShadow =
                      styles.inputFocus.boxShadow;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.input.border.split(" ")[2];
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Task Title:</label>
                <input
                  type="text"
                  style={styles.input}
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.inputFocus.borderColor;
                    e.currentTarget.style.boxShadow =
                      styles.inputFocus.boxShadow;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.input.border.split(" ")[2];
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description:</label>
                <textarea
                  style={{
                    ...styles.input,
                    height: "80px",
                    resize: "vertical",
                  }}
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.inputFocus.borderColor;
                    e.currentTarget.style.boxShadow =
                      styles.inputFocus.boxShadow;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.input.border.split(" ")[2];
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assigned To:</label>
                <select
                  style={styles.select}
                  value={newTask.assignedTo}
                  onChange={(e) =>
                    setNewTask({ ...newTask, assignedTo: e.target.value })
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.inputFocus.borderColor;
                    e.currentTarget.style.boxShadow =
                      styles.inputFocus.boxShadow;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.input.border.split(" ")[2];
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Deadline:</label>
                <input
                  type="date"
                  style={styles.input}
                  value={newTask.deadline}
                  onChange={(e) =>
                    setNewTask({ ...newTask, deadline: e.target.value })
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.inputFocus.borderColor;
                    e.currentTarget.style.boxShadow =
                      styles.inputFocus.boxShadow;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.input.border.split(" ")[2];
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status:</label>
                <select
                  style={styles.select}
                  value={newTask.status}
                  onChange={(e) =>
                    setNewTask({ ...newTask, status: e.target.value })
                  }
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.inputFocus.borderColor;
                    e.currentTarget.style.boxShadow =
                      styles.inputFocus.boxShadow;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      styles.input.border.split(" ")[2];
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div style={styles.formActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowTaskModal(false)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#e2e8f0";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor =
                      styles.cancelButton.backgroundColor;
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.button}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor =
                      styles.buttonHover.backgroundColor;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor =
                      styles.button.backgroundColor;
                  }}
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get background color based on department
function getDepartmentColor(department) {
  switch (department) {
    case "Development":
      return "#dbeafe";
    case "Design":
      return "#f5d0fe";
    case "QA":
      return "#dcfce7";
    default:
      return "#e2e8f0";
  }
}

export default EmployeeManagementDashboard;
