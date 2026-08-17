// src/api/mockData.js
export const initialDashboardData = {
  todayTreatments: 12,
  ticketDeductions: 7,
  syncStatus: "정상",
  recentCustomers: [
    {
      id: "cust_01",
      name: "김지수",
      phone: "010-1234-5678",
      email: "jisoo@example.com",
      clinic: "엠레드 클리닉",
      lastTreatment: "울쎄라 리프팅",
      lastDate: "2026-08-02",
      birth: "1998-04-12",
      memo: "리프팅 관리 선호",
      reservations: [
        {
          id: "res-1",
          title: "울쎄라 리프팅",
          area: "턱 라인",
          dateTime: "2026-08-17 14시30분",
        },
      ],
      history: [
        {
          id: "his-1",
          title: "울쎄라 리프팅",
          area: "얼굴 전체",
          dateTime: "2026-08-02 14시30분",
          expireDate: "2027-07-10",
          usedCount: 2,
          totalCount: 3,
        },
      ],
    },
    {
      id: "cust_02",
      name: "박민지",
      phone: "010-9876-5432",
      email: "minji@example.com",
      clinic: "엠레드 클리닉",
      lastTreatment: "리쥬란 스킨부스터",
      lastDate: "2026-08-01",
      birth: "1995-11-23",
      memo: "보습 관리 주의",
      reservations: [],
      history: [
        {
          id: "his-2",
          title: "리쥬란 스킨부스터",
          area: "얼굴 전체",
          dateTime: "2026-08-01 11시00분",
          expireDate: "2027-08-01",
          usedCount: 1,
          totalCount: 5,
        },
      ],
    },
  ],
};