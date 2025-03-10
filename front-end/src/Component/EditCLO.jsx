//อ้อแก้ทั้งไฟล์
import React, { useState, useEffect } from "react";
import { FaBars } from "react-icons/fa";
import * as XLSX from "xlsx";

export default function CurriculumManagement() {
  const [programs, setPrograms] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [facultys, setFacultys] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [plos, setPlos] = useState([]);
  const [CLOs, setCLOs] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [programCourseData, setProgramCourseData] = useState({
    courses: [],
    sections: [],
    semesters: [],
    years: [],
  });
  const [editClo, setEditClo] = useState(null); // Store the CLO being edited
  const [showEditModal, setShowEditModal] = useState(false); // Control modal visibility
  const [editCloName, setEditCloName] = useState("");
  const [editCloEngName, setEditCloEngName] = useState("");
  const [editCloCode, setEditCloCode] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [excelData, setExcelData] = useState(null);
  const [typeError, setTypeError] = useState(null);
  const [editingScores, setEditingScores] = useState(false);
  const [scores, setScores] = useState({});
  const [weights, setWeights] = useState({});
  const [previousYearCLOs, setPreviousYearCLOs] = useState([]);
  const [showPreviousYearCLOsModal, setShowPreviousYearCLOsModal] =
    useState(false);
  const [allPLOs, setAllPLOs] = useState([]);

  useEffect(() => {
    // ดึงข้อมูลมหาวิทยาลัย
    fetch("http://localhost:8000/university")
      .then((response) => response.json())
      .then((data) => setUniversities(data))
      .catch((error) => console.error("Error fetching universities:", error));
  }, []);

  useEffect(() => {
    if (!selectedUniversity) return;

    fetch(`http://localhost:8000/faculty?university_id=${selectedUniversity}`)
      .then(async (response) => {
        if (!response.ok) {
          console.error(`HTTP Error: ${response.status}`);
          return response.text().then((text) => {
            throw new Error(text || `HTTP ${response.status}`);
          });
        }
        const text = await response.text();
        return text ? JSON.parse(text) : [];
      })
      .then((data) => {
        const formattedData = Array.isArray(data) ? data : [data];

        console.log("Formatted Facultys:", formattedData);
        setFacultys(formattedData);
      })
      .catch((error) => {
        console.error(" Error fetching facultys:", error);
        setFacultys([]);
      });
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedFaculty) {
      // ดึงข้อมูลโปรแกรมตามสาขาที่เลือก
      fetch(`http://localhost:8000/program?faculty_id=${selectedFaculty}`)
        .then((response) => response.json())
        .then((data) => setPrograms(data))
        .catch((error) => console.error("Error fetching programs:", error));
    }
  }, [selectedFaculty]);


  useEffect(() => {
    if (selectedProgram) {
      // Convert selectedProgram to a string to ensure type consistency
      const programId = String(selectedProgram);

      console.log("Fetching courses for Program ID:", programId);

      fetch(
        `http://localhost:8000/program_courses_detail?program_id=${programId}`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Raw Courses Data for Program:", data);

          if (data && data.length > 0) {
            // Filter unique courses
            const uniqueCourses = data.reduce((acc, course) => {
              const existingCourse = acc.find(
                (c) => c.course_id === course.course_id
              );

              if (!existingCourse) {
                acc.push({
                  course_id: course.course_id,
                  course_name: course.course_name,
                  course_engname: course.course_engname,
                  program_name: course.program_name,
                });
              }

              return acc;
            }, []);

            // Extract unique sections
            const uniqueSections = [
              ...new Set(data.map((item) => item.section_id)),
            ];

            // Extract unique semesters
            const uniqueSemesters = [
              ...new Set(data.map((item) => item.semester_id)),
            ];

            // Extract unique years
            const uniqueYears = [...new Set(data.map((item) => item.year))];

            console.log("Unique Courses:", uniqueCourses);
            console.log("Unique Sections:", uniqueSections);
            console.log("Unique Semesters:", uniqueSemesters);
            console.log("Unique Years:", uniqueYears);

            setProgramCourseData((prevData) => ({
              ...prevData,
              courses: uniqueCourses,
              sections: uniqueSections,
              semesters: uniqueSemesters,
              years: uniqueYears,
            }));
          } else {
            console.warn("No courses found for this program");
            setProgramCourseData((prevData) => ({
              ...prevData,
              courses: [],
              sections: [],
              semesters: [],
              years: [],
            }));
          }
        })
        .catch((error) => {
          console.error("Error fetching program courses:", error);
          setProgramCourseData((prevData) => ({
            ...prevData,
            courses: [],
            sections: [],
            semesters: [],
            years: [],
          }));
        });
    }
  }, [selectedProgram]);

  useEffect(() => {
    if (
      selectedCourseId &&
      selectedSectionId &&
      selectedSemesterId &&
      selectedYear &&
      selectedProgram
    ) {
      // Find the program data first
      const selectedProgramData = programs.find(
        (program) =>
          program.program_id.toString() === selectedProgram.toString()
      );

      if (!selectedProgramData) {
        console.error("Program not found:", selectedProgram);
        setCLOs([]);
        setMappings([]);
        setPlos([]);
        return;
      }

      const programId = selectedProgramData.program_id;

      fetch(
        `http://localhost:8000/course_clo?program_id=${programId}&course_id=${selectedCourseId}&semester_id=${selectedSemesterId}&section_id=${selectedSectionId}&year=${selectedYear}`
      )
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch CLOs");
          return response.json();
        })
        .then((cloData) => {
          console.log("CLO Data received:", cloData);
          const formattedCLOs = Array.isArray(cloData) ? cloData : [cloData];
          setCLOs(formattedCLOs);
        });
    }
  }, [
    selectedCourseId,
    selectedSectionId,
    selectedSemesterId,
    selectedYear,
    selectedProgram,
    programs,
  ]);

  useEffect(() => {
    if (allPLOs.length > 0) {
      console.log("PLO Data Structure Check:");
      allPLOs.forEach((plo, index) => {
        console.log(`PLO #${index}:`, {
          PLO_id: plo.PLO_id,
          plo_id: plo.plo_id, // บางที API อาจจะใช้ชื่อฟิลด์นี้แทน
          PLO_code: plo.PLO_code
        });
      });
    }
  }, [allPLOs]);

  useEffect(() => {
    if (
      selectedCourseId &&
      selectedSectionId &&
      selectedSemesterId &&
      selectedYear &&
      selectedProgram
    ) {
      // Find the program data first
      const selectedProgramData = programs.find(
        (program) =>
          program.program_id.toString() === selectedProgram.toString()
      );

      if (!selectedProgramData) {
        console.error("Program not found:", selectedProgram);
        setMappings([]);
        return;
      }

      const programId = selectedProgramData.program_id;

      // Ensure CLO IDs exist before fetching mappings
      if (CLOs.length === 0) {
        console.warn("No CLOs available to fetch mappings");
        return;
      }

      const cloIds = CLOs.map((clo) => clo.CLO_id).join(",");

      fetch(
        `http://localhost:8000/plo_clo?course_id=${selectedCourseId}&section_id=${selectedSectionId}&semester_id=${selectedSemesterId}&year=${selectedYear}&program_id=${programId}&clo_ids=${cloIds}`
      )
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch PLO-CLO mappings");
          return response.json();
        })
        .then((mappingData) => {
          console.log("Raw Mapping Data:", mappingData);

          // Ensure mappingData is always an array
          const formattedMappings = Array.isArray(mappingData)
            ? mappingData
            : [mappingData];

          setMappings(formattedMappings);

          // Extract unique PLO IDs
          const extractedPlos = [
            ...new Set(formattedMappings.map((item) => item.PLO_id)),
          ];
          setPlos(extractedPlos);
        })
        .catch((error) => {
          console.error("Error fetching PLO-CLO mappings:", error);
          setMappings([]);
          setPlos([]);
        });
    }
  }, [
    selectedCourseId,
    selectedSectionId,
    selectedSemesterId,
    selectedYear,
    selectedProgram,
    CLOs,
    programs,
  ]);

  // เพิ่มฟังก์ชันดึงข้อมูล PLO
  const fetchPLOsForProgram = async () => {
    // ...
    try {
      const response = await fetch(`http://localhost:8000/program_plo?program_id=${selectedProgram}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Raw PLO data:", data);
      
      // ปรับแต่งข้อมูลให้มีฟิลด์ PLO_id
      let formattedPLOs = [];
      if (data.success && Array.isArray(data.message)) {
        formattedPLOs = data.message.map(plo => ({
          ...plo,
          PLO_id: plo.PLO_id || plo.plo_id // ใช้ plo_id หากไม่มี PLO_id
        }));
      } else if (Array.isArray(data)) {
        formattedPLOs = data.map(plo => ({
          ...plo,
          PLO_id: plo.PLO_id || plo.plo_id
        }));
      } else if (data) {
        formattedPLOs = [{
          ...data,
          PLO_id: data.PLO_id || data.plo_id
        }];
      }
      
      console.log("Formatted PLOs:", formattedPLOs);
      setAllPLOs(formattedPLOs);
    } catch (error) {
      // ...
    }
  };

useEffect(() => {
  if (
    selectedProgram &&
    selectedCourseId &&
    selectedSectionId &&
    selectedSemesterId &&
    selectedYear
  ) {
    fetchPLOsForProgram();
  } else {
    setAllPLOs([]);
  }
}, [
  selectedProgram,
  selectedCourseId,
  selectedSectionId,
  selectedSemesterId,
  selectedYear
]);

  useEffect(() => {
    const updatedWeights = {};

    mappings.forEach((mapping) => {
      const key = `${mapping.PLO_id}-${mapping.CLO_id}`;
      updatedWeights[key] = mapping.weight ?? "-"; // ใช้ weight ถ้ามีค่า ถ้าไม่มีให้ใช้ "-"
    });

    console.log("Updated Weights:", updatedWeights); // ✅ ตรวจสอบค่า weights ที่ set
    setWeights(updatedWeights);
  }, [mappings, CLOs]);

  useEffect(() => {
    const groupedMappings = mappings.reduce((acc, mapping) => {
      const key = `${mapping.PLO_id}-${mapping.CLO_id}`;

      if (!acc[key]) {
        acc[key] = { ...mapping, total: mapping.weight };
      } else {
        acc[key].total += mapping.weight;
      }

      return acc;
    }, {});

    setWeights(Object.values(groupedMappings));
  }, [mappings]);

  // const handleSelectProgram = (programName) => {
  //   setSelectedProgram(programName);
  // };

  const handleEditClo = (cloId) => {
    const cloToEdit = CLOs.find((clo) => clo.CLO_id === cloId);
    if (cloToEdit) {
      setEditClo(cloToEdit); // Set the CLO to edit
      setEditCloName(cloToEdit.CLO_name || ""); // Initialize CLO name
      setEditCloEngName(cloToEdit.CLO_engname || ""); // Initialize CLO English name
      setEditCloCode(cloToEdit.CLO_code || "");
      setShowEditModal(true); // Show the modal
    }
  };

  const handleSaveClo = async () => {
    if (!editClo) return;
  
    // หา program_id จากโปรแกรมที่เลือก
    const selectedProgramData = programs.find(
      (program) => program.program_id.toString() === selectedProgram.toString()
    );
  
    if (!selectedProgramData) {
      console.error("Program not found:", selectedProgram);
      alert("Please select a valid program.");
      return;
    }
  
    // Validation checks
    if (!editCloCode) {
      alert("CLO Code cannot be empty.");
      return;
    }
  
    if (!editCloName) {
      alert("CLO Name cannot be empty.");
      return;
    }
  
    if (!editCloEngName) {
      alert("CLO English Name cannot be empty.");
      return;
    }
  
    const updatedCLO = {
      clo_id: editClo.CLO_id,
      program_id: selectedProgramData.program_id,
      course_id: selectedCourseId,
      semester_id: selectedSemesterId,
      section_id: selectedSectionId,
      year: selectedYear,
      CLO_name: editCloName.trim(),
      CLO_engname: editCloEngName.trim(),
      CLO_code: editCloCode.trim(), // เพิ่ม CLO_code ในการอัปเดต
    };
  
    try {
      const response = await fetch("http://localhost:8000/course_clo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCLO),
      });
  
      if (response.ok) {
        // Update the CLOs in the state with all fields
        const updatedCLOs = CLOs.map((clo) =>
          clo.CLO_id === editClo.CLO_id
            ? {
                ...clo,
                CLO_name: editCloName.trim(),
                CLO_engname: editCloEngName.trim(),
                CLO_code: editCloCode.trim(), // เพิ่ม CLO_code ในการอัปเดตที่แสดงในตาราง
              }
            : clo
        );
  
        setCLOs(updatedCLOs);
  
        // Close the modal
        setShowEditModal(false);
  
        // Optional: Show success message
        alert("CLO updated successfully!");
      } else {
        // Handle error response from server
        const errorData = await response.json();
        console.error("Failed to update CLO:", errorData);
        alert(`Failed to update CLO: ${errorData.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error updating CLO:", err);
      alert("An error occurred while updating the CLO.");
    }
  };

  const handleDeleteClo = async (
    cloId,
    courseId,
    semesterId,
    sectionId,
    year,
    programIdentifier
  ) => {
    if (
      !cloId ||
      !courseId ||
      !semesterId ||
      !sectionId ||
      !year ||
      !programIdentifier
    ) {
      console.error("Missing required fields");
      alert("Missing required fields. Please check your data.");
      return;
    }
  
    // หา program_id
    let programId;
    if (typeof programIdentifier === "string" && isNaN(programIdentifier)) {
      const selectedProgramData = programs.find(
        (program) => program.program_name === programIdentifier
      );
  
      if (!selectedProgramData) {
        console.error("Program not found:", programIdentifier);
        alert("Program not found.");
        return;
      }
  
      programId = selectedProgramData.program_id;
    } else {
      programId = parseInt(programIdentifier);
    }
  
    if (window.confirm("Are you sure you want to delete this CLO?")) {
      try {
        const response = await fetch("http://localhost:8000/course_clo", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clo_id: cloId,
            course_id: courseId,
            semester_id: semesterId,
            section_id: sectionId,
            year: year,
            program_id: programId,
          }),
        });
  
        if (response.ok) {
          // อัปเดต CLOs state
          setCLOs((prevCLOs) => prevCLOs.filter((clo) => clo.CLO_id !== cloId));
          
          // อัปเดต mappings state โดยลบการแมปทั้งหมดที่เกี่ยวข้องกับ CLO ที่ถูกลบ
          setMappings((prevMappings) => 
            prevMappings.filter((mapping) => mapping.CLO_id !== cloId)
          );
          
          // เคลียร์ค่า scores ถ้ากำลังแก้ไขอยู่
          if (editingScores) {
            const updatedScores = { ...scores };
            Object.keys(updatedScores).forEach(key => {
              const [ploId, mappingCloId] = key.split('-');
              if (parseInt(mappingCloId) === cloId) {
                delete updatedScores[key];
              }
            });
            setScores(updatedScores);
          }
          
          // รีเฟรชข้อมูล mappings จาก API เพื่อให้แน่ใจว่าข้อมูลถูกต้อง
          try {
            // รอเวลาเล็กน้อยเพื่อให้การลบในฐานข้อมูลเสร็จสมบูรณ์
            setTimeout(async () => {
              await fetchUpdatedMappings();
            }, 500);
          } catch (refreshError) {
            console.error("Error refreshing mappings:", refreshError);
          }
  
          alert("CLO deleted successfully!");
        } else {
          const error = await response.json();
          console.error("Failed to delete CLO:", error.message);
          alert(`Failed to delete CLO: ${error.message}`);
        }
      } catch (error) {
        console.error("Error while deleting CLO:", error);
        alert("An error occurred while deleting the CLO.");
      }
    }
  };

  const handleAddClo = async () => {
    // Find the selected program data
    const selectedProgramData = programs.find(
      (program) => program.program_id.toString() === selectedProgram.toString()
    );

    // Comprehensive validation
    if (!selectedProgramData) {
      alert("Please select a valid program.");
      return;
    }

    if (!selectedCourseId) {
      alert("Please select a course.");
      return;
    }

    if (!selectedSemesterId) {
      alert("Please select a semester.");
      return;
    }

    if (!selectedSectionId) {
      alert("Please select a section.");
      return;
    }

    if (!selectedYear) {
      alert("Please select a year.");
      return;
    }

    if (!editCloCode) {
      alert("Please enter a CLO code.");
      return;
    }

    if (!editCloName) {
      alert("Please enter a CLO name.");
      return;
    }

    if (!editCloEngName) {
      alert("Please enter a CLO English name.");
      return;
    }

    // Prepare the data for submission
    const newClo = {
      program_id: parseInt(selectedProgramData.program_id),
      course_id: parseInt(selectedCourseId),
      semester_id: parseInt(selectedSemesterId),
      section_id: parseInt(selectedSectionId),
      year: parseInt(selectedYear),
      CLO_code: editCloCode.trim(),
      CLO_name: editCloName.trim(),
      CLO_engname: editCloEngName.trim(),
    };

    try {
      const response = await fetch("http://localhost:8000/program_course_clo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClo),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Create a new CLO object to add to the existing CLOs
        const addedClo = {
          CLO_id: responseData.clo_id, // Assuming the server returns the new CLO's ID
          CLO_code: newClo.CLO_code,
          CLO_name: newClo.CLO_name,
          CLO_engname: newClo.CLO_engname,
        };

        // Update the CLOs state by adding the new CLO
        setCLOs((prevCLOs) => [...prevCLOs, addedClo]);

        // Reset form fields
        setEditCloCode("");
        setEditCloName("");
        setEditCloEngName("");

        // Close the modal
        setShowAddModal(false);

        alert("CLO added successfully!");
      } else {
        // Handle error response from server
        alert(responseData.message || "Failed to add CLO");
      }
    } catch (error) {
      console.error("Error adding CLO:", error);
      alert("An error occurred while adding the CLO");
    }
  };

  const handleFileUpload = async (e) => {
    let fileTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    let selectedFile = e.target.files[0];

    if (selectedFile) {
      if (fileTypes.includes(selectedFile.type)) {
        setTypeError(null);
        let reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const data = event.target.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            // Find the selected program
            const programData = programs.find(
              (program) => program.program_id.toString() === selectedProgram.toString()
            );

            if (!programData) {
              console.error("Selected program not found:", selectedProgram);
              alert("Error: Selected program not found. Please select a valid program.");
              return;
            }

            // Ensure all required fields are present
            const updatedData = jsonData.map((row) => ({
              program_id: parseInt(programData.program_id),
              course_id: parseInt(selectedCourseId),
              semester_id: parseInt(selectedSemesterId),
              section_id: parseInt(selectedSectionId),
              year: parseInt(selectedYear),
              CLO_code: row.CLO_code || "",
              CLO_name: row.CLO_name || "",
              CLO_engname: row.CLO_engname || ""
            }));

            // Validate that all required fields are present in each row
            const invalidRows = updatedData.filter(row => 
              !row.program_id || !row.course_id || !row.semester_id || 
              !row.section_id || !row.year || !row.CLO_code || 
              !row.CLO_name || !row.CLO_engname
            );

            if (invalidRows.length > 0) {
              console.error("Invalid rows found:", invalidRows);
              alert(`Error: ${invalidRows.length} rows are missing required fields. Please check your Excel data.`);
              return;
            }

            setExcelData(updatedData); // อัปเดตข้อมูลใน State
            console.log("Uploaded File Data:", updatedData);
          } catch (error) {
            console.error("Error reading file:", error);
            alert("Error processing file: " + error.message);
          }
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
          alert("Error reading file: " + error.message);
        };
        reader.readAsBinaryString(selectedFile);
      } else {
        setTypeError("Please select only Excel file types");
        alert("Please select only Excel file types");
      }
    } else {
      console.log("Please select your file");
    }
};

