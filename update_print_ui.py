import sys

try:
    content = open('src/app/admin/result-module/print/page.tsx', 'r', encoding='utf-8').read()

    # Add imports for faculties and departments
    import_progs = 'import { getProgrammes } from "@/actions/programmes";'
    new_imports = 'import { getProgrammes } from "@/actions/programmes";\nimport { getFaculties } from "@/actions/faculties";\nimport { getDepartments } from "@/actions/departments";'
    content = content.replace(import_progs, new_imports)

    # Add state variables
    state_block_old = """  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [templateStyle, setTemplateStyle] = useState<"detailed" | "original">("original");

  const [loading, setLoading] = useState(false);"""
    
    state_block_new = """  const [studentResults, setStudentResults] = useState<any[]>([]);
  
  const [bulkMode, setBulkMode] = useState<"programme" | "department" | "faculty" | "all">("programme");
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [templateStyle, setTemplateStyle] = useState<"detailed" | "original">("original");

  const [loading, setLoading] = useState(false);"""
    content = content.replace(state_block_old, state_block_new)

    # Fetch effect
    effect_old = """    getProgrammes().then(res => {
      if (res.success) setProgrammes(res.data || []);
    });"""
    effect_new = """    getProgrammes().then(res => {
      if (res.success) setProgrammes(res.data || []);
    });
    getFaculties().then(res => {
      if (res.success) setFaculties(res.data || []);
    });
    getDepartments().then(res => {
      if (res.success) setDepartments(res.data || []);
    });"""
    content = content.replace(effect_old, effect_new)

    # Bulk print action
    loadBulk_old = """  async function loadBulkTranscripts() {
    if (!selectedProgramme) return alert("Please select a programme");
    setLoading(true);
    setSelectedStudent(null);
    const res = await getBulkTranscripts(Number(selectedProgramme));
    if (res.success) {
      setTranscriptsToRender(res.data || []);
    } else {
      alert(res.error);
    }
    setLoading(false);
  }"""
    loadBulk_new = """  async function loadBulkTranscripts() {
    let filters: any = {};
    if (bulkMode === "programme") {
      if (!selectedProgramme) return alert("Please select a programme");
      filters.programmeId = Number(selectedProgramme);
    } else if (bulkMode === "department") {
      if (!selectedDepartment) return alert("Please select a department");
      filters.departmentId = Number(selectedDepartment);
    } else if (bulkMode === "faculty") {
      if (!selectedFaculty) return alert("Please select a faculty");
      filters.facultyId = Number(selectedFaculty);
    } else if (bulkMode === "all") {
      filters.all = true;
    }
    
    setLoading(true);
    setSelectedStudent(null);
    const res = await getBulkTranscripts(filters);
    if (res.success) {
      setTranscriptsToRender(res.data || []);
    } else {
      alert(res.error);
    }
    setLoading(false);
  }"""
    content = content.replace(loadBulk_old, loadBulk_new)

    # Toolbar selector replacement
    toolbar_old = """              <select
                  value={selectedProgramme}
                  onChange={e => setSelectedProgramme(e.target.value)}
                  style={{ width: 240, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
                >
                  <option value="">Select Programme for Bulk Print</option>
                  {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>"""
    toolbar_new = """              <select
                  value={bulkMode}
                  onChange={e => setBulkMode(e.target.value as any)}
                  style={{ width: 140, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
                >
                  <option value="programme">By Programme</option>
                  <option value="department">By Department</option>
                  <option value="faculty">By Faculty</option>
                  <option value="all">Entire School</option>
                </select>

                {bulkMode === "programme" && (
                  <select value={selectedProgramme} onChange={e => setSelectedProgramme(e.target.value)} style={{ width: 200, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}>
                    <option value="">Select Programme...</option>
                    {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
                {bulkMode === "department" && (
                  <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} style={{ width: 200, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}>
                    <option value="">Select Department...</option>
                    {departments.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
                {bulkMode === "faculty" && (
                  <select value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)} style={{ width: 200, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}>
                    <option value="">Select Faculty...</option>
                    {faculties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
"""
    content = content.replace(toolbar_old, toolbar_new)
    
    disabled_old = "disabled={loading || !selectedProgramme}"
    disabled_new = "disabled={loading || (bulkMode === 'programme' && !selectedProgramme) || (bulkMode === 'department' && !selectedDepartment) || (bulkMode === 'faculty' && !selectedFaculty)}"
    content = content.replace(disabled_old, disabled_new)
    
    opacity_old = "opacity: loading || !selectedProgramme ? 0.5 : 1"
    opacity_new = "opacity: loading || (bulkMode === 'programme' && !selectedProgramme) || (bulkMode === 'department' && !selectedDepartment) || (bulkMode === 'faculty' && !selectedFaculty) ? 0.5 : 1"
    content = content.replace(opacity_old, opacity_new)

    open('src/app/admin/result-module/print/page.tsx', 'w', encoding='utf-8').write(content)
    print("SUCCESS")
except Exception as e:
    print(e)
