/**
 * Authoritative Indian States & Union Territories with Major Districts
 * For VaahanSafe Doorstep Courier Delivery & Logistics Routing
 */

export interface IndianStateData {
  code: string;
  name: string;
  districts: string[];
}

export const INDIAN_STATES_DATA: IndianStateData[] = [
  {
    code: "AN",
    name: "Andaman and Nicobar Islands",
    districts: ["Nicobar", "North and Middle Andaman", "South Andaman"],
  },
  {
    code: "AP",
    name: "Andhra Pradesh",
    districts: [
      "Alluri Sitharama Raju",
      "Anakapalli",
      "Ananthapuramu",
      "Annamayya",
      "Bapatla",
      "Chittoor",
      "Dr. B.R. Ambedkar Konaseema",
      "East Godavari",
      "Eluru",
      "Guntur",
      "Kakinada",
      "Krishna",
      "Kurnool",
      "Nandyal",
      "NTR",
      "Palnadu",
      "Parvathipuram Manyam",
      "Prakasam",
      "Sri Potti Sriramulu Nellore",
      "Sri Sathya Sai",
      "Srikakulam",
      "Tirupati",
      "Visakhapatnam",
      "Vizianagaram",
      "West Godavari",
      "YSR Kadapa",
    ],
  },
  {
    code: "AR",
    name: "Arunachal Pradesh",
    districts: [
      "Anjaw",
      "Changlang",
      "Dibang Valley",
      "East Kameng",
      "East Siang",
      "Itanagar Capital Complex",
      "Kamle",
      "Kra Daadi",
      "Kurung Kumey",
      "Leparada",
      "Lohit",
      "Longding",
      "Lower Dibang Valley",
      "Lower Siang",
      "Lower Subansiri",
      "Namsai",
      "Pakke Kessang",
      "Papum Pare",
      "Shi Yomi",
      "Siang",
      "Tawang",
      "Tirap",
      "Upper Siang",
      "Upper Subansiri",
      "West Kameng",
      "West Siang",
    ],
  },
  {
    code: "AS",
    name: "Assam",
    districts: [
      "Baksa",
      "Barpeta",
      "Biswanath",
      "Bongaigaon",
      "Cachar",
      "Charaideo",
      "Chirang",
      "Darrang",
      "Dhemaji",
      "Dhubri",
      "Dibrugarh",
      "Dima Hasao",
      "Goalpara",
      "Golaghat",
      "Hailakandi",
      "Hojai",
      "Jorhat",
      "Kamrup",
      "Kamrup Metropolitan",
      "Karbi Anglong",
      "Karimganj",
      "Kokrajhar",
      "Lakhimpur",
      "Majuli",
      "Morigaon",
      "Nagaon",
      "Nalbari",
      "Sivasagar",
      "Sonitpur",
      "South Salmara-Mankachar",
      "Tinsukia",
      "Udalguri",
      "West Karbi Anglong",
    ],
  },
  {
    code: "BR",
    name: "Bihar",
    districts: [
      "Araria",
      "Arwal",
      "Aurangabad",
      "Banka",
      "Begusarai",
      "Bhagalpur",
      "Bhojpur",
      "Buxar",
      "Darbhanga",
      "East Champaran (Motihari)",
      "Gaya",
      "Gopalganj",
      "Jamui",
      "Jehanabad",
      "Kaimur (Bhabua)",
      "Katihar",
      "Khagaria",
      "Kishanganj",
      "Lakhisarai",
      "Madhepura",
      "Madhubani",
      "Munger",
      "Muzaffarpur",
      "Nalanda",
      "Nawada",
      "Patna",
      "Purnia",
      "Rohtas (Sasaram)",
      "Saharsa",
      "Samastipur",
      "Saran (Chhapra)",
      "Sheikhpura",
      "Sheohar",
      "Sitamarhi",
      "Siwan",
      "Supaul",
      "Vaishali (Hajipur)",
      "West Champaran (Bettiah)",
    ],
  },
  {
    code: "CH",
    name: "Chandigarh",
    districts: ["Chandigarh"],
  },
  {
    code: "CT",
    name: "Chhattisgarh",
    districts: [
      "Balod",
      "Baloda Bazar-Bhatapara",
      "Balrampur-Ramanujganj",
      "Bastar (Jagdalpur)",
      "Bemetara",
      "Bijapur",
      "Bilaspur",
      "Dakshin Bastar Dantewada",
      "Dhamtari",
      "Durg",
      "Gariaband",
      "Gaurela-Pendra-Marwahi",
      "Janjgir-Champa",
      "Jashpur",
      "Kabeerdham (Kawardha)",
      "Khairagarh-Chhuikhadan-Gandai",
      "Kondagaon",
      "Korba",
      "Koriya",
      "Mahasamund",
      "Manendragarh-Chirmiri-Bharatpur",
      "Mohla-Manpur-Ambagarh Chowki",
      "Mungeli",
      "Narayanpur",
      "Raigarh",
      "Raipur",
      "Rajnandgaon",
      "Sakti",
      "Sarangarh-Bilaigarh",
      "Sukma",
      "Surajpur",
      "Surguja (Ambikapur)",
      "Uttar Bastar Kanker",
    ],
  },
  {
    code: "DH",
    name: "Dadra and Nagar Haveli and Daman and Diu",
    districts: ["Dadra and Nagar Haveli", "Daman", "Diu"],
  },
  {
    code: "DL",
    name: "Delhi",
    districts: [
      "Central Delhi",
      "East Delhi",
      "New Delhi",
      "North Delhi",
      "North East Delhi",
      "North West Delhi",
      "Shahdara",
      "South Delhi",
      "South East Delhi",
      "South West Delhi",
      "West Delhi",
    ],
  },
  {
    code: "GA",
    name: "Goa",
    districts: ["North Goa", "South Goa"],
  },
  {
    code: "GJ",
    name: "Gujarat",
    districts: [
      "Ahmedabad",
      "Amreli",
      "Anand",
      "Aravalli",
      "Banaskantha (Palanpur)",
      "Bharuch",
      "Bhavnagar",
      "Botad",
      "Chhota Udepur",
      "Dahod",
      "Dangs (Ahwa)",
      "Devbhumi Dwarka",
      "Gandhinagar",
      "Gir Somnath",
      "Jamnagar",
      "Junagadh",
      "Kheda (Nadiad)",
      "Kutch (Bhuj)",
      "Mahisagar",
      "Mehsana",
      "Morbi",
      "Narmada (Rajpipla)",
      "Navsari",
      "Panchmahal (Godhra)",
      "Patan",
      "Porbandar",
      "Rajkot",
      "Sabarkantha (Himmatnagar)",
      "Surat",
      "Surendranagar",
      "Tapi (Vyara)",
      "Vadodara",
      "Valsad",
    ],
  },
  {
    code: "HR",
    name: "Haryana",
    districts: [
      "Ambala",
      "Bhiwani",
      "Charkhi Dadri",
      "Faridabad",
      "Fatehabad",
      "Gurugram",
      "Hisar",
      "Jhajjar",
      "Jind",
      "Kaithal",
      "Karnal",
      "Kurukshetra",
      "Mahendragarh (Narnaul)",
      "Nuh",
      "Palwal",
      "Panchkula",
      "Panipat",
      "Rewari",
      "Rohtak",
      "Sirsa",
      "Sonipat",
      "Yamunanagar",
    ],
  },
  {
    code: "HP",
    name: "Himachal Pradesh",
    districts: [
      "Bilaspur",
      "Chamba",
      "Hamirpur",
      "Kangra (Dharamshala)",
      "Kinnaur (Reckong Peo)",
      "Kullu",
      "Lahaul and Spiti (Keylong)",
      "Mandi",
      "Shimla",
      "Sirmaur (Nahan)",
      "Solan",
      "Una",
    ],
  },
  {
    code: "JK",
    name: "Jammu and Kashmir",
    districts: [
      "Anantnag",
      "Bandipora",
      "Baramulla",
      "Budgam",
      "Doda",
      "Ganderbal",
      "Jammu",
      "Kathua",
      "Kishtwar",
      "Kulgam",
      "Kupwara",
      "Poonch",
      "Pulwama",
      "Rajouri",
      "Ramban",
      "Reasi",
      "Samba",
      "Shopian",
      "Srinagar",
      "Udhampur",
    ],
  },
  {
    code: "JH",
    name: "Jharkhand",
    districts: [
      "Bokaro",
      "Chatra",
      "Deoghar",
      "Dhanbad",
      "Dumka",
      "East Singhbhum (Jamshedpur)",
      "Garhwa",
      "Giridih",
      "Godda",
      "Gumla",
      "Hazaribagh",
      "Jamtara",
      "Khunti",
      "Koderma",
      "Latehar",
      "Lohardaga",
      "Pakur",
      "Palamu (Daltonganj)",
      "Ramgarh",
      "Ranchi",
      "Sahebganj",
      "Saraikela Kharsawan",
      "Simdega",
      "West Singhbhum (Chaibasa)",
    ],
  },
  {
    code: "KA",
    name: "Karnataka",
    districts: [
      "Bagalkote",
      "Ballari (Bellary)",
      "Belagavi (Belgaum)",
      "Bengaluru Rural",
      "Bengaluru Urban",
      "Bidar",
      "Chamarajanagar",
      "Chikkaballapura",
      "Chikkamagaluru (Chikmagalur)",
      "Chitradurga",
      "Dakshina Kannada (Mangaluru)",
      "Davanagere",
      "Dharwad (Hubballi)",
      "Gadag",
      "Hassan",
      "Haveri",
      "Kalaburagi (Gulbarga)",
      "Kodagu (Madikeri)",
      "Kolar",
      "Koppal",
      "Mandya",
      "Mysuru (Mysore)",
      "Raichur",
      "Ramanagara",
      "Shivamogga (Shimoga)",
      "Tumakuru (Tumkur)",
      "Udupi",
      "Uttara Kannada (Karwar)",
      "Vijayanagara",
      "Vijayapura (Bijapur)",
      "Yadgir",
    ],
  },
  {
    code: "KL",
    name: "Kerala",
    districts: [
      "Alappuzha",
      "Ernakulam (Kochi)",
      "Idukki",
      "Kannur",
      "Kasaragod",
      "Kollam",
      "Kottayam",
      "Kozhikode",
      "Malappuram",
      "Palakkad",
      "Pathanamthitta",
      "Thiruvananthapuram",
      "Thrissur",
      "Wayanad",
    ],
  },
  {
    code: "LA",
    name: "Ladakh",
    districts: ["Kargil", "Leh"],
  },
  {
    code: "LD",
    name: "Lakshadweep",
    districts: ["Lakshadweep (Kavaratti)"],
  },
  {
    code: "MP",
    name: "Madhya Pradesh",
    districts: [
      "Agar Malwa",
      "Alirajpur",
      "Anuppur",
      "Ashoknagar",
      "Balaghat",
      "Barwani",
      "Betul",
      "Bhind",
      "Bhopal",
      "Burhanpur",
      "Chhatarpur",
      "Chhindwara",
      "Damoh",
      "Datia",
      "Dewas",
      "Dhar",
      "Dindori",
      "Guna",
      "Gwalior",
      "Harda",
      "Hoshangabad (Narmadapuram)",
      "Indore",
      "Jabalpur",
      "Jhabua",
      "Katni",
      "Khandwa",
      "Khargone",
      "Maihar",
      "Mandla",
      "Mandsaur",
      "Morena",
      "Narsinghpur",
      "Neemuch",
      "Niwari",
      "Panna",
      "Raisen",
      "Rajgarh",
      "Ratlam",
      "Rewa",
      "Sagar",
      "Satna",
      "Sehore",
      "Seoni",
      "Shahdol",
      "Shajapur",
      "Sheopur",
      "Shivpuri",
      "Sidhi",
      "Singrauli",
      "Tikamgarh",
      "Ujjain",
      "Umaria",
      "Vidisha",
    ],
  },
  {
    code: "MH",
    name: "Maharashtra",
    districts: [
      "Ahmednagar (Ahilyanagar)",
      "Akola",
      "Amravati",
      "Chhatrapati Sambhajinagar (Aurangabad)",
      "Beed",
      "Bhandara",
      "Buldhana",
      "Chandrapur",
      "Dhule",
      "Dharashiv (Osmanabad)",
      "Gadchiroli",
      "Gondia",
      "Hingoli",
      "Jalgaon",
      "Jalna",
      "Kolhapur",
      "Latur",
      "Mumbai City",
      "Mumbai Suburban",
      "Nagpur",
      "Nanded",
      "Nandurbar",
      "Nashik",
      "Palghar",
      "Parbhani",
      "Pune",
      "Raigad (Alibag)",
      "Ratnagiri",
      "Sangli",
      "Satara",
      "Sindhudurg",
      "Solapur",
      "Thane",
      "Wardha",
      "Washim",
      "Yavatmal",
    ],
  },
  {
    code: "MN",
    name: "Manipur",
    districts: [
      "Bishnupur",
      "Chandel",
      "Churachandpur",
      "Imphal East",
      "Imphal West",
      "Jiribam",
      "Kakching",
      "Kamjong",
      "Kangpokpi",
      "Noney",
      "Pherzawl",
      "Senapati",
      "Tamenglong",
      "Tengnoupal",
      "Thoubal",
      "Ukhrul",
    ],
  },
  {
    code: "ML",
    name: "Meghalaya",
    districts: [
      "East Garo Hills",
      "East Jaintia Hills",
      "East Khasi Hills (Shillong)",
      "Eastern West Khasi Hills",
      "North Garo Hills",
      "Ri Bhoi",
      "South Garo Hills",
      "South West Garo Hills",
      "South West Khasi Hills",
      "West Garo Hills (Tura)",
      "West Jaintia Hills (Jowai)",
      "West Khasi Hills",
    ],
  },
  {
    code: "MZ",
    name: "Mizoram",
    districts: [
      "Aizawl",
      "Champhai",
      "Hnahthial",
      "Khawzawl",
      "Kolasib",
      "Lawngtlai",
      "Lunglei",
      "Mamit",
      "Saitual",
      "Serchhip",
      "Siaha",
    ],
  },
  {
    code: "NL",
    name: "Nagaland",
    districts: [
      "Chumoukedima",
      "Dimapur",
      "Kiphire",
      "Kohima",
      "Longleng",
      "Mokokchung",
      "Mon",
      "Niuland",
      "Noklak",
      "Peren",
      "Phek",
      "Shamator",
      "Tseminyu",
      "Tuensang",
      "Wokha",
      "Zunheboto",
    ],
  },
  {
    code: "OD",
    name: "Odisha",
    districts: [
      "Angul",
      "Balangir",
      "Balasore (Baleswar)",
      "Bargarh",
      "Bhadrak",
      "Boudh",
      "Cuttack",
      "Deogarh",
      "Dhenkanal",
      "Gajapati",
      "Ganjam (Berhampur)",
      "Jagatsinghpur",
      "Jajpur",
      "Jharsuguda",
      "Kalahandi",
      "Kandhamal",
      "Kendrapara",
      "Kendujhar (Keonjhar)",
      "Khordha (Bhubaneswar)",
      "Koraput",
      "Malkangiri",
      "Mayurbhanj",
      "Nabarangpur",
      "Nayagarh",
      "Nuapada",
      "Puri",
      "Rayagada",
      "Sambalpur",
      "Subarnapur (Sonepur)",
      "Sundargarh (Rourkela)",
    ],
  },
  {
    code: "PY",
    name: "Puducherry",
    districts: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  },
  {
    code: "PB",
    name: "Punjab",
    districts: [
      "Amritsar",
      "Barnala",
      "Bathinda",
      "Faridkot",
      "Fatehgarh Sahib",
      "Fazilka",
      "Ferozepur",
      "Gurdaspur",
      "Hoshiarpur",
      "Jalandhar",
      "Kapurthala",
      "Ludhiana",
      "Malerkotla",
      "Mansa",
      "Moga",
      "Muktsar",
      "Pathankot",
      "Patiala",
      "Rupnagar (Ropar)",
      "Sahibzada Ajit Singh Nagar (Mohali)",
      "Sangrur",
      "Shahid Bhagat Singh Nagar (Nawanshahr)",
      "Tarn Taran",
    ],
  },
  {
    code: "RJ",
    name: "Rajasthan",
    districts: [
      "Ajmer",
      "Alwar",
      "Anupgarh",
      "Balotra",
      "Banswara",
      "Baran",
      "Barmer",
      "Beawar",
      "Bharatpur",
      "Bhilwara",
      "Bikaner",
      "Bundi",
      "Chittorgarh",
      "Churu",
      "Dausa",
      "Deeg",
      "Dholpur",
      "Didwana-Kuchaman",
      "Dudu",
      "Dungarpur",
      "Ganganagar (Sri Ganganagar)",
      "Gangapur City",
      "Hanumangarh",
      "Jaipur",
      "Jaipur Rural",
      "Jaisalmer",
      "Jalore",
      "Jhalawar",
      "Jhunjhunu",
      "Jodhpur",
      "Jodhpur Rural",
      "Karauli",
      "Kekri",
      "Khairthal-Tijara",
      "Kota",
      "Kotputli-Behror",
      "Nagaur",
      "Neem Ka Thana",
      "Pali",
      "Phalodi",
      "Pratapgarh",
      "Rajsamand",
      "Salumbar",
      "Sanchore",
      "Sawai Madhopur",
      "Shahpura",
      "Sikar",
      "Sirohi",
      "Tonk",
      "Udaipur",
    ],
  },
  {
    code: "SK",
    name: "Sikkim",
    districts: [
      "Gangtok",
      "Gyalshing (West Sikkim)",
      "Mangan (North Sikkim)",
      "Namchi (South Sikkim)",
      "Pakyong",
      "Soreng",
    ],
  },
  {
    code: "TN",
    name: "Tamil Nadu",
    districts: [
      "Ariyalur",
      "Chengalpattu",
      "Chennai",
      "Coimbatore",
      "Cuddalore",
      "Dharmapuri",
      "Dindigul",
      "Erode",
      "Kallakurichi",
      "Kanchipuram",
      "Kanniyakumari (Nagercoil)",
      "Karur",
      "Krishnagiri",
      "Madurai",
      "Mayiladuthurai",
      "Nagapattinam",
      "Namakkal",
      "Nilgiris (Udhagamandalam)",
      "Perambalur",
      "Pudukkottai",
      "Ramanathapuram",
      "Ranipet",
      "Salem",
      "Sivaganga",
      "Tenkasi",
      "Thanjavur",
      "Theni",
      "Thoothukudi (Tuticorin)",
      "Tiruchirappalli (Trichy)",
      "Tirunelveli",
      "Tirupathur",
      "Tiruppur",
      "Tiruvallur",
      "Tiruvannamalai",
      "Tiruvarur",
      "Vellore",
      "Viluppuram",
      "Virudhunagar",
    ],
  },
  {
    code: "TS",
    name: "Telangana",
    districts: [
      "Adilabad",
      "Bhadradri Kothagudem",
      "Hanamkonda",
      "Hyderabad",
      "Jagtial",
      "Jangaon",
      "Jayashankar Bhupalpally",
      "Jogulamba Gadwal",
      "Kamareddy",
      "Karimnagar",
      "Khammam",
      "Kumuram Bheem Asifabad",
      "Mahabubabad",
      "Mahbubnagar",
      "Mancherial",
      "Medak",
      "Medchal-Malkajgiri",
      "Mulugu",
      "Nagarkurnool",
      "Nalgonda",
      "Narayanpet",
      "Nirmal",
      "Nizamabad",
      "Peddapalli (Ramagundam)",
      "Rajanna Sircilla",
      "Rangareddy",
      "Sangareddy",
      "Siddipet",
      "Suryapet",
      "Vikarabad",
      "Wanaparthy",
      "Warangal",
      "Yadadri Bhuvanagiri",
    ],
  },
  {
    code: "TR",
    name: "Tripura",
    districts: [
      "Dhalai",
      "Gomati",
      "Khowai",
      "North Tripura",
      "Sepahijala",
      "South Tripura",
      "Unakoti",
      "West Tripura (Agartala)",
    ],
  },
  {
    code: "UP",
    name: "Uttar Pradesh",
    districts: [
      "Agra",
      "Aligarh",
      "Ambedkar Nagar",
      "Amethi",
      "Amroha",
      "Auraiya",
      "Ayodhya (Faizabad)",
      "Azamgarh",
      "Baghpat",
      "Bahraich",
      "Ballia",
      "Balrampur",
      "Banda",
      "Barabanki",
      "Bareilly",
      "Basti",
      "Bhadohi",
      "Bijnor",
      "Budaun",
      "Bulandshahr",
      "Chandauli",
      "Chitrakoot",
      "Deoria",
      "Etah",
      "Etawah",
      "Farrukhabad",
      "Fatehpur",
      "Firozabad",
      "Gautam Buddha Nagar (Noida / Greater Noida)",
      "Ghaziabad",
      "Ghazipur",
      "Gonda",
      "Gorakhpur",
      "Hamirpur",
      "Hapur",
      "Hardoi",
      "Hathras",
      "Jalaun",
      "Jaunpur",
      "Jhansi",
      "Kannauj",
      "Kanpur Dehat",
      "Kanpur Nagar",
      "Kasganj",
      "Kaushambi",
      "Kheri (Lakhimpur)",
      "Kushinagar",
      "Lalitpur",
      "Lucknow",
      "Maharajganj",
      "Mahoba",
      "Mainpuri",
      "Mathura",
      "Mau",
      "Meerut",
      "Mirzapur",
      "Moradabad",
      "Muzaffarnagar",
      "Pilibhit",
      "Pratapgarh",
      "Prayagraj (Allahabad)",
      "Raebareli",
      "Rampur",
      "Saharanpur",
      "Sambhal",
      "Sant Kabir Nagar",
      "Shahjahanpur",
      "Shamli",
      "Shravasti",
      "Siddharthnagar",
      "Sitapur",
      "Sonbhadra",
      "Sultanpur",
      "Unnao",
      "Varanasi",
    ],
  },
  {
    code: "UK",
    name: "Uttarakhand",
    districts: [
      "Almora",
      "Bageshwar",
      "Chamoli",
      "Champawat",
      "Dehradun",
      "Haridwar",
      "Nainital",
      "Pauri Garhwal",
      "Pithoragarh",
      "Rudraprayag",
      "Tehri Garhwal",
      "Udham Singh Nagar",
      "Uttarkashi",
    ],
  },
  {
    code: "WB",
    name: "West Bengal",
    districts: [
      "Alipurduar",
      "Bankura",
      "Birbhum",
      "Cooch Behar",
      "Dakshin Dinajpur",
      "Darjeeling",
      "Hooghly",
      "Howrah",
      "Jalpaiguri",
      "Jhargram",
      "Kalimpong",
      "Kolkata",
      "Malda",
      "Murshidabad",
      "Nadia",
      "North 24 Parganas",
      "Paschim Bardhaman",
      "Paschim Medinipur",
      "Purba Bardhaman",
      "Purba Medinipur",
      "Purulia",
      "South 24 Parganas",
      "Uttar Dinajpur",
    ],
  },
];