const handlePasteButtonClick = async () => {
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      alert("Clipboard API is not supported in this browser.");
      return;
    }

    // Validate all selections are made
    if (!selectedProgram || !selectedCourseId || !selectedSectionId || 
        !selectedSemesterId || !selectedYear) {
      alert("Please select Program, Course, Section, Semester, and Year before pasting data.");
      return;
    }

    // Find the selected program
    const programData = programs.find(
      (program) => program.program_id.toString() === selectedProgram.toString()
    );

    if (!programData) {
      alert("Error: Selected program not found. Please select a valid program.");
      return;
    }

    // อ่านข้อมูลจาก Clipboard
    const text = await navigator.clipboard.readText();

    if (!text) {
      alert("No text found in clipboard!");
      return;
    }

    console.log("Raw Clipboard Data:", text);

    // ใช้ XLSX เพื่อแปลงข้อมูลที่วางเป็น JSON
    const workbook = XLSX.read(text, { type: "string" }); // แปลงข้อมูลใน clipboard เป็น workbook
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    console.log("Parsed Data:", jsonData);

    // เพิ่มข้อมูลที่เกี่ยวข้องจาก UI
    const updatedData = jsonData.map((row) => ({
      program_id: parseInt(programData.program_id),
      course_id: parseInt(selectedCourseId),
      semester_id: parseInt(selectedSemesterId),
      section_id: parseInt(selectedSectionId),
      year: parseInt(selectedYear),
      CLO_code: row.CLO_code || "",
      CLO_name: row.CLO_name || "",
      CLO_engname: row.CLO_engname || ""
    }));

    // Validate that all required fields are present in each row
    const invalidRows = updatedData.filter(row => 
      !row.program_id || !row.course_id || !row.semester_id || 
      !row.section_id || !row.year || !row.CLO_code || 
      !row.CLO_name || !row.CLO_engname
    );

    if (invalidRows.length > 0) {
      console.error("Invalid rows found:", invalidRows);
      alert(`Error: ${invalidRows.length} rows are missing required fields. Please check your Excel data.`);
      return;
    }

    setExcelData(updatedData); // อัปเดตข้อมูลใน State
    console.log("Pasted Data:", updatedData);
  } catch (err) {
    console.error("Failed to paste data:", err);
    alert("Failed to paste data. Make sure you copied valid Excel data: " + err.message);
  }
};

