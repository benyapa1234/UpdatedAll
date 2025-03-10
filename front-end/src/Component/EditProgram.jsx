//อ้อแก้ทั้งไฟล์
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Program() {
  const [program, setProgram] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [filteredProgram, setFilteredProgram] = useState([]);
  const [newProgram, setNewProgram] = useState({
    program_name: "",
    program_name_th: "",
    program_shortname_en: "",
    program_shortname_th: "",
  });
  const [editProgram, setEditProgram] = useState(null);
  const [editFormData, setEditFormData] = useState({
    program_name: "",
    program_name_th: "",
    program_shortname_en: "",
    program_shortname_th: "",
    year: "",
  });
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [facultys, setFacultys] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("all");
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  // Fetch program, universities, and facultys when the component loads
  useEffect(() => {
    axios
      .get("http://localhost:8000/university")
      .then((response) => setUniversities(response.data))
      .catch((error) => {
        console.error("Error fetching universities:", error);
        showAlert("ไม่สามารถโหลดรายชื่อมหาวิทยาลัยได้", "danger");
      });
  }, []);

  useEffect(() => {
    if (!selectedUniversity || selectedUniversity === "all") {
      setFacultys([]);
      setSelectedFaculty("all");
      return;
    }

    axios
      .get(`http://localhost:8000/faculty?university_id=${selectedUniversity}`)
      .then((response) => {
        const facultyData = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setFacultys(facultyData);

        if (
          facultyData.length > 0 &&
          !facultyData.some((f) => f.faculty_id.toString() === selectedFaculty)
        ) {
          setSelectedFaculty("all");
        }
      })
      .catch((error) => {
        console.error("Error fetching facultys:", error);
        showAlert("ไม่สามารถโหลดคณะได้", "danger");
        setFacultys([]);
        setSelectedFaculty("all");
      });
  }, [selectedUniversity]);

  useEffect(() => {
    if (!selectedFaculty || selectedFaculty === "all") {
      setProgram([]);
      setFilteredProgram([]);
      setYears([]);
      setSelectedYear("all");
      setSelectedProgram("all");
      return;
    }

    axios
      .get(`http://localhost:8000/program?faculty_id=${selectedFaculty}`)
      .then((response) => {
        const programData = Array.isArray(response.data)
          ? response.data
          : [response.data];

        setProgram(programData);
        setFilteredProgram(programData);
        setSelectedProgram("all"); // Reset program selection

        // Extract unique years from all programs in this faculty
        const uniqueYears = [
          ...new Set(
            programData.map((p) => p.year).filter((year) => year != null)
          ),
        ];
        setYears(uniqueYears.sort((a, b) => a - b));
        setSelectedYear("all"); // Reset year selection
      })
      .catch((error) => {
        console.error("Error fetching programs:", error);
        showAlert("ไม่สามารถโหลดหลักสูตรได้", "danger");
        setProgram([]);
        setFilteredProgram([]);
        setYears([]);
        setSelectedYear("all");
      });
  }, [selectedFaculty]);

  // Filter programs based on year
  useEffect(() => {
    let filteredData = program;

    // Filter by year
    if (selectedYear !== "all") {
      filteredData = filteredData.filter(
        (p) => p.year === parseInt(selectedYear)
      );
    }

    setFilteredProgram(filteredData);
  }, [program, selectedYear]);

  // New useEffect to handle program selection
  useEffect(() => {
    if (!selectedProgram || selectedProgram === "all") {
      // When "All Programs" is selected, show years from all programs in the faculty
      if (program.length > 0) {
        const uniqueYears = [
          ...new Set(program.map((p) => p.year).filter((year) => year != null)),
        ];
        setYears(uniqueYears.sort((a, b) => a - b));

        // Filter the program display but don't change available years
        setFilteredProgram(program);
      }
      return;
    }

    // Filter to show only the selected program
    const programFiltered = program.filter(
      (p) => p.program_id === parseInt(selectedProgram)
    );
    setFilteredProgram(programFiltered);

    // Get years only for the selected program
    if (programFiltered.length > 0) {
      const uniqueYears = [
        ...new Set(
          programFiltered.map((p) => p.year).filter((year) => year != null)
        ),
      ];
      setYears(uniqueYears.sort((a, b) => a - b));

      // Set default year if available and none is selected
      if (uniqueYears.length > 0 && selectedYear === "all") {
        setSelectedYear(uniqueYears[0].toString());
      } else if (uniqueYears.length === 0) {
        setSelectedYear("all");
      }
    }
  }, [selectedProgram, program]);

  // Filter programs based on year
  useEffect(() => {
    if (selectedYear === "all") {
      // If "All Years" is selected but a program is filtered
      if (selectedProgram !== "all") {
        const programFiltered = program.filter(
          (p) => p.program_id === parseInt(selectedProgram)
        );
        setFilteredProgram(programFiltered);
      } else {
        // Show all programs in the selected faculty
        setFilteredProgram(program);
      }
      return;
    }

    // Filter by year
    let filteredData = program;

    // First filter by program if a specific program is selected
    if (selectedProgram !== "all") {
      filteredData = filteredData.filter(
        (p) => p.program_id === parseInt(selectedProgram)
      );
    }

    // Then filter by year
    filteredData = filteredData.filter(
      (p) => p.year === parseInt(selectedYear)
    );
    setFilteredProgram(filteredData);
  }, [selectedYear, program, selectedProgram]);

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ ...alert, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Show alert message
  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
  };

  // Handle input change for new program form
  const handleNewProgramChange = (e) => {
    const { name, value } = e.target;
    setNewProgram({
      ...newProgram,
      [name]: value,
    });
  };

  // Handle input change for edit program form
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  // Function to add a new program with all fields
  const handleAddProgram = () => {
    if (!newProgram.program_name || newProgram.program_name.trim() === "") {
      showAlert("กรุณากรอกชื่อหลักสูตร", "warning");
      return;
    }

    if (!selectedFaculty || selectedFaculty === "all") {
      showAlert("กรุณาเลือกคณะ", "warning");
      return;
    }

    // Validate year input
    if (!newProgram.year) {
      showAlert("กรุณากรอกปีของหลักสูตร", "warning");
      return;
    }

    const yearValue = parseInt(newProgram.year, 10);
    if (isNaN(yearValue) || yearValue < 1900 || yearValue > 2100) {
      showAlert("ปีของหลักสูตรต้องเป็นตัวเลขระหว่าง 1900-2100", "warning");
      return;
    }

    const programPayload = {
      program_name: newProgram.program_name,
      program_name_th: newProgram.program_name_th || "",
      program_shortname_en: newProgram.program_shortname_en || "",
      program_shortname_th: newProgram.program_shortname_th || "",
      year: yearValue,
    };

    console.log("Payload being sent:", programPayload);

    axios
      .post("http://localhost:8000/program", programPayload)
      .then((response) => {
        console.log("✅ Program added successfully!", response.data);

        // Extract program_id from the response
        const newProgramId = response.data.program_id;

        if (!newProgramId) {
          throw new Error("❌ program_id is missing from response");
        }

        console.log("🔹 Sending data to /program_faculty:", {
          program_id: newProgramId,
          faculty_id: selectedFaculty,
        });

        return axios
          .post("http://localhost:8000/program_faculty", {
            program_id: newProgramId,
            faculty_id: selectedFaculty,
          })
          .then(() => newProgramId); // Pass the program_id to the next .then()
      })
      .then((newProgramId) => {
        console.log("✅ Program added to program_faculty successfully!");

        // Create a new program item to add to the filtered list
        const newProgramItem = {
          program_id: newProgramId,
          program_name: newProgram.program_name,
          program_name_th: newProgram.program_name_th || "",
          program_shortname_en: newProgram.program_shortname_en || "",
          program_shortname_th: newProgram.program_shortname_th || "",
          year: yearValue,
        };

        // Update the filtered program list
        setFilteredProgram([...filteredProgram, newProgramItem]);
        setProgram([...program, newProgramItem]);

        // Reset the new program form
        setNewProgram({
          program_name: "",
          program_name_th: "",
          program_shortname_en: "",
          program_shortname_th: "",
          year: "",
        });

        showAlert("เพิ่มหลักสูตรเรียบร้อยแล้ว", "success");
      })
      .catch((error) => {
        console.error(
          "❌ Error adding program:",
          error.response?.data || error
        );

        // Detailed error handling
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const errorMessage = error.response.data.errors
            ? error.response.data.errors.join(", ")
            : error.response.data.message || "เกิดข้อผิดพลาดในการเพิ่มหลักสูตร";

          showAlert(errorMessage, "danger");
        } else if (error.request) {
          // The request was made but no response was received
          showAlert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้", "danger");
        } else {
          // Something happened in setting up the request that triggered an Error
          showAlert("เกิดข้อผิดพลาดในการส่งข้อมูล", "danger");
        }
      });
  };

  // Function to edit an existing program with all required fields
  const handleEditProgram = () => {
    if (!editProgram) return;

    // Check if all required fields are provided
    if (
      !editFormData.program_name ||
      !editFormData.program_name_th ||
      !editFormData.year ||
      !editFormData.program_shortname_en ||
      !editFormData.program_shortname_th
    ) {
      showAlert("กรุณากรอกข้อมูลให้ครบทุกช่อง", "warning");
      return;
    }

    // Validate year input
    const yearValue = parseInt(editFormData.year, 10);
    if (isNaN(yearValue) || yearValue < 1900 || yearValue > 2100) {
      showAlert("ปีของหลักสูตรต้องเป็นตัวเลขระหว่าง 1900-2100", "warning");
      return;
    }

    axios
      .put(`http://localhost:8000/program/${editProgram.program_id}`, {
        program_name: editFormData.program_name,
        program_name_th: editFormData.program_name_th,
        year: yearValue,
        program_shortname_en: editFormData.program_shortname_en,
        program_shortname_th: editFormData.program_shortname_th,
      })
      .then(() => {
        const updatedProgram = program.map((p) =>
          p.program_id === editProgram.program_id
            ? {
                ...p,
                program_name: editFormData.program_name,
                program_name_th: editFormData.program_name_th,
                year: yearValue,
                program_shortname_en: editFormData.program_shortname_en,
                program_shortname_th: editFormData.program_shortname_th,
              }
            : p
        );
        setProgram(updatedProgram);

        // Also update the filtered list
        const updatedFiltered = filteredProgram.map((p) =>
          p.program_id === editProgram.program_id
            ? {
                ...p,
                program_name: editFormData.program_name,
                program_name_th: editFormData.program_name_th,
                year: yearValue,
                program_shortname_en: editFormData.program_shortname_en,
                program_shortname_th: editFormData.program_shortname_th,
              }
            : p
        );
        setFilteredProgram(updatedFiltered);

        // Reset edit state
        setEditProgram(null);
        setEditFormData({
          program_name: "",
          program_name_th: "",
          program_shortname_en: "",
          program_shortname_th: "",
          year: "",
        });

        // Show success alert
        showAlert("แก้ไขหลักสูตรเรียบร้อยแล้ว", "success");
      })
      .catch((error) => {
        console.error("Error editing program:", error);
        showAlert("เกิดข้อผิดพลาดในการแก้ไขหลักสูตร", "danger");
      });
  };

  // Function to delete a program
  const handleDeleteProgram = (program_id) => {
    // Confirm before deleting
    if (!window.confirm("คุณต้องการลบหลักสูตรนี้ใช่หรือไม่?")) {
      return;
    }

    axios
      .delete(`http://localhost:8000/program/${program_id}`)
      .then(() => {
        const updatedProgram = program.filter(
          (p) => p.program_id !== program_id
        );
        setProgram(updatedProgram);

        // Also update the filtered list
        const updatedFiltered = filteredProgram.filter(
          (p) => p.program_id !== program_id
        );
        setFilteredProgram(updatedFiltered);

        // Show success alert
        showAlert("ลบหลักสูตรเรียบร้อยแล้ว", "success");
      })
      .catch((error) => {
        console.error("Error deleting program:", error);
        showAlert("เกิดข้อผิดพลาดในการลบหลักสูตร", "danger");
      });
  };

  // Handler for university selection change
  const handleUniversityChange = (e) => {
    setSelectedUniversity(e.target.value);
  };

  // Handler for faculty selection change
  const handleFacultyChange = (e) => {
    setSelectedFaculty(e.target.value);
  };

  // Handler for year selection change
  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

  return (
    <div className="card p-4 position-relative">
      <h3>Add Edit Delete Program</h3>

      {/* Alert notification */}
      {alert.show && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show`}
          role="alert"
        >
          {alert.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert({ ...alert, show: false })}
          ></button>
        </div>
      )}

      {/* University selector */}
      <div className="mb-3">
        <label className="form-label text-start">Filter by University</label>
        <select
          className="form-select"
          value={selectedUniversity}
          onChange={handleUniversityChange}
        >
          <option value="all">All Universities</option>
          {universities.map((university) => (
            <option
              key={university.university_id}
              value={university.university_id}
            >
              {university.university_name_en} ({university.university_name_th})
            </option>
          ))}
        </select>
      </div>

      {/* Faculty selector */}
      <div className="mb-3">
        <label className="form-label text-start">Filter by Faculty</label>
        <select
          className="form-select"
          value={selectedFaculty}
          onChange={handleFacultyChange}
        >
          <option value="all">All Facultys</option>
          {facultys.map((faculty) => (
            <option key={faculty.faculty_id} value={faculty.faculty_id}>
              {faculty.faculty_name_en} ({faculty.faculty_name_th})
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label text-start">Filter by Program</label>
        <select
          className="form-select"
          value={selectedProgram || "all"}
          onChange={(e) => setSelectedProgram(e.target.value)}
        >
          <option value="all">All Programs</option>
          {program.map((p) => (
            <option key={p.program_id} value={p.program_id}>
              {p.program_name} ({p.program_name_th || ""})
            </option>
          ))}
        </select>
      </div>

      {/* Year selector */}
      <div className="mb-3">
        <label className="form-label text-start">Program Revision Year</label>
        <select
          className="form-select"
          value={selectedYear}
          onChange={handleYearChange}
        >
          <option value="all">All Years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Enhanced section to add a new program with all fields */}
      <div className="mb-3">
        <label className="form-label text-start">Add Program</label>
        <div className="mb-2">
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Program Name (English)"
            name="program_name"
            value={newProgram.program_name}
            onChange={handleNewProgramChange}
          />
          <input
            type="text"
            className="form-control mb-2"
            placeholder="ชื่อหลักสูตร (ภาษาไทย)"
            name="program_name_th"
            value={newProgram.program_name_th}
            onChange={handleNewProgramChange}
          />
          <div className="row mb-2">
            <div className="col">
              <input
                type="text"
                className="form-control"
                placeholder="Short Name (EN)"
                name="program_shortname_en"
                value={newProgram.program_shortname_en}
                onChange={handleNewProgramChange}
              />
            </div>
            <div className="col">
              <input
                type="text"
                className="form-control"
                placeholder="ชื่อย่อ (ไทย)"
                name="program_shortname_th"
                value={newProgram.program_shortname_th}
                onChange={handleNewProgramChange}
              />
            </div>
          </div>
          <div className="row mb-2">
            <div className="col">
              <input
                type="text"
                className="form-control"
                placeholder="Year (e.g., 2023)"
                name="year"
                value={newProgram.year}
                onChange={handleNewProgramChange}
              />
            </div>
            <div className="col d-flex justify-content-end">
              <button
                className="btn btn-primary"
                onClick={handleAddProgram}
                disabled={newProgram.program_name.trim() === ""}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Updated section to edit an existing program with all fields */}
      <div className="mb-3">
        <label className="form-label text-start">Edit Program</label>
        <div className="mb-2">
          <select
            className="form-select mb-2"
            value={editProgram ? editProgram.program_id : ""}
            onChange={(e) => {
              const selectedId = parseInt(e.target.value, 10);
              const selectedProgram = program.find(
                (p) => p.program_id === selectedId
              );
              setEditProgram(selectedProgram);
              if (selectedProgram) {
                setEditFormData({
                  program_name: selectedProgram.program_name || "",
                  program_name_th: selectedProgram.program_name_th || "",
                  program_shortname_en:
                    selectedProgram.program_shortname_en || "",
                  program_shortname_th:
                    selectedProgram.program_shortname_th || "",
                  year: selectedProgram.year
                    ? selectedProgram.year.toString()
                    : "",
                });
              }
            }}
          >
            <option value="" disabled>
              Select Program
            </option>
            {filteredProgram.map((p) => (
              <option key={p.program_id} value={p.program_id}>
                {p.program_name}
              </option>
            ))}
          </select>

          <input
            type="text"
            className="form-control mb-2"
            placeholder="Program Name (English)"
            name="program_name"
            value={editFormData.program_name}
            onChange={handleEditFormChange}
            disabled={!editProgram}
          />
          <input
            type="text"
            className="form-control mb-2"
            placeholder="ชื่อหลักสูตร (ภาษาไทย)"
            name="program_name_th"
            value={editFormData.program_name_th}
            onChange={handleEditFormChange}
            disabled={!editProgram}
          />
          <div className="row mb-2">
            <div className="col">
              <input
                type="text"
                className="form-control"
                placeholder="Short Name (EN)"
                name="program_shortname_en"
                value={editFormData.program_shortname_en}
                onChange={handleEditFormChange}
                disabled={!editProgram}
              />
            </div>
            <div className="col">
              <input
                type="text"
                className="form-control"
                placeholder="ชื่อย่อ (ไทย)"
                name="program_shortname_th"
                value={editFormData.program_shortname_th}
                onChange={handleEditFormChange}
                disabled={!editProgram}
              />
            </div>

            <div className="row mb-2">
              <div className="col">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Year (e.g., 2023)"
                  name="year"
                  value={editFormData.year}
                  onChange={handleEditFormChange}
                  disabled={!editProgram}
                />
              </div>
              <div className="col d-flex justify-content-end">
                <button
                  className="btn btn-primary"
                  onClick={handleEditProgram}
                  disabled={!editProgram}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Program list with all fields */}
      <h5>Program</h5>
      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>Program Name</th>
            <th>ชื่อหลักสูตร (ไทย)</th>
            <th>Short Name</th>
            <th>ชื่อย่อ (ไทย)</th>
            <th>Year</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProgram.map((p) => (
            <tr key={p.program_id}>
              <td>{p.program_name}</td>
              <td>{p.program_name_th || "-"}</td>
              <td>{p.program_shortname_en || "-"}</td>
              <td>{p.program_shortname_th || "-"}</td>
              <td>{p.year || "-"}</td>
              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteProgram(p.program_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
