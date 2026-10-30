# 하네스 사용 안내

## 현재 구현 범위

- `rules.json`: G01~G10 게이트, 단계별 선행·종료 검사, 역할별 쓰기 폴더, 재시도 한도.
- `gate.py`: Python 표준 라이브러리 기반 검사기. G10 수식 이미지 검사에는 Pillow가 추가로 필요하다.
- `validate.py`: 삼투 현상 복사본과 명확히 표시된 모의 자료를 사용하는 회귀 검증.
- `validation/latest.json`: 가장 최근 검증 결과 위치.

새 수업 제작, 공식 교육과정 적합성 판정, 피그마 업로드를 이번 검증에서 수행한 것은 아니다.

## 레퍼런스 재현 검사

G08·G09 및 prototype/design_confirmation 단계와 sample 쓰기 역할을 추가했다. 7유형과 실제 사용자 확인이 없으면 전체 제작과 최종화를 막는다. 명령과 파일 계약은 [엄격한 레퍼런스 검증](../docs/harness-reference-fidelity.md)을 따른다. 과거 디자인 승인이나 기존 체크포인트는 새 검사를 대체하지 않는다.

## 명령

프로젝트 루트에서 Python 3.10 이상으로 실행한다. 아래 `python`은 사용 중인 Python 실행 파일로 바꿀 수 있다.

```powershell
python harness/gate.py --unit units/2-05_삼투현상 baseline --protect inbox/ppt --protect textbook-chunjae --protect etc
python harness/gate.py --unit units/2-05_삼투현상 check --gate G01
python harness/gate.py --unit units/2-05_삼투현상 plan-hash
python harness/gate.py --unit units/2-05_삼투현상 check --report
python harness/gate.py --unit units/2-05_삼투현상 checkpoint research
python harness/gate.py --unit units/2-05_삼투현상 resume
python harness/gate.py --unit units/2-05_삼투현상 retry production overlap-slide08
python harness/gate.py --unit units/2-05_삼투현상 write production drafts/deck.pptx --from-file path/to/prepared.pptx
python harness/gate.py --unit units/2-05_삼투현상 finalize
```

실제 존재하는 보호 대상 경로를 지정한다. 기준 목록은 `harness/control/`에 소단원별로 저장하며 기존 기준을 조용히 덮어쓸 수 없다. 각 단계의 산출물이 준비되면 `checkpoint`로 종료 검사를 수행한다. `check`는 기본 읽기 전용이며 `--report`를 지정할 때 보고서를 저장한다. 각 실행 보고서는 checks/runs/실행ID.json에 보존하고 checks/report.json은 최신 결과를 가리킨다. 종료 코드는 0=통과, 1=게이트 실패, 2=실행·입력 차단이다. `resume`은 무효화된 단계 상태를 갱신하므로 읽기 전용 명령이 아니다.

`write`는 해당 역할의 경로와 단계 선행 게이트를 확인한 뒤에만 파일을 기록한다. 기존 파일은 `history/실행ID/`에 보존한다. 판정자 역할은 쓸 수 없다. 허용 경로 안에 있더라도 보호 대상으로 등록된 파일은 변경 전에 차단한다.

`finalize`는 모든 게이트와 단계별 체크포인트가 유효할 때만 PPTX·DOCX를 final/로 복사한다. 모의 시험 모드에서는 최종 납품을 금지한다.

## 데이터 계약

구체적인 전체 예시는 최신 검증 세션의 `unit/`을 참조한다. 그 예시는 모두 시험용이며 실제 승인·교과서 근거·리뷰로 재사용하면 안 된다.