const handleUploadButtonClick = () => {
  if (!excelData || excelData.length === 0) {
    console.error("No data to upload");
    alert("No data to upload. Please paste or upload data first.");
    return;
  }

  // Additional validation before sending to server
  if (!selectedProgram || !selectedCourseId || !selectedSectionId || 
      !selectedSemesterId || !selectedYear) {
    alert("Please select Program, Course, Section, Semester, and Year before uploading.");
    return;
  }

  // Check each row for required fields
  const missingFields = excelData.some(row => 
    !row.program_id || !row.course_id || !row.semester_id || 
    !row.section_id || !row.year || !row.CLO_code || 
    !row.CLO_name || !row.CLO_engname
  );

  if (missingFields) {
    alert("Some rows are missing required fields. Please check your data.");
    return;
  }

  fetch("http://localhost:8000/program_course_clo/excel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(excelData),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData) => {
          throw new Error(errorData.message || "Unknown error occurred");
        });
      }
      return response.json();
    })
    .then((data) => {
      console.log("Success:", data);
      alert("Data Uploaded Successfully!");
      setExcelData(null); // ล้างข้อมูลหลังจากอัปโหลดสำเร็จ
      
      // Refresh CLOs after successful upload
      if (selectedCourseId && selectedSectionId && selectedSemesterId && selectedYear && selectedProgram) {
        fetch(
          `http://localhost:8000/course_clo?program_id=${selectedProgram}&course_id=${selectedCourseId}&semester_id=${selectedSemesterId}&section_id=${selectedSectionId}&year=${selectedYear}`
        )
          .then((response) => response.json())
          .then((cloData) => {
            console.log("CLO Data refreshed:", cloData);
            const formattedCLOs = Array.isArray(cloData) ? cloData : [cloData];
            setCLOs(formattedCLOs);
          })
          .catch(error => console.error("Error refreshing CLOs:", error));
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred: " + error.message);
    });
};

  const handleInputChange = (ploId, cloId, value) => {
    if (editingScores) {
      const updatedScores = { ...scores };
      updatedScores[`${ploId}-${cloId}`] = value ? parseInt(value) : 0;
      setScores(updatedScores);
    }
  };

  const calculateTotal = (ploId) => {
    // ใช้เฉพาะ CLO_id ที่มีอยู่ใน CLOs ปัจจุบันเท่านั้น
    const activeCloIds = CLOs.map(clo => clo.CLO_id);
    
    return mappings
      .filter(m => m.PLO_id === ploId && activeCloIds.includes(m.CLO_id))
      .reduce((sum, mapping) => {
        if (editingScores) {
          const key = `${ploId}-${mapping.CLO_id}`;
          return sum + (Number(scores[key]) || 0);
        } else {
          return sum + (Number(mapping.weight) || 0);
        }
      }, 0);
  };

  const calculateTotalForPLO = (ploId) => {
    if (!ploId) return 0;
    
    let total = 0;
    CLOs.forEach(clo => {
      const mapping = mappings.find(
        m => (m.PLO_id === ploId || m.plo_id === ploId) && m.CLO_id === clo.CLO_id
      );
      
      if (editingScores) {
        const key = `${ploId}-${clo.CLO_id}`;
        total += Number(scores[key] || 0);
      } else if (mapping) {
        total += Number(mapping.weight || 0);
      }
    });
    
    return total || 0;
  };

  const handleEditToggle = () => {
    setEditingScores(!editingScores);
  };

  // Improved handlePatchScores function
  const handlePatchScores = async () => {
    // Find program_id from selectedProgram
    const selectedProgramData = programs.find(
      (program) => program.program_id.toString() === selectedProgram.toString()
    );

    // Validate program selection
    if (!selectedProgramData) {
      alert("Error: Please select a valid program.");
      return;
    }

    // Validate all required selection fields
    if (
      !selectedCourseId ||
      !selectedSectionId ||
      !selectedSemesterId ||
      !selectedYear
    ) {
      alert(
        "Please complete all selection fields: Course, Section, Semester, and Year."
      );
      return;
    }

    // Validate that scores exist
    if (Object.keys(scores).length === 0) {
      alert("No mapping scores to update. Please add scores first.");
      return;
    }

    // 🔑 Prepare updated scores array DIRECTLY HERE
    const updatedScores = Object.entries(scores).map(([key, value]) => {
      const [PLO_id, CLO_id] = key.split("-");
      return {
        program_id: parseInt(selectedProgramData.program_id),
        course_id: parseInt(selectedCourseId),
        section_id: parseInt(selectedSectionId),
        semester_id: parseInt(selectedSemesterId),
        year: parseInt(selectedYear),
        PLO_id: parseInt(PLO_id),
        CLO_id: parseInt(CLO_id),
        weight: value !== undefined ? parseFloat(value) : null,
      };
    });

    try {
      // Send PATCH requests for each mapping
      const patchResponses = await Promise.all(
        updatedScores.map(async (scoreData) => {
          const response = await fetch("http://localhost:8000/plo_clo", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(scoreData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update mapping");
          }

          return response.json();
        })
      );

      // Update mappings state immediately
      const updatedMappings = mappings.map((mapping) => {
        const matchingScore = updatedScores.find(
          (score) =>
            score.PLO_id === mapping.PLO_id && score.CLO_id === mapping.CLO_id
        );

        return matchingScore
          ? { ...mapping, weight: matchingScore.weight }
          : mapping;
      });

      console.log("Patch Responses:", patchResponses);
      console.log("Updated Mappings:", updatedMappings);

      // Update mappings in state
      setMappings(updatedMappings);

      // Reset editing states
      setScores({});
      setEditingScores(false);

      alert("PLO-CLO mappings updated successfully!");
    } catch (error) {
      console.error("Error updating mapping scores:", error);
      alert(`Error updating mapping scores: ${error.message}`);
    }
  };

  // Improved handlePostScores function
  const handlePostScores = async () => {
    // Ensure CLOs is always an array
    const validClos = Array.isArray(CLOs) ? CLOs : CLOs.CLO_id ? [CLOs] : [];
  
    // Find program data with more robust selection
    const selectedProgramData = programs.find(
      (program) =>
        program.program_id.toString() === selectedProgram.toString() ||
        program.program_name === selectedProgram
    );
  
    // Validate program selection with detailed logging
    if (!selectedProgramData) {
      console.error("No matching program found for:", selectedProgram);
      console.log(
        "Available programs:",
        programs.map((p) => ({
          id: p.program_id,
          name: p.program_name,
        }))
      );
      alert("Please select a valid program.");
      return;
    }
  
    // Comprehensive field validation
    const requiredFields = [
      { name: "Program", value: selectedProgramData.program_id },
      { name: "Course", value: selectedCourseId },
      { name: "Section", value: selectedSectionId },
      { name: "Semester", value: selectedSemesterId },
      { name: "Year", value: selectedYear },
    ];
  
    const missingFields = requiredFields.filter((field) => !field.value);
    if (missingFields.length > 0) {
      const missingFieldNames = missingFields.map((f) => f.name).join(", ");
      console.error(`Missing required fields: ${missingFieldNames}`);
      alert(`Please complete these fields: ${missingFieldNames}`);
      return;
    }
  
    // Validate scores with detailed logging
    if (Object.keys(scores).length === 0) {
      console.warn("No scores to submit");
      alert("No scores to submit. Please add some scores first.");
      return;
    }
  
    // Debug logging
    console.group("POST Scores Debug");
    console.log("CLOs:", CLOs);
    console.log("Parsed validClos:", validClos);
    console.log("Scores:", scores);
    console.log("Mappings:", mappings);
    console.log("All PLOs:", allPLOs);  // Add this to debug available PLOs
    console.groupEnd();
  
    // Create a mutable array for scores
    const scoresArray = [];
    let validationErrors = [];
  
    // Get all available PLO IDs from allPLOs for validation
    const availablePloIds = allPLOs.map(plo => plo.PLO_id || plo.plo_id);
    console.log("Available PLO IDs for validation:", availablePloIds);
  
    for (const key in scores) {
      const [ploId, cloId] = key.split("-");
      const parsedPloId = parseInt(ploId);
      const parsedCloId = parseInt(cloId);
      const scoreValue = parseFloat(scores[key]);
  
      // Validate PLO - check against the allPLOs array instead of plos
      const isPloValid = availablePloIds.includes(parsedPloId);
  
      if (!isPloValid) {
        validationErrors.push(`Invalid PLO ID: ${parsedPloId}`);
        console.warn(`Invalid PLO ID: ${parsedPloId}`);
        console.log("Available PLO IDs:", availablePloIds);
      }
  
      // Validate CLO
      const isCloValid = validClos.some(
        (clo) => clo.CLO_id == parsedCloId || clo.CLO_id === parsedCloId
      );
  
      if (!isCloValid) {
        validationErrors.push(`Invalid CLO ID: ${parsedCloId}`);
        console.warn(`Invalid CLO ID: ${parsedCloId}`);
        console.log("Available CLOs:", validClos);
      }
  
      // Score value validation
      if (isNaN(scoreValue)) {
        validationErrors.push(`Invalid score for ${key}: ${scores[key]}`);
      }
  
      // Only add valid entries to scoresArray
      if (isPloValid && isCloValid && !isNaN(scoreValue)) {
        scoresArray.push({
          plo_id: parsedPloId,
          clo_id: parsedCloId,
          weight: scoreValue || 0,
        });
      }
    }
  
    // Halt if validation errors exist
    if (validationErrors.length > 0) {
      console.error("Validation Errors:", validationErrors);
      alert(`Validation errors:\n${validationErrors.join("\n")}`);
      return;
    }
  
    // Prepare request body with type conversions
    const requestBody = {
      program_id: parseInt(selectedProgramData.program_id),
      course_id: parseInt(selectedCourseId),
      section_id: parseInt(selectedSectionId),
      semester_id: parseInt(selectedSemesterId),
      year: parseInt(selectedYear),
      scores: scoresArray,
    };
  
    console.group("Request Body");
    console.log(JSON.stringify(requestBody, null, 2));
    console.groupEnd();
  
    try {
      const response = await fetch("http://localhost:8000/plo_clo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
  
      // Detailed error handling
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error Response Status:", response.status);
        console.error("Error Response Body:", errorText);
  
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
  
      const responseData = await response.json();
      console.log("Success Response:", responseData);
  
      await fetchUpdatedMappings();
  
      alert("PLO-CLO mappings added successfully!");
  
      setEditingScores(false);
      setScores({});
    } catch (error) {
      console.error("Complete Error Object:", error);
      console.error("Error Name:", error.name);
      console.error("Error Message:", error.message);
      alert(`Submission Error: ${error.message}`);
    }
  };

  // Helper function to fetch updated mappings
  const fetchUpdatedMappings = async () => {
    try {
      // Ensure CLO IDs exist
      if (!CLOs || CLOs.length === 0 || !selectedCourseId) {
        console.warn("No CLOs or Course selected to fetch mappings");
        return;
      }

      const cloIds = CLOs.map((clo) => clo.CLO_id).join(",");
      const response = await fetch(
        `http://localhost:8000/plo_clo?clo_ids=${cloIds}&course_id=${selectedCourseId}&program_id=${selectedProgram}&semester_id=${selectedSemesterId}&section_id=${selectedSectionId}&year=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch updated mappings");
      }

      const newMappingData = await response.json();

      // Ensure data is always an array
      const formattedMappings = Array.isArray(newMappingData)
        ? newMappingData
        : [newMappingData];

      // Update mappings state
      setMappings(formattedMappings);

      console.log("Updated Mappings:", formattedMappings);
    } catch (error) {
      console.error("Error fetching updated mappings:", error);
      alert(`Failed to refresh mappings: ${error.message}`);
    }
  };

  const fetchPreviousYearCLOs = async () => {
    if (
      !selectedProgram ||
      !selectedCourseId ||
      !selectedSemesterId ||
      !selectedSectionId ||
      !selectedYear
    ) {
      alert("กรุณาเลือกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/course_clo?program_id=${selectedProgram}&course_id=${selectedCourseId}&semester_id=${selectedSemesterId}&section_id=${selectedSectionId}&year=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch CLOs");
      }

      const data = await response.json();

      const formattedCLOs = Array.isArray(data) ? data : [data];

      if (formattedCLOs.length > 0) {
        setPreviousYearCLOs(formattedCLOs);
        setShowPreviousYearCLOsModal(true); // Add this line to show the modal
        alert(`พบ ${formattedCLOs.length} CLO สำหรับปีที่เลือก`);
      } else {
        alert("ไม่พบข้อมูล CLO");
      }
    } catch (error) {
      console.error("Error fetching CLOs:", error);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล CLO");
    }
  };

  return (
    <div
      className="container-fluid"
      style={{ backgroundColor: "#f1f1f1", padding: "20px" }}
    >
      <div className="d-flex">
        <button className="btn btn-outline-dark me-3">
          <FaBars />
        </button>
        <h5 className="my-auto">Program:</h5>
      </div>

      {/* Select University */}
      <div className="card mt-3 p-3" style={{ backgroundColor: "#e0e4cc" }}>
        <h6>Select University:</h6>
        <select
          className="form-select"
          value={selectedUniversity}
          onChange={(e) => setSelectedUniversity(e.target.value)}
        >
          <option value="" disabled>
            Select University
          </option>
          {universities.map((university) => (
            <option
              key={university.university_id}
              value={university.university_id}
            >
              {university.university_name_en}
            </option>
          ))}
        </select>
      </div>

      <div className="card mt-3 p-3" style={{ backgroundColor: "#e0e4cc" }}>
        <h6>Select Faculty:</h6>
        <select
          className="form-select"
          value={selectedFaculty}
          onChange={(e) => setSelectedFaculty(e.target.value)}
          disabled={!selectedUniversity}
        >
          <option value="" disabled>
            Select Faculty
          </option>
          {facultys.map((faculty) => (
            <option key={faculty.faculty_id} value={faculty.faculty_id}>
              {faculty.faculty_name_en}
            </option>
          ))}
        </select>
      </div>

      <div className="card mt-3 p-3" style={{ backgroundColor: "#e0e4cc" }}>
        <h6>Select Program:</h6>
        <select
          className="form-select"
          value={selectedProgram}
          onChange={(e) => {
            const programValue = e.target.value;
            console.log(
              "Selected Program:",
              programs.find((p) => p.program_id.toString() === programValue)
            ); // Add this log
            setSelectedProgram(programValue);
          }}
          disabled={!selectedFaculty}
        >
          <option value="" disabled>
            Select Program
          </option>
          {programs.map((program) => (
            <option
              key={program.program_id}
              value={program.program_id.toString()} // Ensure this is program_id
            >
              {program.program_name}
            </option>
          ))}
        </select>
      </div>


      <div className="row mt-3">

      <div className="col-md-3">
          <select
            className="form-select"
            value={selectedYear || ""}
            onChange={(e) => setSelectedYear(e.target.value)}
            disabled={!programCourseData.years.length}
          >
            <option value="" disabled>
              Select Year
            </option>
            {programCourseData.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>


        <div className="col-md-3">
          <select
            className="form-select"
            value={selectedCourseId || ""}
            onChange={(e) => {
              console.log("Selected Course:", e.target.value);
              setSelectedCourseId(e.target.value);
            }}
            disabled={programCourseData.courses.length === 0}
          >
            <option value="" disabled>
              Select Course
            </option>
            {programCourseData.courses.map((course) => (
              <option key={course.course_id} value={course.course_id}>
                {`${course.course_id} - ${course.course_name} (${course.course_engname})`}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <select
            className="form-select"
            value={selectedSectionId || ""}
            onChange={(e) => {
              console.log("Selected Section:", e.target.value);
              setSelectedSectionId(e.target.value);
            }}
            disabled={programCourseData.sections.length === 0}
          >
            <option value="" disabled>
              Select Section
            </option>
            {programCourseData.sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <select
            className="form-select"
            value={selectedSemesterId || ""}
            onChange={(e) => setSelectedSemesterId(e.target.value)}
            disabled={!programCourseData.semesters.length}
          >
            <option value="" disabled>
              Select Semester
            </option>
            {programCourseData.semesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <button
          onClick={() => setShowAddModal(true)} // แสดง modal เมื่อคลิกปุ่ม
          className="btn btn-success"
        >
          Add CLO
        </button>

        <label htmlFor="uploadExcel" className="btn btn-primary ms-3">
          Upload from Excel
        </label>
        <input
          type="file"
          id="uploadExcel"
          className="form-control d-none"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
        />

        {/* ปุ่มใหม่สำหรับ Paste และ Upload */}
        <div className="mt-3 d-flex flex-column align-items-start">
          {/* ปุ่ม Paste from Clipboard */}
          <button
            onClick={handlePasteButtonClick}
            className="btn btn-secondary mb-2"
          >
            Paste from Clipboard
          </button>

          {excelData && excelData.length > 0 && (
            <div className="mt-3">
              <h5>Preview Data:</h5>
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>CLO Code</th>
                    <th>CLO Name</th>
                    <th>CLO English Name</th>
                  </tr>
                </thead>
                <tbody>
                  {excelData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.CLO_code}</td>
                      <td>{row.CLO_name}</td>
                      <td>{row.CLO_engname}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ปุ่ม Upload Data */}
          <button
            onClick={handleUploadButtonClick}
            className="btn btn-primary"
            disabled={!excelData || excelData.length === 0} // ปิดปุ่มหากไม่มีข้อมูลใน excelData
          >
            Upload Data
          </button>
        </div>

        {/* ใช้ modal จาก Bootstrap */}
        {showAddModal && (
          <div
            className="modal fade show"
            style={{ display: "block" }}
            aria-labelledby="exampleModalLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="exampleModalLabel">
                    Add New CLO
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddModal(false)} // ปิด modal
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <label>CLO Code:</label>
                  <input
                    type="text"
                    value={editCloCode}
                    onChange={(e) => setEditCloCode(e.target.value)}
                    style={{ width: "100%" }}
                  />
                  <label>CLO Name:</label>
                  <input
                    type="text"
                    value={editCloName}
                    onChange={(e) => setEditCloName(e.target.value)}
                    style={{ width: "100%" }}
                  />
                  <label>CLO English Name:</label>
                  <input
                    type="text"
                    value={editCloEngName}
                    onChange={(e) => setEditCloEngName(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="modal-footer">
                  <button
                    onClick={handleAddClo}
                    style={{
                      backgroundColor: "blue",
                      color: "white",
                      padding: "8px 16px",
                      border: "none",
                      cursor: "pointer",
                      marginTop: "10px",
                      width: "100%",
                    }}
                  >
                    Add CLO
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)} // ปิด modal
                    style={{
                      backgroundColor: "red",
                      color: "white",
                      padding: "8px 16px",
                      border: "none",
                      cursor: "pointer",
                      marginTop: "10px",
                      width: "100%",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={fetchPreviousYearCLOs}
        className="btn btn-info me-2"
        disabled={
          !selectedProgram ||
          !selectedCourseId ||
          !selectedSemesterId ||
          !selectedSectionId ||
          !selectedYear
        }
      >
        Previous Year CLOs
      </button>

      {/* Modal for Previous Year CLOs */}
      {/* Modal for Previous Year CLOs */}
      {showPreviousYearCLOsModal && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">CLOs from Previous Year</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPreviousYearCLOsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {previousYearCLOs.length > 0 ? (
                  <div className="card">
                    <div className="card-header bg-primary text-white">
                      Course Learning Outcomes (CLOs)
                    </div>
                    <div className="card-body">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>CLO Code</th>
                            <th>CLO Name (Thai)</th>
                            <th>CLO Name (English)</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previousYearCLOs.map((clo) => (
                            <tr key={clo.CLO_id}>
                              <td className="fw-bold">{clo.CLO_code}</td>
                              <td>{clo.CLO_name}</td>
                              <td>{clo.CLO_engname}</td>
                              <td>
                                <button
                                  className="btn btn-info btn-sm"
                                  onClick={() => {
                                    console.log("Selected CLO for Copy:", clo);
                                    // You can implement copy functionality here
                                  }}
                                >
                                  Copy
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning text-center">
                    No Course Learning Outcomes (CLOs) found for the selected
                    year
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPreviousYearCLOsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card mt-3">
        <div className="card-header">
          <h5>CLOs</h5>
        </div>
        <div className="card-body">
          {!(
            selectedCourseId &&
            selectedSectionId &&
            selectedSemesterId &&
            selectedYear
          ) ? (
            <p className="text-warning">
              กรุณาเลือกข้อมูลให้ครบทุกช่องก่อนแสดง CLO
            </p>
          ) : CLOs.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>CLO </th>
                  <th>Detail</th>
                  <th>Detail Eng</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {CLOs.map((clo) => (
                  <tr key={clo.CLO_id}>
                    <td>{clo.CLO_code}</td>
                    <td>{clo.CLO_name}</td>
                    <td>{clo.CLO_engname}</td>
                    <td>
                      <button
                        className="btn btn-warning me-2"
                        onClick={() => handleEditClo(clo.CLO_id)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          console.log("programId:", selectedProgram);
                          handleDeleteClo(
                            clo.CLO_id,
                            selectedCourseId,
                            selectedSemesterId,
                            selectedSectionId,
                            selectedYear,
                            selectedProgram
                          );
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No CLO data available</p>
          )}
        </div>
      </div>

      {showEditModal && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit CLO</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">

              <div className="mb-3">
                  <label htmlFor="clo-code" className="form-label">
                    CLO Code
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="clo-code"
                    value={editCloCode}
                    onChange={(e) => setEditCloCode(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="clo-name" className="form-label">
                    CLO Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="clo-name"
                    value={editCloName}
                    onChange={(e) => setEditCloName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="clo-engname" className="form-label">
                    CLO English Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="clo-engname"
                    value={editCloEngName}
                    onChange={(e) => setEditCloEngName(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveClo}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inside the CurriculumManagement component, replace the PLO-CLO Mapping Table section with: */}

      <div className="card mt-3">
        <div className="card-header">
          <h5>PLO-CLO Mapping Table</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <button className="btn btn-primary me-2" onClick={handleEditToggle}>
              {editingScores ? "Cancel Edit" : "Edit Mapping"}
            </button>
            {editingScores && (
              <>
                <button
                  className="btn btn-success me-2"
                  onClick={handlePatchScores}
                  disabled={!editingScores}
                >
                  Save Mapping
                </button>
                <button
                  className="btn btn-success"
                  onClick={handlePostScores}
                  disabled={!editingScores}
                >
                  Submit New Scores
                </button>
              </>
            )}
          </div>

          {(allPLOs.length > 0 && CLOs.length > 0) ? (
  <div className="table-responsive">
    <table
      className="table table-bordered"
      border="1"
      cellPadding="10"
    >
      <thead>
        <tr>
          <th rowSpan="2">PLO</th>
          <th colSpan={CLOs.length} className="text-center">CLO</th>
          <th rowSpan="2">Total</th>
        </tr>
        <tr>
          {CLOs.map((clo) => (
            <th key={`header-clo-${clo.CLO_id}`} className="text-center">
              {clo.CLO_code}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {allPLOs.map((plo,index) => {

        const ploId = plo.PLO_id || plo.plo_id;
          return (
            <tr key={ploId ? `row-plo-${ploId}` : `row-plo-index-${index}`}>
              <td>{plo.PLO_code || "N/A"}</td>
              {CLOs.map((clo) => {
                const key = `${plo.PLO_id}-${clo.CLO_id}`;
                // หาค่า weight จาก mappings
                const mapping = mappings.find(
                  (m) => (m.PLO_id === ploId || m.plo_id === ploId) && m.CLO_id === clo.CLO_id
        );
                const weightValue = mapping ? mapping.weight : "-";

                return (
                  <td key={`cell-${key}`} className="text-center">
                    {editingScores ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scores[key] || ""}
                        onChange={(e) =>
                          handleInputChange(
                            plo.PLO_id,
                            clo.CLO_id,
                            e.target.value
                          )
                        }
                        className="form-control mx-auto"
                        style={{ width: "60px" }}
                      />
                    ) : (
                      weightValue
                    )}
                  </td>
                );
              })}
              <td className="text-center">{calculateTotalForPLO(plo.PLO_id)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
) : (
  <p className="text-warning">
    {!(
      selectedCourseId &&
      selectedSectionId &&
      selectedSemesterId &&
      selectedYear
    ) ? (
      "กรุณาเลือกข้อมูลให้ครบทุกช่องก่อนแสดงตาราง"
    ) : CLOs.length === 0 ? (
      "ไม่พบข้อมูล CLO"
    ) : allPLOs.length === 0 ? (
      "ไม่พบข้อมูล PLO"
    ) : (
      "ไม่พบข้อมูลการแมป PLO-CLO"
    )}
  </p>
)}

        </div>
      </div>
    </div>
  );
}
