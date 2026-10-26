# R4 산출물과 재개 방식

> 2026-10-19 사용자 정정 후 실행 기준: [엄격한 레퍼런스 검증 1.1.0](harness-reference-fidelity.md). 아래의 대표 3장·승인 1회·G08/G09 미구현 설명은 당시 설계 이력이며 현재 실행에는 적용하지 않는다. 현재는 7유형·두 확인 지점과 rules.json 1.1.0을 따른다.

> 구현 현황 (2026-10-19): 로컬 판정기·관리 경로의 쓰기 제한·재개 검사와 48건 회귀 시험을 구현·검증했다. [검증 보고서](../harness/validation-report.md)와 [사용법](../harness/README.md)을 참조한다. 아래 설계 시점의 미구현 표기는 이 현황으로 대체한다. OS 수준 격리와 실제 피그마 업로드·과학 내용 전수 검증은 포함하지 않는다.

## 소단원별 파일 구조

기본 경로: units/단원번호_소단원명/

| 구분 | 경로 |
|---|---|
| 입력 | input.json |
| 근거 분석 | research/sources.json, research/content-map.json, research/comparison.md |
| 페이지 계획 | plan.md |
| 이미지 | assets/manifest.json, assets/crops/, assets/generated/ |
| 제작 초안 | drafts/deck.pptx, drafts/script.docx |
| 검수 | checks/report.json, renders/ |
| 피그마 대응 기록 | figma/mapping.json |
| 최종본 | final/deck.pptx, final/script.docx |
| 진행 상태 | state.json |
| 승인 증빙 | approvals.json |
| 이전 결과 | history/실행ID/ |

피그마 대응 기록에는 시안 링크와 슬라이드별 프레임 대응 정보를 남긴다.

## 검사 규칙의 단일 기준

프로젝트 루트의 harness/rules.json을 스크립트 검사 규칙의 단일 기준 파일로 사용한다.

규칙마다 다음 정보를 둔다.
- 규칙 ID
- 검사 대상
- 허용값 또는 통과 조건
- 실패 시 복귀 단계

AGENTS.md는 실행 지침, design.md는 디자인 설명을 담당한다. 기계가 검사할 수치는 rules.json에서 관리하고 다른 문서에서는 규칙 ID로 참조한다.

현재 문서의 기존 수치와 지침을 규칙으로 옮기는 작업은 후속 설계와 최종 AGENTS.md 보강 시 정리한다.

## 재개 조건

마지막 통과 단계의 입력·규칙·출력 해시가 모두 일치할 때만 다음 단계부터 재개한다.

하나라도 변경되거나 기록이 없으면 영향을 받은 가장 앞 단계와 그에 의존하는 후속 단계를 재검사한다. 계획 승인도 승인 당시 계획과 연결해 확인한다.

## 이력과 최종본

- 재작업으로 파일을 덮어쓰기 전에 이전 결과를 history/실행ID/에 보존한다.
- 검사 기록에는 실행 ID와 사용한 규칙 버전을 남긴다.
- final/에는 최신 통과 결과만 배치한다.
- 원본 교과서와 참고 PPT는 이력 보존 대상 작업 파일과 구분하며 수정하지 않는다.

## 설계 상태

이 문서는 파일 구조와 재개 정책의 설계다. JSON 스키마, 검사 규칙, 판정 스크립트와 전체 폴더는 아직 구현하지 않았다.