- `input.json`: unit, curriculum, target_slides, minutes.
- `research/sources.json`: 비어 있지 않은 배열. 각 항목에 id, role, citation, curriculum, evidence가 필요하다. role은 primary(천재 물질과 에너지), secondary(화학Ⅱ), comparison(다른 교과서·완자), standard(성취기준)의 근거를 포함해야 한다.
- `research/content-map.json`: id, claim, standard, standard_source_id, rationale, scope, source_ids. scope는 범위 내 / 보충·심화 / 제외. 보충·심화는 inclusion_reason과 separation도 필요하다.
- 증빙 형식: `{"path":"research/extract.txt","sha256":"파일의 SHA-256"}`. 경로는 소단원 폴더 기준 상대 경로이며 실제 파일의 해시와 일치해야 한다. 내용 발췌에는 책명·쪽수·URL 등 원문 위치를 기재한다.
- `plan.md`: 사람이 읽는 설명·페이지 표와 함께, 기계가 읽을 JSON 블록을 정확히 하나 둔다. 블록 언어 표시는 `harness-plan`이다. 변경 후 설명과 JSON을 함께 갱신한다.
- 계획 JSON: unit, curriculum, objectives, target_slides, minutes, design, supplementary, slides. slides 각 항목은 number, title, message, content_ids, visual(자산 ID 배열), source_ids, layout, character를 포함한다. 본문에 사용하지 않는 캐릭터는 `none`처럼 명시한다.
- supplementary는 보충 내용 ID별 inclusion_reason, separation, source_ids를 담는다. 보충 내용이 없으면 빈 객체다.
- `approvals.json`: 배열. unit, actor=`human`, decision=`approve`, message_ref, plan_hash, evidence를 포함한다. 실제 사용자 응답을 출처로 저장해야 하며 오케스트레이터가 승인 문구를 지어내면 안 된다. 모의 승인은 simulation=true로 표시하고 실제 모드에서는 거절한다.
- 승인 해시는 교육과정·목표·시간·장수·페이지별 핵심 메시지·내용 ID·내용 판정과 보충 내용을 포함한다. 레이아웃만 바꾸면 승인은 유지되지만 단계별 재검사는 필요하다. 기계가 문구의 의미 동등성을 이해하는 것은 아니므로 핵심 메시지 문구를 바꾸면 보수적으로 재승인을 요구한다.
- `assets/manifest.json`: id, file(경로·해시), kind(crop/generated/existing), purpose, review=`passed`, reviewer. 크롭은 source_id와 page, 나머지는 provenance가 필요하다. 계획에 연결된 전체 자산 ID와 일치해야 한다.
- `drafts/deck.pptx`: 실제 OOXML 슬라이드 관계 순서와 노트를 읽는다. 각 장 노트에는 비어 있지 않은 설명과 `출처:` 또는 `Source:`가 필요하다.
- `drafts/script.docx`: 각 장 제목 문단을 `Slide 1`, `Slide 2` 형식으로 둔다. 해당 구간에 원고와 출처를 둔다. 구간 수·순서·출처의 존재를 검사하지만 원고의 교육적 품질은 별도 리뷰가 필요하다.
- `checks/reviews.json`: plan_hash, artifacts(PPTX·DOCX의 현재 해시), open_issues(미해결 배열), slides. 장별 number, render(경로·해시), science/curriculum/visual 검토 기록을 둔다. 각 검토에는 status=`passed`, reviewer, comment, evidence가 필요하다.
- `figma/mapping.json`: url, deck_sha256, status=`verified`, reviewer, evidence, frames(각 slide·node_id). 프레임 ID는 중복될 수 없다. 피그마 연결 도구로 실제 확인한 결과를 증빙에 저장한다.

## 재개·판정의 범위

