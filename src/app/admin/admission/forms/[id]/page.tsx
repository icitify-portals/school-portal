"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Plus, 
    GripVertical, 
    Trash2, 
    Settings, 
    ChevronLeft,
    Save,
    Eye,
    Check,
    X,
    Type,
    List,
    Calendar,
    FileUp,
    Hash,
    Mail,
    Phone,
    Layout,
    CheckSquare,
    CircleDot,
    Clock,
    LinkIcon,
    Camera,
    Image,
    Globe,
    MapPin,
    Building2,
    Sparkles,
    Loader2,
    ChevronDown,
    ChevronUp,
    Users,
    Droplet,
    Dna,
    Pencil
} from "lucide-react";
import Link from "next/link";
import { 
    getFormTemplate, 
    saveFormTemplate, 
    saveFormSection, 
    deleteFormSection,
    saveFormField,
    deleteFormField,
    updateFieldsOrder,
    updateSectionsOrder
} from "@/actions/admission_v2";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { getFeeStructures } from "@/actions/bursary";

const NIN_PROVIDERS = [
    { value: 'simulator', label: 'Simulator (Testing)' },
    { value: 'dojah', label: 'Dojah' },
    { value: 'verifyme', label: 'VerifyMe' },
    { value: 'smileid', label: 'SmileID' },
    { value: 'monnify', label: 'Monnify' }
];

const FIELD_TYPES = [
    { label: "Gender / Sex", value: "gender", icon: Users },
    { label: "Blood Group", value: "blood_group", icon: Droplet },
    { label: "Phenotype / Genotype", value: "phenotype", icon: Dna },
    { label: "Short Text", value: "text", icon: Type },
    { label: "Long Text", value: "textarea", icon: Layout },
    { label: "Select List", value: "select", icon: List, needsOptions: true },
    { label: "Nationality Dropdown", value: "nationality", icon: Globe },
    { label: "State of Origin Dropdown", value: "state", icon: MapPin },
    { label: "L.G.A Dropdown", value: "lga", icon: Building2 },
    { label: "Date", value: "date", icon: Calendar },
    { label: "Number", value: "number", icon: Hash },
    { label: "Email", value: "email", icon: Mail },
    { label: "Phone", value: "phone", icon: Phone },
    { label: "Time", value: "time", icon: Clock },
    { label: "URL", value: "url", icon: LinkIcon },
    { label: "Radio Buttons", value: "radio", icon: CircleDot, needsOptions: true },
    { label: "Checkbox (Single)", value: "checkbox", icon: CheckSquare },
    { label: "Checkbox Group", value: "checkbox_group", icon: CheckSquare, needsOptions: true },
    { label: "Image / Banner", value: "image", icon: Image },
    { label: "File Upload", value: "file", icon: FileUp },
    { label: "O-Level Result Grid", value: "olevel_result", icon: Layout },
];

// Sample data presets for common field types
const FIELD_PRESETS = {
    select: {
        gender: { label: "Gender", options: "Male, Female, Other" },
        maritalStatus: { label: "Marital Status", options: "Single, Married, Divorced, Widowed" },
        bloodGroup: { label: "Blood Group", options: "A+, A-, B+, B-, AB+, AB-, O+, O-" },
        genotype: { label: "Genotype", options: "AA, AS, AC, SS, SC, CC" },
        religion: { label: "Religion", options: "Christianity, Islam, Traditional, Others" },
        disability: { label: "Disability Status", options: "None, Visual, Hearing, Physical, Speech, Intellectual, Multiple" },
        schoolType: { label: "Type of School Attended", options: "Public, Private, Mission, Federal, State" },
        examType: { label: "Examination Type", options: "WAEC, NECO, NABTEB, GCE, JAMB, SAT, IGCSE" },
        yesNo: { label: "Yes/No", options: "Yes, No" },
    },
    radio: {
        gender: { label: "Gender", options: "Male, Female" },
        maritalStatus: { label: "Marital Status", options: "Single, Married, Divorced, Widowed" },
        yesNo: { label: "Yes / No", options: "Yes, No" },
        trueFalse: { label: "True / False", options: "True, False" },
        attendance: { label: "Attendance Mode", options: "Full-time, Part-time, Distance Learning, Sandwich" },
    },
    checkbox_group: {
        hobbies: { label: "Hobbies/Interests", options: "Reading, Sports, Music, Travel, Cooking, Gaming, Art, Photography" },
        skills: { label: "Skills", options: "Communication, Leadership, Teamwork, Problem Solving, Critical Thinking, Time Management, Adaptability, Creativity" },
        languages: { label: "Languages Spoken", options: "English, Yoruba, Igbo, Hausa, French, Arabic, Pidgin, Others" },
        documents: { label: "Required Documents", options: "Birth Certificate, WAEC/NECO Result, JAMB Result, Local Govt ID, Passport Photo, Medical Report, Reference Letter" },
    }
};