/**
 * Fast lookup for Indian postal PIN prefix (first 2 digits) to state
 */
const PINCODE_PREFIX_MAP: Record<string, string> = {
  "11": "Delhi",
  "12": "Haryana",
  "13": "Haryana",
  "14": "Punjab",
  "15": "Punjab",
  "16": "Chandigarh",
  "17": "Himachal Pradesh",
  "18": "Jammu and Kashmir",
  "19": "Jammu and Kashmir",
  "20": "Uttar Pradesh",
  "21": "Uttar Pradesh",
  "22": "Uttar Pradesh",
  "23": "Uttar Pradesh",
  "24": "Uttarakhand",
  "25": "Uttar Pradesh",
  "26": "Uttarakhand",
  "27": "Uttar Pradesh",
  "28": "Uttar Pradesh",
  "30": "Rajasthan",
  "31": "Rajasthan",
  "32": "Rajasthan",
  "33": "Rajasthan",
  "34": "Rajasthan",
  "36": "Gujarat",
  "37": "Gujarat",
  "38": "Gujarat",
  "39": "Gujarat",
  "40": "Maharashtra",
  "41": "Maharashtra",
  "42": "Maharashtra",
  "43": "Maharashtra",
  "44": "Maharashtra",
  "45": "Madhya Pradesh",
  "46": "Madhya Pradesh",
  "47": "Madhya Pradesh",
  "48": "Madhya Pradesh",
  "49": "Chhattisgarh",
  "50": "Telangana",
  "51": "Andhra Pradesh",
  "52": "Andhra Pradesh",
  "53": "Andhra Pradesh",
  "56": "Karnataka",
  "57": "Karnataka",
  "58": "Karnataka",
  "59": "Karnataka",
  "60": "Tamil Nadu",
  "61": "Tamil Nadu",
  "62": "Tamil Nadu",
  "63": "Tamil Nadu",
  "64": "Tamil Nadu",
  "67": "Kerala",
  "68": "Kerala",
  "69": "Kerala",
  "70": "West Bengal",
  "71": "West Bengal",
  "72": "West Bengal",
  "73": "West Bengal",
  "74": "West Bengal",
  "75": "Odisha",
  "76": "Odisha",
  "77": "Odisha",
  "78": "Assam",
  "79": "Meghalaya",
  "80": "Bihar",
  "81": "Jharkhand",
  "82": "Jharkhand",
  "83": "Jharkhand",
  "84": "Bihar",
  "85": "Bihar",
};

