import { useState, useEffect } from "react";

export default function EmployeeDashboard() {
  // Current date and time state
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    position: "Loading...",
  });
  const [timeStatus, setTimeStatus] = useState("Out");
  const [timeIn, setTimeIn] = useState(null);
  const [timeOut, setTimeOut] = useState(null);
  const [timeHistory, setTimeHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({
    annual: 0,
    sick: 0,
    personal: 0,
  });
  const [metrics, setMetrics] = useState({
    tasksCompleted: 0,
    tasksInProgress: 0,
    projectsContributed: 0,
    averageTaskCompletion: 0,
    onTimeCompletionRate: 0,
  });
  const [newLeave, setNewLeave] = useState({
    type: "Annual",
    startDate: "",
    endDate: "",
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  // Helper functions
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  const getHeaders = () => {
    return {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getPriorityBadgeStyle = (priority) => {
    switch (priority) {
      case "High":
        return { backgroundColor: "#F56565", color: "white" };
      case "Medium":
        return { backgroundColor: "#ED8936", color: "white" };
      case "Low":
        return { backgroundColor: "#3182CE", color: "white" };
      default:
        return { backgroundColor: "#CBD5E0", color: "black" };
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Completed":
        return { backgroundColor: "#48BB78", color: "white" };
      case "In Progress":
        return { backgroundColor: "#3182CE", color: "white" };
      case "Pending":
        return { backgroundColor: "#718096", color: "white" };
      default:
        return { backgroundColor: "#CBD5E0", color: "black" };
    }
  };

  const getLeaveBadgeStyle = (status) => {
    switch (status) {
      case "Approved":
        return { backgroundColor: "#48BB78", color: "white" };
      case "Pending":
        return { backgroundColor: "#ECC94B", color: "black" };
      case "Rejected":
        return { backgroundColor: "#F56565", color: "white" };
      default:
        return { backgroundColor: "#CBD5E0", color: "black" };
    }
  };

  const getDeadlineIndicatorStyle = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { backgroundColor: "#F56565" }; // Overdue - red
    } else if (diffDays <= 2) {
      return { backgroundColor: "#ED8936" }; // Due soon - orange
    } else {
      return { backgroundColor: "#48BB78" }; // Not urgent - green
    }
  };

  // API calls and effects
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/api/employee/profile",
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setUserProfile({
            name: data.employee.name,
            position: data.employee.position,
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Failed to load user profile");
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const fetchTimeStatus = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/api/time-tracking/status",
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setTimeStatus(data.status);

        if (data.time_in) {
          setTimeIn(new Date(data.time_in));
        }

        if (data.time_out) {
          setTimeOut(new Date(data.time_out));
        }
      } catch (error) {
        console.error("Error fetching time status:", error);
      }
    };

    const fetchTimeHistory = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/api/time-tracking/history",
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setTimeHistory(data.history);
      } catch (error) {
        console.error("Error fetching time history:", error);
      }
    };

    fetchTimeStatus();
    fetchTimeHistory();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://127.0.0.1:5000/api/tasks", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response for Tasks:", data);
        setTasks(data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError("Failed to load tasks. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/api/performance-metrics",
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setMetrics({
          tasksCompleted: data.metrics.tasks_completed || 0,
          tasksInProgress: data.metrics.tasks_in_progress || 0,
          projectsContributed: data.metrics.projects_contributed || 0,
          averageTaskCompletion: data.metrics.average_task_completion || 0,
          onTimeCompletionRate: data.metrics.on_time_completion_rate || 0,
        });
      } catch (error) {
        console.error("Error fetching performance metrics:", error);
      }
    };

    fetchMetrics();
  }, []);

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/api/leave-balance",
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setLeaveBalance({
          annual: data.leaveBalance.annual || 0,
          sick: data.leaveBalance.sick || 0,
          personal: data.leaveBalance.personal || 0,
        });
      } catch (error) {
        console.error("Error fetching leave balance:", error);
      }
    };

    const fetchLeaveHistory = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/api/leave-history",
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setLeaves(data.leaveHistory || []);
      } catch (error) {
        console.error("Error fetching leave history:", error);
      }
    };

    fetchLeaveBalance();
    fetchLeaveHistory();
  }, []);

  useEffect(() => {
    const fetchUpcomingDeadlines = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/api/upcoming-deadlines",
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setUpcomingDeadlines(data.deadlines || []);
      } catch (error) {
        console.error("Error fetching upcoming deadlines:", error);
      }
    };

    fetchUpcomingDeadlines();
  }, []);

  // Event handlers
  const handleTimeToggle = async () => {
    try {
      const action = timeStatus === "Out" ? "in" : "out";
      const response = await fetch(
        "http://127.0.0.1:5000/api/time-tracking/clock",
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTimeStatus(data.status);

        if (data.time_in) {
          setTimeIn(new Date(data.time_in));
        }

        if (data.time_out) {
          setTimeOut(new Date(data.time_out));

          // Refresh time history after clock out
          const historyResponse = await fetch(
            "http://127.0.0.1:5000/api/time-tracking/history",
            {
              method: "GET",
              headers: getHeaders(),
            }
          );

          if (!historyResponse.ok) {
            throw new Error(`HTTP error! Status: ${historyResponse.status}`);
          }

          const historyData = await historyResponse.json();
          setTimeHistory(historyData.history);
        }
      }
    } catch (error) {
      console.error("Error clocking in/out:", error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/tasks/${taskId}/status`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update task in state
        const updatedTasks = tasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        );
        setTasks(updatedTasks);

        // Refresh performance metrics
        const metricsResponse = await fetch(
          "http://127.0.0.1:5000/api/performance-metrics",
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        if (!metricsResponse.ok) {
          throw new Error(`HTTP error! Status: ${metricsResponse.status}`);
        }

        const metricsData = await metricsResponse.json();

        setMetrics({
          tasksCompleted: metricsData.metrics.tasks_completed || 0,
          tasksInProgress: metricsData.metrics.tasks_in_progress || 0,
          projectsContributed: metricsData.metrics.projects_contributed || 0,
          averageTaskCompletion:
            metricsData.metrics.average_task_completion || 0,
          onTimeCompletionRate:
            metricsData.metrics.on_time_completion_rate || 0,
        });

        // Refresh upcoming deadlines if needed
        if (newStatus === "Completed") {
          const deadlinesResponse = await fetch(
            "http://127.0.0.1:5000/api/upcoming-deadlines",
            {
              method: "GET",
              headers: getHeaders(),
            }
          );

          if (!deadlinesResponse.ok) {
            throw new Error(`HTTP error! Status: ${deadlinesResponse.status}`);
          }

          const deadlinesData = await deadlinesResponse.json();
          setUpcomingDeadlines(deadlinesData.deadlines || []);
        }
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleNewLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!newLeave.startDate || !newLeave.endDate) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/api/leave-request", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          type: newLeave.type,
          startDate: newLeave.startDate,
          endDate: newLeave.endDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(
          `HTTP error! Status: ${response.status}, Message: ${
            errorData.message || "Unknown error"
          }`
        );
      }

      const data = await response.json();

      if (data.success) {
        // Add new leave to state
        setLeaves([data.leave, ...leaves]);

        // Reset form
        setNewLeave({ type: "Annual", startDate: "", endDate: "" });
      }
    } catch (error) {
      console.error("Error submitting leave request:", error);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle}>Employee Dashboard</h1>
          <div style={styles.headerUserInfo}>
            <p style={styles.headerUserName}>
              {userProfile?.name ?? "Loading..."}
            </p>
            <p style={styles.headerUserRole}>{userProfile?.position ?? "-"}</p>

            <p style={styles.headerDateTime}>
              {currentDateTime.toLocaleDateString()} |{" "}
              {currentDateTime.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={styles.mainContainer}>
        <div style={styles.gridContainer}>
          {/* Left Column */}
          <div style={styles.leftColumn}>
            {/* Time Tracking */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Time Tracking</h2>
              <div style={styles.timeTrackingContainer}>
                <div>
                  <p style={styles.timeStatusLabel}>
                    Current Status:
                    <span
                      style={
                        timeStatus === "In" ? styles.statusIn : styles.statusOut
                      }
                    >
                      {" "}
                      {timeStatus}
                    </span>
                  </p>
                  {timeIn && (
                    <p style={styles.timeDetails}>
                      Time In: {timeIn.toLocaleTimeString()}
                    </p>
                  )}
                  {timeOut && (
                    <p style={styles.timeDetails}>
                      Time Out: {timeOut.toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleTimeToggle}
                  style={
                    timeStatus === "Out"
                      ? styles.clockInButton
                      : styles.clockOutButton
                  }
                >
                  {timeStatus === "Out" ? "Clock In" : "Clock Out"}
                </button>
              </div>

              {/* Time History */}
              {timeHistory.length > 0 && (
                <div style={styles.timeHistoryContainer}>
                  <h3 style={styles.sectionSubtitle}>Recent Activity</h3>
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeaderRow}>
                          <th style={styles.tableHeaderCell}>Date</th>
                          <th style={styles.tableHeaderCell}>Time In</th>
                          <th style={styles.tableHeaderCell}>Time Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeHistory.map((entry, index) => (
                          <tr key={index} style={styles.tableRow}>
                            <td style={styles.tableCell}>{entry.date}</td>
                            <td style={styles.tableCell}>{entry.timeIn}</td>
                            <td style={styles.tableCell}>{entry.timeOut}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Task Management */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Tasks Assigned by Manager</h2>
              {tasks.length > 0 ? (
                <ul style={styles.taskList}>
                  {tasks.map((task) => (
                    <li key={task.id} style={styles.taskItem}>
                      <div style={styles.taskDetails}>
                        <h3 style={styles.taskTitle}>{task.title}</h3>
                        <p style={styles.taskDescription}>{task.description}</p>
                        <p style={styles.taskMeta}>
                          Due: {formatDate(task.deadline)}
                        </p>
                        <p style={styles.taskMeta}>Priority: {task.priority}</p>
                        <p style={styles.taskMeta}>Status: {task.status}</p>
                        <div style={styles.taskActions}>
                          <button
                            style={styles.inProgressButton}
                            onClick={() =>
                              updateTaskStatus(task.id, "In Progress")
                            }
                          >
                            Set to In Progress
                          </button>
                          <button
                            style={styles.completedButton}
                            onClick={() =>
                              updateTaskStatus(task.id, "Completed")
                            }
                          >
                            Set to Completed
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No tasks assigned by your manager.</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div style={styles.rightColumn}>
            {/* Performance Metrics */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Performance Metrics</h2>
              <div style={styles.metricsContainer}>
                <div style={styles.metricRow}>
                  <span style={styles.metricLabel}>Tasks Completed</span>
                  <span style={styles.metricValue}>
                    {metrics.tasksCompleted}
                  </span>
                </div>
                <div style={styles.metricRow}>
                  <span style={styles.metricLabel}>Tasks In Progress</span>
                  <span style={styles.metricValue}>
                    {metrics.tasksInProgress}
                  </span>
                </div>
                <div style={styles.metricRow}>
                  <span style={styles.metricLabel}>Projects Contributed</span>
                  <span style={styles.metricValue}>
                    {metrics.projectsContributed}
                  </span>
                </div>
                <div style={styles.metricRow}>
                  <span style={styles.metricValue}>
                    {metrics?.tasksCompleted ?? 0}
                  </span>
                  <span style={styles.metricValue}>
                    {metrics?.averageTaskCompletion?.toFixed(2) ?? "0.00"} days
                  </span>
                </div>
                <div style={styles.metricRow}>
                  <span style={styles.metricLabel}>
                    On-Time Completion Rate
                  </span>
                  <span style={styles.metricValue}>
                    {metrics.onTimeCompletionRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Upcoming Deadlines</h2>
              <div style={styles.deadlinesContainer}>
                {tasks
                  .filter((task) => task.status !== "Completed")
                  .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                  .slice(0, 3)
                  .map((task) => (
                    <div
                      key={`deadline-${task.id}`}
                      style={styles.deadlineItem}
                    >
                      <div
                        style={{
                          ...styles.deadlineIndicator,
                          ...getDeadlineIndicatorStyle(task.dueDate),
                        }}
                      ></div>
                      <div style={styles.deadlineInfo}>
                        <p style={styles.deadlineTitle}>{task.title}</p>
                        <p style={styles.deadlineDate}>
                          Due: {formatDate(task.deadline)}
                        </p>
                      </div>
                      <span
                        style={{
                          ...styles.badge,
                          ...getPriorityBadgeStyle(task.priority),
                        }}
                      >
                        {task.priority}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Leave Management */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Leave Management</h2>

              {/* Leave Balance */}
              <div style={styles.leaveBalanceContainer}>
                <h3 style={styles.sectionSubtitle}>Leave Balance</h3>
                <div style={styles.leaveBalanceGrid}>
                  <div
                    style={{
                      ...styles.leaveBalanceCard,
                      ...styles.annualLeaveCard,
                    }}
                  >
                    <p style={styles.leaveTypeName}>Annual</p>
                    <p style={styles.leaveTypeValue}>
                      {leaveBalance.annual} days
                    </p>
                  </div>
                  <div
                    style={{
                      ...styles.leaveBalanceCard,
                      ...styles.sickLeaveCard,
                    }}
                  >
                    <p style={styles.leaveTypeName}>Sick</p>
                    <p style={styles.leaveTypeValue}>
                      {leaveBalance.sick} days
                    </p>
                  </div>
                  <div
                    style={{
                      ...styles.leaveBalanceCard,
                      ...styles.personalLeaveCard,
                    }}
                  >
                    <p style={styles.leaveTypeName}>Personal</p>
                    <p style={styles.leaveTypeValue}>
                      {leaveBalance.personal} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Leave History */}
              <div style={styles.leaveHistoryContainer}>
                <h3 style={styles.sectionSubtitle}>Leave History</h3>
                <div style={styles.leaveHistoryList}>
                  {leaves.map((leave) => (
                    <div key={leave.id} style={styles.leaveHistoryItem}>
                      <div style={styles.leaveItemHeader}>
                        <span style={styles.leaveItemType}>
                          {leave.type} Leave
                        </span>
                        <span
                          style={{
                            ...styles.badge,
                            ...getLeaveBadgeStyle(leave.status),
                          }}
                        >
                          {leave.status}
                        </span>
                      </div>
                      <p style={styles.leaveItemDate}>
                        {formatDate(leave.startDate)}
                        {leave.startDate !== leave.endDate &&
                          ` to ${formatDate(leave.endDate)}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Leave */}
              <div style={styles.leaveRequestContainer}>
                <h3 style={styles.sectionSubtitle}>Request Leave</h3>
                <form onSubmit={handleNewLeaveSubmit} style={styles.form}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Leave Type</label>
                    <select
                      value={newLeave.type}
                      onChange={(e) =>
                        setNewLeave({ ...newLeave, type: e.target.value })
                      }
                      style={styles.formSelect}
                    >
                      <option value="Annual">Annual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Personal">Personal Leave</option>
                    </select>
                  </div>
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Start Date</label>
                      <input
                        type="date"
                        value={newLeave.startDate}
                        onChange={(e) =>
                          setNewLeave({
                            ...newLeave,
                            startDate: e.target.value,
                          })
                        }
                        style={styles.formInput}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>End Date</label>
                      <input
                        type="date"
                        value={newLeave.endDate}
                        onChange={(e) =>
                          setNewLeave({
                            ...newLeave,
                            endDate: e.target.value,
                          })
                        }
                        style={styles.formInput}
                      />
                    </div>
                  </div>
                  <button type="submit" style={styles.submitButton}>
                    Submit Request
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const styles = {
  // Layout
  container: {
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
  },
  header: {
    backgroundColor: "#2563eb",
    color: "white",
    padding: "16px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  headerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    margin: 0,
  },
  headerUserInfo: {
    textAlign: "right",
  },
  headerUserName: {
    fontSize: "18px",
    margin: "0 0 4px 0",
  },
  headerUserRole: {
    fontSize: "14px",
    margin: "0 0 4px 0",
    opacity: 0.9,
  },
  headerDateTime: {
    fontSize: "14px",
    margin: 0,
    opacity: 0.9,
  },
  mainContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "16px",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
  },
  leftColumn: {
    gridColumn: "1 / 3",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  rightColumn: {
    gridColumn: "3 / 4",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  // Cards
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#333",
    marginTop: 0,
    marginBottom: "16px",
    borderBottom: "1px solid #eee",
    paddingBottom: "8px",
  },
  sectionSubtitle: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#444",
    marginTop: 0,
    marginBottom: "8px",
  },

  // Time Tracking
  timeTrackingContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  timeStatusLabel: {
    color: "#555",
    fontSize: "15px",
    margin: "0 0 4px 0",
  },
  statusIn: {
    fontWeight: "bold",
    color: "#16a34a",
  },
  statusOut: {
    fontWeight: "bold",
    color: "#dc2626",
  },
  timeDetails: {
    color: "#555",
    fontSize: "15px",
    margin: "0 0 4px 0",
  },
  clockInButton: {
    backgroundColor: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: "999px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  clockOutButton: {
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "999px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  timeHistoryContainer: {
    marginTop: "24px",
  },

  // Tables
  tableContainer: {
    overflowX: "auto",
    maxHeight: "300px",
    marginBottom: "16px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  tableHeaderRow: {
    backgroundColor: "#f9fafb",
  },
  tableHeaderCell: {
    padding: "12px",
    textAlign: "left",
    fontWeight: "500",
    color: "#555",
    borderBottom: "1px solid #eee",
  },
  tableRow: {
    borderBottom: "1px solid #eee",
  },
  tableCell: {
    padding: "12px",
    color: "#333",
  },
  statusSelect: {
    padding: "6px 8px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
    color: "#333",
  },

  // Badges
  badge: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "500",
  },
  statusBadgeGreen: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusBadgeBlue: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  statusBadgeYellow: {
    backgroundColor: "#fef9c3",
    color: "#854d0e",
  },
  priorityBadgeHigh: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
  },
  priorityBadgeMedium: {
    backgroundColor: "#fef9c3",
    color: "#854d0e",
  },
  priorityBadgeLow: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  leaveBadgeApproved: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  leaveBadgePending: {
    backgroundColor: "#fef9c3",
    color: "#854d0e",
  },
  leaveBadgeTaken: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },

  // Info Notes
  infoNote: {
    backgroundColor: "#dbeafe",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    padding: "16px",
    marginTop: "16px",
  },
  infoNoteText: {
    color: "#1e40af",
    fontSize: "14px",
    margin: 0,
  },
  infoNoteLabel: {
    fontWeight: "500",
  },

  // Metrics
  metricsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    color: "#555",
    fontSize: "15px",
  },
  metricValue: {
    fontWeight: "bold",
    color: "#2563eb",
    fontSize: "16px",
  },

  // Deadline section
  deadlinesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  deadlineItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    border: "1px solid #eee",
    borderRadius: "6px",
  },
  deadlineIndicator: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    marginRight: "12px",
  },
  deadlineIndicatorRed: {
    backgroundColor: "#ef4444",
  },
  deadlineIndicatorYellow: {
    backgroundColor: "#eab308",
  },
  deadlineIndicatorGreen: {
    backgroundColor: "#22c55e",
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineTitle: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
  },
  deadlineDate: {
    margin: 0,
    fontSize: "12px",
    color: "#666",
  },

  // Leave Management
  leaveBalanceContainer: {
    marginBottom: "24px",
  },
  leaveBalanceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },
  leaveBalanceCard: {
    padding: "12px",
    borderRadius: "6px",
    textAlign: "center",
  },
  annualLeaveCard: {
    backgroundColor: "#dbeafe",
  },
  sickLeaveCard: {
    backgroundColor: "#dcfce7",
  },
  personalLeaveCard: {
    backgroundColor: "#f3e8ff",
  },
  leaveTypeName: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    color: "#555",
  },
  leaveTypeValue: {
    margin: 0,
    fontWeight: "bold",
    fontSize: "16px",
  },
  leaveHistoryContainer: {
    marginBottom: "24px",
  },
  leaveHistoryList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  leaveHistoryItem: {
    border: "1px solid #eee",
    borderRadius: "6px",
    padding: "12px",
  },
  leaveItemHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  leaveItemType: {
    fontWeight: "500",
    color: "#333",
  },
  leaveItemDate: {
    margin: 0,
    fontSize: "14px",
    color: "#666",
  },
  leaveRequestContainer: {
    marginTop: "24px",
  },

  // Forms
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  formLabel: {
    fontSize: "14px",
    color: "#555",
  },
  formInput: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
  },
  formSelect: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "14px",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "10px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  taskActions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  inProgressButton: {
    backgroundColor: "#3182CE",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "8px 12px",
    fontSize: "14px",
    cursor: "pointer",
  },
  completedButton: {
    backgroundColor: "#48BB78",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "8px 12px",
    fontSize: "14px",
    cursor: "pointer",
  },
};
