# 신장학 5년 문헌 리뷰 · 연구공백 분석 — 데이터 및 방법

## 방법
- **출처**: PubMed (NCBI E-utilities, MCP 경유), ClinicalTrials.gov API v2
- **코퍼스**: 주요 신장학 저널 16종, 2021.01–2026.08 = **22,179편**
  - Tier A (8종): Kidney Int, Kidney Int Rep, Clin Kidney J, Nephrol Dial Transplant, J Am Soc Nephrol, Clin J Am Soc Nephrol, Am J Kidney Dis, Nat Rev Nephrol (14,600편)
  - Tier B (8종): Kidney360, J Nephrol, Kidney Med, Nephrology (Carlton), Kidney Res Clin Pract, Am J Nephrol, Curr Opin Nephrol Hypertens, Semin Nephrol (7,579편)
- **카테고리**: 30개 주제, MeSH + [tiab] 키워드 조합으로 정의 (중복 태깅 허용 — 한 논문이 여러 카테고리에 속할 수 있음)
- **시기 구간**: P1 = 2021–22, P2 = 2023–24, P3 = 2025–26.08

## 파일
- `category-counts.tsv` — 30개 카테고리 × 3개 시기 × 2개 저널그룹 논문 수
- `rct-counts.tsv` — Tier A 8종 기준 카테고리별 RCT(Publication Type) 논문 수
- `trial-counts.tsv` — ClinicalTrials.gov 중재연구 등록 수 (2021년 이후 개시)

## 한계 (Limitations)
1. **PubMed 날짜 인덱싱**: `[dp]`는 전자출판일과 인쇄출판일을 모두 매칭하므로 연도별 합계(23,531)가 중복제거 총계(22,179)보다 약 6% 큼. 시기별 비교는 동일 방식이므로 상대 비교에는 영향이 적음.
2. **P3 구간 길이**: 2025.01–2026.08은 1.67년으로 P1/P2(각 2년)보다 짧음. 성장률은 연환산(annualized) 후 계산.
3. **PubMed API 연산자 제한**: boolean 연산자 최대 20개 → 저널 목록을 2그룹으로 분할 후 합산 (저널은 상호배타적이므로 정확).
4. **카테고리 중복**: 카테고리 합계는 코퍼스 총계를 초과함 (한 논문이 여러 주제에 매칭). 비율은 "코퍼스 대비 언급 빈도"로 해석해야 함.
5. **RCT 비중**: Tier A 8종 기준. AKI/CKD/DKD 3개는 연산자 제한으로 MeSH 항을 제외한 축약 쿼리를 분자·분모 모두에 동일 적용. 나머지는 분모에 중복제거 보정계수(0.9425)를 적용한 근사치.
6. **ClinicalTrials.gov 동의어 확장**: 복합 OR/AND 쿼리에서 무관한 시험이 섞임. 신뢰할 수 없는 3개 쿼리는 `trial-counts.tsv`에 명시적으로 제외 표기.
7. **저널 단위 리뷰의 구조적 한계**: NEJM/Lancet/JAMA 등에 실린 신장학 논문(특히 대형 RCT)은 코퍼스에 포함되지 않음. 이는 "Translation gap" 해석 시 반드시 고려해야 함.
