# PPT Harness

과학 수업 PPT 제작의 근거 분석, 페이지 계획, 승인, 레퍼런스 재현 및 검수를 관리하는 하네스입니다.

## 구성

- [lesson.md](lesson.md): 소단원별 수업 범위·계획 관리
- [템플릿.md](템플릿.md): 소단원별 디자인 템플릿·보존 조건
- [ppt.md](ppt.md): 소단원별 PPT·테마·버전·검토 상태

- `AGENTS.md`: 작업 절차와 사용자 지침
- `design.md`: 현재 공통 디자인 기준
- `asset.md`: 원본·생성 자산, 캐릭터·수식·투명도·출처 규칙
- `qa.md`: 실제 화면 검수와 출고 기준
- `brief.md`: 사용자 직접 수정본 비교 근거
- `templates/unit-plan.md`: 새 단원 계획 템플릿
- `docs/`: 하네스 목적·설계·파이프라인·역할·게이트·검증 및 관련 참고 문서
- `plan.md`: 새 단원에도 적용하는 공통 제작 절차
- `units/*/plan.md`: 각 단원의 실제 수업 계획
- `harness/gate.py`: 제작 단계 및 승인 검사
- `harness/design_gate.py`: 레퍼런스 재현 검사
- `harness/rules.json`: G01~G10 검사 규칙
- `harness/equation_gate.py`: 수식 이미지 검증(G10, Pillow 필요)
- `harness/validate.py`: 격리된 회귀 검증
- `harness/README.md`: 사용법과 데이터 계약
- `harness/validation-report.md`: 기존 검증 결과 기록

## 실행

Python 3.10 이상이 필요합니다. 기본 검사기는 표준 라이브러리를 사용하며, G10 수식 이미지 검사는 Pillow가 필요합니다.

```sh
python3 harness/gate.py --help
python3 harness/validate.py --help
```

실제 제작·검증에는 해당 명령의 입력 자료와 승인·검토 증빙이 필요합니다. 수업 이미지, PPT/DOCX, 미리보기, 보호 기준 및 로컬 실행 기록은 이 저장소에 포함하지 않습니다. 원본 교재 자료는 이 저장소에 포함하지 않습니다.

이 업로드는 기존 코드와 문서의 버전 보관이며, 수업 디자인 승인이나 전체 제작 완료를 의미하지 않습니다.

## 새 단원 시작

[공통 계획](plan.md)의 읽기 순서에 따라 자료 조사와 단원별 계획부터 작성합니다. 기존 루트 계획·디자인 문서는 [이력 폴더](docs/history/2026-10-30-root-docs/)에 보존했습니다. 공통 기준은 누적 사용자 정정을 반영하며 단원별 보존 장표·승인 범위를 덮어쓰지 않습니다.
