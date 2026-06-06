import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, Circle, MapPin, Calendar, DollarSign, AlertCircle, FileText, User, Lock, Download, Image as ImageIcon, BarChart3, Users, LogOut, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, CalendarDays, List, HelpCircle, Edit2, Trash2, Save, Maximize2, Loader2, FileSpreadsheet, TrendingUp, Menu, MessageSquare, BookOpen, Clock, Power, Key, Thermometer, Droplets, Wind, Package, Trash, Shirt, Box, Play, Layers, PiggyBank, CreditCard, Coins, ShoppingCart, Percent, UserPlus, UserMinus, PlusCircle, MinusCircle, History, Wallet, Plus, PieChart, ArrowUp, ArrowDown, Calculator, Upload } from 'lucide-react';

// === Firebase Database Integration ===
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, addDoc, serverTimestamp } from 'firebase/firestore';

// =====================================================================
// 💡 Load Firebase Config
// =====================================================================
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyAjjEtx4Rkf7yGRaymWf9_tmUzf-yQ16Qg",
  authDomain: "heart-pop.firebaseapp.com",
  projectId: "heart-pop",
  projectName: "heart-pop",
  storageBucket: "heart-pop.firebasestorage.app",
  messagingSenderId: "711616458234",
  appId: "1:711616458234:web:bb3de45e0be2f6102c0843"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'heart-pop-app-prod';
