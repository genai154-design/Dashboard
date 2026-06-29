/**
 * prompt/ 폴더의 마크다운 프롬프트 템플릿 로더
 * — 프롬프트 수정 시 서버 재시작으로 반영 (메모리 캐시)
 */
const fs = require('fs');
const path = require('path');
const { rootDir } = require('./env');

const DEFAULT_PROMPT_DIR = 'prompt';
const templateCache = new Map();

/** prompt/ 디렉터리 절대 경로 */
function getPromptDir() {
  const customDir = process.env.PROMPT_DIR?.trim();
  return customDir
    ? path.resolve(rootDir, customDir)
    : path.join(rootDir, DEFAULT_PROMPT_DIR);
}

/**
 * 마크다운 프롬프트 파일 읽기 (캐시)
 * @param {string} filename - 예: news-analysis.md
 */
function loadPromptTemplate(filename) {
  const cacheKey = filename;
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey);
  }

  const filePath = path.join(getPromptDir(), filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `프롬프트 파일을 찾을 수 없습니다: ${path.relative(rootDir, filePath)}`
    );
  }

  const content = fs.readFileSync(filePath, 'utf8').trim();
  templateCache.set(cacheKey, content);
  return content;
}

/**
 * {{변수명}} 플레이스홀더 치환
 * @param {string} template
 * @param {Record<string, string>} variables
 */
function renderPromptTemplate(template, variables = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = variables[key];
    if (value === undefined || value === null) return '';
    return String(value);
  });
}

/**
 * 프롬프트 파일 로드 + 변수 치환
 * @param {string} filename
 * @param {Record<string, string>} variables
 */
function buildPromptFromFile(filename, variables) {
  const template = loadPromptTemplate(filename);
  return renderPromptTemplate(template, variables);
}

/** 개발 중 프롬프트 파일 변경 시 캐시 초기화 */
function clearPromptCache() {
  templateCache.clear();
}

module.exports = {
  loadPromptTemplate,
  renderPromptTemplate,
  buildPromptFromFile,
  clearPromptCache,
  getPromptDir,
  NEWS_ANALYSIS_PROMPT_FILE: 'news-analysis.md',
};