/**
 * Returns all Indian states/UTs sorted alphabetically
 */
export function getIndianStates(): string[] {
  return INDIAN_STATES_DATA.map((s) => s.name).sort((a, b) => a.localeCompare(b));
}

/**
 * Returns districts for a given state, or empty array if not found
 */
export function getDistrictsForState(stateName: string): string[] {
  if (!stateName) return [];
  const normalized = stateName.trim().toLowerCase();
  const found = INDIAN_STATES_DATA.find(
    (s) => s.name.toLowerCase() === normalized || s.code.toLowerCase() === normalized
  );
  return found ? [...found.districts].sort((a, b) => a.localeCompare(b)) : [];
}

/**
 * Fuzzy matches a state name from freeform text or geocoder result
 */
export function matchIndianState(rawState: string): string | null {
  if (!rawState) return null;
  const clean = rawState.trim().toLowerCase();
  
  // Direct match
  const exact = INDIAN_STATES_DATA.find(
    (s) => s.name.toLowerCase() === clean || s.code.toLowerCase() === clean
  );
  if (exact) return exact.name;

  // Substring match
  const partial = INDIAN_STATES_DATA.find(
    (s) => clean.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(clean)
  );
  return partial ? partial.name : null;
}

/**
 * Matches district within a state or across all states
 */
