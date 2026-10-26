# PPT Harness

과학 수업 PPT 제작의 근거 분석, 페이지 계획, 승인, 레퍼런스 재현 및 검수를 관리하는 하네스입니다.

## 구성

- `AGENTS.md`: 작업 절차와 사용자 지침
- `design.md`: 디자인 기준
- `docs/`: 하네스 목적·설계·파이프라인·역할·게이트·검증 및 관련 참고 문서
- `plan.md`, `units/*/plan.md`: 기존 제작 계획
- `harness/gate.py`: 제작 단계 및 승인 검사
- `harness/design_gate.py`: 레퍼런스 재현 검사
- `harness/rules.json`: G01~G09 검사 규칙
- `harness/validate.py`: 격리된 회귀 검증
- `harness/README.md`: 사용법과 데이터 계약
- `harness/validation-report.md`: 기존 검증 결과 기록

## 실행

Python 3.10 이상이 필요하며 외부 패키지는 필요하지 않습니다.

```sh
python3 harness/gate.py --help
python3 harness/validate.py --help
```

실제 제작·검증에는 해당 명령의 입력 자료와 승인·검토 증빙이 필요합니다. 수업 이미지, PPT/DOCX, 미리보기, 보호 기준 및 로컬 실행 기록은 이 저장소에 포함하지 않습니다. 원본 교재 자료는 이 저장소에 포함하지 않습니다.

이 업로드는 기존 코드와 문서의 버전 보관이며, 수업 디자인 승인이나 전체 제작 완료를 의미하지 않습니다.
