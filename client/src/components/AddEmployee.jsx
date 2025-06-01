import { useState } from "react";
import { X, UserPlus } from "lucide-react";

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onAddEmployee,
  managers,
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
    department: "",
    startDate: "",
    salary: "",
    phone: "",
    manager: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const departments = [
    "Engineering",
    "Design",
    "Product",
    "Analytics",
    "Marketing",
    "Human Resources",
    "Finance",
    "Operations",
    "Sales",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error when field is being edited
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Required fields validation
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    if (!formData.position.trim()) errors.position = "Position is required";
    if (!formData.department) errors.department = "Department is required";
    if (!formData.startDate) errors.startDate = "Start date is required";

    // Salary validation if provided
    if (formData.salary && isNaN(Number(formData.salary))) {
      errors.salary = "Salary must be a number";
    }

    // Phone validation if provided
    if (formData.phone && !/^[0-9()\-\s]+$/.test(formData.phone)) {
      errors.phone = "Phone number is invalid";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure manager is null if not selected
      const formDataToSubmit = {
        ...formData,
        manager: formData.manager || null,
        status: "New Hire",
      };

      // Call the onAddEmployee prop which handles the API call
      await onAddEmployee(formDataToSubmit);

      // Reset form
      setFormData({
        name: "",
        email: "",
        position: "",
        department: "",
        startDate: "",
        salary: "",
        phone: "",
        manager: "",
      });

      // Close modal
      onClose();
    } catch (error) {
      console.error("Error adding employee:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-container">
            <UserPlus size={20} className="modal-icon" />
            <h2 className="modal-title">Add New Employee</h2>
          </div>
          <button onClick={onClose} className="modal-close-button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="position" className="form-label">
                Position *
              </label>
              <input
                id="position"
                name="position"
                type="text"
                className="form-input"
                value={formData.position}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="department" className="form-label">
                Department *
              </label>
              <select
                id="department"
                name="department"
                className="form-select"
                value={formData.department}
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="startDate" className="form-label">
                Start Date *
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="salary" className="form-label">
                Salary
              </label>
              <input
                id="salary"
                name="salary"
                type="number"
                className="form-input"
                value={formData.salary}
                onChange={handleChange}
                placeholder="Annual salary"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(xxx) xxx-xxxx"
              />
            </div>

            <div className="form-group">
              <label htmlFor="manager" className="form-label">
                Manager
              </label>
              <select
                id="manager"
                name="manager"
                className="form-select"
                value={formData.manager}
                onChange={handleChange}
              >
                <option value="">Select Manager</option>
                {(managers || []).map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-footer">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          width: 100%;
          max-width: 750px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title-container {
          display: flex;
          align-items: center;
        }

        .modal-icon {
          color: #4338ca;
          margin-right: 12px;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .modal-close-button {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }

        .modal-close-button:hover {
          background-color: #f3f4f6;
        }

        .modal-form {
          padding: 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 640px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-input,
        .form-select {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.15s ease-in-out;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 1px #4f46e5;
        }

        .form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .cancel-button {
          padding: 10px 16px;
          border: 1px solid #d1d5db;
          background-color: white;
          color: #374151;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
        }

        .cancel-button:hover {
          background-color: #f3f4f6;
        }

        .submit-button {
          padding: 10px 16px;
          border: none;
          background-color: #4f46e5;
          color: white;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
        }

        .submit-button:hover {
          background-color: #4338ca;
        }
      `}</style>
    </div>
  );
}
