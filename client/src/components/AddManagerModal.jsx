import { useState } from "react";
import { X } from "lucide-react";

export default function AddManagerModal({ isOpen, onClose, onAddManager }) {
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    email: "",
    phone: "",
    department: "",
    directReports: 0,
    hireDate: "",
  });

  const [errors, setErrors] = useState({});

  const departmentOptions = [
    "Engineering",
    "Marketing",
    "Finance",
    "Human Resources",
    "Product",
    "Operations",
    "Sales",
    "Customer Support",
    "Legal",
    "Research & Development",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear the error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.department) {
      newErrors.department = "Department is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.hireDate) {
      newErrors.hireDate = "Hire date is required";
    }

    if (formData.directReports < 0) {
      newErrors.directReports = "Direct reports cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Create manager object with form data
      const newManager = {
        ...formData,
        id: Date.now(), // Temporary ID for demo purposes
        avatarInitial: formData.name
          .split(" ")
          .map((n) => n[0])
          .join(""),
        status: "Active",
      };

      onAddManager(newManager);
      onClose();

      // Reset form
      setFormData({
        name: "",
        title: "",
        email: "",
        phone: "",
        department: "",
        directReports: 0,
        hireDate: "",
      });
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Add New Manager</h2>
          <button className="modal-close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${errors.name ? "error-input" : ""}`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="error-message">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Job Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? "error-input" : ""}`}
              placeholder="Enter job title"
            />
            {errors.title && <p className="error-message">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="department" className="form-label">
              Department
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className={`form-input ${errors.department ? "error-input" : ""}`}
            >
              <option value="">Select Department</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="error-message">{errors.department}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? "error-input" : ""}`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="error-message">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`form-input ${errors.phone ? "error-input" : ""}`}
              placeholder="Enter phone number"
            />
            {errors.phone && <p className="error-message">{errors.phone}</p>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hireDate" className="form-label">
                Hire Date
              </label>
              <input
                type="date"
                id="hireDate"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleChange}
                className={`form-input ${errors.hireDate ? "error-input" : ""}`}
              />
              {errors.hireDate && (
                <p className="error-message">{errors.hireDate}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="directReports" className="form-label">
                Direct Reports
              </label>
              <input
                type="number"
                id="directReports"
                name="directReports"
                value={formData.directReports}
                onChange={handleChange}
                className={`form-input ${
                  errors.directReports ? "error-input" : ""
                }`}
                min="0"
              />
              {errors.directReports && (
                <p className="error-message">{errors.directReports}</p>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-button">
              Add Manager
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        /* Modal Overlay */
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

        /* Modal Content */
        .modal-content {
          background-color: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        /* Modal Header */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .modal-close-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
        }

        /* Modal Form */
        .modal-form {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 16px;
          width: 100%;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background-color: #f9fafb;
        }

        .form-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
        }

        .error-input {
          border-color: #ef4444;
        }

        .error-message {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
          margin-bottom: 0;
        }

        /* Modal Footer */
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 16px;
          margin-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .cancel-button {
          padding: 8px 16px;
          background-color: white;
          color: #4b5563;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .submit-button {
          padding: 8px 16px;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .submit-button:hover {
          background-color: #4338ca;
        }
      `}</style>
    </div>
  );
}