- 해시에는 규칙 파일과 검사기 코드도 포함한다. 규칙·입출력 변경은 관련 단계와 후속 단계의 기존 통과를 무효화한다.
- 로컬 증빙 검사는 기록·파일·해시·참조의 일관성을 판정한다. 사용자 신원 인증, 원문 내용의 진위, 피그마 서버의 현재 상태를 독립적으로 인증하지 않는다.
- 이 구현의 쓰기 제한은 `gate.py write`를 통하는 파일 작업에 적용된다. 임의의 터미널·앱·플러그인 접근까지 OS 수준에서 차단하는 샌드박스는 아니다. 작업 에이전트는 반드시 이 경로를 사용해야 한다.
- 이미지 생성 도구와 피그마 쓰기 호출 전에도 오케스트레이터가 해당 선행 게이트를 실행해야 한다. 도구 자체가 이 검사기에 기술적으로 종속된 것은 아니다.
- 과학·교육과정·시각 리뷰가 없으면 통과하지 않는다. 시험의 모의 통과 기록은 실제 수업의 내용 검수 결과가 아니다.

## 검증 재실행

```powershell
python harness/validate.py --source 'inbox/ppt/[물에맛.Zip] 2-05. 삼투 현상.pptx' --renders analysis/render1
```

검증은 별도 세션 폴더와 임시 복사본에서만 실패를 유도한다. 원본의 실행 전후 SHA-256을 비교한다. 정상 경로는 모의 근거·승인·리뷰·피그마 자료로 검사하며, 실제 복사본은 그런 기록 없이 별도 검사해 전체 완료가 차단되는지 확인한다.

## G10 — 수식 이미지·교과서 수식체·블랙 테마

`checks/equations.json`으로 현재 PPTX와 모든 실제 장표를 묶는다. production 종료, review 진입·종료 및 최종화에 적용한다. G10 픽셀 검사는 Pillow가 필요하므로 번들 Python을 사용한다. 이전 G01~G09 승인·검사는 대체하지 않는다.

- 모든 장표의 이미지 분류와 네이티브 수식 후보를 빠짐없이 기록한다. 독립 계산식을 단순 설명 예외로 통과시키지 않는다.
- 수식 자산과 PPT 내 실제 임베딩의 SHA-256이 같아야 한다. 누락·변경·불일치·미검수이면 실패한다.
- 블랙 테마에서는 불투명 잉크 픽셀의 98% 이상이 RGB 각 240 이상이어야 한다. 실제 투명 픽셀과 비어 있지 않은 잉크를 검사한다.
- 이미지 종횡비 오차 1.5% 이내. 같은 size_group의 실제 글자 높이 배율 편차는 5% 이내. 파일 상자 크기만 같게 하는 것은 통과 조건이 아니다.
- 교과서 세리프체·H 기울임·원소/괄호 정자·상태 기울임·계수·원소·전하·첨자·방향·부호·수치는 현재 렌더와 원문 대조의 해시 증빙이 필요하다. 이름만 `textbook-serif`라고 적었다고 글꼴을 자동 인식한 것은 아니다.
- 색상/투명도 보정은 2026-10-28 사용자 허용 범위다. 수식을 코드로 새로 조판하는 허용이 아니다. 생성본·보정본·프롬프트·원문 대조를 보존한다.
- 실행: `python harness/gate.py --unit units/3-02_헤스법칙 check --gate G10 --report`
- 회귀검사: `python harness/test_equation_gate.py`. 합성 시험은 실제 수업의 시각·과학 승인과 구분한다.

계약: 최상위 schema_version=1, theme, deck(경로/해시), open_issues=[], slides. 각 장표는 number, render, inventory_review, reviewer, equations, non_equation_images, inline_or_science_labels를 가진다. equation 항목은 picture_id, asset, generation_record, source_comparison, visual_review(모두 경로/해시), producer, style, expected_expression, reviewer, checks, reference_glyph_height_px, size_group을 가진다. 실제 표기의 판독·과학적 옳음은 별도 시각 검토이며 픽셀 색상 검사로 대신하지 않는다.

G10의 `preserved-source-color-correction`은 기존 반응식 원본의 글자를 보존한 색상·알파 보정에만 사용한다. 보존 원본 및 보정 근거 파일의 해시와 `glyphs_unchanged` 검토가 필요하다. 신규 작성·재구성 반응식은 `image_gen`을 사용한다.
