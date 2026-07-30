import sys

try:
    content = open('src/app/admin/result-module/print/page.tsx', 'r', encoding='utf-8').read()

    # Add imports for faculties and departments
    import_progs = 'import { getProgrammes } from "@/actions/programmes";'
    new_imports = 'import { getProgrammes } from "@/actions/programmes";\nimport { getFaculties } from "@/actions/faculties";\nimport { getDepartments } from "@/actions/departments";'
    if new_imports not in content:
        content = content.replace(import_progs, new_imports)

    # State variables
    state_block_old = """  const [studentQuery, setStudentQuery] = useState("");
  const [templateStyle, setTemplateStyle] = useState<"detailed" | "original">("original");
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState("");"""
    
    state_block_new = """  const [studentQuery, setStudentQuery] = useState("");
  const [templateStyle, setTemplateStyle] = useState<"detailed" | "original">("original");
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [bulkMode, setBulkMode] = useState<"programme" | "department" | "faculty" | "all">("programme");
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState("");
  
  const [faculties, setFaculties] = useState<any[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");"""

    if state_block_old in content:
        content = content.replace(state_block_old, state_block_new)

    # Fetch effect
    effect_old = """  useEffect(() => {
    getProgrammes().then(res => { if (res.success) setProgrammes(res.data || []); });
  }, []);"""
    effect_new = """  useEffect(() => {
    getProgrammes().then(res => { if (res.success) setProgrammes(res.data || []); });
    getFaculties().then(res => { if (res.success) setFaculties(res.data || []); });
    getDepartments().then(res => { if (res.success) setDepartments(res.data || []); });
  }, []);"""
    if effect_old in content:
        content = content.replace(effect_old, effect_new)

    # loadBulkTranscripts action
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
    if loadBulk_old in content:
        content = content.replace(loadBulk_old, loadBulk_new)

    # Toolbar HTML (assuming I didn't replace it before successfully, but wait, the compilation error showed that bulkMode was missing in HTML but present! Oh, the compilation error had `bulkMode` missing meaning I *did* replace the HTML. I should just update the state!)
    open('src/app/admin/result-module/print/page.tsx', 'w', encoding='utf-8').write(content)
    print("SUCCESS")
except Exception as e:
    print(e)
