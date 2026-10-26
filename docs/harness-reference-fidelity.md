## 캐릭터와 PART 배경 — 최신 사용자 수정

- 캐릭터는 모든 본문에 넣는 필수 장식이 아니다. 계산 과정, 정보량이 많은 표·수식, 큰 실험·입자 도식 장표에는 장식용 캐릭터를 넣지 않는다. 계산 단계와 과학 그림의 가독성을 우선한다.
- 도입·생활 질문·안내처럼 캐릭터가 구체적인 역할을 수행할 때만 등록된 자산을 사용한다. 표지와 PART의 기존 장면은 유지한다.
- PART는 표지 삽화가 어둡게 비치는 원본 표현을 따른다. 삼투 원본은 검정 덮개 불투명도 51%다. 글자·로고에는 불투명도를 적용하지 않는다. SVG 가져오기에서 이미지 opacity가 소실되면 덮개 이미지의 알파에 같은 값을 적용하고 원본 값·변환 자산을 기록한다.
- 장식용 캐릭터를 제거한 본문은 character_identity를 사유 있는 해당 없음으로 검토한다. 캐릭터의 존재 자체를 통과 조건으로 삼지 않는다.

## 최신 적용 구분 — 허들링클럽 목차와 본문 레퍼런스

사용자는 허들링클럽의 ‘PART 1 진행방식 소개 / PART 2 메이크 사용방법 / PART 3 시연하며 함께 만들기’ 목차 원형임을 확인했다. 그 블록·간격·글자 배치를 유지하고 과학 목차 문구를 적용한다.

표지·PART·학습 목표는 지정한 원본 배치를 그대로 재현한다. 본문은 최신 요청에 따라 다른 제공 PPT/PDF의 도식·삽화 배치를 적극적으로 가져오며, 물에맛.Zip의 번호 원과 회색 계산 단계 띠·복잡한 비교표·전체/부분 확대 방식도 함께 적용한다. 본문까지 물에맛.Zip 한 자료로만 제한한다는 해석은 폐기한다.

본문의 복수 자료 적용에는 source-adoption recipe를 먼저 남긴다. 가져온 파일·쪽·실제 화면·배치 요소와 과학 자료/기존 캐릭터의 대응을 기록하고, 고정한 참조 템플릿과 후보 SVG의 실제 내보내기를 비교한다. G08의 일치 조건이나 허용 오차는 통과를 위해 바꾸지 않는다. 공통 4유형의 정확한 재현과 본문에서 명시적으로 허용된 요소 차용을 구분한다.

원본 PPT에서 문자가 이미지인 부분은 원본 자산으로 재현할 수 있지만 이를 편집 가능한 텍스트라고 표현하지 않는다. Figma 업로드 성공은 원격 시각 검증이나 G09 확인을 뜻하지 않는다.

## T셀파 최신 적용 규칙 — 사용자 정정 2026-10-19

- T셀파 로고는 수업의 첫 장표(표지)에만 필요하다. PART·동기 유발·목차·목표·본문·정리에는 넣지 않는다. 이전 ‘모든 장표에 두 로고 병기’ 규칙은 폐기한다. 사이음 로고는 별도 원본 기준을 따른다.
- 첫 장의 T셀파 크기·위치·사이음 로고와의 관계는 해당 레퍼런스 첫 장과 정확히 일치시킨다. 임의의 210×60 또는 임의 공통 박스를 쓰지 않는다.
- PPT 이미지 상자의 투명 여백·크롭 변환과 실제 보이는 픽셀 경계를 구분한다. 원본 파일·장 번호·자산 해시·객체 bbox·visible_bbox를 기록하고 같은 좌표계에서 비교한다. 공식 자산의 비율·색·심벌·문구를 바꾸지 않는다.
- G08의 branding 항목은 필수다. 표지 로고 누락·실제 표시 크기/위치 불일치·다른 장표의 T셀파는 실패다. 전체 제작물에서도 G06의 장별 visual 검토에 동일 규칙을 적용한다. 자동 검사는 등록된 레이아웃 내보내기를 검사하며, 실제 픽셀과 레이아웃의 일치는 시각 대조로 확인한다.

# 엄격한 레퍼런스 검증 — 실행 계약 1.1.0

사용자 정정: 레퍼런스와 같은 구성·위치·비율을 재현한다. 과거 3유형만 검토하던 설계는 7유형으로 강화한다. 규칙의 단일 기준은 `harness/rules.json`이다.

## 실행 순서

근거 분석 → 계획 승인(G03) → 이미지 준비 → `sample` 역할로 7유형 대표 시안 → G08 → 사용자 디자인 확인(G09) → 전체 제작 → G06/Figma 대조 → 최종화.

