/**
 * 클리닉 브랜드별 색상 반환 유틸리티
 *
 * 로그인한 관리자의 brand/username에 따라 고유 색상을 반환합니다.
 * - derna (더나): #FFF84A
 * - amred (엠레드): #A3A9FF
 * - wim (윔): #7AD9B5
 * - 기본값: #A3A9FF
 */

const BRAND_COLORS = {
  derna: '#FFF84A',
  amred: '#A3A9FF',
  wim: '#7AD9B5',
};

/**
 * 브랜드명으로 색상 반환
 * @param {string} brandName - 브랜드 이름 (예: 'derna', '더나', 'amred', '엠레드', 'wim', '윔')
 * @returns {string} 헥사 컬러 코드
 */
export function getBrandColor(brandName) {
  const lower = (brandName || '').toLowerCase().trim();

  if (lower.includes('derna') || lower.includes('더나')) return BRAND_COLORS.derna;
  if (lower.includes('amred') || lower.includes('엠레드')) return BRAND_COLORS.amred;
  if (lower.includes('wim') || lower.includes('윔')) return BRAND_COLORS.wim;

  return BRAND_COLORS.amred; // 기본값
}

/**
 * localStorage에서 현재 로그인한 계정의 브랜드를 읽어 색상 반환
 * @returns {string} 헥사 컬러 코드
 */
export function getCurrentBrandColor() {
  try {
    // 1순위: localStorage의 brand 값
    const brand = localStorage.getItem('brand');
    if (brand) return getBrandColor(brand);

    // 2순위: localStorage의 user 객체에서 brand/username 추출
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      const userBrand = parsed.brand || parsed.username || parsed.clinicName || '';
      return getBrandColor(userBrand);
    }
  } catch (err) {
    // 파싱 실패 시 기본값
  }

  return BRAND_COLORS.amred; // 기본값
}

export default getBrandColor;
