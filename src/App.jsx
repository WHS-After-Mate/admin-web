// React의 핵심 라이브러리 및 상태 관리를 위한 useState Hook 임포트
import React, { useState } from 'react';

// 페이지 이동 및 라우팅 관리를 위한 react-router-dom 컴포넌트 및 useNavigate 임포트
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// --- [컴포넌트 임포트 영역] ---
// 공통 레이아웃에 들어가는 사이드바 컴포넌트
import Sidebar from './components/Sidebar';

// 각 모달(팝업창) 컴포넌트들
import TreatmentModal from "./pages/Treatment/TreatmentModal";
import CustomerModal from './pages/Customer/CustomerModal.jsx';

// 서비스의 각 화면 페이지 컴포넌트들
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import CustomerPage from './pages/Customer/CustomerPage';
import CustomerDetailModal from "./pages/CustomerDetail/CustomerDetailModal";

// 전역 또는 레이아웃 스타일시트
import './App.css';

/**
 * 1. AdminLayout 컴포넌트
 * 역할: 로그인 이후 관리자 페이지의 공통 틀(사이드바, 메인 콘텐츠 영역) 및
 *       페이지 전역에서 공통으로 떠야 하는 모달(팝업)등을 일괄 관리합니다.
 */
function AdminLayout({
  children,                // 현재 주소(Route)에 따라 렌더링될 메인 페이지 컴포넌트
  isModalOpen,             // 진료/관리 등록 모달 열림 상태 (boolean)
  setIsModalOpen,          // 진료/관리 등록 모달 상태 변경 함수
  isCustomerModalOpen,     // 신규 고객 등록 모달 열림 상태 (boolean)
  setIsCustomerModalOpen,  // 신규 고객 등록 모달 상태 변경 함수
  isDetailModalOpen,       // 고객 상세 모달 열림 상태 (boolean)
  setIsDetailModalOpen,    // 고객 상세 모달 상태 변경 함수
  selectedCustomer,       // 모달에 전달할 선택된 고객 정보 데이터
<<<<<<< HEAD
=======
  setSelectedCustomer,    // 선택된 고객 정보 상태 변경 함수
  treatmentCustomer,      // 관리 등록 모달에 전달할 고객 데이터
  setTreatmentCustomer,   // 관리 등록 모달 고객 상태 변경 함수
  onRefreshData,          // 데이터 리프레시 콜백
>>>>>>> feature/login
}) {
  return (
    <div className="dashboard-layout">
      {/* 화면 좌측 공통 사이드바 (진료 등록 모달을 열 수 있는 이벤트 전달) */}
<<<<<<< HEAD
      <Sidebar onOpenTreatmentModal={() => setIsModalOpen(true)} />
=======
      <Sidebar onOpenTreatmentModal={() => {
        setTreatmentCustomer(null); // 특정 고객 없이 열기
        setIsModalOpen(true);
      }} />
>>>>>>> feature/login

      {/* 중앙 메인 콘텐츠 영역 (Route에서 전달받은 children 페이지가 표시됨) */}
      <main className="dashboard-main">
        {children}
      </main>

      {/* --- 공통 팝업/모달 영역 --- */}

<<<<<<< HEAD
      {/* 1) 진료 / 관리 등록 모달 */}
      <TreatmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* 2) 신규 고객 등록 모달 */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
      />

      {/* 3) 고객 상세 정보 모달 */}
      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        customerData={selectedCustomer} 
        onOpenTreatmentModal={() => setIsModalOpen(true)}
      />
=======
      {/* 1) 진료/관리 등록 모달 */}
      {isModalOpen && (
        <TreatmentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setTreatmentCustomer(null);
          }}
          customer={treatmentCustomer}
          onRefreshData={onRefreshData}
        />
      )}

      {/* 2) 신규 고객 등록 모달 */}
      {isCustomerModalOpen && (
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
        />
      )}

      {/* 3) 고객 상세 정보 모달 */}
      {isDetailModalOpen && (
        <CustomerDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          customerData={selectedCustomer}
          onOpenTreatmentModal={(customer) => {
            setTreatmentCustomer(customer);  // 고객 데이터를 저장
            setIsDetailModalOpen(false);      // 상세 모달을 닫고
            setIsModalOpen(true);             // 관리 등록 모달을 엽니다
          }}
          onRefreshData={onRefreshData}
        />
      )}