export function matchDistrict(stateName: string, rawCityOrDistrict: string): string | null {
  if (!rawCityOrDistrict) return null;
  const clean = rawCityOrDistrict.trim().toLowerCase();
  const districts = getDistrictsForState(stateName);

  // Exact match in state
  const exact = districts.find((d) => d.toLowerCase() === clean);
  if (exact) return exact;

  // Substring match in state
  const partial = districts.find(
    (d) => d.toLowerCase().includes(clean) || clean.includes(d.toLowerCase())
  );
  if (partial) return partial;

  return null;
}

/**
 * Fast offline prefix lookup for Indian PIN code
 */
export function lookupStateFromPincode(pincode: string): string | null {
  const digits = pincode.replace(/\D/g, "");
  if (digits.length < 2) return null;
  const prefix = digits.slice(0, 2);
  return PINCODE_PREFIX_MAP[prefix] || null;
}

export interface PincodeResolution {
  state: string;
  district: string;
  postOfficeName?: string;
  pincode: string;
  landmark?: string;
}

/**
 * Authoritative Indian Postal API lookup with offline fallback
 */
export async function resolvePincodeData(pincode: string): Promise<PincodeResolution | null> {
  const cleanPin = pincode.replace(/\D/g, "").slice(0, 6);
  if (cleanPin.length !== 6) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as Array<{
        Status: string;
        PostOffice?: Array<{
          Name: string;
          District: string;
          State: string;
        }>;
      }>;

      const firstResult = data?.[0];
      const firstPo = firstResult?.PostOffice?.[0];
      if (firstResult?.Status === "Success" && firstPo) {
        const canonicalState = matchIndianState(firstPo.State) || firstPo.State;
        const canonicalDistrict = matchDistrict(canonicalState, firstPo.District) || firstPo.District;
        const poName = firstPo.Name?.trim();
        const landmark = poName ? `Near ${poName} Post Office` : undefined;

        return {
          state: canonicalState,
          district: canonicalDistrict,
          postOfficeName: poName,
          pincode: cleanPin,
          landmark,
        };
      }
    }
  } catch {
    // Network or timeout failure; fall back to offline prefix map
  }

  // Fallback to offline prefix
  const offlineState = lookupStateFromPincode(cleanPin);
  if (offlineState) {
    return {
      state: offlineState,
      district: "",
      pincode: cleanPin,
    };
  }

  return null;
}

