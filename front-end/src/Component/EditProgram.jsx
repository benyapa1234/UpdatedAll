//อ้อแก้ทั้งไฟล์
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Program() {
  const [program, setProgram] = useState([]);
  const [filteredProgram, setFilteredProgram] = useState([]);
  const [newProgram, setNewProgram] = useState({
    program_name: "",
    program_name_th: "",
    program_shortname_en: "",
    program_shortname_th: ""
  });
  const [editProgram, setEditProgram] = useState(null);
  const [editFormData, setEditFormData] = useState({
    program_name: "",
    program_name_th: "",
    program_shortname_en: "",
    program_shortname_th: "",
    year: ""
  });
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [majors, setMajors] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState("all");
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  // Fetch program, universities, and majors when the component loads
  useEffect(() => {
    axios
      .get("http://localhost:8000/university")
      .then((response) => setUniversities(response.data))
      .catch((error) => {
        console.error("Error fetching universities:", error);
        showAlert("ไม่สามารถโหลดรายชื่อมหาวิทยาลัยได้", "danger");
      });
  }, []);

  // Fetch majors when university is selected
  useEffect(() => {
    if (!selectedUniversity || selectedUniversity === "all") {
      setMajors([]);
      setSelectedMajor("all");
      return;
    }

    axios
      .get(`http://localhost:8000/major?university_id=${selectedUniversity}`)
      .then((response) => {
        const majorData = Array.isArray(response.data) ? response.data : [response.data];
        setMajors(majorData);
        
        // Reset major selection if current major is not in new list
        if (majorData.length > 0 && !majorData.some(m => m.major_id.toString() === selectedMajor)) {
          setSelectedMajor("all");
        }
      })
      .catch((error) => {
        console.error("Error fetching majors:", error);
        showAlert("ไม่สามารถโหลดสาขาวิชาได้", "danger");
        setMajors([]);
        setSelectedMajor("all");
      });
  }, [selectedUniversity]);

  // Fetch programs when major is selected
  useEffect(() => {
    // Reset state when no major is selected
    if (!selectedMajor || selectedMajor === "all") {
      setProgram([]);
      setFilteredProgram([]);
      setYears([]);
      setSelectedYear("all");
      return;
    }

    // Fetch programs for the selected major
    axios
      .get(`http://localhost:8000/program?major_id=${selectedMajor}`)
      .then((response) => {
        const programData = Array.isArray(response.data) ? response.data : [response.data];
        
        // Extract unique years
        const uniqueYears = [...new Set(programData.map((p) => p.year).filter(year => year != null))];
        
        setProgram(programData);
        setFilteredProgram(programData);
        setYears(uniqueYears.sort((a, b) => a - b));
        
        // Set default year if possible
        if (uniqueYears.length > 0) {
          setSelectedYear(uniqueYears[0].toString());
        }
      })
      .catch((error) => {
        console.error("Error fetching programs:", error);
        showAlert("ไม่สามารถโหลดหลักสูตรได้", "danger");
        setProgram([]);
        setFilteredProgram([]);
        setYears([]);
        setSelectedYear("all");
      });
  }, [selectedMajor]);

  // Filter programs based on year
  useEffect(() => {
    let filteredData = program;

    // Filter by year
    if (selectedYear !== "all") {
      filteredData = filteredData.filter(p => 
        p.year === parseInt(selectedYear)
      );
    }

    setFilteredProgram(filteredData);
  }, [program, selectedYear]);
  

  // Filter programs when filters change
  // useEffect(() => {
  //   let filtered = program;

  //   // Filter by university if selected
  //   if (selectedUniversity !== "all") {
  //     // We need to fetch university-program relationships from the endpoint
  //     axios
  //       .get("http://localhost:8000/university_program_major")
  //       .then((response) => {
  //         const universityPrograms = response.data
  //           .filter(up => up.university_id === parseInt(selectedUniversity))
  //           .map(up => up.program_id);
          
  //         filtered = filtered.filter(p => universityPrograms.includes(p.program_id));
  //         applyAdditionalFilters(filtered);
  //       })
  //       .catch((error) => console.error("Error fetching university programs:", error));
  //   } else {
  //     applyAdditionalFilters(filtered);
  //   }
    
  //   function applyAdditionalFilters(data) {
  //     // Filter by major if selected
  //     if (selectedMajor !== "all") {
  //       // We need to fetch program-major relationships from the endpoint
  //       axios
  //         .get("http://localhost:8000/university_program_major")
  //         .then((response) => {
  //           const majorPrograms = response.data
  //             .filter(up => up.major_ids && up.major_ids.split(',').includes(selectedMajor))
  //             .map(up => up.program_id);
            
  //           data = data.filter(p => majorPrograms.includes(p.program_id));
  //           applyYearFilter(data);
  //         })
  //         .catch((error) => console.error("Error fetching major programs:", error));
  //     } else {
  //       applyYearFilter(data);
  //     }
  //   }
    
  //   function applyYearFilter(data) {
  //     // Filter by year
  //     if (selectedYear !== "all") {
  //       data = data.filter(p => p.year === parseInt(selectedYear));
  //     }
      
  //     setFilteredProgram(data);
  //   }
  // }, [selectedUniversity, selectedMajor, selectedYear, program]);

  // Auto-hide alert after 3 seconds
  
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
      [name]: value
    });
  };

  // Handle input change for edit program form
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  // Function to add a new program with all fields
  const handleAddProgram = () => {
    if (!newProgram.program_name || newProgram.program_name.trim() === "") {
      showAlert("กรุณากรอกชื่อหลักสูตร", "warning");
      return;
    }
  
    // Check if a major is selected
    if (!selectedMajor || selectedMajor === "all") {
      showAlert("กรุณาเลือกสาขา", "warning");
      return;
    }
  
    const programPayload = {
      program_name: newProgram.program_name,
      program_name_th: newProgram.program_name_th || "",
      program_shortname_en: newProgram.program_shortname_en || "",
      program_shortname_th: newProgram.program_shortname_th || "",
      year: selectedYear !== "all" ? parseInt(selectedYear, 10) : null
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
  
        console.log("🔹 Sending data to /program_major:", {
          program_id: newProgramId,
          major_id: selectedMajor
        });
  
        // Add the program to program_major table
        return axios.post("http://localhost:8000/program_major", {
          program_id: newProgramId,
          major_id: selectedMajor
        }).then(() => newProgramId); // Pass the program_id to the next .then()
      })
      .then((newProgramId) => {
        console.log("✅ Program added to program_major successfully!");
  
        // Create a new program item to add to the filtered list
        const newProgramItem = {
          program_id: newProgramId,
          program_name: newProgram.program_name,
          program_name_th: newProgram.program_name_th || "",
          program_shortname_en: newProgram.program_shortname_en || "",
          program_shortname_th: newProgram.program_shortname_th || "",
          year: selectedYear !== "all" ? parseInt(selectedYear) : null
        };
  
        // Update the filtered program list
        setFilteredProgram([...filteredProgram, newProgramItem]);
        setProgram([...program, newProgramItem]);
  
        // Reset the new program form
        setNewProgram({
          program_name: "",
          program_name_th: "",
          program_shortname_en: "",
          program_shortname_th: ""
        });
  
        showAlert("เพิ่มหลักสูตรเรียบร้อยแล้ว", "success");
      })
      .catch((error) => {
        console.error("❌ Error adding program:", error.response?.data || error);
        
        // Detailed error handling
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const errorMessage = error.response.data.errors 
            ? error.response.data.errors.join(', ') 
            : error.response.data.message || 'เกิดข้อผิดพลาดในการเพิ่มหลักสูตร';
          
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
    if (!editFormData.program_name || 
        !editFormData.program_name_th || 
        !editFormData.year || 
        !editFormData.program_shortname_en || 
        !editFormData.program_shortname_th) {
      showAlert("กรุณากรอกข้อมูลให้ครบทุกช่อง", "warning");
      return;
    }

    axios
      .put(`http://localhost:8000/program/${editProgram.program_id}`, {
        program_name: editFormData.program_name,
        program_name_th: editFormData.program_name_th,
        year: parseInt(editFormData.year),
        program_shortname_en: editFormData.program_shortname_en,
        program_shortname_th: editFormData.program_shortname_th
      })
      .then(() => {
        const updatedProgram = program.map((p) =>
          p.program_id === editProgram.program_id
            ? { 
                ...p, 
                program_name: editFormData.program_name,
                program_name_th: editFormData.program_name_th,
                year: parseInt(editFormData.year),
                program_shortname_en: editFormData.program_shortname_en,
                program_shortname_th: editFormData.program_shortname_th
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
                year: parseInt(editFormData.year),
                program_shortname_en: editFormData.program_shortname_en,
                program_shortname_th: editFormData.program_shortname_th
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
          year: ""
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
        const updatedProgram = program.filter((p) => p.program_id !== program_id);
        setProgram(updatedProgram);
        
        // Also update the filtered list
        const updatedFiltered = filteredProgram.filter((p) => p.program_id !== program_id);
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

  // Handler for major selection change
  const handleMajorChange = (e) => {
    setSelectedMajor(e.target.value);
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
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setAlert({...alert, show: false})}
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
            <option key={university.university_id} value={university.university_id}>
              {university.university_name_en} ({university.university_name_th})
            </option>
          ))}
        </select>
      </div>

      {/* Major selector */}
      <div className="mb-3">
        <label className="form-label text-start">Filter by Major</label>
        <select 
          className="form-select" 
          value={selectedMajor}
          onChange={handleMajorChange}
        >
          <option value="all">All Majors</option>
          {majors.map((major) => (
            <option key={major.major_id} value={major.major_id}>
              {major.major_name_en} ({major.major_name_th})
            </option>
          ))}
        </select>
      </div>

      {/* Year selector */}
      <div className="mb-3">
        <label className="form-label text-start">Filter by Year</label>
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
          <div className="d-flex align-items-center">
            <div className="me-2">
              <span className="form-text">Year: {selectedYear !== "all" ? selectedYear : "Not specified"}</span>
            </div>
            <button
              className="btn btn-primary ms-auto"
              onClick={handleAddProgram}
              disabled={newProgram.program_name.trim() === ""}
            >
              Insert
            </button>
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
              const selectedProgram = program.find((p) => p.program_id === selectedId);
              setEditProgram(selectedProgram);
              if (selectedProgram) {
                setEditFormData({
                  program_name: selectedProgram.program_name || "",
                  program_name_th: selectedProgram.program_name_th || "",
                  program_shortname_en: selectedProgram.program_shortname_en || "",
                  program_shortname_th: selectedProgram.program_shortname_th || "",
                  year: selectedProgram.year ? selectedProgram.year.toString() : ""
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
          </div>
          <div className="row mb-2">
            <div className="col">
              <select
                className="form-select"
                name="year"
                value={editFormData.year}
                onChange={handleEditFormChange}
                disabled={!editProgram}
              >
                <option value="" disabled>Select Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
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