>>>>>>> feature/login
    </div>
  );
}

/**
 * 2. AppContent 컴포넌트
 * 역할: BrowserRouter 내부에서 useNavigate 훅을 사용하기 위해 분리된 내부 컴포넌트입니다.
 */
function AppContent() {
  // 페이지 이동을 위한 useNavigate 훅 사용
  const navigate = useNavigate();

  // --- [상태 관리 (State) 영역] ---
  const [isModalOpen, setIsModalOpen] = useState(false);               // 진료 등록 모달 열림/닫힘
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false); // 신규 고객 모달 열림/닫힘
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);     // 고객 상세 모달 열림/닫힘
  const [selectedCustomer, setSelectedCustomer] = useState(null);       // 모달에 띄울 선택된 고객 데이터
<<<<<<< HEAD
=======
  const [treatmentCustomer, setTreatmentCustomer] = useState(null);     // 관리 등록 모달에 전달할 고객 데이터
  const [refreshTrigger, setRefreshTrigger] = useState(0);              // 데이터 리프레시 트리거

  /**
   * 데이터 리프레시 콜백 (모달에서 등록/삭제 후 목록 갱신용)
   */
  const handleRefreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };
>>>>>>> feature/login

  /**
   * 핸들러 함수: 특정 고객을 클릭했을 때 선택된 고객 정보를 저장하고 상세 모달을 켭니다.
   */
  const handleOpenDetailModal = (customerData) => {
    setSelectedCustomer(customerData);
    setIsDetailModalOpen(true);
  };

  /**
<<<<<<< HEAD
=======
   * 핸들러 함수: 관리 등록 모달을 특정 고객과 함께 엽니다.
   */
  const handleOpenTreatmentModal = (customer) => {
    setTreatmentCustomer(customer || null);
    setIsModalOpen(true);
  };

  /**
>>>>>>> feature/login
   * layoutProps 묶음
   */
  const layoutProps = {
    isModalOpen,
    setIsModalOpen,
    isCustomerModalOpen,
    setIsCustomerModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    selectedCustomer,
<<<<<<< HEAD
=======
    setSelectedCustomer,
    treatmentCustomer,
    setTreatmentCustomer,
    onRefreshData: handleRefreshData,
>>>>>>> feature/login
  };

  return (
    <Routes>
      {/* [경로: '/'] - 기본 루트 진입 시 로그인 페이지('/login')로 리다이렉트 */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* [경로: '/login'] - 로그인 페이지 */}
      <Route path="/login" element={<LoginPage />} />

      {/* [경로: '/dashboard'] - 메인 대시보드 페이지 */}
      <Route
        path="/dashboard"
        element={
          <AdminLayout {...layoutProps}>
            <DashboardPage
              onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
              onOpenDetailModal={handleOpenDetailModal}
              onNavigateToCustomer={() => navigate('/customer')}
            />
          </AdminLayout>
        }
      />

      {/* [경로: '/customer'] - 고객 목록 및 관리 페이지 */}
      <Route
        path="/customer"
        element={
          <AdminLayout {...layoutProps}>
            <CustomerPage
<<<<<<< HEAD
              onOpenModal={() => setIsModalOpen(true)}
=======
              onOpenModal={handleOpenTreatmentModal}
>>>>>>> feature/login
              onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
              onOpenDetailModal={handleOpenDetailModal}
            />
          </AdminLayout>
        }
      />
    </Routes>
  );
}

/**
 * 3. App 최상위 컴포넌트
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}