export interface ReverseGeocodeResult {
  state: string;
  district: string;
  city: string;
  pincode: string;
  locality?: string;
  road?: string;
  landmark?: string;
}

/**
 * Reverse geocode latitude/longitude coordinates via OpenStreetMap Nominatim
 */
export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "VaahanSafe-Address-Detector/1.0",
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as {
        name?: string;
        display_name?: string;
        address?: {
          state?: string;
          state_district?: string;
          county?: string;
          city?: string;
          town?: string;
          suburb?: string;
          neighbourhood?: string;
          road?: string;
          postcode?: string;
          landmark?: string;
          amenity?: string;
          building?: string;
          shop?: string;
          place_of_worship?: string;
          historic?: string;
          tourism?: string;
          leisure?: string;
          commercial?: string;
          office?: string;
          school?: string;
          hospital?: string;
          junction?: string;
          residential?: string;
        };
      };

      if (data?.address) {
        const rawState = data.address.state || "";
        const canonicalState = matchIndianState(rawState) || rawState;
        const rawDistrict =
          data.address.state_district ||
          data.address.county ||
          data.address.city ||
          data.address.town ||
          "";
        const canonicalDistrict =
          matchDistrict(canonicalState, rawDistrict) || rawDistrict;

        const rawPin = data.address.postcode ? data.address.postcode.replace(/\D/g, "").slice(0, 6) : "";
        const locality = data.address.suburb || data.address.neighbourhood || "";
        const road = data.address.road || "";

        // Extract landmark candidate from high-confidence POI / landmark / building / amenity tags
        const poiCandidate =
          data.address.landmark ||
          data.address.amenity ||
          (data.address.building && data.address.building !== "yes" ? data.address.building : "") ||
          data.address.shop ||
          data.address.place_of_worship ||
          data.address.hospital ||
          data.address.school ||
          data.address.junction ||
          data.address.historic ||
          data.address.tourism ||
          data.address.commercial ||
          data.address.office ||
          (data.name &&
          data.name !== road &&
          data.name !== data.address.city &&
          data.name !== data.address.town &&
          data.name !== locality &&
          data.name !== canonicalState
            ? data.name
            : "");

        let landmark = "";
        if (poiCandidate && typeof poiCandidate === "string") {
          const trimmed = poiCandidate.trim();
          if (trimmed.length > 1) {
            landmark = /^(near|opp|opposite|behind|beside|adj|adjacent)\b/i.test(trimmed)
              ? trimmed
              : `Near ${trimmed}`;
          }
        }

        // If no direct POI, check residential colony / complex name
        if (!landmark && data.address.residential && data.address.residential !== locality) {
          landmark = `Near ${data.address.residential.trim()}`;
        }

        // If still no landmark but we resolved a valid PIN, query India Post branch as fallback
        if (!landmark && rawPin) {
          try {
            const pinLookup = await resolvePincodeData(rawPin);
            if (pinLookup?.landmark) {
              landmark = pinLookup.landmark;
            }
          } catch {
            // ignore fallback error
          }
        }

        return {
          state: canonicalState,
          district: canonicalDistrict,
          city: data.address.city || data.address.town || canonicalDistrict,
          pincode: rawPin,
          locality,
          road,
          landmark,
        };
      }
    }
  } catch {
    // Reverse geocode failed
  }

  return null;
}