`sample`은 drafts/representatives/에만 기록한다. 전체 목표 장수 검사는 대표 시안 단계에 적용하지 않는다. 전체 제작 선행 검사·G06·최종화·재개는 현재 G08·G09 유효성을 확인한다.

```sh
python harness/gate.py --unit UNIT preflight prototype
python harness/gate.py --unit UNIT write sample drafts/representatives/sample.pptx --from-file PREPARED
python harness/gate.py --unit UNIT check --gate G08
python harness/gate.py --unit UNIT tool-preflight figma-preview
python harness/gate.py --unit UNIT check --gate G09
python harness/gate.py --unit UNIT preflight production
```

도구 호출은 명령이 성공한 경우에만 한다. 쓰기 제한은 관리 작업에만 적용되며 OS 또는 Figma 도구 자체를 가로채는 기술적 차단은 아니다. 한도 때문에 원격 화면을 확인할 수 없으면 미확인으로 기록한다.

## 파일 계약

`design-review/reference-lock.json`: unit, templates. templates는 각 유형을 한 번씩 포함한다. 각 항목에 id, type, slide(실제 원본 장 번호), source(원본 파일 path/sha256), render(원본 화면 path/sha256), layout(정규화한 내보내기 path/sha256)을 둔다. 원본을 보호하고 비교용 복사본·내보내기는 design-review 안에 보관한다.

`design-review/review.json`: unit, version, plan_hash, reference_hash(원본 잠금 JSON의 canonical 해시), slides. slides는 7유형 각각 id, type, reference_id, artifact, render, layout, comparison(각 path/sha256), reviewer, reason, criteria를 포함한다. 이 파일에 거짓 passed를 입력하지 않는다. 전체 파일·화면·글꼴·이미지를 실제 확인해야 한다.

레이아웃 JSON: artifact_sha256, render_sha256, exporter, canvas, objects. canvas는 정규화 화면이며 수치는 rules.json의 구현 계약을 따른다. objects는 고유 role과 locked_properties의 실제 내보내기 값이다. 원본·시안의 역할·도형 종류·상자 좌표·색·글꼴·크기·굵기·정렬·캐릭터 참조를 대조한다. 텍스트 내용은 승인된 수업 내용으로 바꿀 수 있지만 잠긴 구조는 일치해야 한다. 반드시 실제 PPT/Figma/제작 소스에서 내보낸 값을 사용하고 판정을 통과시키려고 손으로 맞춘 JSON을 증빙으로 쓰지 않는다. 기계 검사는 내보내기 기록의 진실성이나 시각적 동일성을 독립 인증하지 않는다.

criteria의 항목과 허용 예외는 rules.json을 따른다. 각 항목에 status, reason, reviewer, evidence(path/sha256)가 필요하다. failed·unverified는 실패이며 필수 항목은 not_applicable로 건너뛸 수 없다.

`design-review/approvals.json`: 배열. unit, version, review_hash(현재 review JSON의 canonical 해시), reference_hash, actor=human, decision=approve_design, message_ref, evidence. 실제 사용자 응답을 기록한다. 무응답·과거 계획 승인·에이전트 자체 판정은 승인 증거가 아니다.

`design-review/feedback.json`: 빈 경우에도 []를 명시한다. 의견별 id, scope(global/local), text, message_ref, evidence, status를 기록한다. resolved에는 resolution_version, resolution_reason, resolution_evidence가 필요하고 global 의견에는 현재 사용자 디자인 확인의 message_ref와 같은 confirmation_ref가 필요하다. 전체 거부를 국소 수정으로 닫지 않는다.

## 실패와 재개

G08·G09 실패의 복귀 대상은 prototype이다. preflight가 실패하면 해당 상태를 failed로 기록하고 복귀 단계 및 후속 상태를 pending으로 무효화한다. 결과 보고와 이전 산출물을 보존한다. 기록을 고쳐 실패를 통과로 만들지 않는다.

대표 산출물·원본 잠금·확인 기록은 체크포인트 지문에 포함한다. 현재 버전 변경은 과거 확인을 무효화한다. G07 기준 경로 이동 문제는 별도로 보존하며 원본 보호 기준을 임의 갱신하지 않는다.

## 검증 범위

기존 삼투 원본의 격리 복사본과 명시적 모의 자료로 정상·실패 주입·재개·최종화 차단을 시험한다. 모의 확인은 실제 소단원 승인으로 사용할 수 없다. 사례별 결과는 harness/validation의 최신 실행 보고서를 따른다.

## 전체 장표 로고 검사

G06은 checks/reviews.json의 각 장별 layout 증빙을 요구한다. layout은 현재 PPTX 해시·해당 렌더 해시·exporter·정규화 canvas·objects에 연결한다. 첫 장에는 레퍼런스와 같은 T셀파 하나가 필요하며 나머지 장에는 없어야 한다. 원본 T셀파 측정 근거는 tsherpa-reference-measurement.json에 있다.