// Nigeria states and LGAs (abbreviated for demo - in production load from database)
const NIGERIA_STATES = [
    { name: "Abia", lgas: ["Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umu Nneochi"] },
    { name: "Adamawa", lgas: ["Demsa", "Fufure", "Ganye", "Girei", "Gombi", "Guyuk", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"] },
    { name: "Akwa Ibom", lgas: ["Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono Ibom", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat Enin", "Nsit Atai", "Nsit Ibom", "Nsit Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"] },
    { name: "Anambra", lgas: ["Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"] },
    { name: "Bauchi", lgas: ["Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balewa", "Toro", "Warji", "Zaki"] },
    { name: "Bayelsa", lgas: ["Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"] },
    { name: "Benue", lgas: ["Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Oturkpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"] },
    { name: "Borno", lgas: ["Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"] },
    { name: "Cross River", lgas: ["Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki", "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala"] },
    { name: "Delta", lgas: ["Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"] },
    { name: "Ebonyi", lgas: ["Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"] },
    { name: "Edo", lgas: ["Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben", "Ikpoba Okha", "Oredo", "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde"] },
    { name: "Ekiti", lgas: ["Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure", "Gbonyin", "Ido Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"] },
    { name: "Enugu", lgas: ["Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo Uwani"] },
    { name: "FCT Abuja", lgas: ["Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council"] },
    { name: "Gombe", lgas: ["Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"] },
    { name: "Imo", lgas: ["Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli", "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West", "Unuimo"] },
    { name: "Jigawa", lgas: ["Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa", "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kazaure", "Kiri Kasama", "Kiyawa", "Maigatari", "Malam Madori", "Miga", "Ringim", "Roni", "Sule Tankarkar", "Taura", "Yankwashi"] },
    { name: "Kaduna", lgas: ["Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Soba", "Zangon Kataf", "Zaria"] },
    { name: "Kano", lgas: ["Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko", "Garun Mallam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Hadejia", "Kabo", "Kano Municipal", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Nasarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"] },
    { name: "Katsina", lgas: ["Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume", "Danja", "Daura", "Dutsi", "Dutsin Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"] },
    { name: "Kebbi", lgas: ["Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi", "Bunza", "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri", "Zuru"] },
    { name: "Kogi", lgas: ["Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela/Odolu", "Ijumu", "Kabba/Bunu", "Koton Karfe", "Lokoja", "Mopa-Muro", "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"] },
    { name: "Kwara", lgas: ["Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero", "Oyun", "Pategi"] },
    { name: "Lagos", lgas: ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Somolu", "Surulere"] },
    { name: "Nasarawa", lgas: ["Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"] },
    { name: "Niger", lgas: ["Agaie", "Agwara", "Bida", "Borno", "Bosso", "Chanchaga", "Edati", "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Moya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"] },
    { name: "Ogun", lgas: ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Egbado North", "Egbado South", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Ipokia", "Obafemi Owode", "Odedah", "Odogbolu", "Remo North", "Shagamu"] },
    { name: "Ondo", lgas: ["Akoko North-East", "Akoko North-West", "Akoko South-East", "Akoko South-West", "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje", "Ile Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ose", "Owo"] },
    { name: "Osun", lgas: ["Aiyedaade", "Aiyedire", "Atakunmosa East", "Atakunmosa West", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Egbedore", "Ejigbo", "Ife Central", "Ife East", "Ife North", "Ife South", "Ilesa East", "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin", "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"] },
    { name: "Oyo", lgas: ["Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"] },
    { name: "Plateau", lgas: ["Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"] },
    { name: "Rivers", lgas: ["Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru", "Bonny", "Degema", "Eleme", "Emuoha", "Etche", "Gokana", "Ikwerre", "Khana", "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo", "Port Harcourt", "Tai"] },
    { name: "Sokoto", lgas: ["Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamakko", "Wurno", "Yabo"] },
    { name: "Taraba", lgas: ["Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", "Kurmi", "Lau", "Ngada", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"] },
    { name: "Yobe", lgas: ["Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Kara", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"] },
    { name: "Zamfara", lgas: ["Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Gummi", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Tsafe", "Zurmi"] },
];

export default function AdmissionFormBuilder() {
    const params = useParams();
    const templateId = parseInt(params.id as string);
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<number | null>(null);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [showFieldModal, setShowFieldModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);
    const [settingsData, setSettingsData] = useState({
        name: "", slug: "", flowType: "form_first",
        feeStructureId: "", applicationFee: "0", processingFee: "0",
        startDate: "", endDate: ""
    });
    const [togglingActive, setTogglingActive] = useState(false);
    const [showAgeModal, setShowAgeModal] = useState(false);
    const [minAgeInput, setMinAgeInput] = useState("");
    const [savingAgeRule, setSavingAgeRule] = useState(false);
    
    const [sectionData, setSectionData] = useState({ title: "" });
    const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
    const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
    const [fieldData, setFieldData] = useState({
        label: "",
        type: "text",
        placeholder: "",
        isRequired: false,
        options: "",
        isSystemField: false,
        systemKey: "",
        helpText: "",
        defaultValue: "",
        validationRules: "" as string,
        conditionalLogic: "" as string,
        width: "full"
    });
    
    // NIN Verification Config
    const [ninConfig, setNinConfig] = useState({
        enabled: false,
        provider: 'simulator',
        required: true,
        autoFill: true
    });

    useEffect(() => {
        fetchTemplate();
    }, [templateId]);

    const fetchTemplate = async () => {
        setLoading(true);
        const [data, structures] = await Promise.all([
            getFormTemplate(templateId),
            getFeeStructures()
        ]);
        setFeeStructures(structures);
        setTemplate(data);
        setSettingsData({ 
            name: data?.name || "", 
            slug: data?.slug || "",
            flowType: data?.flowType || "form_first",
            feeStructureId: data?.feeStructureId?.toString() || "",
            applicationFee: data?.applicationFee?.toString() || "0",
            processingFee: data?.processingFee?.toString() || "0",
            startDate: data?.startDate ? new Date(data.startDate).toISOString().split('T')[0] : "",
            endDate: data?.endDate ? new Date(data.endDate).toISOString().split('T')[0] : ""
        });
        
        // Load NIN verification config
        if (data?.ninVerificationConfig) {
            try {
                const config = typeof data.ninVerificationConfig === 'string' 
                    ? JSON.parse(data.ninVerificationConfig) 
                    : data.ninVerificationConfig;
                setNinConfig(config);
            } catch {}
        }
        
        // Preserve current section if still valid, otherwise fall back to first
        if (data?.sections?.length > 0) {
            const sectionStillExists = data.sections.some((s: any) => s.id === activeSection);
            if (!sectionStillExists || activeSection === null) {
                setActiveSection(data.sections[0].id);
            }
        }
        setLoading(false);
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await saveFormTemplate({ 
            id: templateId, 
            ...template, 
            name: settingsData.name, 
            slug: settingsData.slug,
            flowType: settingsData.flowType,
            feeStructureId: settingsData.feeStructureId ? parseInt(settingsData.feeStructureId) : null,
            applicationFee: parseFloat(settingsData.applicationFee),
            processingFee: parseFloat(settingsData.processingFee),
            startDate: new Date(settingsData.startDate),
            endDate: new Date(settingsData.endDate)
        });
        if (res.success) {
            setShowSettingsModal(false);
            fetchTemplate();
            toast.success("Template settings updated!");
        } else {
            toast.error(res.error || "Failed to update template");
        }
    };

    const handleToggleActive = async () => {
        setTogglingActive(true);
        const nextActive = !template.isActive;
        const res = await saveFormTemplate({ id: templateId, ...template, isActive: nextActive });
        if (res.success) {
            toast.success(nextActive ? "Form is now live and accepting applications." : "Form taken offline — applicants can no longer access it.");
            fetchTemplate();
        } else {
            toast.error(res.error || "Failed to update form status");
        }
        setTogglingActive(false);
    };

    const handleSaveAgeRule = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingAgeRule(true);
        const minAge = minAgeInput.trim() === "" ? null : parseInt(minAgeInput, 10);
        if (minAge !== null && (isNaN(minAge) || minAge < 0)) {
            toast.error("Please enter a valid minimum age (or leave blank for no restriction).");
            setSavingAgeRule(false);
            return;
        }
        const res = await saveFormTemplate({ id: templateId, ...template, minAge });
        if (res.success) {
            toast.success("Age eligibility rule updated!");
            setShowAgeModal(false);
            fetchTemplate();
        } else {
            toast.error(res.error || "Failed to update age rule");
        }
        setSavingAgeRule(false);
    };

    const handleSaveNinConfig = async () => {
        const res = await saveFormTemplate({ 
            id: templateId, 
            ...template, 
            ninVerificationConfig: JSON.stringify(ninConfig) 
        });
        if (res.success) {
            fetchTemplate();
            toast.success("NIN verification settings updated!");
        } else {
            toast.error(res.error || "Failed to update NIN settings");
        }
    };

    const handleSaveSection = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await saveFormSection({ 
            id: editingSectionId,
            templateId, 
            ...sectionData, 
            order: editingSectionId ? undefined : template.sections.length 
        });
        if (res.success) {
            setShowSectionModal(false);
            setEditingSectionId(null);
            setSectionData({ title: "" });
            fetchTemplate();
            toast.success(editingSectionId ? "Section updated" : "Section added successfully");
        }
    };

    const handleEditSection = (section: any) => {
        setEditingSectionId(section.id);
        setSectionData({ title: section.title });
        setShowSectionModal(true);
    };

    const handleSaveField = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSection) return;
        const section = template.sections.find((s: any) => s.id === activeSection);
        
        const fieldPayload = {
            ...fieldData,
            validationRules: fieldData.validationRules || null,
            conditionalLogic: fieldData.conditionalLogic || null
        };
        
        if (editingFieldId) {
            // Update existing field
            const res = await saveFormField({
                id: editingFieldId,
                sectionId: activeSection,
                templateId,
                ...fieldPayload,
                order: section.fields.find((f: any) => f.id === editingFieldId)?.order || 0
            });
            if (res.success) {
                setShowFieldModal(false);
                setEditingFieldId(null);
                resetFieldData();
                fetchTemplate();
                toast.success("Field updated successfully");
            }
        } else {
            // Create new field
            const res = await saveFormField({
                sectionId: activeSection,
                templateId,
                ...fieldPayload,
                order: section.fields.length
            });
            if (res.success) {
                setShowFieldModal(false);
                resetFieldData();
                fetchTemplate();
                toast.success("Field added successfully");
            }
        }
    };

    const resetFieldData = () => {
        setFieldData({
            label: "", type: "text", placeholder: "", isRequired: false, options: "", 
            isSystemField: false, systemKey: "", helpText: "", defaultValue: "", 
            validationRules: "", conditionalLogic: "", width: "full"
        });
    };

    const handleEditField = (field: any) => {
        setEditingFieldId(field.id);
        setFieldData({
            label: field.label || "",
            type: field.type || "text",
            placeholder: field.placeholder || "",
            isRequired: field.isRequired || false,
            options: field.options || "",
            isSystemField: field.isSystemField || false,
            systemKey: field.systemKey || "",
            helpText: field.helpText || "",
            defaultValue: field.defaultValue || "",
            validationRules: field.validationRules || "",
            conditionalLogic: field.conditionalLogic || "",
            width: field.width || "full"
        });
        setShowFieldModal(true);
    };

    const handleOnDragEnd = async (result: any) => {
        if (!result.destination || !activeSection) return;
        
        const sectionIndex = template.sections.findIndex((s: any) => s.id === activeSection);
        const items = Array.from(template.sections[sectionIndex].fields);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedFields = items.map((item: any, index: number) => ({
            id: item.id,
            order: index
        }));

        // Optimistic update
        const newTemplate = { ...template };
        newTemplate.sections[sectionIndex].fields = items;
        setTemplate(newTemplate);

        const res = await updateFieldsOrder(updatedFields, templateId);
        if (!res.success) {
            toast.error("Failed to save field order");
            fetchTemplate();
        }
    };

    const handleSectionDragEnd = async (result: any) => {
        if (!result.destination) return;
        
        const items = Array.from(template.sections);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedSections = items.map((item: any, index: number) => ({
            id: item.id,
            order: index
        }));

        // Optimistic update
        const newTemplate = { ...template, sections: items };
        setTemplate(newTemplate);

        const res = await updateSectionsOrder(updatedSections, templateId);
        if (!res.success) {
            toast.error("Failed to save sections order");
            fetchTemplate();
        } else {
            toast.success("Page order saved!");
        }
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    if (!template) return <div className="p-20 text-center">Template not found</div>;

    const currentSection = template.sections.find((s: any) => s.id === activeSection);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-[1600px] mx-auto px-8 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/admission/forms">
                            <Button variant="ghost" className="rounded-2xl p-4 hover:bg-slate-100">
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-slate-900 italic uppercase">{template.name}</h1>
                                <span className="px-3 py-0.5 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    Builder Mode
                                </span>
                                {template.isActive ? (
                                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                                        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" /> Live
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 px-3 py-1 rounded-full">
                                        Draft
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {template.level} Admission • {template.sections.length} Sections • {template.sections.reduce((acc: number, s: any) => acc + s.fields.length, 0)} Fields
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={() => setShowSettingsModal(true)} variant="outline" className="rounded-2xl border-slate-200 font-black px-6 py-6 flex gap-2 uppercase text-[10px] tracking-widest">
                            <Settings className="w-4 h-4" /> Settings
                        </Button>
                        <Button
                            onClick={() => window.open(`/admin/admission/forms/${templateId}/preview`, '_blank')}
                            variant="outline"
                            className="rounded-2xl border-slate-200 font-black px-6 py-6 flex gap-2 uppercase text-[10px] tracking-widest"
                        >
                            <Eye className="w-4 h-4" /> Preview
                        </Button>
                        <Button
                            onClick={handleToggleActive}
                            disabled={togglingActive}
                            className={cn(
                                "rounded-2xl text-white font-black px-6 py-6 flex gap-2 uppercase text-[10px] tracking-widest shadow-lg",
                                template.isActive
                                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-100"
                                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                            )}
                        >
                            <Save className="w-4 h-4" /> {togglingActive ? "Saving..." : template.isActive ? "Take Offline" : "Activate Form"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-8 py-10 grid grid-cols-12 gap-8">
                {/* Sidebar: Sections */}
                <div className="col-span-3 space-y-6">
                    <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic">Form Pages</h3>
                            <Button onClick={() => setShowSectionModal(true)} size="sm" className="rounded-xl bg-slate-900 text-white p-2">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <DragDropContext onDragEnd={handleSectionDragEnd}>
                            <Droppable droppableId="sections">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                        {template.sections.map((section: any, index: number) => (
                                            <Draggable key={section.id.toString()} draggableId={section.id.toString()} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className="group/sec flex items-center gap-2"
                                                    >
                                                        <div {...provided.dragHandleProps} className="p-2 bg-slate-50 rounded-xl text-slate-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing" title="Drag to reorder">
                                                            <GripVertical className="w-4 h-4" />
                                                        </div>
                                                        <button
                                                            onClick={() => setActiveSection(section.id)}
                                                            className={cn(
                                                                "flex-1 flex items-center gap-3 p-5 rounded-2xl transition-all font-bold text-sm text-left",
                                                                activeSection === section.id 
                                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 -translate-x-1" 
                                                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                                            )}
                                                        >
                                                            <span className={cn(
                                                                "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0",
                                                                activeSection === section.id ? "bg-white/20" : "bg-slate-200 text-slate-500"
                                                            )}>
                                                                {index + 1}
                                                            </span>
                                                            <span className="truncate flex-1">{section.title}</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        {template.sections.length === 0 && (
                                            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No sections yet</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </Card>

                    <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-slate-900 text-white">
                        <h3 className="text-sm font-black uppercase tracking-widest italic mb-4">Age Eligibility</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            {template.minAge 
                                ? `Candidates must be at least ${template.minAge} years old to qualify.` 
                                : "No age restriction set for this template."}
                        </p>
                        <Button
                            onClick={() => { setMinAgeInput(template.minAge?.toString() || ""); setShowAgeModal(true); }}
                            className="w-full mt-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black py-4 uppercase text-[9px] tracking-widest"
                        >
                            Edit Rules
                        </Button>
                    </Card>

                    <Card className="border-none shadow-xl rounded-[2.5rem] p-8 bg-gradient-to-br from-purple-900 to-indigo-900 text-white">
                        <h3 className="text-sm font-black uppercase tracking-widest italic mb-4">NIN Verification</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-purple-200 uppercase tracking-widest">Enable NIN</span>
                                <button
                                    onClick={() => setNinConfig({ ...ninConfig, enabled: !ninConfig.enabled })}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-colors relative",
                                        ninConfig.enabled ? "bg-purple-400" : "bg-white/20"
                                    )}
                                >
                                    <div className={cn(
                                        "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                                        ninConfig.enabled ? "translate-x-6" : "translate-x-0.5"
                                    )} />
                                </button>
                            </div>
                            
                            {ninConfig.enabled && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-purple-300 uppercase tracking-widest">Provider</label>
                                        <select 
                                            className="w-full bg-white/10 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none text-white"
                                            value={ninConfig.provider}
                                            onChange={(e) => setNinConfig({ ...ninConfig, provider: e.target.value })}
                                        >
                                            {NIN_PROVIDERS.map(p => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-purple-300 uppercase tracking-widest">Required</span>
                                        <button
                                            onClick={() => setNinConfig({ ...ninConfig, required: !ninConfig.required })}
                                            className={cn(
                                                "w-10 h-5 rounded-full transition-colors relative",
                                                ninConfig.required ? "bg-purple-400" : "bg-white/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform",
                                                ninConfig.required ? "translate-x-5" : "translate-x-0.5"
                                            )} />
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-purple-300 uppercase tracking-widest">Auto-fill from NIN</span>
                                        <button
                                            onClick={() => setNinConfig({ ...ninConfig, autoFill: !ninConfig.autoFill })}
                                            className={cn(
                                                "w-10 h-5 rounded-full transition-colors relative",
                                                ninConfig.autoFill ? "bg-purple-400" : "bg-white/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform",
                                                ninConfig.autoFill ? "translate-x-5" : "translate-x-0.5"
                                            )} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        <Button 
                            onClick={handleSaveNinConfig}
                            className="w-full mt-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black py-4 uppercase text-[9px] tracking-widest"
                        >
                            Save NIN Settings
                        </Button>
                    </Card>
                </div>

                {/* Main: Field Builder */}
                <div className="col-span-9 space-y-8">
                    {currentSection ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 italic uppercase">{currentSection.title}</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure fields for this step</p>
                                </div>
                                <div className="flex gap-4">
                                    <Button onClick={() => setShowFieldModal(true)} className="rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black px-8 py-6 flex gap-3 uppercase text-xs tracking-widest shadow-xl">
                                        <Plus className="w-5 h-5" /> Add Field
                                    </Button>
                                    <Button onClick={() => handleEditSection(currentSection)} variant="ghost" className="rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-4">
                                        <Pencil className="w-5 h-5" />
                                    </Button>
                                    <Button onClick={async () => {
                                        if (confirm("Are you sure? This will delete all fields in this section.")) {
                                            await deleteFormSection(currentSection.id, templateId);
                                            fetchTemplate();
                                        }
                                    }} variant="ghost" className="rounded-2xl text-rose-500 hover:bg-rose-50 p-4">
                                        <Trash2 className="w-6 h-6" />
                                    </Button>
                                </div>
                            </div>

                            <DragDropContext onDragEnd={handleOnDragEnd}>
                                <Droppable droppableId="fields">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-2 gap-4">
                                            {currentSection.fields.map((field: any, index: number) => (
                                                <Draggable key={field.id.toString()} draggableId={field.id.toString()} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className={cn(
                                                                "group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-xl hover:border-indigo-100 transition-all",
                                                                field.width === 'half' ? "col-span-1" : "col-span-2"
                                                            )}
                                                        >
                                                            <div {...provided.dragHandleProps} className="p-3 bg-slate-50 rounded-2xl text-slate-300 group-hover:text-indigo-400 group-hover:bg-indigo-50 transition-colors">
                                                                <GripVertical className="w-6 h-6" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-lg font-black text-slate-900 italic uppercase">{field.label}</span>
                                                                    {field.isRequired && (
                                                                        <span className="text-rose-500 font-black text-xl">*</span>
                                                                    )}
                                                                    {field.isSystemField && (
                                                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-lg text-[8px] font-black uppercase">System Core</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                        <div className="w-1 h-1 bg-slate-300 rounded-full" /> {field.type.replace('_', ' ')}
                                                                    </span>
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded-md text-[8px] font-black uppercase",
                                                                        field.width === 'half' ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                                                                    )}>
                                                                        {field.width === 'half' ? '½ width' : 'full'}
                                                                    </span>
                                                                    {field.placeholder && (
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                            <div className="w-1 h-1 bg-slate-300 rounded-full" /> Hint: {field.placeholder}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {(() => {
                                                                    if (field.type === 'image' && field.options) {
                                                                        return (
                                                                            <div className="mt-2">
                                                                                <img
                                                                                    src={field.options}
                                                                                    alt={field.label}
                                                                                    className="h-12 rounded-lg object-contain bg-slate-50 border border-slate-100"
                                                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                                />
                                                                            </div>
                                                                        );
                                                                    }
                                                                    let opts: string[] = [];
                                                                    if (['select', 'radio', 'checkbox_group'].includes(field.type) && field.options) {
                                                                        opts = field.options.split(/[,\n]/).map((o: string) => o.trim()).filter(Boolean);
                                                                    } else if (field.type === 'gender') {
                                                                        opts = ['Male', 'Female'];
                                                                    } else if (field.type === 'blood_group') {
                                                                        opts = (field.options && field.options.trim()) ? field.options.split(/[,\n]/).map((o: string) => o.trim()).filter(Boolean) : ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
                                                                    } else if (field.type === 'phenotype') {
                                                                        opts = (field.options && field.options.trim()) ? field.options.split(/[,\n]/).map((o: string) => o.trim()).filter(Boolean) : ['AA', 'AS', 'AC', 'SS', 'SC', 'CC'];
                                                                    }
                                                                    if (opts.length === 0) return null;
                                                                    return (
                                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                                            {opts.slice(0, 8).map((opt: string, i: number) => (
                                                                                <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-bold">
                                                                                    {opt}
                                                                                </span>
                                                                            ))}
                                                                            {opts.length > 8 && (
                                                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-bold">
                                                                                    +{opts.length - 8} more
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button 
                                                                    onClick={() => handleEditField(field)}
                                                                    variant="ghost" 
                                                                    className="rounded-xl hover:bg-slate-100 p-3"
                                                                >
                                                                    <Settings className="w-5 h-5 text-slate-400" />
                                                                </Button>
                                                                <Button 
                                                                    onClick={async () => {
                                                                        await deleteFormField(field.id, templateId);
                                                                        fetchTemplate();
                                                                    }}
                                                                    variant="ghost" 
                                                                    className="rounded-xl hover:bg-rose-50 p-3"
                                                                >
                                                                    <Trash2 className="w-5 h-5 text-rose-400" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            {currentSection.fields.length === 0 && (
                                                <div className="py-32 text-center bg-white border-4 border-dashed border-slate-50 rounded-[3rem]">
                                                    <div className="max-w-xs mx-auto space-y-4">
                                                        <div className="p-6 bg-slate-50 rounded-2xl w-fit mx-auto">
                                                            <Plus className="w-10 h-10 text-slate-200" />
                                                        </div>
                                                        <h4 className="text-xl font-black text-slate-300 italic uppercase">Empty Section</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add your first field to this step of the application.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </div>
                    ) : (
                        <div className="py-48 text-center bg-white border-none shadow-xl rounded-[3rem]">
                             <div className="max-w-md mx-auto space-y-6">
                                <Layout className="w-16 h-16 text-slate-100 mx-auto" />
                                <h2 className="text-3xl font-black text-slate-900 italic uppercase">Create a Page</h2>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs leading-relaxed">Start by adding a section to your form. These act as pages in the multi-step application process.</p>
                                <Button onClick={() => setShowSectionModal(true)} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 py-8 uppercase text-xs tracking-widest shadow-xl shadow-indigo-100">
                                    <Plus className="w-5 h-5 mr-3" /> Add First Section
                                </Button>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showSectionModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[3rem] overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black italic uppercase">{editingSectionId ? 'Edit Page Section' : 'Add Page Section'}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 bg-white">
                            <form onSubmit={handleSaveSection} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Section Title</label>
                                    <input 
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. Biodata & Personal Info"
                                        value={sectionData.title}
                                        onChange={(e) => setSectionData({ title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="ghost" onClick={() => { setShowSectionModal(false); setEditingSectionId(null); setSectionData({ title: "" }); }} className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest">Cancel</Button>
                                    <Button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest">{editingSectionId ? 'Update Section' : 'Create Section'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {showFieldModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="bg-slate-900 text-white px-8 py-6">
                            <h2 className="text-xl font-black italic uppercase">{editingFieldId ? "Edit Field" : "Configure New Field"}</h2>
                        </div>
                        <form onSubmit={handleSaveField} className="flex flex-col flex-1 min-h-0">
                            <div className="px-6 pt-4">
                                <Tabs defaultValue="general" className="w-full">
                                    <TabsList className="w-full bg-slate-100 rounded-2xl p-1.5">
                                        <TabsTrigger value="general" className="rounded-xl font-bold text-[10px] uppercase tracking-widest">General</TabsTrigger>
                                        <TabsTrigger value="options" className="rounded-xl font-bold text-[10px] uppercase tracking-widest">Options</TabsTrigger>
                                        <TabsTrigger value="validation" className="rounded-xl font-bold text-[10px] uppercase tracking-widest">Validation</TabsTrigger>
                                        <TabsTrigger value="logic" className="rounded-xl font-bold text-[10px] uppercase tracking-widest">Logic</TabsTrigger>
                                    </TabsList>

                                    <div className="overflow-y-auto max-h-[55vh] custom-scrollbar -mx-1 px-1">
                                        <TabsContent value="general" className="space-y-5 mt-4 pb-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Label</label>
                                                    <input
                                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                                        placeholder="e.g. Current Class"
                                                        value={fieldData.label}
                                                        onChange={(e) => setFieldData({ ...fieldData, label: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Field Type</label>
                                                    <select
                                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                                        value={fieldData.type}
                                                        onChange={(e) => setFieldData({ ...fieldData, type: e.target.value })}
                                                    >
                                                        {FIELD_TYPES.map(type => (
                                                            <option key={type.value} value={type.value}>{type.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Placeholder / Hint</label>
                                                <input
                                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="e.g. Enter your current school name"
                                                    value={fieldData.placeholder}
                                                    onChange={(e) => setFieldData({ ...fieldData, placeholder: e.target.value })}
                                                />
                                            </div>

                                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                                <input
                                                    type="checkbox"
                                                    id="isRequired"
                                                    className="w-5 h-5 rounded-lg accent-indigo-600"
                                                    checked={fieldData.isRequired}
                                                    onChange={(e) => setFieldData({ ...fieldData, isRequired: e.target.checked })}
                                                />
                                                <label htmlFor="isRequired" className="text-xs font-black uppercase tracking-widest text-slate-700 cursor-pointer">Required Field</label>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Field Width on Page</label>
                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFieldData({ ...fieldData, width: "full" })}
                                                        className={cn(
                                                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                                            fieldData.width === "full"
                                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                                        )}
                                                    >
                                                        Full Width
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFieldData({ ...fieldData, width: "half" })}
                                                        className={cn(
                                                            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                                            fieldData.width === "half"
                                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                                        )}
                                                    >
                                                        Half Width
                                                    </button>
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 px-1">Half-width fields sit side by side. Best for short fields like Gender, Blood Group, Date.</p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Help Text (Optional)</label>
                                                <input
                                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="e.g. Enter your 11-digit NIN number"
                                                    value={fieldData.helpText}
                                                    onChange={(e) => setFieldData({ ...fieldData, helpText: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Default Value (Optional)</label>
                                                <input
                                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="e.g. Nigeria"
                                                    value={fieldData.defaultValue}
                                                    onChange={(e) => setFieldData({ ...fieldData, defaultValue: e.target.value })}
                                                />
                                            </div>

                                            {['nationality', 'state', 'lga'].includes(fieldData.type) && (
                                                <div className="p-4 bg-emerald-50 rounded-2xl space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="w-4 h-4 text-emerald-600" />
                                                        <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Auto-Populated Dropdown</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-emerald-600 leading-relaxed">
                                                        {fieldData.type === 'nationality' && "This field will render a full list of 200+ countries. No manual options needed — applicants pick from a searchable dropdown."}
                                                        {fieldData.type === 'state' && "This field will render all 36 Nigerian states + FCT. Applicants pick their state of origin — L.G.A options cascade from this selection."}
                                                        {fieldData.type === 'lga' && "This field will render the L.G.A list filtered by the applicant's selected State. It depends on a 'State of Origin' field existing in the same form."}
                                                    </p>
                                                </div>
                                            )}

                                            {fieldData.type === 'file' && (
                                                <div className="p-4 bg-sky-50 rounded-2xl space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <Camera className="w-4 h-4 text-sky-600" />
                                                        <span className="text-xs font-black text-sky-700 uppercase tracking-widest">File Upload Settings</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-sky-600 leading-relaxed">
                                                        Applicants can tap to browse files or use their device camera to capture a photo directly. Supported types: images (JPG, PNG), PDFs, and documents. The placeholder text can hint: "Tap to upload or take a photo".
                                                    </p>
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-2 text-[10px] font-bold text-sky-600 uppercase">
                                                            <input type="checkbox" className="accent-sky-600" defaultChecked /> Allow camera capture
                                                        </label>
                                                        <label className="flex items-center gap-2 text-[10px] font-bold text-sky-600 uppercase">
                                                            <input type="checkbox" className="accent-sky-600" defaultChecked /> Allow file upload
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="options" className="space-y-5 mt-4 pb-4">
                                            {['select', 'radio', 'checkbox_group'].includes(fieldData.type) ? (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Preset Templates</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Object.entries(FIELD_PRESETS[fieldData.type as keyof typeof FIELD_PRESETS] || {}).map(([key, preset]) => (
                                                                <button
                                                                    key={key}
                                                                    type="button"
                                                                    onClick={() => setFieldData({
                                                                        ...fieldData,
                                                                        label: fieldData.label || preset.label,
                                                                        options: preset.options
                                                                    })}
                                                                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
                                                                >
                                                                    {preset.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <Separator className="bg-slate-100" />

                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                                                            Options (one per line or comma-separated)
                                                        </label>
                                                        <textarea
                                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 min-h-[140px] text-sm"
                                                            placeholder={"Option 1\nOption 2\nOption 3"}
                                                            value={fieldData.options}
                                                            onChange={(e) => setFieldData({ ...fieldData, options: e.target.value })}
                                                            required
                                                        />
                                                        {fieldData.options && (
                                                            <div className="flex flex-wrap gap-1.5 px-1">
                                                                {fieldData.options.split(/[,\n]/).map((o: string) => o.trim()).filter(Boolean).map((opt: string, i: number) => (
                                                                    <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold">
                                                                        {opt}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : ['nationality', 'state', 'lga', 'gender', 'blood_group', 'phenotype'].includes(fieldData.type) ? (
                                                <div className="space-y-4">
                                                    {fieldData.type === 'gender' && (
                                                        <div className="space-y-3">
                                                            <div className="p-4 bg-emerald-50 rounded-2xl space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Users className="w-4 h-4 text-emerald-600" />
                                                                    <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Auto-populated</span>
                                                                </div>
                                                                <p className="text-[10px] font-bold text-emerald-600 leading-relaxed">Renders a dropdown with Male and Female options.</p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Options (editable)</label>
                                                                <textarea
                                                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] text-sm"
                                                                    value={fieldData.options || "Male, Female"}
                                                                    onChange={(e) => setFieldData({ ...fieldData, options: e.target.value })}
                                                                />
                                                                <div className="flex flex-wrap gap-1.5 px-1">
                                                                    {(fieldData.options || "Male, Female").split(/[,\n]/).map((o: string) => o.trim()).filter(Boolean).map((opt: string, i: number) => (
                                                                        <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold">{opt}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {fieldData.type === 'blood_group' && (
                                                        <div className="space-y-3">
                                                            <div className="p-4 bg-rose-50 rounded-2xl space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Droplet className="w-4 h-4 text-rose-600" />
                                                                    <span className="text-xs font-black text-rose-700 uppercase tracking-widest">Blood Group</span>
                                                                </div>
                                                                <p className="text-[10px] font-bold text-rose-600 leading-relaxed">Standard ABO blood groups with Rhesus factor. Edit the list below if your institution uses a different set.</p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Options (editable)</label>
                                                                <textarea
                                                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] text-sm"
                                                                    value={fieldData.options || "A+, A-, B+, B-, AB+, AB-, O+, O-"}
                                                                    onChange={(e) => setFieldData({ ...fieldData, options: e.target.value })}
                                                                />
                                                                <div className="flex flex-wrap gap-1.5 px-1">
                                                                    {(fieldData.options || "A+, A-, B+, B-, AB+, AB-, O+, O-").split(/[,\n]/).map((o: string) => o.trim()).filter(Boolean).map((opt: string, i: number) => (
                                                                        <span key={i} className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold">{opt}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {fieldData.type === 'phenotype' && (
                                                        <div className="space-y-3">
                                                            <div className="p-4 bg-violet-50 rounded-2xl space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Dna className="w-4 h-4 text-violet-600" />
                                                                    <span className="text-xs font-black text-violet-700 uppercase tracking-widest">Phenotype / Genotype</span>
                                                                </div>
                                                                <p className="text-[10px] font-bold text-violet-600 leading-relaxed">Sickle cell genotype status. Edit the list below if needed.</p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Options (editable)</label>
                                                                <textarea
                                                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px] text-sm"
                                                                    value={fieldData.options || "AA, AS, AC, SS, SC, CC"}
                                                                    onChange={(e) => setFieldData({ ...fieldData, options: e.target.value })}
                                                                />
                                                                <div className="flex flex-wrap gap-1.5 px-1">
                                                                    {(fieldData.options || "AA, AS, AC, SS, SC, CC").split(/[,\n]/).map((o: string) => o.trim()).filter(Boolean).map((opt: string, i: number) => (
                                                                        <span key={i} className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-lg text-[10px] font-bold">{opt}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {['nationality', 'state', 'lga'].includes(fieldData.type) && (
                                                        <div className="py-12 text-center space-y-3">
                                                            <div className="p-4 bg-emerald-100 rounded-2xl w-fit mx-auto">
                                                                <Globe className="w-8 h-8 text-emerald-600 mx-auto" />
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-500">No manual options needed</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">
                                                                {fieldData.type === 'nationality' && "A full country list is auto-populated at render time."}
                                                                {fieldData.type === 'state' && "All 36 Nigerian states + FCT are auto-populated at render time."}
                                                                {fieldData.type === 'lga' && "L.G.A options are dynamically filtered based on the applicant's state selection."}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : fieldData.type === 'image' ? (
                                                <div className="space-y-4">
                                                    <div className="p-4 bg-sky-50 rounded-2xl space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Image className="w-4 h-4 text-sky-600" />
                                                            <span className="text-xs font-black text-sky-700 uppercase tracking-widest">Static Image / Banner</span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-sky-600 leading-relaxed">
                                                            This field displays a static image on the form. Use it for school logos, instructional banners, sample passport photos, or any visual element. Applicants see this image but cannot edit it.
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Image URL</label>
                                                        <input
                                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                                            placeholder="https://example.com/logo.png or /uploads/branding/logo.png"
                                                            value={fieldData.options || ""}
                                                            onChange={(e) => setFieldData({ ...fieldData, options: e.target.value })}
                                                        />
                                                        <p className="text-[9px] font-bold text-slate-400 px-1">Paste a full URL or a relative path like /uploads/branding/logo.png</p>
                                                    </div>
                                                    {fieldData.options && (
                                                        <div className="p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Preview</p>
                                                            <img
                                                                src={fieldData.options}
                                                                alt={fieldData.label || "Image preview"}
                                                                className="max-w-full h-auto max-h-48 rounded-xl object-contain mx-auto"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                    const errEl = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                                                    if (errEl) errEl.style.display = 'block';
                                                                }}
                                                            />
                                                            <p className="text-xs text-red-400 font-bold hidden">Image failed to load. Check the URL.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : fieldData.type === 'olevel_result' ? (
                                                <div className="py-12 text-center space-y-3">
                                                    <div className="p-4 bg-amber-100 rounded-2xl w-fit mx-auto">
                                                        <Layout className="w-8 h-8 text-amber-600 mx-auto" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-500">Grid field — auto-generated</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">
                                                        This renders a structured grid where applicants enter up to 8 O-Level subjects with grades. No manual options needed.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="py-12 text-center space-y-3">
                                                    <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto">
                                                        <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-400">No options for this field type</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Switch to Select, Radio, or Checkbox Group to configure options here.</p>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="validation" className="space-y-5 mt-4 pb-4">
                                            {(fieldData.type === 'text' || fieldData.type === 'number' || fieldData.type === 'textarea' || fieldData.type === 'phone') && (
                                                <div className="p-5 bg-amber-50 rounded-2xl space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-600">Validation Rules</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {(fieldData.type === 'text' || fieldData.type === 'textarea' || fieldData.type === 'phone') && (
                                                            <>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-amber-500 uppercase">Min Length</label>
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                                                        placeholder="0"
                                                                        min="0"
                                                                        value={(() => {
                                                                            try { return JSON.parse(fieldData.validationRules || '{}').minLength || ''; } catch { return ''; }
                                                                        })()}
                                                                        onChange={(e) => {
                                                                            try {
                                                                                const rules = JSON.parse(fieldData.validationRules || '{}');
                                                                                rules.minLength = e.target.value ? parseInt(e.target.value) : undefined;
                                                                                setFieldData({ ...fieldData, validationRules: JSON.stringify(rules) });
                                                                            } catch {}
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-amber-500 uppercase">Max Length</label>
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                                                        placeholder="No limit"
                                                                        min="0"
                                                                        value={(() => {
                                                                            try { return JSON.parse(fieldData.validationRules || '{}').maxLength || ''; } catch { return ''; }
                                                                        })()}
                                                                        onChange={(e) => {
                                                                            try {
                                                                                const rules = JSON.parse(fieldData.validationRules || '{}');
                                                                                rules.maxLength = e.target.value ? parseInt(e.target.value) : undefined;
                                                                                setFieldData({ ...fieldData, validationRules: JSON.stringify(rules) });
                                                                            } catch {}
                                                                        }}
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                        {fieldData.type === 'number' && (
                                                            <>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-amber-500 uppercase">Min Value</label>
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                                                        placeholder="No min"
                                                                        value={(() => {
                                                                            try { return JSON.parse(fieldData.validationRules || '{}').min || ''; } catch { return ''; }
                                                                        })()}
                                                                        onChange={(e) => {
                                                                            try {
                                                                                const rules = JSON.parse(fieldData.validationRules || '{}');
                                                                                rules.min = e.target.value ? parseFloat(e.target.value) : undefined;
                                                                                setFieldData({ ...fieldData, validationRules: JSON.stringify(rules) });
                                                                            } catch {}
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-amber-500 uppercase">Max Value</label>
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                                                        placeholder="No max"
                                                                        value={(() => {
                                                                            try { return JSON.parse(fieldData.validationRules || '{}').max || ''; } catch { return ''; }
                                                                        })()}
                                                                        onChange={(e) => {
                                                                            try {
                                                                                const rules = JSON.parse(fieldData.validationRules || '{}');
                                                                                rules.max = e.target.value ? parseFloat(e.target.value) : undefined;
                                                                                setFieldData({ ...fieldData, validationRules: JSON.stringify(rules) });
                                                                            } catch {}
                                                                        }}
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    {(fieldData.type === 'text' || fieldData.type === 'textarea' || fieldData.type === 'phone') && (
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold text-amber-500 uppercase">Pattern (Regex)</label>
                                                            <input
                                                                className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                                                placeholder="e.g. ^[A-Za-z]+$"
                                                                value={(() => {
                                                                    try { return JSON.parse(fieldData.validationRules || '{}').pattern || ''; } catch { return ''; }
                                                                })()}
                                                                onChange={(e) => {
                                                                    try {
                                                                        const rules = JSON.parse(fieldData.validationRules || '{}');
                                                                        rules.pattern = e.target.value || undefined;
                                                                        setFieldData({ ...fieldData, validationRules: JSON.stringify(rules) });
                                                                    } catch {}
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {!['text', 'number', 'textarea', 'phone'].includes(fieldData.type) && (
                                                <div className="py-12 text-center space-y-3">
                                                    <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto">
                                                        <Hash className="w-8 h-8 text-slate-300 mx-auto" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-400">No validation rules for this type</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validation rules are available for text, number, textarea, and phone fields.</p>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="logic" className="space-y-5 mt-4 pb-4">
                                            <div className="p-5 bg-purple-50 rounded-2xl space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id="enableConditional"
                                                        className="w-4 h-4 rounded accent-purple-600"
                                                        checked={(() => {
                                                            try { return JSON.parse(fieldData.conditionalLogic || '{}').enabled || false; } catch { return false; }
                                                        })()}
                                                        onChange={(e) => {
                                                            try {
                                                                const logic = JSON.parse(fieldData.conditionalLogic || '{}');
                                                                logic.enabled = e.target.checked;
                                                                setFieldData({ ...fieldData, conditionalLogic: JSON.stringify(logic) });
                                                            } catch {
                                                                setFieldData({ ...fieldData, conditionalLogic: JSON.stringify({ enabled: e.target.checked, sourceField: '', operator: 'equals', value: '' }) });
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor="enableConditional" className="text-xs font-black uppercase tracking-widest text-purple-700 cursor-pointer">Conditional Visibility</label>
                                                </div>
                                                {(() => {
                                                    try {
                                                        const logic = JSON.parse(fieldData.conditionalLogic || '{}');
                                                        return logic.enabled;
                                                    } catch { return false; }
                                                })() && (
                                                    <div className="space-y-3 pt-2">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold text-purple-500 uppercase">Show this field when...</label>
                                                            <select
                                                                className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                                                value={(() => {
                                                                    try { return JSON.parse(fieldData.conditionalLogic || '{}').sourceField || ''; } catch { return ''; }
                                                                })()}
                                                                onChange={(e) => {
                                                                    try {
                                                                        const logic = JSON.parse(fieldData.conditionalLogic || '{}');
                                                                        logic.sourceField = e.target.value;
                                                                        setFieldData({ ...fieldData, conditionalLogic: JSON.stringify(logic) });
                                                                    } catch {}
                                                                }}
                                                            >
                                                                <option value="">Select a field...</option>
                                                                {template?.sections?.flatMap((s: any) => s.fields || []).filter((f: any) => f.id !== editingFieldId).map((f: any) => (
                                                                    <option key={f.id} value={f.label}>{f.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-bold text-purple-500 uppercase">Operator</label>
                                                                <select
                                                                    className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                                                    value={(() => {
                                                                        try { return JSON.parse(fieldData.conditionalLogic || '{}').operator || 'equals'; } catch { return 'equals'; }
                                                                    })()}
                                                                    onChange={(e) => {
                                                                        try {
                                                                            const logic = JSON.parse(fieldData.conditionalLogic || '{}');
                                                                            logic.operator = e.target.value;
                                                                            setFieldData({ ...fieldData, conditionalLogic: JSON.stringify(logic) });
                                                                        } catch {}
                                                                    }}
                                                                >
                                                                    <option value="equals">Equals</option>
                                                                    <option value="notEquals">Not Equals</option>
                                                                    <option value="contains">Contains</option>
                                                                    <option value="notEmpty">Is Not Empty</option>
                                                                </select>
                                                            </div>
                                                            {(() => {
                                                                try {
                                                                    const logic = JSON.parse(fieldData.conditionalLogic || '{}');
                                                                    return logic.operator !== 'notEmpty';
                                                                } catch { return true; }
                                                            })() && (
                                                                <div className="space-y-1">
                                                                    <label className="text-[9px] font-bold text-purple-500 uppercase">Value</label>
                                                                    <input
                                                                        className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                                                        placeholder="Expected value"
                                                                        value={(() => {
                                                                            try { return JSON.parse(fieldData.conditionalLogic || '{}').value || ''; } catch { return ''; }
                                                                        })()}
                                                                        onChange={(e) => {
                                                                            try {
                                                                                const logic = JSON.parse(fieldData.conditionalLogic || '{}');
                                                                                logic.value = e.target.value;
                                                                                setFieldData({ ...fieldData, conditionalLogic: JSON.stringify(logic) });
                                                                            } catch {}
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <Separator className="bg-slate-100" />

                                            <div className="p-5 bg-indigo-50 rounded-2xl space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="checkbox"
                                                        id="isSystemField"
                                                        className="w-5 h-5 rounded-lg accent-indigo-600"
                                                        checked={fieldData.isSystemField}
                                                        onChange={(e) => setFieldData({ ...fieldData, isSystemField: e.target.checked })}
                                                    />
                                                    <label htmlFor="isSystemField" className="text-xs font-black uppercase tracking-widest text-indigo-700 cursor-pointer italic">Bind to System Identity</label>
                                                </div>
                                                {fieldData.isSystemField && (
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-indigo-400">System Key Mapper</label>
                                                        <select
                                                            className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-black outline-none"
                                                            value={fieldData.systemKey}
                                                            onChange={(e) => setFieldData({ ...fieldData, systemKey: e.target.value })}
                                                        >
                                                            <option value="">Select identity mapping...</option>
                                                            <option value="firstName">First Name</option>
                                                            <option value="lastName">Last Name</option>
                                                            <option value="dob">Date of Birth (Used for Age Calc)</option>
                                                            <option value="gender">Gender</option>
                                                            <option value="email">Email</option>
                                                            <option value="phone">Phone Number</option>
                                                            <option value="nin">National Identification Number (NIN)</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>

                            <div className="px-8 py-5 border-t border-slate-200 bg-white flex gap-4">
                                <Button type="button" variant="ghost" onClick={() => { setShowFieldModal(false); setEditingFieldId(null); resetFieldData(); }} className="flex-1 font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest">Cancel</Button>
                                <Button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100">{editingFieldId ? "Update Field" : "Save Field"}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
            {showSettingsModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col border-none shadow-2xl rounded-[3rem] overflow-hidden animate-in fade-in zoom-in duration-300">
                        <CardHeader className="bg-slate-900 text-white p-8 shrink-0">
                            <CardTitle className="text-2xl font-black italic uppercase">Form Template Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 bg-white overflow-y-auto custom-scrollbar flex-1">
                            <form onSubmit={handleSaveSettings} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Form Title</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g. 2026/2027 Admission"
                                            value={settingsData.name}
                                            onChange={(e) => setSettingsData({...settingsData, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Custom Public URL (Slug)</label>
                                        <input 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g. primary-intake-2026"
                                            value={settingsData.slug}
                                            onChange={(e) => setSettingsData({...settingsData, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                                            required
                                        />
                                        <p className="text-[9px] font-bold text-slate-500 px-1">Current URL: /admission/{template.slug}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Flow Type</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={settingsData.flowType}
                                            onChange={(e) => setSettingsData({...settingsData, flowType: e.target.value})}
                                        >
                                            <option value="form_first">Form First (Free/Pay Later)</option>
                                            <option value="payment_first">Payment First (Pay to Access)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Link Fee Structure</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={settingsData.feeStructureId}
                                            onChange={(e) => setSettingsData({...settingsData, feeStructureId: e.target.value})}
                                            required={settingsData.flowType === 'payment_first'}
                                        >
                                            <option value="">No Fee Structure</option>
                                            {feeStructures.map(fs => (
                                                <option key={fs.id} value={fs.id}>{fs.name} (₦{parseFloat(fs.totalAmount).toLocaleString()})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Application Fee (₦)</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={settingsData.applicationFee}
                                            onChange={(e) => setSettingsData({...settingsData, applicationFee: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Platform Processing Fee (₦)</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={settingsData.processingFee}
                                            onChange={(e) => setSettingsData({...settingsData, processingFee: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Start Date</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={settingsData.startDate}
                                            onChange={(e) => setSettingsData({...settingsData, startDate: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">End Date</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={settingsData.endDate}
                                            onChange={(e) => setSettingsData({...settingsData, endDate: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button 
                                        type="button" variant="ghost"
                                        onClick={() => setShowSettingsModal(false)}
                                        className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit"
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {showAgeModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden animate-in fade-in zoom-in duration-300">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <CardTitle className="text-2xl font-black italic uppercase">Age Eligibility Rule</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6 bg-white">
                            <form onSubmit={handleSaveAgeRule} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Minimum Age (Years)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. 16 (leave blank for no restriction)"
                                        value={minAgeInput}
                                        onChange={(e) => setMinAgeInput(e.target.value)}
                                    />
                                    <p className="text-[10px] font-bold text-slate-500 px-1">
                                        Applicants younger than this age (based on date of birth or NIN data) will be blocked from proceeding. Leave blank to remove the restriction.
                                    </p>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button" variant="ghost"
                                        onClick={() => setShowAgeModal(false)}
                                        className="flex-1 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={savingAgeRule}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest"
                                    >
                                        {savingAgeRule ? "Saving..." : "Save Rule"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