const appId = rawAppId.replace(/\//g, '_');

// =====================================================================
// 💡 Constants (단가 및 설정)
// =====================================================================
const UNIT_PRICES = {
  rice: 2500,  // 쌀 1kg당 가격
  vinyl: 40,   // 포장 비닐 1장당 가격
  tie: 5,      // 빵끈 1개당 가격
};

const ACCOUNT_OPTIONS = ['기업은행', '카뱅1', '카뱅2', '쿠팡와우', '현대카드'];

// --- Helper Functions for Formatting ---
const formatComma = (val) => {
  if (!val && val !== 0) return '';
  const num = val.toString().replace(/[^0-9]/g, '');
  return num ? Number(num).toLocaleString() : '';
};

const parseComma = (val) => {
  return val.toString().replace(/[^0-9]/g, '');
};

// 고정 매니저 리스트 (사용자 요청에 의해 비움 -> DB에서 수동 등록한 이름만 불러옴)
const managerList = [];

// 비용 카테고리 리스트
const COST_CATEGORIES = [
  '재료', '급여', '소모품', '비품', '장비 구입', '보험료', '식비', 
  '임차료', '교통비', '차량유지비', '배송비(우편 및 용달)', '기타'
];

// 은은한 파스텔 매니저 컬러맵 적용
const managerColorMap = {
  '정윤이': 'bg-blue-50 text-blue-700 border-blue-200',
  '황진웅': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '최윤미': 'bg-amber-50 text-amber-700 border-amber-200',
  '장유미': 'bg-purple-50 text-purple-700 border-purple-200',
  '윤종규': 'bg-rose-50 text-rose-700 border-rose-200',
  'default': 'bg-gray-50 text-gray-700 border-gray-200'
};

const dynamicColors = [
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-teal-50 text-teal-700 border-teal-200'
];

const getManagerColor = (name) => {
  if (managerColorMap[name]) return managerColorMap[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return dynamicColors[hash % dynamicColors.length];
};

const photoNames = {
  riceBin: '쌀통',
  pot: '솥',
  desk: '매대 정면',
  report: '판매일보',
  key: '열쇠'
};

const inventoryTypeNames = {
  rice: '뻥쌀',
  tie: '빵끈',
  bag: '포장 비닐'
};

const openManualItems = [
  { id: 1, title: 'POS 전원 켜기 + KFPOS 프로그램 켜기', icon: <Power className="text-gray-500"/> },
  { id: 2, title: '돈통 열쇠 찾아서 열기', icon: <Key className="text-gray-500"/> },
  { id: 3, title: '기계 전원 연결 및 히터 켜기', icon: <Thermometer className="text-gray-500"/> },
  { id: 4, title: '아크릴 보관함 내부 세척(물티슈)', icon: <Droplets className="text-gray-500"/> },
  { id: 5, title: '매대 및 뒤쪽 보관함 전체 에어건 청소', icon: <Wind className="text-gray-500"/> },
  { id: 6, title: '포장 비닐, 위생장갑, 빵끈 꺼내기', icon: <Package className="text-gray-500"/> },
  { id: 7, title: '쓰레기 봉투 및 로스뻥튀기 봉투 부착', icon: <Trash className="text-gray-500"/> },
  { id: 8, title: '모자, 앞치마, 위생마스크, 이어플러그, 장갑 착용', icon: <Shirt className="text-gray-500"/> },
  { id: 9, title: '사용할 쌀 재고 확인', icon: <Box className="text-gray-500"/> },
  { id: 10, title: '쌀 넣고 기계 작동시키기', icon: <Play className="text-gray-500"/> },
  { id: 11, title: '재고 가림막(보자기천) 제거하기', icon: <Layers className="text-gray-500"/> },
];

const closeManualItems = [
  { id: 1, title: '기계 쌀통에 있는 쌀을 모두 빼주세요. (7~8분 더 작동합니다.)', icon: <Box className="text-gray-500"/> },
  { id: 2, title: '쌀이 끊기면 기계를 끄고 기계 청소를 진행합니다. (마감방법 준수)', icon: <Wind className="text-gray-500"/> },
  { id: 3, title: '남은 뻥튀기 마저 포장하고 아크릴 보관함 세척', icon: <Droplets className="text-gray-500"/> },
  { id: 4, title: '재고를 보자기천으로 가려주세요.', icon: <Layers className="text-gray-500"/> },
  { id: 5, title: '에어건으로 전체적으로 청소해주세요.', icon: <Wind className="text-gray-500"/> },
  { id: 6, title: '잡동사니 및 사용한 물품을 플라스틱 보관함에 넣어주세요.', icon: <Box className="text-gray-500"/> },
  { id: 7, title: '돈통에 있는 현금과 매입일지의 현금이 일치하는지 확인', icon: <DollarSign className="text-gray-500"/> },
  { id: 8, title: 'POS에서 마감진행 + 매출일지 작성 + 사진촬영', icon: <Camera className="text-gray-500"/> },
  { id: 9, title: 'POS 끄기 + 열쇠 숨기기', icon: <Power className="text-gray-500"/> },
  { id: 10, title: '마감보고 작성해주세요.', icon: <FileText className="text-gray-500"/> },
  { id: 11, title: '외부인 출입이 안되도록 출입구를 막아주세요.', icon: <Lock className="text-gray-500"/> },
  { id: 12, title: '로스뻥튀기 봉투와 쓰레기봉투를 외부 쓰레기장에 버려주세요.', icon: <Trash className="text-gray-500"/> },
];

const getTodayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return (new Date(now - offset)).toISOString().split('T')[0];
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// 쌀박스 선택을 위한 0.5단위 배열 생성 (0 ~ 20박스)
const riceBoxOptions = Array.from({ length: 41 }, (_, i) => i * 0.5);

export default function App() {
  // --- States ---
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); 
  const [reports, setReports] = useState([]);
  const [qnas, setQnas] = useState([]); 
  const [references, setReferences] = useState([]); 
  const [holidays, setHolidays] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [dbManagers, setDbManagers] = useState([]); 
  const [deletedDefaults, setDeletedDefaults] = useState([]); 
  const [costs, setCosts] = useState([]);
  
  // 재고 관리 상태 
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [adjustType, setAdjustType] = useState('rice');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustPrice, setAdjustPrice] = useState(''); 
  const [editLogId, setEditLogId] = useState(null);
  const [editLogData, setEditLogData] = useState(null);

  const [view, setView] = useState('form'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 
  const [filterValue, setFilterValue] = useState('');
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [adminViewMode, setAdminViewMode] = useState('calendar'); 
  const [calendarDate, setCalendarDate] = useState(new Date()); 
  const [editReportId, setEditReportId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState(''); 
  const [isUploading, setIsUploading] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [scheduleSelection, setScheduleSelection] = useState(null); 
  const [scheduleWage, setScheduleWage] = useState(''); 
  const [customScheduleWorker, setCustomScheduleWorker] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  
  // 비용 관리 폼 상태
  const [costSelectionDate, setCostSelectionDate] = useState(null);
  const [costForm, setCostForm] = useState({ category: '재료', amount: '', description: '', account: '기업은행' });

  // Q&A 폼용 상태
  const [qnaQuestion, setQnaQuestion] = useState('');
  const [qnaAuthor, setQnaAuthor] = useState('');
  const [qnaReplyId, setQnaReplyId] = useState(null);
  const [qnaReplyContent, setQnaReplyContent] = useState('');

  // 레퍼런스(사진) 폼용 상태
  const [refDirectionTab, setRefDirectionTab] = useState('상행선');
  const [editRefId, setEditRefId] = useState(null);
  const [editRefDesc, setEditRefDesc] = useState('');

  const [openChecks, setOpenChecks] = useState({});
  const [closeChecks, setCloseChecks] = useState({});

  const [formData, setFormData] = useState({
    location: '상행선',
    date: getTodayString(), 
    worker: '', // 기본값 비움
    customWorker: '',
    sales: { cash: '', card: '', finalPos: '' },
    inventory: { 
      stockCount: '', 
      usedRice: '', 
      loss: '', 
      leftRice: '', 
      remainingRiceBoxes: '', // 주관식 텍스트 필드로 변경
      bagStatus: null,
      tieStatus: null,
      otherSupplies: ''
    },
    photos: { riceBin: null, pot: null, desk: null, report: null, key: null },
    notes: '',
    waiting: { hadWaiting: null, lastNumber: '', missedTeams: '' }
  });

  // 활성화된 기본 매니저 (삭제되지 않은 매니저만 - 현재 빈 배열)
  const activeDefaults = useMemo(() => {
    return managerList.filter(m => !deletedDefaults.includes(m));
  }, [deletedDefaults]);

  // 통합 매니저 리스트 (활성 기본 + DB 추가)
  const allManagers = useMemo(() => {
    return [...new Set([...activeDefaults, ...dbManagers.map(m => m.name)])];
  }, [activeDefaults, dbManagers]);

  // 기본 작성자 세팅
  useEffect(() => {
    if (allManagers.length > 0) {
      if (!qnaAuthor || !allManagers.includes(qnaAuthor)) {
        setQnaAuthor(allManagers[0]);
      }
      if (!formData.worker) {
        setFormData(prev => ({ ...prev, worker: allManagers[0] }));
      }
    }
  }, [allManagers]);

  // --- Authentication ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (view !== 'manual_open') setOpenChecks({});
    if (view !== 'manual_close') setCloseChecks({});
  }, [view]);

  // --- Data Subscription ---
  useEffect(() => {
    if (!user) return;
    const reportsRef = collection(db, 'artifacts', appId, 'public', 'data', 'reports');
    const qnaRef = collection(db, 'artifacts', appId, 'public', 'data', 'qna');
    const refsRef = collection(db, 'artifacts', appId, 'public', 'data', 'references');
    const holidaysRef = collection(db, 'artifacts', appId, 'public', 'data', 'holidays');
    const schedulesRef = collection(db, 'artifacts', appId, 'public', 'data', 'schedules');
    const managersRef = collection(db, 'artifacts', appId, 'public', 'data', 'managers');
    const inventoryLogsRef = collection(db, 'artifacts', appId, 'public', 'data', 'inventoryLogs');
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'managerSettings');
    const costsRef = collection(db, 'artifacts', appId, 'public', 'data', 'costs');
    
    const unsubReports = onSnapshot(reportsRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setReports(fetched);
    }, (err) => console.error(err));

    const unsubQna = onSnapshot(qnaRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setQnas(fetched);
    }, (err) => console.error(err));

    const unsubRefs = onSnapshot(refsRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setReferences(fetched);
    }, (err) => console.error(err));

    const unsubHolidays = onSnapshot(holidaysRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => fetched.push(doc.id));
      setHolidays(fetched);
    }, (err) => console.error(err));

    const unsubSchedules = onSnapshot(schedulesRef, (snapshot) => {
      const fetched = {};
      snapshot.forEach((doc) => {
         const data = doc.data();
         fetched[doc.id] = {
            manager: data.manager,
            wage: data.wage || 0
         };
      });
      setSchedules(fetched);
    }, (err) => console.error(err));

    const unsubManagers = onSnapshot(managersRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach(doc => fetched.push({ id: doc.id, name: doc.data().name }));
      setDbManagers(fetched);
    }, (err) => console.error(err));

    const unsubInventoryLogs = onSnapshot(inventoryLogsRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setInventoryLogs(fetched);
    }, (err) => console.error(err));

    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setDeletedDefaults(docSnap.data().deletedDefaults || []);
      }
    }, (err) => console.error(err));

    const unsubCosts = onSnapshot(costsRef, (snapshot) => {
      const fetched = [];
      snapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() }));
      setCosts(fetched);
    }, (err) => console.error(err));

    return () => { unsubReports(); unsubQna(); unsubRefs(); unsubHolidays(); unsubSchedules(); unsubManagers(); unsubInventoryLogs(); unsubSettings(); unsubCosts(); };
  }, [user]);

  // --- Handlers ---
  const handleWaitingToggle = (val) => {
    setFormData(prev => ({
      ...prev,
      waiting: { ...prev.waiting, hadWaiting: val }
    }));
  };

  const handlePhotoChange = (key, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 용량 제한 20MB
    if (file.size > 20 * 1024 * 1024) {
      setAlertMessage("사진 첨부 용량 제한은 20MB 입니다.");
      e.target.value = null;
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 1000; 
        let w = img.width; let h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
        else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        setFormData(p => ({ ...p, photos: { ...p.photos, [key]: canvas.toDataURL('image/jpeg', 0.6) } }));
        setIsUploading(false);
      };
    };
  };

  const submitReport = async () => {
    if (holidays.includes(formData.date)) {
      return setAlertMessage("해당 일자는 휴무일로 설정되어 리포트를 제출할 수 없습니다.");
    }
    if (!formData.sales.cash || !formData.sales.card) return setAlertMessage("현금/카드 매출을 모두 입력해 주세요.");
    if (!formData.worker) return setAlertMessage("담당 매니저를 선택하거나 입력해 주세요.");
    
    if (!user) return setAlertMessage("인증 중입니다. 잠시만 기다려 주세요.");
    setIsSubmitting(true);
    
    const cashVal = Number(parseComma(formData.sales.cash)) || 0;
    const cardVal = Number(parseComma(formData.sales.card)) || 0;
    const finalPosVal = Number(parseComma(formData.sales.finalPos)) || 0;
    const total = cashVal + cardVal;
    const finalWorker = formData.worker;

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', Date.now().toString()), {
        ...formData, 
        worker: finalWorker,
        sales: { cash: cashVal, card: cardVal, finalPos: finalPosVal },
        totalSales: total, 
        timestamp: new Date().toISOString()
      });
      setShowSubmitModal(true);
    } catch (e) { setAlertMessage("제출 실패: " + e.message); } finally { setIsSubmitting(false); }
  };

  const submitQna = async () => {
    if (!qnaQuestion.trim() || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'qna'), {
        author: qnaAuthor || (allManagers[0] || '익명'), 
        question: qnaQuestion, 
        answer: null, 
        timestamp: new Date().toISOString(), 
        date: getTodayString()
      });
      setQnaQuestion('');
      setAlertMessage("질문이 성공적으로 등록되었습니다.");
    } catch (e) { setAlertMessage("등록 실패: " + e.message); }
  };

  const submitQnaReply = async (id) => {
    if (!qnaReplyContent.trim() || !user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'qna', id), { answer: qnaReplyContent }, { merge: true });
      setQnaReplyId(null);
      setQnaReplyContent('');
      setAlertMessage("답변이 등록되었습니다.");
    } catch (e) { setAlertMessage("답변 실패: " + e.message); }
  };

  const toggleHoliday = async (dateStr) => {
    if (!user) return;
    try {
      if (holidays.includes(dateStr)) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'holidays', dateStr));
      } else {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'holidays', dateStr), { isHoliday: true });
      }
    } catch (e) { setAlertMessage("휴무 설정 오류: " + e.message); }
  };

  const assignWorkerToSchedule = async (manager) => {
    if (!user || !scheduleSelection) return;
    const { date, location } = scheduleSelection;
    const docId = `${date}_${location}`;
    const finalManager = manager;
    const wage = Number(parseComma(scheduleWage)) || 0;

    try {
      if (manager === 'CLEAR') {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schedules', docId));
      } else {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schedules', docId), { manager: finalManager, wage: wage });
      }
      setScheduleSelection(null);
      setScheduleWage('');
    } catch (e) { setAlertMessage("배정 실패: " + e.message); }
  };

  const executeDelete = async () => {
    if (!user || !deleteConfirmId) return;
    try {
      let col = 'reports';
      const id = typeof deleteConfirmId === 'object' ? deleteConfirmId.id : deleteConfirmId;
      if (typeof deleteConfirmId === 'object' && deleteConfirmId.col) {
         col = deleteConfirmId.col;
      } else {
         if (view === 'qna') col = 'qna';
         if (view === 'reference') col = 'references';
         if (adminViewMode === 'inventory' && view === 'admin') col = 'inventoryLogs';
         if (adminViewMode === 'cost' && view === 'admin') col = 'costs';
      }

      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
      setDeleteConfirmId(null);
    } catch (e) { setAlertMessage("삭제 오류: " + e.message); }
  };

  const startEdit = (report) => {
    setEditReportId(report.id);
    setEditData({ ...report });
  };

  const saveEdit = async () => {
    if (!user || !editData) return;
    const cashVal = Number(parseComma(editData.sales?.cash)) || 0;
    const cardVal = Number(parseComma(editData.sales?.card)) || 0;
    const finalPosVal = Number(parseComma(editData.sales?.finalPos)) || 0;
    const total = cashVal + cardVal;
    
    const id = editData.id;
    const updated = { 
       ...editData, 
       sales: { ...(editData.sales || {}), cash: cashVal, card: cardVal, finalPos: finalPosVal }, 
       totalSales: total,
       inventory: { ...(editData.inventory || {}) }
    };
    delete updated.id;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reports', id), updated, { merge: true });
      setEditReportId(null);
      setEditData(null);
      setAlertMessage("리포트가 성공적으로 수정되었습니다.");
    } catch (e) { setAlertMessage("저장 오류: " + e.message); }
  };

  const toggleOpenManualCheck = (id) => setOpenChecks(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleCloseManualCheck = (id) => setCloseChecks(prev => ({ ...prev, [id]: !prev[id] }));

  // --- Reference Photo Handlers ---
  const handleRefUpload = (e) => {
    if(!user) return;
    const file = e.target.files[0];
    if(file) {
      if (file.size > 20 * 1024 * 1024) {
        setAlertMessage("사진 첨부 용량 제한은 20MB 입니다.");
        e.target.value = null;
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max = 1000;
          if (width > height) {
            if (width > max) { height *= max / width; width = max; }
          } else {
            if (height > max) { width *= max / height; height = max; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const base64Img = canvas.toDataURL('image/jpeg', 0.7);
          try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'references'), {
              direction: refDirectionTab,
              imageUrl: base64Img,
              description: '',
              timestamp: new Date().toISOString()
            });
          } catch (err) { setAlertMessage("업로드 실패: " + err.message); }
          setIsUploading(false);
          e.target.value = null;
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const saveReferenceEdit = async () => {
    if(!user || !editRefId) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'references', editRefId), {
        description: editRefDesc
      }, { merge: true });
      setEditRefId(null);
      setEditRefDesc('');
    } catch (err) { setAlertMessage(err.message); }
  };

  // --- Custom Manager Handlers ---
  const handleAddManager = async () => {
    if (!newManagerName.trim() || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'managers'), { name: newManagerName.trim(), timestamp: serverTimestamp() });
      setNewManagerName('');
    } catch (e) { setAlertMessage("추가 실패: " + e.message); }
  };

  const handleRemoveManager = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'managers', id));
    } catch (e) { setAlertMessage("삭제 실패: " + e.message); }
  };

  const handleRemoveDefaultManager = async (name) => {
    if (!user) return;
    try {
      const newDeleted = [...deletedDefaults, name];
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'managerSettings'), { deletedDefaults: newDeleted }, { merge: true });
    } catch (e) { setAlertMessage("기본 매니저 삭제 실패: " + e.message); }
  };

  // --- Inventory Adjust Handler (Log Based) ---
  const handleAdjustInventory = async (isAdd) => {
    if (!user || !adjustAmount) return;
    const amount = Number(adjustAmount);
    const price = Number(parseComma(adjustPrice)) || 0;

    if (isNaN(amount) || amount <= 0) return setAlertMessage("올바른 수량을 입력하세요.");

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'inventoryLogs'), {
        type: adjustType,
        action: isAdd ? 'add' : 'remove',
        amount: amount,
        price: price,
        date: getTodayString(),
        timestamp: new Date().toISOString()
      });
      setAdjustAmount('');
      setAdjustPrice('');
      setAlertMessage(`성공적으로 재고가 ${isAdd ? '입고' : '출고'} 기록되었습니다.`);
    } catch (e) {
      setAlertMessage("재고 반영 실패: " + e.message);
    }
  };

  const startEditLog = (log) => {
    setEditLogId(log.id);
    setEditLogData({ ...log, priceStr: formatComma(log.price || 0) });
  };

  const saveLogEdit = async () => {
    if (!user || !editLogData) return;
    const price = Number(parseComma(editLogData.priceStr)) || 0;
    const amount = Number(editLogData.amount) || 0;
    
    if (isNaN(amount) || amount <= 0) return setAlertMessage("올바른 수량을 입력하세요.");

    const updated = { ...editLogData, amount, price };
    delete updated.priceStr;
    delete updated.id;

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventoryLogs', editLogId), updated);
      setEditLogId(null);
      setEditLogData(null);
      setAlertMessage("기록이 성공적으로 수정되었습니다.");
    } catch (e) {
      setAlertMessage("수정 오류: " + e.message);
    }
  };

  // --- Cost Handler ---
  const handleAddCost = async () => {
    if (!costForm.amount || !costForm.description || !user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'costs'), {
        date: costSelectionDate,
        category: costForm.category,
        amount: Number(parseComma(costForm.amount)),
        description: costForm.description,
        account: costForm.account || '기업은행', // 새로 추가된 계좌정보
        timestamp: new Date().toISOString()
      });
      setCostForm({ category: '재료', amount: '', description: '', account: '기업은행' });
    } catch(e) { setAlertMessage("비용 등록 실패: " + e.message); }
  };

  // --- Statistics & Inventory Calculations ---
  const inventoryTotals = useMemo(() => {
    let rice = 0, tie = 0, bag = 0, totalSpent = 0;
    let riceSpent = 0, tieSpent = 0, bagSpent = 0;

    inventoryLogs.forEach(log => {
      const mult = log.action === 'add' ? 1 : -1;
      if (log.type === 'rice') rice += log.amount * mult;
      if (log.type === 'tie') tie += log.amount * mult;
      if (log.type === 'bag') bag += log.amount * mult;

      const price = Number(log.price) || 0;
      if (log.action === 'add') {
        totalSpent += price;
        if (log.type === 'rice') riceSpent += price;
        if (log.type === 'tie') tieSpent += price;
        if (log.type === 'bag') bagSpent += price;
      } else if (log.action === 'remove') {
        totalSpent -= price;
        if (log.type === 'rice') riceSpent -= price;
        if (log.type === 'tie') tieSpent -= price;
        if (log.type === 'bag') bagSpent -= price;
      }
    });
    return { rice, tie, bag, totalSpent, riceSpent, tieSpent, bagSpent };
  }, [inventoryLogs]);

  const currentStock = useMemo(() => {
    let usedRice = 0;
    let usedTieAndBag = 0;
    
    reports.forEach(r => {
      usedRice += Number(r.inventory?.usedRice || 0);
      const sales = Number(r.totalSales || 0);
      usedTieAndBag += Math.floor(sales / 5000);
    });

    return {
      riceKg: inventoryTotals.rice - usedRice,
      tie: inventoryTotals.tie - usedTieAndBag,
      bag: inventoryTotals.bag - usedTieAndBag,
      totalSpent: inventoryTotals.totalSpent,
      riceSpent: inventoryTotals.riceSpent,
      tieSpent: inventoryTotals.tieSpent,
      bagSpent: inventoryTotals.bagSpent
    };
  }, [reports, inventoryTotals]);

  // 일 평균 사용량 (26년 5월 1일 기준)
  const averagesSinceMay2026 = useMemo(() => {
    const targetReports = reports.filter(r => r.date >= '2026-05-01');
    const uniqueDays = new Set(targetReports.map(r => r.date)).size;
    if (uniqueDays === 0) return { rice: 0, tie: 0, bag: 0 };

    let totalRice = 0;
    let totalSales = 0;
    targetReports.forEach(r => {
      totalRice += Number(r.inventory?.usedRice || 0);
      totalSales += Number(r.totalSales || 0);
    });

    const totalTieAndBag = Math.floor(totalSales / 5000);

    return {
      rice: (totalRice / uniqueDays).toFixed(1),
      tie: Math.round(totalTieAndBag / uniqueDays),
      bag: Math.round(totalTieAndBag / uniqueDays)
    };
  }, [reports]);

  // 이번 달 남은 영업일 계산: 집계달력 기준 이번 달 전체 일수 - 휴무일 - 상/하 마감 모두 제출된 일자
  const remainingDaysThisMonth = useMemo(() => {
    const todayStr = getTodayString();
    const todayDate = new Date(todayStr);
    const year = todayDate.getFullYear();
    const month = todayDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (!holidays.includes(dStr)) {
        const hasSang = reports.some(r => r.date === dStr && r.location === '상행선');
        const hasHa = reports.some(r => r.date === dStr && r.location === '하행선');
        if (!(hasSang && hasHa)) {
          count++;
        }
      }
    }
    return count;
  }, [holidays, reports]);

  const dailyStatus = useMemo(() => {
    const today = formData.date;
    return {
      상행선: reports.some(r => r.date === today && r.location === '상행선') ? '제출완료' : '미제출',
      하행선: reports.some(r => r.date === today && r.location === '하행선') ? '제출완료' : '미제출'
    };
  }, [reports, formData.date]);

  const allTimeStats = useMemo(() => {
    const total = reports.reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const cash = reports.reduce((s, r) => s + (Number(r.sales?.cash) || 0), 0);
    const card = reports.reduce((s, r) => s + (Number(r.sales?.card) || 0), 0);
    const sang = reports.filter(r => r.location === '상행선').reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const ha = reports.filter(r => r.location === '하행선').reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const commission = total * 0.4;
    const profit = total * 0.6; 
    
    // 누적 영업일수 및 평균 매출 계산
    const uniqueDaysSet = new Set(reports.map(r => r.date));
    const cumulativeOperatingDays = uniqueDaysSet.size;
    const avgDailySales = cumulativeOperatingDays > 0 ? Math.round(total / cumulativeOperatingDays) : 0;

    // 올해 남은 영업일수 계산
    let remainingDaysThisYear = 0;
    const todayStr = getTodayString();
    const year = parseInt(todayStr.split('-')[0]);
    
    const current = new Date(todayStr + "T00:00:00");
    const end = new Date(`${year}-12-31T00:00:00`);
    
    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dStr = `${y}-${m}-${day}`;

      // 휴무일이 아니고, 이미 리포트가 제출된 날이 아니면 카운트
      if (!holidays.includes(dStr) && !uniqueDaysSet.has(dStr)) {
        remainingDaysThisYear++;
      }
      current.setDate(current.getDate() + 1);
    }

    // 기대 매출 예측 (현재 누적 + 평균매출 * 남은영업일수)
    const expectedYearlySales = total + (avgDailySales * remainingDaysThisYear);

    return { total, cash, card, sang, ha, commission, profit, cumulativeOperatingDays, remainingDaysThisYear, avgDailySales, expectedYearlySales };
  }, [reports, holidays]);

  // 로스 통계 및 전반적인 월간 통계 계산
  const monthlyStats = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const mReports = reports.filter(r => { const d = new Date(r.date); return d.getFullYear() === year && d.getMonth() === month; });
    
    const dailyMap = {};
    mReports.forEach(r => {
      if (!dailyMap[r.date]) dailyMap[r.date] = 0;
      dailyMap[r.date] += (Number(r.totalSales) || 0);
    });

    let validDays = Object.keys(dailyMap).filter(date => !holidays.includes(date) && dailyMap[date] > 0);
    let maxDay = null;
    let minDay = null;

    if (validDays.length > 0) {
      validDays.sort((a, b) => dailyMap[b] - dailyMap[a]); 
      maxDay = { date: validDays[0], sales: dailyMap[validDays[0]] };
      minDay = { date: validDays[validDays.length - 1], sales: dailyMap[validDays[validDays.length - 1]] };
    }

    const total = mReports.reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const profit = total * 0.6; 
    const sang = mReports.filter(r => r.location === '상행선').reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const ha = mReports.filter(r => r.location === '하행선').reduce((s, r) => s + (Number(r.totalSales) || 0), 0);
    const cash = mReports.reduce((s, r) => s + (Number(r.sales?.cash) || 0), 0);
    const card = mReports.reduce((s, r) => s + (Number(r.sales?.card) || 0), 0);
    const cashPercent = total > 0 ? Math.round((cash / total) * 100) : 0;
    const cardPercent = total > 0 ? Math.round((card / total) * 100) : 0;
    
    // 쌀 및 로스 계산 추가
    const totalRice = mReports.reduce((s, r) => s + (Number(r.inventory?.usedRice) || 0), 0);
    const totalLoss = mReports.reduce((s, r) => s + (Number(r.inventory?.loss) || 0), 0);
    const lossPercentage = totalRice > 0 ? ((totalLoss / totalRice) * 100).toFixed(1) : 0;

    const uniqueDaysCount = new Set(mReports.map(r => r.date)).size;
    const monthHolidaysCount = holidays.filter(h => {
      const d = new Date(h);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;

    const avgRicePerDay = uniqueDaysCount > 0 ? (totalRice / uniqueDaysCount).toFixed(1) : 0;
    const cumulativeRiceCost = totalRice * UNIT_PRICES.rice;
    
    const expectedSales = totalRice * 42735;
    const lossAmount = expectedSales - total;
    const avgDailySales = uniqueDaysCount > 0 ? Math.round(total / uniqueDaysCount) : 0;
    const targetDifference = avgDailySales - 1900000;
    
    return { 
      total, profit, sang, ha, cash, card, cashPercent, cardPercent, 
      avgRicePerDay, cumulativeRiceCost, workingDays: uniqueDaysCount, 
      holidayCount: monthHolidaysCount, maxDay, minDay, 
      expectedSales, lossAmount, avgDailySales, targetDifference,
      totalRice, totalLoss, lossPercentage 
    };
  }, [reports, calendarDate, holidays]);

  const filteredReports = useMemo(() => {
    let result = [...reports];
    if (filterType === 'LOCATION') {
      result = reports.filter(r => r.location === filterValue);
    } else if (filterType === 'WORKER') {
      result = reports.filter(r => r.worker === filterValue);
    }
    return result;
  }, [reports, filterType, filterValue]);

  // 스케쥴 및 급여 통합 계산 로직 (4대보험 및 식대 포함)
  const scheduleStats = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const managerMonthlyStats = {};
    const dailyLaborCosts = {};
    let grandTotalWage = 0;
    let grandTotalMeal = 0;
    let grandTotalInsurance = 0;

    const FULL_INSURANCE_RATE = 0.0965; // 사업주 부담분 약 9.65% (4대보험 전면)
    const PARTIAL_INSURANCE_RATE = 0.0215; // 사업주 부담분 약 2.15% (고용/산재만)
    const MEAL_ALLOWANCE = 9900;

    Object.entries(schedules).forEach(([key, data]) => {
      const [dateStr, loc] = key.split('_');
      const d = new Date(dateStr);
      if (d.getFullYear() === year && d.getMonth() === month && !holidays.includes(dateStr)) {
        if (!managerMonthlyStats[data.manager]) {
          managerMonthlyStats[data.manager] = { totalDays: 0, totalWage: 0, sangDays: 0, sangWage: 0, haDays: 0, haWage: 0, weeklyDays: {} };
        }
        managerMonthlyStats[data.manager].totalDays += 1;
        managerMonthlyStats[data.manager].totalWage += (data.wage || 0);

        // Calculate Week Number for "주 15시간(주 2일) 이상" check
        const wYear = d.getFullYear();
        const wNum = Math.ceil(((d - new Date(wYear, 0, 1)) / 86400000 + new Date(wYear, 0, 1).getDay() + 1) / 7);
        const weekKey = `${wYear}-W${wNum}`;
        managerMonthlyStats[data.manager].weeklyDays[weekKey] = (managerMonthlyStats[data.manager].weeklyDays[weekKey] || 0) + 1;

        if (loc === '상행선') {
          managerMonthlyStats[data.manager].sangDays += 1;
          managerMonthlyStats[data.manager].sangWage += (data.wage || 0);
        } else if (loc === '하행선') {
          managerMonthlyStats[data.manager].haDays += 1;
          managerMonthlyStats[data.manager].haWage += (data.wage || 0);
        }
      }
    });

    Object.values(managerMonthlyStats).forEach(stats => {
      stats.totalHours = stats.totalDays * 10;
      
      stats.isOver15hPerWeek = Object.values(stats.weeklyDays).some(c => c >= 2);
      stats.isOver60hPerMonth = stats.totalHours >= 60;

      if (stats.isOver15hPerWeek || stats.isOver60hPerMonth) {
        stats.insuranceType = 'FULL';
        stats.insuranceRate = FULL_INSURANCE_RATE;
      } else {
        stats.insuranceType = 'PARTIAL';
        stats.insuranceRate = PARTIAL_INSURANCE_RATE;
      }

      stats.totalMeal = stats.totalDays * MEAL_ALLOWANCE;
      stats.totalInsurance = Math.round(stats.totalWage * stats.insuranceRate);
      stats.totalCost = stats.totalWage + stats.totalMeal + stats.totalInsurance;

      grandTotalWage += stats.totalWage;
      grandTotalMeal += stats.totalMeal;
      grandTotalInsurance += stats.totalInsurance;
    });

    // 일별 인건비 합산 (달력 및 비용관리 탭용)
    Object.entries(schedules).forEach(([key, data]) => {
      const [dateStr, loc] = key.split('_');
      const d = new Date(dateStr);
      if (d.getFullYear() === year && d.getMonth() === month && !holidays.includes(dateStr)) {
         const stats = managerMonthlyStats[data.manager];
         if (stats) {
            const wage = data.wage || 0;
            const insurance = Math.round(wage * stats.insuranceRate);
            const dailyCost = wage + MEAL_ALLOWANCE + insurance;
            if (!dailyLaborCosts[dateStr]) dailyLaborCosts[dateStr] = 0;
            dailyLaborCosts[dateStr] += dailyCost;
         }
      }
    });

    return {
      managerMonthlyStats,
      grandTotalWage,
      grandTotalMeal,
      grandTotalInsurance,
      grandTotalLaborCost: grandTotalWage + grandTotalMeal + grandTotalInsurance,
      FULL_INSURANCE_RATE,
      PARTIAL_INSURANCE_RATE,
      MEAL_ALLOWANCE,
      dailyLaborCosts
    };
  }, [schedules, calendarDate, holidays]);

  // 비용 관리 통계 계산 (수동 입력 + 자동 연동 인건비 + 자동 재료비 통합)
  const monthlyCosts = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    let totalManual = 0;
    let manualByDate = {};
    let dailyMaterialCosts = {};
    let totalMaterial = 0;
    
    let categoryTotals = {
      '급여/인건비': scheduleStats.grandTotalWage || 0,
      '식비': scheduleStats.grandTotalMeal || 0,
      '보험료': scheduleStats.grandTotalInsurance || 0,
      '재료비(자동)': 0 // 새로 추가된 자동 계산 재료비 카테고리
    };
    COST_CATEGORIES.forEach(c => { if (categoryTotals[c] === undefined) categoryTotals[c] = 0; });

    // 1. 수동 비용
    costs.forEach(c => {
       const d = new Date(c.date);
       if (d.getFullYear() === year && d.getMonth() === month) {
           const amt = Number(c.amount) || 0;
           totalManual += amt;
           if (!manualByDate[c.date]) manualByDate[c.date] = [];
           manualByDate[c.date].push(c);
           
           if (categoryTotals[c.category] !== undefined) {
               categoryTotals[c.category] += amt;
           } else {
               categoryTotals['기타'] += amt;
           }
       }
    });

    // 2. 일별 재료비 자동 환산 (보고서 기준 - 단가 정확하게 반영됨)
    reports.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const usedRice = Number(r.inventory?.usedRice) || 0;
        const sales = Number(r.totalSales) || 0;
        const usedBags = Math.floor(sales / 5000); // 5000원당 1봉지(빵끈1+비닐1)
        
        // 쌀(2500), 비닐(40), 빵끈(5) 정확한 합산 금액
        const materialCost = (usedRice * UNIT_PRICES.rice) + (usedBags * UNIT_PRICES.vinyl) + (usedBags * UNIT_PRICES.tie);
        
        if (materialCost > 0) {
          if (!dailyMaterialCosts[r.date]) dailyMaterialCosts[r.date] = 0;
          dailyMaterialCosts[r.date] += materialCost;
          totalMaterial += materialCost;
          categoryTotals['재료비(자동)'] += materialCost;
        }
      }
    });

    const totalLabor = scheduleStats.grandTotalLaborCost || 0;
    const grandTotal = totalManual + totalLabor + totalMaterial;
    const sales = monthlyStats.total || 0;
    const costPercentage = sales > 0 ? ((grandTotal / sales) * 100).toFixed(1) : 0;

    const categoryBreakdown = Object.entries(categoryTotals)
      .filter(([_, amt]) => amt > 0)
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        percentage: grandTotal > 0 ? ((amt / grandTotal) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return { totalManual, manualByDate, dailyMaterialCosts, totalMaterial, grandTotal, costPercentage, totalLabor, categoryBreakdown };
  }, [costs, scheduleStats, calendarDate, monthlyStats, reports]);


  const downloadCSV = () => {
    // 엑셀 다운로드 포맷에 로스와 남은 쌀박스 추가 반영
    const headers = ['일자', '위치', '매니저', '총매출', '현금', '카드', '사용한쌀(kg)', '로스(kg)', '원재료 재고(뻥쌀 Box)', '포장된 뻥튀기', '개선사항'];
    const rows = filteredReports.map(r => [
      r.date, r.location, r.worker, r.totalSales, r.sales?.cash, r.sales?.card, 
      r.inventory?.usedRice || 0, r.inventory?.loss || 0, r.inventory?.remainingRiceBoxes || '', r.inventory?.stockCount || 0, 
      (r.notes || "").replace(/,/g, " ")
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `하트뻥튀기_업무보고_${getTodayString()}.csv`;
    link.click();
  };

  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="p-2"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayReports = reports.filter(r => r.date === dStr);
      const sangSales = dayReports.filter(r => r.location === '상행선').reduce((s, r) => s + (Number(r.totalSales)||0), 0);
      const haSales = dayReports.filter(r => r.location === '하행선').reduce((s, r) => s + (Number(r.totalSales)||0), 0);
      const sales = sangSales + haSales;
      const isHoliday = holidays.includes(dStr);
      
      days.push(
        <div 
          key={d} 
          onClick={() => toggleHoliday(dStr)}
          className={`p-1.5 border border-gray-200 min-h-[90px] flex flex-col rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${dStr === getTodayString() ? 'bg-gray-100 border-gray-400' : isHoliday ? 'bg-gray-50 border-gray-200 opacity-50' : 'bg-white'}`}
        >
          <span className={`text-xs font-semibold ${isHoliday ? 'text-gray-400' : 'text-gray-700'}`}>{d}</span>
          {isHoliday && <span className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-tighter text-center">휴무</span>}
          {!isHoliday && (sangSales > 0 || haSales > 0) && (
            <div className="mt-auto flex flex-col items-end space-y-[2px] pt-1">
              {sangSales > 0 && <span className="text-[8px] font-semibold text-red-600 leading-none flex items-center justify-end gap-0.5">상:{formatComma(sangSales)} <ArrowUp size={8} style={{transform:'rotate(20deg)'}}/></span>}
              {haSales > 0 && <span className="text-[8px] font-semibold text-blue-600 leading-none flex items-center justify-end gap-0.5">하:{formatComma(haSales)} <ArrowDown size={8} style={{transform:'rotate(20deg)'}}/></span>}
              <span className="text-[9px] font-bold text-gray-900 border-t border-gray-200 pt-[2px] mt-[2px] w-full text-right leading-none">합:{formatComma(sales)}</span>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  const renderScheduleCalendar = (location) => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${location}-${i}`} className="p-2"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isHoliday = holidays.includes(dStr);
      const scheduleData = schedules[`${dStr}_${location}`];
      const assignedManager = scheduleData?.manager;
      const assignedWage = scheduleData?.wage || 0;
      const isToday = dStr === getTodayString();
      
      days.push(
        <div 
          key={d} 
          onClick={() => {
             if (!isHoliday) {
                setScheduleSelection({ date: dStr, location });
                setScheduleWage(scheduleData && scheduleData.wage ? String(scheduleData.wage) : '');
             }
          }}
          className={`p-1 border min-h-[70px] flex flex-col rounded-lg transition-all ${isToday ? 'border-gray-500 border-2' : 'border-gray-200'} ${isHoliday ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-400 bg-white active:scale-95'}`}
        >
          <span className={`text-xs font-semibold ${isToday ? 'text-gray-900' : isHoliday ? 'text-gray-300' : 'text-gray-500'}`}>{d}</span>
          {isHoliday && (
             <div className="mt-auto bg-gray-100 text-gray-400 p-1 rounded text-center text-[10px] font-semibold uppercase">휴무</div>
          )}
          {!isHoliday && assignedManager && (
            <div className={`mt-auto px-0 py-[2px] rounded text-center text-[9px] font-semibold animate-in fade-in zoom-in border whitespace-nowrap overflow-hidden text-ellipsis tracking-tighter flex flex-col ${getManagerColor(assignedManager)}`}>
              <span>{assignedManager}</span>
              {assignedWage > 0 && <span className="text-[7px] border-t border-black/10 pt-[1px] mt-[1px] opacity-80">{formatComma(assignedWage)}원</span>}
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  const renderCostCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-cost-${i}`} className="p-2"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isHoliday = holidays.includes(dStr);
      const isToday = dStr === getTodayString();
      const manualList = monthlyCosts.manualByDate[dStr] || [];
      const manualSum = manualList.reduce((acc, c) => acc + Number(c.amount), 0);
      const laborSum = scheduleStats.dailyLaborCosts[dStr] || 0;
      const materialSum = monthlyCosts.dailyMaterialCosts[dStr] || 0;
      const totalDaily = manualSum + laborSum + materialSum;
      
      days.push(
        <div 
          key={d} 
          onClick={() => setCostSelectionDate(dStr)}
          className={`p-1.5 border min-h-[90px] flex flex-col rounded-lg transition-all ${isToday ? 'border-gray-500 border-2 bg-gray-50' : 'border-gray-200 bg-white'} cursor-pointer hover:border-gray-400 active:scale-95`}
        >
          <div className="flex justify-between items-start">
             <span className={`text-xs font-semibold ${isToday ? 'text-gray-900' : isHoliday ? 'text-gray-300' : 'text-gray-600'}`}>{d}</span>
             {isHoliday && <span className="text-[8px] font-semibold text-gray-400 bg-gray-100 px-1 rounded uppercase tracking-tighter">휴무</span>}
          </div>
          <div className="mt-auto space-y-[2px] pt-1">
             {laborSum > 0 && <div className="text-[8px] font-semibold bg-blue-100 text-blue-800 rounded px-1 flex justify-between"><span>급/식/보</span><span>{formatComma(laborSum)}</span></div>}
             {materialSum > 0 && <div className="text-[8px] font-semibold bg-green-100 text-green-800 rounded px-1 flex justify-between"><span>재료비(자동)</span><span>{formatComma(materialSum)}</span></div>}
             {manualSum > 0 && <div className="text-[8px] font-semibold bg-gray-200 text-gray-800 rounded px-1 flex justify-between"><span>기타수동</span><span>{formatComma(manualSum)}</span></div>}
             {(laborSum > 0 || manualSum > 0 || materialSum > 0) && <div className="text-[9px] font-bold text-right border-t border-gray-200 mt-[2px] pt-[2px] text-gray-900">{formatComma(totalDaily)}원</div>}
          </div>
        </div>
      );
    }
    return days;
  };

  const NavigationMenu = () => (
    <div className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
      <div className={`relative w-64 bg-white h-full shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-200 bg-gray-900 text-white">
          <h2 className="font-bold text-xl flex items-center gap-2">메뉴</h2>
        </div>
        <div className="p-4 space-y-2">
          <button onClick={() => { setView('form'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-xl font-medium transition-all ${view === 'form' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <FileText size={20}/> 업무공유 리포트
          </button>
          <button onClick={() => { setView('qna'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-xl font-medium transition-all ${view === 'qna' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <HelpCircle size={20}/> 질문과 답변 (Q&A)
          </button>
          <button onClick={() => { setView('reference'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-xl font-medium transition-all ${view === 'reference' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <ImageIcon size={20}/> 사진 레퍼런스
          </button>
          <div className="pt-4 pb-2 px-4 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Manuals</div>
          <button onClick={() => { setView('manual_open'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-xl font-medium transition-all ${view === 'manual_open' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <BookOpen size={20}/> 오픈 매뉴얼
          </button>
          <button onClick={() => { setView('manual_close'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-xl font-medium transition-all ${view === 'manual_close' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Clock size={20}/> 마감 매뉴얼
          </button>
          <div className="pt-8 mt-8 border-t border-gray-100">
            <button onClick={() => { setView('login'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 p-4 rounded-xl font-medium text-gray-400 hover:text-gray-900 transition-all">
              <Lock size={20}/> 관리자 로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderView = () => {
    if (view === 'login') {
      return (
        <div className="max-w-md mx-auto min-h-screen flex items-center justify-center p-4 bg-gray-50 font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-sm w-full border border-gray-200 text-center">
            <h2 className="text-2xl font-bold mb-8 text-gray-900">관리자 접속</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (adminPwd === '940329') { setView('admin'); setIsAdmin(true); setAdminPwd(''); } else setAlertMessage('인증 암호가 일치하지 않습니다.'); }} className="space-y-6">
              <input type="password" autoFocus value={adminPwd} onChange={e=>setAdminPwd(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none text-center text-3xl tracking-widest focus:ring-2 ring-gray-400 text-gray-900" placeholder="••••••" />
              <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-semibold text-lg active:scale-95 transition-transform">인증하기</button>
            </form>
            <button onClick={()=>setView('form')} className="mt-6 text-gray-500 hover:text-gray-900 font-medium text-sm underline transition-colors">돌아가기</button>
          </div>
        </div>
      );
    }

    if (view === 'admin') {
      return (
        <div className="max-w-4xl mx-auto bg-gray-50 min-h-screen pb-32 font-sans">
          <header className="bg-white p-6 sticky top-0 z-30 border-b border-gray-200 flex justify-between items-center shadow-sm">
            <h1 className="font-bold text-xl flex items-center gap-2 text-gray-900"><BarChart3 className="text-gray-600"/> 운영 관리 시스템</h1>
            <button onClick={()=>{setView('form'); setIsAdmin(false);}} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><LogOut size={20} className="text-gray-900"/></button>
          </header>
          
          <div className="p-4 space-y-6">
            {/* 공통 상단: 월간 누적 매출 및 월 변경 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 animate-in slide-in-from-top-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()-1, 1))} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"><ChevronLeft size={20}/></button>
                      <h3 className="text-lg font-bold text-gray-800">{calendarDate.getFullYear()}년 {calendarDate.getMonth()+1}월 누적 매출</h3>
                      <button onClick={()=>setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth()+1, 1))} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"><ChevronRight size={20}/></button>
                    </div>
                    <p className="text-4xl font-bold text-gray-900 tracking-tight leading-none pt-2">{monthlyStats.total.toLocaleString()}원</p>
                    <p className="text-sm font-medium text-gray-500 tracking-tight">💰 정산 예정 금액 (60%): {(monthlyStats.total * 0.6).toLocaleString()}원</p>
                 </div>
                 <button onClick={downloadCSV} className="bg-gray-900 text-white px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-gray-800 active:scale-95 shadow-sm transition-all"><FileSpreadsheet size={18}/> 엑셀(CSV) 다운로드</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <h4 className="text-[10px] font-semibold text-red-500 mb-1 uppercase tracking-tighter flex items-center gap-1">상행선 누적 <ArrowUp size={12} className="text-red-500" style={{transform:'rotate(20deg)'}}/></h4>
                    <p className="text-xl font-bold text-red-700">{monthlyStats.sang.toLocaleString()}원</p>
                 </div>
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="text-[10px] font-semibold text-blue-500 mb-1 uppercase tracking-tighter flex items-center gap-1">하행선 누적 <ArrowDown size={12} className="text-blue-500" style={{transform:'rotate(20deg)'}}/></h4>
                    <p className="text-xl font-bold text-blue-700">{monthlyStats.ha.toLocaleString()}원</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                 <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <h4 className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-tighter">현금 누적 ({monthlyStats.cashPercent}%)</h4>
                    <p className="text-xl font-bold text-gray-700">{monthlyStats.cash.toLocaleString()}원</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <h4 className="text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-tighter">카드 누적 ({monthlyStats.cardPercent}%)</h4>
                    <p className="text-xl font-bold text-gray-700">{monthlyStats.card.toLocaleString()}원</p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-tighter">1일 평균 쌀 사용량</h4>
                    <p className="text-xl font-bold text-gray-800">{monthlyStats.avgRicePerDay}kg</p>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-tighter">누적 쌀 금액 (환산)</h4>
                    <p className="text-xl font-bold text-gray-800">{Number(monthlyStats.cumulativeRiceCost).toLocaleString()}원</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-tighter">기대 매출 (쌀 기준)</h4>
                    <p className="text-xl font-bold text-gray-800">{monthlyStats.expectedSales.toLocaleString()}원</p>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-tighter">로스+시식 환산액</h4>
                    <p className="text-xl font-bold text-gray-800">{monthlyStats.lossAmount.toLocaleString()}원</p>
                 </div>
              </div>
            </div>

            <div className="flex flex-wrap bg-white p-2 rounded-xl border border-gray-200 shadow-sm gap-1">
              <button onClick={()=>setAdminViewMode('calendar')} className={`flex-1 min-w-[60px] py-3 rounded-lg text-[13px] font-semibold transition-all ${adminViewMode==='calendar'?'bg-gray-900 text-white shadow-sm':'text-gray-500 hover:bg-gray-50'}`}>집계 달력</button>
              <button onClick={()=>setAdminViewMode('list')} className={`flex-1 min-w-[60px] py-3 rounded-lg text-[13px] font-semibold transition-all ${adminViewMode==='list'?'bg-gray-900 text-white shadow-sm':'text-gray-500 hover:bg-gray-50'}`}>리포트 목록</button>
              <button onClick={()=>setAdminViewMode('labor')} className={`flex-1 min-w-[60px] py-3 rounded-lg text-[13px] font-semibold transition-all ${adminViewMode==='labor'?'bg-gray-900 text-white shadow-sm':'text-gray-500 hover:bg-gray-50'}`}>근로/급여</button>
              <button onClick={()=>setAdminViewMode('inventory')} className={`flex-1 min-w-[60px] py-3 rounded-lg text-[13px] font-semibold transition-all ${adminViewMode==='inventory'?'bg-gray-900 text-white shadow-sm':'text-gray-500 hover:bg-gray-50'}`}>재고 관리</button>
              <button onClick={()=>setAdminViewMode('cost')} className={`flex-1 min-w-[60px] py-3 rounded-lg text-[13px] font-semibold transition-all ${adminViewMode==='cost'?'bg-gray-900 text-white shadow-sm':'text-gray-500 hover:bg-gray-50'}`}>비용 관리</button>
            </div>

            {adminViewMode === 'calendar' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in">
                  <p className="text-center text-[10px] font-semibold text-gray-400 mb-4 uppercase tracking-widest">* 날짜를 클릭하면 휴무일로 설정할 수 있습니다.</p>
                  <div className="grid grid-cols-7 gap-1 text-center mb-3 text-[12px] font-semibold text-gray-400 uppercase tracking-widest">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-6">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col items-center">
                       <span className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-widest">총 영업 일수</span>
                       <span className="text-2xl font-bold text-gray-900">{monthlyStats.workingDays}일</span>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col items-center">
                       <span className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-widest">총 휴무 일수</span>
                       <span className="text-2xl font-bold text-gray-900">{monthlyStats.holidayCount}일</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col items-center">
                       <span className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-widest">월 최고 매출일</span>
                       {monthlyStats.maxDay ? (
                         <>
                           <span className="text-sm font-semibold text-gray-700 tracking-tighter">{monthlyStats.maxDay.date.split('-').slice(1).join('/')}</span>
                           <span className="text-lg font-bold text-gray-900">{monthlyStats.maxDay.sales.toLocaleString()}원</span>
                         </>
                       ) : (
                         <span className="text-xs text-gray-400 mt-2">데이터 없음</span>
                       )}
                    </div>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col items-center">
                       <span className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-widest">월 최저 매출일</span>
                       {monthlyStats.minDay ? (
                         <>
                           <span className="text-sm font-semibold text-gray-700 tracking-tighter">{monthlyStats.minDay.date.split('-').slice(1).join('/')}</span>
                           <span className="text-lg font-bold text-gray-900">{monthlyStats.minDay.sales.toLocaleString()}원</span>
                         </>
                       ) : (
                         <span className="text-xs text-gray-400 mt-2">데이터 없음</span>
                       )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col items-center">
                       <span className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-widest">일 평균 매출</span>
                       <span className="text-lg font-bold text-gray-900">{monthlyStats.avgDailySales.toLocaleString()}원</span>
                    </div>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col items-center">
                       <span className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-widest">목표(190만) 과부족</span>
                       <span className={`text-lg font-bold ${monthlyStats.targetDifference >= 0 ? 'text-gray-900' : 'text-gray-600'}`}>
                         {monthlyStats.targetDifference > 0 ? '+' : ''}{monthlyStats.targetDifference.toLocaleString()}원
                       </span>
                    </div>
                  </div>

                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">
                   <div className="text-center space-y-2">
                      <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full border border-gray-200 font-semibold text-xs uppercase tracking-widest"><TrendingUp size={14}/> 전체 기간 매출 통계</div>
                   </div>
                   <div className="space-y-4">
                      <div className="bg-gray-900 p-6 rounded-2xl text-white flex flex-col items-center justify-center space-y-1 shadow-sm border border-gray-800">
                         <span className="text-[10px] font-semibold opacity-60 uppercase tracking-[0.2em]">총 누적 매출</span>
                         <span className="text-3xl font-bold tracking-tight">{allTimeStats.total.toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="bg-gray-100 p-6 rounded-2xl text-gray-900 flex flex-col items-center justify-center space-y-1 border border-gray-200">
                            <div className="flex items-center gap-1.5"><Percent size={12} className="text-gray-500"/><span className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.1em]">누적 판매 수수료 (40%)</span></div>
                            <span className="text-2xl font-bold tracking-tight">{allTimeStats.commission.toLocaleString()}</span>
                         </div>
                         <div className="bg-gray-100 p-6 rounded-2xl text-gray-900 flex flex-col items-center justify-center space-y-1 border border-gray-200">
                            <div className="flex items-center gap-1.5"><PiggyBank size={12} className="text-gray-500"/><span className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.1em]">누적 영업이익 (60%)</span></div>
                            <span className="text-2xl font-bold tracking-tight">{allTimeStats.profit.toLocaleString()}</span>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col items-center justify-center space-y-1 shadow-sm">
                            <CalendarDays className="text-gray-400 mb-1" size={24}/>
                            <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest">누적 / 남은 영업일수</span>
                            <span className="text-lg font-bold text-gray-900">{allTimeStats.cumulativeOperatingDays}일 <span className="text-sm font-normal text-gray-400">/ {allTimeStats.remainingDaysThisYear}일</span></span>
                         </div>
                         <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col items-center justify-center space-y-1 shadow-sm">
                            <Calculator className="text-gray-400 mb-1" size={24}/>
                            <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest">1일 평균 매출</span>
                            <span className="text-lg font-bold text-gray-900">{allTimeStats.avgDailySales.toLocaleString()}원</span>
                         </div>
                      </div>
                      <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center space-y-1 shadow-sm">
                         <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp className="text-indigo-500" size={20}/>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">올해 12월 31일 기준 기대 매출 예측</span>
                         </div>
                         <span className="text-2xl font-black text-indigo-900">{allTimeStats.expectedYearlySales.toLocaleString()}원</span>
                         <span className="text-xs font-medium text-indigo-500/80 mt-1">현재 총 매출 + (평균 매출 × 남은 {allTimeStats.remainingDaysThisYear}일)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col items-center justify-center space-y-1">
                            <div className="flex items-center gap-1 mb-1">
                              <MapPin className="text-red-400" size={20}/>
                              <ArrowUp size={20} className="text-red-500" style={{transform:'rotate(20deg)'}}/>
                            </div>
                            <span className="text-[9px] font-semibold text-red-500 uppercase tracking-widest">상행선 누적</span>
                            <span className="text-lg font-bold text-red-700">{allTimeStats.sang.toLocaleString()}원</span>
                         </div>
                         <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex flex-col items-center justify-center space-y-1">
                            <div className="flex items-center gap-1 mb-1">
                              <MapPin className="text-blue-400" size={20}/>
                              <ArrowDown size={20} className="text-blue-500" style={{transform:'rotate(20deg)'}}/>
                            </div>
                            <span className="text-[9px] font-semibold text-blue-500 uppercase tracking-widest">하행선 누적</span>
                            <span className="text-lg font-bold text-blue-700">{allTimeStats.ha.toLocaleString()}원</span>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {adminViewMode === 'cost' && (
              <div className="space-y-6">
                 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in">
                    <p className="text-center text-[10px] font-semibold text-gray-400 mb-4 uppercase tracking-widest">* 날짜를 클릭하여 상세 비용을 확인 및 등록하세요.</p>
                    <div className="grid grid-cols-7 gap-1 text-center mb-3 text-[12px] font-semibold text-gray-400 uppercase tracking-widest">
                       {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">{renderCostCalendar()}</div>
                 </div>

                 {/* 비용 항목별 비교 분석 패널 */}
                 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <PieChart className="text-gray-500" size={20}/>
                      비용 분석 <span className="text-xs font-semibold text-gray-400 font-normal ml-1">(총 100% 기준)</span>
                    </h3>
                    <div className="space-y-4">
                        {monthlyCosts.categoryBreakdown.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-end text-sm text-gray-700">
                                    <span className="flex items-center gap-2 font-medium">
                                      <span className="w-2 h-2 rounded-full bg-gray-400 block"></span>
                                      {item.category}
                                    </span>
                                    <div className="text-right">
                                      <span className="text-base font-bold text-gray-900 block leading-none">{item.amount.toLocaleString()}원</span>
                                      <span className="text-[10px] text-gray-500 uppercase font-semibold">{item.percentage}% 비중</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div className="bg-gray-900 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${item.percentage}%` }}></div>
                                </div>
                            </div>
                        ))}
                        {monthlyCosts.categoryBreakdown.length === 0 && (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                              <p className="text-gray-500 font-medium text-sm">이번 달에 발생한 비용 내역이 없습니다.</p>
                            </div>
                        )}
                    </div>
                 </div>

                 {/* 월 총 비용 및 순수익 요약 대시보드 */}
                 <div className="bg-gray-900 p-8 rounded-2xl text-white shadow-md flex flex-col space-y-6 border border-gray-800 animate-in slide-in-from-bottom-4">
                    <div className="flex flex-col items-center justify-center space-y-2 pb-6 border-b border-gray-800">
                       <div className="flex items-center gap-2 bg-gray-800 px-4 py-1.5 rounded-full border border-gray-700">
                          <Wallet size={14} className="text-gray-400"/>
                          <span className="text-[10px] text-gray-300 uppercase tracking-widest">이번 달 총 발생 비용</span>
                       </div>
                       <div className="text-center flex flex-col items-center gap-1">
                          <span className="text-4xl font-bold tracking-tight">{monthlyCosts.grandTotal.toLocaleString()}원</span>
                          <span className="text-sm font-medium text-gray-400">(매출 대비 {monthlyCosts.costPercentage}%)</span>
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                       <div className="flex items-center gap-2">
                         <TrendingUp size={16} className="text-gray-400" />
                         <h3 className="text-sm font-semibold text-gray-300">이번 달 예상 영업이익 요약</h3>
                       </div>
                       <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                          <div className="w-full flex justify-between items-center bg-gray-800 px-4 py-3 rounded-lg border border-gray-700">
                             <span className="text-xs text-gray-400">매출</span>
                             <span className="text-base font-bold">{monthlyStats.total.toLocaleString()}원</span>
                          </div>
                          <span className="text-gray-600 font-bold">-</span>
                          <div className="w-full flex justify-between items-center bg-gray-800 px-4 py-3 rounded-lg border border-gray-700">
                             <span className="text-xs text-gray-400">수수료(40%)</span>
                             <span className="text-base font-bold">{(monthlyStats.total * 0.4).toLocaleString()}원</span>
                          </div>
                          <span className="text-gray-600 font-bold">-</span>
                          <div className="w-full flex justify-between items-center bg-gray-800 px-4 py-3 rounded-lg border border-gray-700">
                             <span className="text-xs text-gray-400">비용</span>
                             <span className="text-base font-bold">{monthlyCosts.grandTotal.toLocaleString()}원</span>
                          </div>
                          <span className="text-gray-600 font-bold">=</span>
                          <div className="w-full flex justify-between items-center bg-indigo-50 text-indigo-900 px-4 py-3 rounded-lg border border-indigo-200">
                             <span className="text-xs font-bold text-indigo-700">영업이익</span>
                             <span className="text-lg font-black">
                                {(monthlyStats.total - (monthlyStats.total * 0.4) - monthlyCosts.grandTotal).toLocaleString()}원
                                {/* 수정 1: 영업이익이 매출에서 차지하는 비중 괄호로 추가 */}
                                <span className="text-sm font-semibold text-indigo-500 ml-1">
                                   ({monthlyStats.total > 0 ? (((monthlyStats.total - (monthlyStats.total * 0.4) - monthlyCosts.grandTotal) / monthlyStats.total) * 100).toFixed(1) : 0}%)
                                </span>
                             </span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {adminViewMode === 'labor' && (
              <div className="space-y-6 animate-in fade-in">
                 <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                   <h4 className="text-gray-800 text-sm font-bold flex items-center gap-2"><AlertCircle size={16}/> 근로 기준 및 4대보험 안내</h4>
                   <ul className="text-[11px] text-gray-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                     <li>매니저가 1일 근무 시 <strong>실 근로시간은 10시간</strong> 기준입니다.</li>
                     <li><strong>주 15시간 이상(한 주에 2일 이상)</strong> 또는 <strong>월 60시간 이상(월 6일 이상)</strong> 근무 시 <strong>4대보험 전면 가입</strong> 대상입니다. (사업주 부담 약 9.65%)</li>
                     <li>위 조건 미달 시에는 <strong>고용보험, 산재보험만 가입</strong>됩니다. (사업주 부담 약 2.15%)</li>
                     <li>예상 인건비는 <strong>1일 급여 + 보험료 + 식대(9,900원)</strong>가 합산됩니다.</li>
                   </ul>
                 </div>

                 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                    <h3 className="text-lg font-bold text-gray-900 border-l-4 border-gray-900 pl-3">매니저 명단 관리</h3>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={newManagerName} 
                         onChange={e=>setNewManagerName(e.target.value)} 
                         className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm text-gray-900" 
                         placeholder="새로운 매니저 이름" 
                       />
                       <button onClick={handleAddManager} className="px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium flex items-center gap-1 active:scale-95 transition-transform">
                          <UserPlus size={16}/> 추가
                       </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                       {activeDefaults.map(m => (
                          <div key={m} className={`flex justify-between items-center p-3 rounded-xl border ${getManagerColor(m)}`}>
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-current opacity-70"></div>
                                <span className="font-bold text-sm">{m} <span className="text-[9px] opacity-60 ml-1 font-normal">(기본)</span></span>
                             </div>
                             <button onClick={()=>handleRemoveDefaultManager(m)} className="p-1.5 opacity-50 hover:opacity-100 transition-opacity"><UserMinus size={14}/></button>
                          </div>
                       ))}
                       {dbManagers.map(m => (
                          <div key={m.id} className={`flex justify-between items-center p-3 rounded-xl border ${getManagerColor(m.name)}`}>
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-current opacity-70"></div>
                                <span className="font-bold text-sm">{m.name}</span>
                             </div>
                             <button onClick={()=>handleRemoveManager(m.id)} className="p-1.5 opacity-50 hover:opacity-100 transition-opacity"><UserMinus size={14}/></button>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-8 mt-6">
                    <div className="flex items-center gap-2 border-l-4 border-gray-900 pl-3">
                       <CalendarDays size={18} className="text-gray-600"/>
                       <h3 className="text-lg font-bold text-gray-900">근무자 스케쥴 관리</h3>
                    </div>

                    <div className="bg-gray-900 p-6 rounded-2xl text-white shadow-sm space-y-4">
                      <div className="text-center space-y-1">
                        <p className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest flex items-center justify-center gap-1">
                           이번 달 총 예상 인건비
                        </p>
                        <p className="text-3xl font-bold tracking-tight">{scheduleStats.grandTotalLaborCost.toLocaleString()}원</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-800">
                        <div className="text-center">
                          <p className="text-[9px] text-gray-400 mb-0.5">총 예상 급여</p>
                          <p className="text-sm font-semibold">{scheduleStats.grandTotalWage.toLocaleString()}원</p>
                        </div>
                        <div className="text-center border-x border-gray-800">
                          <p className="text-[9px] text-gray-400 mb-0.5">총 보험료</p>
                          <p className="text-sm font-semibold">{scheduleStats.grandTotalInsurance.toLocaleString()}원</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-gray-400 mb-0.5">총 식대</p>
                          <p className="text-sm font-semibold">{scheduleStats.grandTotalMeal.toLocaleString()}원</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-red-700 flex items-center gap-1">상행선 스케쥴 <ArrowUp size={16} className="text-red-500" style={{transform:'rotate(20deg)'}}/></h4>
                      <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                        <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[9px] font-semibold text-gray-400">
                          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d=><div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">{renderScheduleCalendar('상행선')}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-blue-700 flex items-center gap-1">하행선 스케쥴 <ArrowDown size={16} className="text-blue-500" style={{transform:'rotate(20deg)'}}/></h4>
                      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[9px] font-semibold text-gray-400">
                          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d=><div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">{renderScheduleCalendar('하행선')}</div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 space-y-4">
                      <h4 className="text-sm font-bold text-gray-800">매니저별 예상 급여 명세</h4>
                      <div className="flex flex-col gap-3">
                        {Object.entries(scheduleStats.managerMonthlyStats).filter(([_, s]) => s.totalDays > 0).sort((a, b) => b[1].totalDays - a[1].totalDays).length > 0 ? (
                           Object.entries(scheduleStats.managerMonthlyStats)
                             .filter(([_, stats]) => stats.totalDays > 0)
                             .sort((a, b) => b[1].totalDays - a[1].totalDays)
                             .map(([mgr, stats]) => {
                                return (
                                   <div key={mgr} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col gap-3">
                                      <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                        <span className={`text-sm font-bold px-2 py-1 rounded-md ${getManagerColor(mgr)}`}>{mgr} 매니저</span>
                                        <div className="flex items-center gap-1.5">
                                           <span className="bg-white px-2 py-0.5 rounded text-[9px] font-semibold border border-gray-200 text-gray-600 flex items-center gap-1">
                                             총 {stats.totalDays}일 (
                                             <span className="text-red-500 font-bold flex items-center">상:{stats.sangDays}<ArrowUp size={8} style={{transform:'rotate(20deg)'}}/></span> / 
                                             <span className="text-blue-500 font-bold flex items-center">하:{stats.haDays}<ArrowDown size={8} style={{transform:'rotate(20deg)'}}/></span>
                                             )
                                           </span>
                                           {stats.insuranceType === 'FULL' ? (
                                              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[9px] font-semibold">4대보험 가입</span>
                                           ) : (
                                              <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[9px] font-semibold">고용/산재 가입</span>
                                           )}
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                        <div className="flex justify-between"><span>기본 급여</span><span className="font-semibold text-gray-900">{stats.totalWage.toLocaleString()}원</span></div>
                                        <div className="flex justify-between"><span>식대 합계</span><span className="font-semibold text-gray-900">{stats.totalMeal.toLocaleString()}원</span></div>
                                        <div className="flex justify-between col-span-2">
                                          <span>{stats.insuranceType === 'FULL' ? '사업주 부담 보험료' : '사업주 부담 보험료'}</span>
                                          <span className="font-semibold text-gray-900">{stats.totalInsurance.toLocaleString()}원</span>
                                        </div>
                                      </div>
                                      <div className="bg-white p-2.5 rounded-lg border border-gray-200 flex justify-between items-center mt-1">
                                        <span className="text-[11px] font-semibold text-gray-500">인건비 총합</span>
                                        <span className="text-base font-bold text-gray-900">{stats.totalCost.toLocaleString()}원</span>
                                      </div>
                                   </div>
                                );
                             })
                        ) : (
                          <span className="text-xs text-gray-400 px-1">배정된 근무자가 없습니다.</span>
                        )}
                      </div>
                    </div>
                 </div>
              </div>
            )}

            {adminViewMode === 'inventory' && (
              <div className="space-y-6 animate-in fade-in">
                 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <h3 className="text-lg font-bold text-gray-900 border-l-4 border-gray-900 pl-3">현재 재고 현황</h3>
                      <span className="text-[10px] text-gray-400">* 빵끈/비닐은 매출기반 자동 차감</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col items-center justify-center space-y-1.5 relative overflow-hidden">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest relative z-10">뻥쌀 재고</span>
                          
                          {/* 박스 단위 표시 변환부 */}
                          <span className="text-2xl font-bold text-gray-900 tracking-tight relative z-10">
                            {Math.floor(currentStock.riceKg / 20)}박스 {(currentStock.riceKg % 20).toFixed(1).replace(/\.0$/, '')}kg
                            <span className="text-xs ml-1 font-normal text-gray-500">(총 {currentStock.riceKg.toLocaleString()}kg)</span>
                          </span>

                          <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 relative z-10">일 평균 {averagesSinceMay2026.rice}kg</span>
                          <div className="w-full border-t border-gray-200 mt-2 pt-2 text-center flex flex-col relative z-10">
                             <span className="text-[9px] text-gray-400 font-semibold uppercase">잔여 영업일({remainingDaysThisMonth}일) 필요량</span>
                             <span className="text-xs font-bold text-gray-700">{(averagesSinceMay2026.rice * remainingDaysThisMonth).toFixed(1)}kg</span>
                          </div>
                       </div>
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col items-center justify-center space-y-1.5">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">빵끈 재고</span>
                          <span className="text-2xl font-bold text-gray-900 tracking-tight">{currentStock.tie.toLocaleString()}<span className="text-xs ml-0.5 font-normal text-gray-500">개</span></span>
                          <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">일 평균 {averagesSinceMay2026.tie}개</span>
                          <div className="w-full border-t border-gray-200 mt-2 pt-2 text-center flex flex-col">
                             <span className="text-[9px] text-gray-400 font-semibold uppercase">잔여 영업일({remainingDaysThisMonth}일) 필요량</span>
                             <span className="text-xs font-bold text-gray-700">{(averagesSinceMay2026.tie * remainingDaysThisMonth).toLocaleString()}개</span>
                          </div>
                       </div>
                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col items-center justify-center space-y-1.5">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">포장 비닐 재고</span>
                          <span className="text-2xl font-bold text-gray-900 tracking-tight">{currentStock.bag.toLocaleString()}<span className="text-xs ml-0.5 font-normal text-gray-500">개</span></span>
                          <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">일 평균 {averagesSinceMay2026.bag}개</span>
                          <div className="w-full border-t border-gray-200 mt-2 pt-2 text-center flex flex-col">
                             <span className="text-[9px] text-gray-400 font-semibold uppercase">잔여 영업일({remainingDaysThisMonth}일) 필요량</span>
                             <span className="text-xs font-bold text-gray-700">{(averagesSinceMay2026.bag * remainingDaysThisMonth).toLocaleString()}개</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 border-l-4 border-gray-900 pl-3">수동 입출고 기록</h3>
                    <div className="flex flex-col gap-2">
                       <div className="flex gap-2">
                         <select value={adjustType} onChange={e=>setAdjustType(e.target.value)} className="w-1/3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm outline-none text-gray-800">
                            <option value="rice">뻥쌀 (kg)</option>
                            <option value="tie">빵끈 (개)</option>
                            <option value="bag">포장 비닐 (개)</option>
                         </select>
                         <input type="number" value={adjustAmount} onChange={e=>setAdjustAmount(e.target.value)} placeholder="수량" className="w-2/3 p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-right text-gray-900 focus:ring-2 ring-gray-200" />
                       </div>
                       <input type="text" value={formatComma(adjustPrice)} onChange={e=>setAdjustPrice(parseComma(e.target.value))} placeholder="비용(금액) 입력 (선택, 원)" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-right text-gray-900 text-sm focus:ring-2 ring-gray-200" />
                    </div>
                    <div className="flex gap-2 pt-1">
                       <button onClick={()=>handleAdjustInventory(true)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1"><PlusCircle size={16}/> 입고</button>
                       <button onClick={()=>handleAdjustInventory(false)} className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1"><MinusCircle size={16}/> 출고</button>
                    </div>
                 </div>

                 <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                       <History className="text-gray-600" size={18}/>
                       <h3 className="text-sm font-bold text-gray-800">상세 내역</h3>
                    </div>
                    {inventoryLogs.length === 0 ? (
                       <p className="text-center text-gray-400 py-6 text-xs bg-white rounded-xl border border-gray-200">기록이 없습니다.</p>
                    ) : (
                       inventoryLogs.map(log => (
                          <div key={log.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                             {editLogId === log.id ? (
                                <div className="space-y-3">
                                   <div className="flex justify-between items-center">
                                     <span className="text-[10px] font-semibold text-gray-500">내역 수정</span>
                                     <span className="text-[9px] text-gray-400">{log.date}</span>
                                   </div>
                                   <div className="grid grid-cols-2 gap-2">
                                      <select value={editLogData.type} onChange={e=>setEditLogData({...editLogData, type: e.target.value})} className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-800">
                                         <option value="rice">뻥쌀</option>
                                         <option value="tie">빵끈</option>
                                         <option value="bag">포장 비닐</option>
                                      </select>
                                      <select value={editLogData.action} onChange={e=>setEditLogData({...editLogData, action: e.target.value})} className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-800">
                                         <option value="add">입고(+)</option>
                                         <option value="remove">출고(-)</option>
                                      </select>
                                      <div className="col-span-2 flex gap-2">
                                         <input type="number" value={editLogData.amount} onChange={e=>setEditLogData({...editLogData, amount: e.target.value})} className="flex-1 p-2 bg-gray-50 rounded-lg border border-gray-200 text-right text-xs" placeholder="수량" />
                                         <input type="text" value={formatComma(editLogData.priceStr)} onChange={e=>setEditLogData({...editLogData, priceStr: parseComma(e.target.value)})} className="flex-1 p-2 bg-gray-50 rounded-lg border border-gray-200 text-right text-xs" placeholder="금액" />
                                      </div>
                                   </div>
                                   <div className="flex gap-2">
                                      <button onClick={saveLogEdit} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-xs font-semibold">저장</button>
                                      <button onClick={()=>{setEditLogId(null); setEditLogData(null);}} className="flex-1 bg-white border border-gray-200 text-gray-600 py-2 rounded-lg text-xs font-semibold">취소</button>
                                   </div>
                                </div>
                             ) : (
                                <>
                                   <div className="flex justify-between items-start border-b border-gray-100 pb-2 mb-2">
                                      <div className="flex items-center">
                                         <span className={`px-2 py-0.5 rounded text-[9px] font-semibold mr-2 border ${log.action === 'add' ? 'bg-gray-50 border-gray-300 text-gray-700' : 'bg-white border-gray-200 text-gray-500'}`}>
                                            {log.action === 'add' ? '입고' : '출고'}
                                         </span>
                                         <span className="font-semibold text-sm text-gray-800">{inventoryTypeNames[log.type]}</span>
                                      </div>
                                      <div className="text-right">
                                         <span className="text-[9px] text-gray-400 block">{log.date}</span>
                                      </div>
                                   </div>
                                   <div className="flex justify-between items-end mb-3 px-1">
                                      <div>
                                         <span className="text-[9px] text-gray-400 font-semibold uppercase block">수량</span>
                                         <span className={`text-lg font-bold ${log.action === 'add' ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {log.action === 'add' ? '+' : '-'}{log.amount.toLocaleString()} <span className="text-[10px] font-normal">{log.type === 'rice' ? 'kg' : '개'}</span>
                                         </span>
                                      </div>
                                      <div className="text-right">
                                         <span className="text-[9px] text-gray-400 font-semibold uppercase block">금액</span>
                                         <span className="text-sm font-bold text-gray-800">{Number(log.price || 0).toLocaleString()}원</span>
                                      </div>
                                   </div>
                                   <div className="flex gap-2">
                                      <button onClick={()=>startEditLog(log)} className="flex-1 bg-gray-50 text-gray-600 py-2 rounded-lg border border-gray-200 text-[11px] font-semibold active:scale-95 flex items-center justify-center gap-1"><Edit2 size={12}/> 수정</button>
                                      <button onClick={()=>setDeleteConfirmId({ id: log.id, col: 'inventoryLogs' })} className="flex-1 bg-white border border-gray-200 text-gray-500 py-2 rounded-lg text-[11px] font-semibold active:scale-95 flex items-center justify-center gap-1"><Trash2 size={12}/> 삭제</button>
                                   </div>
                                </>
                             )}
                          </div>
                       ))
                    )}
                 </div>
              </div>
            )}

            {adminViewMode === 'list' && (
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button onClick={()=>setFilterType('ALL')} className={`px-4 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${filterType==='ALL' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-500'}`}>전체</button>
                  {allManagers.map(name => (
                    <button key={name} onClick={()=>{setFilterType('WORKER');setFilterValue(name)}} className={`px-4 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${filterType==='WORKER' && filterValue===name ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-500'}`}>{name}</button>
                  ))}
                </div>

                {/* 누적 로스 배너 추가 */}
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-4 animate-in slide-in-from-top-2">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <TrendingUp className="text-red-500 w-6 h-6" />
                  </div>
                  <div>
                      <h3 className="text-xs font-bold text-gray-500 mb-1">이번 달 누적 로스 현황</h3>
                      <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-red-600">{monthlyStats.totalLoss.toLocaleString()}kg</span>
                          <span className="text-xs font-bold text-gray-400">/ 사용 {monthlyStats.totalRice.toLocaleString()}kg</span>
                      </div>
                      <div className="mt-1 inline-block bg-white px-2 py-0.5 rounded text-[10px] font-bold text-red-600 border border-red-200">
                          쌀 사용량 대비 로스율 : {monthlyStats.lossPercentage}%
                      </div>
                  </div>
                </div>

                {filteredReports.map(r => (
                  <div key={r.id} className="p-5 rounded-2xl border border-gray-200 shadow-sm bg-white animate-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] text-gray-400 mb-0.5">{new Date(r.timestamp).toLocaleString('ko-KR')}</p>
                        <p className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                           {r.date} | {r.location}
                           {r.location === '상행선' ? <ArrowUp size={18} className="text-red-500" style={{transform:'rotate(20deg)'}}/> : <ArrowDown size={18} className="text-blue-500" style={{transform:'rotate(20deg)'}}/>}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded border text-[10px] font-bold ${getManagerColor(r.worker)}`}>{r.worker}</span>
                    </div>
                    <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                       <span className="text-[11px] text-gray-500 font-semibold">합계</span>
                       <span className="text-2xl font-bold text-gray-900 tracking-tight">{Number(r.totalSales || 0).toLocaleString()}원</span>
                    </div>
                    <button onClick={()=>setExpandedReportId(expandedReportId === r.id ? null : r.id)} className="w-full mt-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 hover:bg-gray-100 transition-colors">
                      {expandedReportId === r.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} {expandedReportId === r.id ? '닫기' : '상세'}
                    </button>
                    {expandedReportId === r.id && (
                      <div className="mt-4 space-y-4 pt-4 border-t border-dashed border-gray-200 animate-in fade-in">
                         {editReportId === r.id ? (
                           <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                             <p className="text-[10px] text-gray-500 font-bold">수정 모드</p>
                             {/* 관리자 탭에서도 날짜를 자유롭게 수정 가능하도록 보장 */}
                             <div className="space-y-1">
                               <label className="text-[9px] text-gray-500 font-semibold">보고 날짜</label>
                               <input type="date" value={editData.date || ''} onChange={e=>setEditData({...editData, date:e.target.value})} className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs" />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                               <div className="space-y-1">
                                 <label className="text-[9px] text-gray-500 font-semibold">현금</label>
                                 <input type="text" value={formatComma(editData.sales?.cash || '')} onChange={e=>setEditData({...editData, sales:{...(editData.sales || {}), cash:parseComma(e.target.value)}})} className="w-full p-2 bg-white rounded-lg border border-gray-200 text-right text-xs" />
                               </div>
                               <div className="space-y-1">
                                 <label className="text-[9px] text-gray-500 font-semibold">카드</label>
                                 <input type="text" value={formatComma(editData.sales?.card || '')} onChange={e=>setEditData({...editData, sales:{...(editData.sales || {}), card:parseComma(e.target.value)}})} className="w-full p-2 bg-white rounded-lg border border-gray-200 text-right text-xs" />
                               </div>
                             </div>
                             <div className="space-y-1">
                               <label className="text-[9px] text-gray-500 font-semibold">종료 매출</label>
                               <input type="text" value={formatComma(editData.sales?.finalPos || '')} onChange={e=>setEditData({...editData, sales:{...(editData.sales || {}), finalPos:parseComma(e.target.value)}})} className="w-full p-2 bg-white rounded-lg border border-gray-200 text-right text-xs" />
                             </div>
                             <div className="grid grid-cols-2 gap-2 mt-2">
                               <div className="space-y-1">
                                 <label className="text-[9px] text-gray-500 font-semibold">사용쌀(kg)</label>
                                 <input type="number" value={editData.inventory?.usedRice || ''} onChange={e=>setEditData({...editData, inventory:{...(editData.inventory || {}), usedRice:e.target.value}})} className="w-full p-2 bg-white rounded-lg border border-gray-200 text-right text-xs" />
                               </div>
                               <div className="space-y-1">
                                 <label className="text-[9px] text-gray-500 font-semibold">포장된 뻥튀기</label>
                                 <input type="number" value={editData.inventory?.stockCount || ''} onChange={e=>setEditData({...editData, inventory:{...(editData.inventory || {}), stockCount:e.target.value}})} className="w-full p-2 bg-white rounded-lg border border-gray-200 text-right text-xs" />
                               </div>
                               <div className="space-y-1 mt-1">
                                 <label className="text-[9px] text-red-500 font-semibold">로스(kg)</label>
                                 <input type="number" value={editData.inventory?.loss || ''} onChange={e=>setEditData({...editData, inventory:{...(editData.inventory || {}), loss:e.target.value}})} className="w-full p-2 bg-red-50 text-red-700 rounded-lg border border-red-200 text-right text-xs" />
                               </div>
                               <div className="space-y-1 mt-1">
                                 <label className="text-[9px] text-gray-500 font-semibold">원재료 재고(뻥쌀 Box)</label>
                                 <input 
                                    type="text" 
                                    value={editData.inventory?.remainingRiceBoxes || ''} 
                                    onChange={e=>setEditData({...editData, inventory:{...(editData.inventory || {}), remainingRiceBoxes: e.target.value}})} 
                                    className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs text-right"
                                    placeholder="자유롭게 입력 (예: 3박스 반)"
                                 />
                               </div>
                             </div>
                             <div className="space-y-1 mt-2">
                               <label className="text-[9px] text-gray-500 font-semibold">개선이 필요한 부분</label>
                               <textarea value={editData.notes || ''} onChange={e=>setEditData({...editData, notes:e.target.value})} className="w-full p-2 bg-white rounded-lg border border-gray-200 text-xs" rows={2} />
                             </div>
                             <div className="flex gap-2 pt-2">
                               <button onClick={saveEdit} className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold">저장</button>
                               <button onClick={()=>{setEditReportId(null);setEditData(null)}} className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg text-xs font-semibold">취소</button>
                             </div>
                           </div>
                         ) : (
                           <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                  <p className="text-[9px] text-gray-400 mb-1 font-semibold">매출 정보</p>
                                  <div className="flex justify-between text-xs text-gray-800 mb-0.5"><span>현금</span><span className="font-medium">{Number(r.sales?.cash || 0).toLocaleString()}원</span></div>
                                  <div className="flex justify-between text-xs text-gray-800"><span>카드</span><span className="font-medium">{Number(r.sales?.card || 0).toLocaleString()}원</span></div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                  <p className="text-[9px] text-gray-400 mb-1 font-semibold">재고 정보</p>
                                  <div className="flex justify-between text-xs text-gray-800 mb-0.5"><span>쌀 사용량</span><span className="font-medium">{r.inventory?.usedRice || 0}kg</span></div>
                                  <div className="flex justify-between text-xs text-red-600 mb-0.5"><span>로스</span><span className="font-medium">{r.inventory?.loss || 0}kg</span></div>
                                  <div className="flex justify-between text-xs text-gray-800 mb-0.5"><span>원재료 재고(뻥쌀 Box)</span><span className="font-medium">{r.inventory?.remainingRiceBoxes || '기록없음'}</span></div>
                                  <div className="flex justify-between text-xs text-gray-800"><span>포장된 뻥튀기</span><span className="font-medium">{r.inventory?.stockCount || 0}봉투</span></div>
                                </div>
                             </div>

                             <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <p className="text-[9px] text-gray-400 mb-1 font-semibold">포스기 마감 정보</p>
                                <div className="flex justify-between text-xs text-gray-800"><span>종료 전 마지막 매출</span><span className="font-medium">{Number(r.sales?.finalPos || 0).toLocaleString()}원</span></div>
                             </div>

                             <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <p className="text-[9px] text-gray-400 mb-1 font-semibold">익일 자재 상태</p>
                                <div className="flex justify-between text-xs text-gray-800 mb-0.5"><span>포장 비닐</span><span className={r.inventory?.bagStatus === '부족' ? 'text-gray-900 font-bold' : 'text-gray-500'}>{r.inventory?.bagStatus || '미기입'}</span></div>
                                <div className="flex justify-between text-xs text-gray-800"><span>빵끈</span><span className={r.inventory?.tieStatus === '부족' ? 'text-gray-900 font-bold' : 'text-gray-500'}>{r.inventory?.tieStatus || '미기입'}</span></div>
                             </div>

                             <div className="bg-white border border-gray-200 p-4 rounded-xl text-gray-700 text-sm">
                               <p className="text-[9px] text-gray-400 mb-1 font-semibold">개선이 필요한 부분</p>
                               "{r.notes || '없음'}"
                             </div>
                             
                             <div className="grid grid-cols-5 gap-1.5">
                               {r.photos && Object.entries(r.photos).map(([key, url]) => (
                                 url && (
                                   <div key={key} onClick={()=>setSelectedPhoto({url, name: photoNames[key], date: r.date, worker: r.worker})} className="aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-200 cursor-pointer">
                                      <img src={url} className="w-full h-full object-cover" />
                                   </div>
                                 )
                               ))}
                             </div>
                             <div className="flex gap-2 pt-2">
                                <button onClick={()=>startEdit(r)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 hover:bg-gray-50"><Edit2 size={14}/> 수정</button>
                                <button onClick={()=>setDeleteConfirmId({ id: r.id, col: 'reports' })} className="flex-1 py-3 bg-white border border-gray-200 text-gray-500 hover:text-gray-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"><Trash2 size={14}/> 삭제</button>
                             </div>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 스케쥴 배정 모달 */}
          {view === 'admin' && scheduleSelection && (
            <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white p-8 rounded-3xl w-full max-w-sm border border-gray-200 shadow-xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">{scheduleSelection.location}</p>
                    <h3 className="text-xl font-bold text-gray-900">{scheduleSelection.date}</h3>
                  </div>
                  <button onClick={()=>setScheduleSelection(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><X size={20}/></button>
                </div>
                
                <div className="mb-6 space-y-2">
                  <label className="text-[11px] text-gray-500 font-semibold pl-1">해당일 근무 임금</label>
                  <input
                    type="text"
                    value={formatComma(scheduleWage)}
                    onChange={e => setScheduleWage(parseComma(e.target.value))}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-right text-gray-900 focus:ring-2 ring-gray-200"
                    placeholder="0 원"
                  />
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={() => setScheduleWage('120000')} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-600">12만원</button>
                    <button onClick={() => setScheduleWage('130000')} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-600">13만원</button>
                    <button onClick={() => setScheduleWage('140000')} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-600">14만원</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  {allManagers.map(m => (
                    <button key={m} onClick={() => assignWorkerToSchedule(m)} className={`py-3 rounded-xl border font-semibold text-xs transition-colors hover:opacity-80 ${getManagerColor(m)}`}>
                      {m} 배정
                    </button>
                  ))}
                </div>

                <button onClick={() => assignWorkerToSchedule('CLEAR')} className="w-full py-4 bg-white text-gray-500 hover:text-gray-900 rounded-xl font-semibold border border-gray-200 flex items-center justify-center gap-1.5 transition-colors">
                  <Trash2 size={16}/> 배정 삭제
                </button>
              </div>
            </div>
          )}

          {/* 비용 상세 모달 (자동 환산 + 계좌 드롭다운 기능 추가) */}
          {view === 'admin' && costSelectionDate && (
            <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl w-full max-w-sm border border-gray-200 shadow-xl animate-in zoom-in-95 flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold">비용 상세 내역</p>
                    <h3 className="text-xl font-bold text-gray-900">{costSelectionDate}</h3>
                  </div>
                  <button onClick={()=>setCostSelectionDate(null)} className="p-2 bg-gray-100 rounded-lg"><X size={20}/></button>
                </div>

                <div className="overflow-y-auto pr-1 space-y-5">
                   <div className="space-y-2">
                     <h4 className="text-[10px] text-gray-400 font-semibold pl-1">자동 계산 내역</h4>
                     {/* 자동 인건비 표시 */}
                     <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-blue-800 flex items-center gap-1.5"><CalendarDays size={14}/> 인건비 (자동 산출)</span>
                        <span className="text-base font-bold text-blue-900">{formatComma(scheduleStats.dailyLaborCosts[costSelectionDate] || 0)}원</span>
                     </div>
                     {/* 자동 재료비(쌀, 비닐, 빵끈) 표시 */}
                     {monthlyCosts.dailyMaterialCosts[costSelectionDate] > 0 && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex justify-between items-center">
                           <span className="text-[11px] font-semibold text-green-800 flex items-center gap-1.5"><Box size={14}/> 재료비 (자동 산출)</span>
                           <span className="text-base font-bold text-green-900">{formatComma(monthlyCosts.dailyMaterialCosts[costSelectionDate])}원</span>
                        </div>
                     )}
                   </div>

                   <div className="space-y-2">
                      <h4 className="text-[10px] text-gray-400 font-semibold pl-1">수동 추가 내역</h4>
                      {(monthlyCosts.manualByDate[costSelectionDate] || []).length === 0 ? (
                        <p className="text-[11px] text-gray-400 bg-white p-3 rounded-xl text-center border border-dashed border-gray-200">수동 비용이 없습니다.</p>
                      ) : (
                        (monthlyCosts.manualByDate[costSelectionDate] || []).map(c => (
                           <div key={c.id} className="bg-white p-3 rounded-xl border border-gray-200 flex justify-between items-center">
                              <div>
                                <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 mr-1.5 border border-gray-200">{c.category}</span>
                                <span className="text-[9px] bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded mr-1.5 border border-gray-200">{c.account || '기업은행'}</span>
                                <span className="text-xs font-semibold text-gray-800">{c.description}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-900">{formatComma(c.amount)}</span>
                                <button onClick={()=>setDeleteConfirmId({id: c.id, col: 'costs'})} className="text-gray-400 hover:text-gray-900"><Trash2 size={14}/></button>
                              </div>
                           </div>
                        ))
                      )}
                   </div>

                   <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2.5">
                      <h4 className="text-[11px] text-gray-700 font-bold mb-1 flex items-center gap-1.5"><Plus size={12}/> 항목 추가</h4>
                      
                      <div className="flex gap-2">
                         <select value={costForm.category} onChange={e=>setCostForm({...costForm, category: e.target.value})} className="w-2/5 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-800 outline-none">
                            {COST_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                         </select>
                         <input type="text" value={formatComma(costForm.amount)} onChange={e=>setCostForm({...costForm, amount: parseComma(e.target.value)})} placeholder="금액" className="w-3/5 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm font-bold text-right text-gray-900 outline-none" />
                      </div>
                      <div className="flex gap-2">
                        <select value={costForm.account} onChange={e=>setCostForm({...costForm, account: e.target.value})} className="w-2/5 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-800 outline-none">
                           {ACCOUNT_OPTIONS.map(acc => (
                             <option key={acc} value={acc}>{acc}</option>
                           ))}
                        </select>
                        <input type="text" value={costForm.description} onChange={e=>setCostForm({...costForm, description: e.target.value})} placeholder="내용 설명" className="w-3/5 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-800 outline-none" />
                      </div>
                      <button onClick={handleAddCost} className="w-full py-3 bg-gray-900 text-white rounded-lg text-xs font-bold mt-1 active:scale-95 transition-transform">추가하기</button>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (view === 'reference') {
      const currentRefs = references.filter(r => r.direction === refDirectionTab);
      return (
         <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-40 font-sans">
            <header className="bg-white p-5 border-b border-gray-200 flex justify-between items-center sticky top-0 z-20">
               <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100"><Menu size={20}/></button>
               <h1 className="font-bold text-gray-900 text-lg">사진 레퍼런스</h1>
               <div className="w-8"></div>
            </header>
            <div className="p-4 space-y-5">
               <div className="flex gap-2 p-1.5 bg-gray-200 rounded-xl">
                  <button onClick={()=>setRefDirectionTab('상행선')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${refDirectionTab === '상행선' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>상행선 레퍼런스</button>
                  <button onClick={()=>setRefDirectionTab('하행선')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${refDirectionTab === '하행선' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>하행선 레퍼런스</button>
               </div>
               
               <div className="flex justify-end mb-2">
                  <label className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95 transition-transform shadow-sm">
                     {isUploading ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16}/>}
                     {isUploading ? '업로드 중...' : '새 사진 첨부'}
                     <input type="file" accept="image/*" className="hidden" onChange={handleRefUpload} disabled={isUploading}/>
                  </label>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                  {currentRefs.length === 0 && (
                     <div className="col-span-2 text-center py-12 text-gray-400 font-semibold text-sm bg-white rounded-2xl border border-dashed border-gray-200">등록된 사진이 없습니다.</div>
                  )}
                  {currentRefs.map(ref => (
                     <div key={ref.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 flex flex-col animate-in slide-in-from-bottom-2">
                        <div className="aspect-square bg-gray-100 relative cursor-pointer group" onClick={() => setSelectedPhoto({url: ref.imageUrl, name: '레퍼런스', date: new Date(ref.timestamp).toLocaleDateString(), worker: ''})}>
                           <img src={ref.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="text-white" size={24}/>
                           </div>
                        </div>
                        <div className="p-3 bg-white flex flex-col flex-1">
                           {editRefId === ref.id ? (
                              <div className="space-y-2 flex-1 flex flex-col">
                                 <input autoFocus type="text" value={editRefDesc} onChange={e=>setEditRefDesc(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 outline-none" placeholder="설명 입력..."/>
                                 <div className="flex gap-1.5 mt-auto">
                                    <button onClick={saveReferenceEdit} className="flex-1 bg-gray-900 text-white py-1.5 rounded-md text-[10px] font-bold">저장</button>
                                    <button onClick={()=>setEditRefId(null)} className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded-md text-[10px] font-bold">취소</button>
                                 </div>
                              </div>
                           ) : (
                              <div className="flex-1 flex flex-col">
                                 <p className="text-xs font-semibold text-gray-800 line-clamp-2 min-h-[2rem] leading-relaxed break-words">{ref.description || <span className="text-gray-400 italic font-normal">설명 없음</span>}</p>
                                 <div className="flex justify-end gap-1.5 mt-2 pt-2 border-t border-gray-100">
                                    <button onClick={() => { setEditRefId(ref.id); setEditRefDesc(ref.description || ''); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={14}/></button>
                                    <button onClick={() => setDeleteConfirmId({id: ref.id, col: 'references'})} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      );
    }

    if (view === 'manual_open' || view === 'manual_close') {
      const isOpen = view === 'manual_open';
      const manualItems = isOpen ? openManualItems : closeManualItems;
      const checks = isOpen ? openChecks : closeChecks;
      const toggleFn = isOpen ? toggleOpenManualCheck : toggleCloseManualCheck;
      const checkedCount = Object.values(checks).filter(Boolean).length;
      const progress = Math.round((checkedCount / manualItems.length) * 100);

      return (
        <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-40 font-sans">
          <header className="bg-white p-5 border-b border-gray-200 flex justify-between items-center sticky top-0 z-20 shadow-sm">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"><Menu size={20}/></button>
            <h1 className="font-bold text-gray-900 text-lg">하트뻥튀기 매뉴얼</h1>
            <div className="w-8"></div>
          </header>
          <div className="p-4 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-end">
                <h2 className="text-sm font-bold text-gray-900 border-l-4 border-gray-900 pl-2">
                  {isOpen ? '오픈 매뉴얼' : '마감 매뉴얼'}
                </h2>
                <span className="text-xl font-bold text-gray-800">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-800 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed text-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                {isOpen ? '적혀있는 순서대로 꼼꼼히 오픈해주세요.' : '깨끗한 매장을 위해 마감 수칙을 꼭 지켜주세요. 수고하셨습니다.'}
              </p>
            </div>
            
            <div className="space-y-2.5">
              {manualItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => toggleFn(item.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 transform active:scale-[0.98] ${checks[item.id] ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200 shadow-sm'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${checks[item.id] ? 'bg-gray-800 text-white' : 'bg-gray-100'}`}>
                    {checks[item.id] ? <CheckCircle2 size={20}/> : item.icon}
                  </div>
                  <span className={`flex-1 text-left font-medium text-sm leading-snug ${checks[item.id] ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {item.title}
                  </span>
                  {!checks[item.id] && <Circle size={24} className="text-gray-200 flex-shrink-0"/>}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-20 font-sans">
        <header className="bg-white p-5 border-b border-gray-200 sticky top-0 z-20 flex justify-between items-center shadow-sm">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100"><Menu size={20}/></button>
          <h1 className="font-bold text-gray-900 text-lg flex items-center gap-1 tracking-tight">❤️ 하트뻥튀기</h1>
          <div className="w-8"></div>
        </header>

        <div className="p-4 space-y-5 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
             <div className="flex-1 flex flex-col">
                <span className="text-[10px] font-semibold text-gray-500 mb-0.5">보고 일자</span>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="text-sm font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer" />
             </div>
             <div className="flex gap-2">
                <div className="flex flex-col items-center">
                   <span className="text-[9px] text-gray-400 mb-1 font-semibold flex items-center gap-0.5">상행 <ArrowUp size={10} className="text-red-500" style={{ transform: 'rotate(20deg)' }}/></span>
                   <span className={`text-[9px] px-2 py-0.5 rounded border transition-all ${dailyStatus.상행선 === '제출완료' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{dailyStatus.상행선}</span>
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-[9px] text-gray-400 mb-1 font-semibold flex items-center gap-0.5">하행 <ArrowDown size={10} className="text-blue-500" style={{ transform: 'rotate(20deg)' }}/></span>
                   <span className={`text-[9px] px-2 py-0.5 rounded border transition-all ${dailyStatus.하행선 === '제출완료' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>{dailyStatus.하행선}</span>
                </div>
             </div>
          </div>

          <section className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-gray-800 border-l-4 border-gray-800 pl-2">1. 기본 정보 및 매출</h2>
            <div className="space-y-5 pt-1">
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-600">근무 매니저</label>
                  <div className="grid grid-cols-3 gap-2">
                    {allManagers.map(m => (
                      <button 
                        key={m} 
                        onClick={() => setFormData({...formData, worker: m})} 
                        className={`py-2.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${formData.worker === m ? 'bg-gray-900 border-gray-900 text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-600">영업 위치</label>
                  <div className="flex gap-2">
                    {['상행선','하행선'].map(l=>(
                      <button key={l} onClick={()=>setFormData({...formData, location:l})} className={`px-5 py-2 rounded-lg text-xs font-medium border transition-all active:scale-95 flex items-center gap-1.5 ${formData.location === l ? (l === '상행선' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700') : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                         {l} {l === '상행선' ? <ArrowUp size={14} className={formData.location === l ? 'text-red-600' : 'text-gray-400'} style={{transform:'rotate(20deg)'}}/> : <ArrowDown size={14} className={formData.location === l ? 'text-blue-600' : 'text-gray-400'} style={{transform:'rotate(20deg)'}}/>}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
            
            <div className="space-y-3 pt-5 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-semibold pl-1">현금 매출(원)</label>
                  <input type="text" value={formatComma(formData.sales.cash)} onChange={e=>setFormData({...formData, sales:{...formData.sales, cash:parseComma(e.target.value)}})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold text-right text-gray-900 text-base focus:ring-1 ring-gray-400" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-semibold pl-1">카드 매출(원)</label>
                  <input type="text" value={formatComma(formData.sales.card)} onChange={e=>setFormData({...formData, sales:{...formData.sales, card:parseComma(e.target.value)}})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold text-right text-gray-900 text-base focus:ring-1 ring-gray-400" placeholder="0" />
                </div>
              </div>
              <div className="p-3 bg-gray-900 rounded-xl flex justify-between items-center text-white shadow-sm mt-1">
                <span className="text-xs font-semibold">오늘 마감 합계</span>
                <span className="text-lg font-bold">{((Number(parseComma(formData.sales.cash))||0)+(Number(parseComma(formData.sales.card))||0)).toLocaleString()}원</span>
              </div>
              <div className="space-y-1 mt-4 pt-4 border-t border-dashed border-gray-200">
                <label className="text-[10px] text-gray-500 font-semibold pl-1">포스기 종료 전 마지막 매출</label>
                <input type="text" value={formatComma(formData.sales.finalPos)} onChange={e=>setFormData({...formData, sales:{...formData.sales, finalPos:parseComma(e.target.value)}})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold text-right text-gray-800 text-base" placeholder="0" />
                <p className="text-[9px] text-gray-400 pl-1">* 위 합계에 포함되지 않으며, 보고용으로 사용됩니다.</p>
              </div>
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-gray-800 border-l-4 border-gray-800 pl-2">2. 재료 및 재고 현황</h2>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 font-semibold pl-1">포장된 뻥튀기</label>
                <input type="number" value={formData.inventory.stockCount} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, stockCount:e.target.value}})} className="w-full p-2.5 bg-gray-50 rounded-lg border border-gray-200 outline-none font-bold text-right text-gray-800 text-sm" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 font-semibold pl-1">사용 쌀(kg)</label>
                <input type="number" value={formData.inventory.usedRice} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, usedRice:e.target.value}})} className="w-full p-2.5 bg-gray-50 rounded-lg border border-gray-200 outline-none font-bold text-right text-gray-800 text-sm" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-red-500 font-semibold pl-1">로스(kg)</label>
                <input type="number" value={formData.inventory.loss} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, loss:e.target.value}})} className="w-full p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-200 outline-none font-bold text-right text-sm" placeholder="0" />
              </div>
            </div>
            
            <div className="pt-5 border-t border-gray-100 space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700 pl-1">원재료 재고(뻥쌀 Box)</p>
                  <input 
                    type="text"
                    value={formData.inventory.remainingRiceBoxes} 
                    onChange={e=>setFormData({...formData, inventory:{...formData.inventory, remainingRiceBoxes: e.target.value}})} 
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm font-semibold text-gray-800 focus:ring-1 ring-gray-400"
                    placeholder="자유롭게 입력해주세요 (예: 3박스 반)"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700 pl-1">포장 비닐 (최소 300장)</p>
                  <div className="flex gap-2">
                    <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, bagStatus:'충분'}})} className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${formData.inventory.bagStatus==='충분'?'bg-gray-800 border-gray-800 text-white':'bg-gray-50 border-gray-200 text-gray-500'}`}>충분함</button>
                    <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, bagStatus:'부족'}})} className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${formData.inventory.bagStatus==='부족'?'bg-gray-800 border-gray-800 text-white':'bg-gray-50 border-gray-200 text-gray-500'}`}>부족함</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700 pl-1">빵끈 (최소 250개)</p>
                  <div className="flex gap-2">
                    <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, tieStatus:'충분'}})} className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${formData.inventory.tieStatus==='충분'?'bg-gray-800 border-gray-800 text-white':'bg-gray-50 border-gray-200 text-gray-500'}`}>충분함</button>
                    <button onClick={()=>setFormData({...formData, inventory:{...formData.inventory, tieStatus:'부족'}})} className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${formData.inventory.tieStatus==='부족'?'bg-gray-800 border-gray-800 text-white':'bg-gray-50 border-gray-200 text-gray-500'}`}>부족함</button>
                  </div>
                </div>
                <div className="space-y-1.5 mt-2">
                  <p className="text-xs font-semibold text-gray-700 pl-1">기타 물품 (직접 입력)</p>
                  <input type="text" value={formData.inventory.otherSupplies} onChange={e=>setFormData({...formData, inventory:{...formData.inventory, otherSupplies:e.target.value}})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm text-gray-800 focus:ring-1 ring-gray-400" placeholder="부족한 물품 입력..." />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 border-l-4 border-gray-800 pl-2">3. 증빙 사진 촬영</h2>
              {isUploading && <Loader2 className="w-5 h-5 text-gray-600 animate-spin"/>}
            </div>
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {Object.keys(photoNames).map(p=>(
                <label key={p} className={`aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all duration-200 ${formData.photos[p] ? 'bg-gray-50 border-gray-400' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}`}>
                  <input type="file" accept="image/*" className="hidden" onChange={e=>handlePhotoChange(p, e)} disabled={isUploading} />
                  {formData.photos[p] ? <img src={formData.photos[p]} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center opacity-50"><Camera size={24} className="text-gray-700 mb-1"/><span className="text-[10px] text-gray-700 font-semibold">{photoNames[p]}</span></div>}
                  {formData.photos[p] && <div className="absolute inset-0 bg-black/5 flex items-center justify-center"><CheckCircle2 className="text-white drop-shadow-md" size={32}/></div>}
                </label>
              ))}
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-800 border-l-4 border-gray-800 pl-2">4. 대기 손님 여부</h2>
            <div className="flex gap-2 pt-1">
              <button onClick={()=>handleWaitingToggle(true)} className={`flex-1 py-4 rounded-xl font-semibold text-sm border transition-all ${formData.waiting.hadWaiting===true?'bg-gray-900 border-gray-900 text-white shadow-sm':'bg-gray-50 border-gray-200 text-gray-500'}`}>손님 있었음</button>
              <button onClick={()=>handleWaitingToggle(false)} className={`flex-1 py-4 rounded-xl font-semibold text-sm border transition-all ${formData.waiting.hadWaiting===false?'bg-gray-900 border-gray-900 text-white shadow-sm':'bg-gray-50 border-gray-200 text-gray-500'}`}>없었음</button>
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-gray-800 border-l-4 border-gray-800 pl-2">5. 개선이 필요한 부분</h2>
            <textarea rows="3" value={formData.notes} onChange={e=>setFormData({...formData, notes:e.target.value})} className="w-full bg-gray-50 rounded-xl p-4 border border-gray-200 outline-none text-sm text-gray-800 placeholder:text-gray-400 focus:ring-1 ring-gray-400" placeholder="사장님께 전달할 내용을 입력해 주세요..." />
          </section>

          <div className="pt-6 pb-8">
            <button onClick={submitReport} disabled={isSubmitting || isUploading} className={`w-full py-5 rounded-2xl font-bold text-lg text-white shadow-sm transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isSubmitting||isUploading?'bg-gray-400 border-gray-400':'bg-gray-900 hover:bg-gray-800'}`}>
              {isSubmitting ? <Loader2 className="animate-spin" size={24}/> : null} {isSubmitting ? '전송 중...' : '보고서 제출 완료'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <NavigationMenu />
      {renderView()}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl border border-gray-200 animate-in zoom-in-95">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} className="text-gray-800"/></div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900 tracking-tight">제출 완료</h3>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed font-medium">매니저님, 정말 고생 많으셨습니다!<br/>조심히 들어가세요.</p>
            <button onClick={() => { window.location.reload(); }} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-base active:scale-95 transition-all">메인으로 돌아가기</button>
          </div>
        </div>
      )}
      {alertMessage && (
        <div className="fixed inset-0 bg-black/60 z-[310] flex items-center justify-center p-6 backdrop-blur-sm" onClick={()=>setAlertMessage('')}>
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm text-center shadow-xl animate-in zoom-in-95" onClick={e=>e.stopPropagation()}>
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={40} className="text-gray-800"/></div>
            <p className="text-gray-900 font-semibold text-base mb-8 whitespace-pre-wrap">{String(alertMessage)}</p>
            <button onClick={()=>setAlertMessage('')} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm active:scale-95 transition-all">확인</button>
          </div>
        </div>
      )}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4 animate-in fade-in" onClick={()=>setSelectedPhoto(null)}>
          <div className="absolute top-6 right-6 flex gap-4">
             <a href={selectedPhoto.url} download={`하트뻥튀기_${selectedPhoto.date}_${selectedPhoto.name}.jpg`} className="p-3 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors" onClick={e=>e.stopPropagation()}><Download size={24}/></a>
             <button className="p-3 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"><X size={24}/></button>
          </div>
          <img src={selectedPhoto.url} className="max-w-full max-h-[75vh] rounded-2xl shadow-xl animate-in zoom-in-95" />
          <div className="text-center mt-6 text-white animate-in slide-in-from-bottom-4">
            <p className="text-xl mb-1 font-bold">{String(selectedPhoto.name)}</p>
            <p className="text-gray-400 text-sm font-medium">{String(selectedPhoto.date)} | {String(selectedPhoto.worker)} MANAGER</p>
          </div>
        </div>
      )}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center p-8 backdrop-blur-md animate-in fade-in duration-200 font-black font-black font-black font-black">
           <div className="bg-white p-12 rounded-[56px] w-full max-w-sm text-center border-[10px] border-red-600 shadow-2xl animate-in zoom-in-95 duration-300 font-black font-black font-black">
              <div className="bg-red-50 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner font-black"><AlertCircle size={64} className="text-red-600"/></div>
              <p className="font-black text-gray-900 mb-12 text-3xl tracking-tight leading-tight font-black">정말 이 항목을<br/>영구 삭제하시겠습니까?</p>
              <div className="flex gap-4 font-black font-black font-black">
                 <button onClick={()=>{setDeleteConfirmId(null); setDeleteTargetType(null);}} className="flex-1 py-6 bg-gray-100 rounded-[28px] font-black text-xl text-gray-500 hover:bg-gray-200 transition-colors font-black font-black">취소</button>
                 <button onClick={executeDelete} className="flex-1 py-6 bg-red-600 rounded-[28px] font-black text-xl text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-500/50">삭제 승인</button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}