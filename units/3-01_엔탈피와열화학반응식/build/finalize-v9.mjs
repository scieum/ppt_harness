import fs from 'node:fs/promises';
import {finalizePresentation} from '/Users/keemhayeon/.codex/plugins/cache/openai-primary-runtime/presentations/26.1017.11052/skills/presentations/container_tools/artifact_tool_utils.mjs';
const workspaceDir='/Users/keemhayeon/Downloads/Codex/scieum_ppt';
const unit=workspaceDir+'/units/3-01_엔탈피와열화학반응식';
const skill='/Users/keemhayeon/.codex/plugins/cache/openai-primary-runtime/presentations/26.1017.11052/skills/presentations';
await fs.mkdir(workspaceDir+'/output',{recursive:true});
console.log(await finalizePresentation({workspaceDir,candidatePath:unit+'/build/sample-v9/candidate-font-explicit.pptx',finalPath:workspaceDir+'/output/3-01_대표시안_8장_v9.pptx',pythonExecutable:'/Users/keemhayeon/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','18288000,10287000','--validate-heading-fit'],explicitTotalSlideCount:8,requiredNativeTableOwnerSlides:[],fontPolicy:{basis:'design',families:['Pretendard','Pretendard Medium']},verifyArtifactToolImport:true,receiptPath:unit+'/checks/sample8-dark-callout-validation.json'}));
