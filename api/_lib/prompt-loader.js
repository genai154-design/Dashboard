/**
 * prompt/ 폴더의 마크다운 프롬프트 템플릿 로더
 * — 로컬: 프로젝트 루트 prompt/
 * — Vercel: includeFiles + api/_lib/prompts/ fallback
 */
const fs = require('fs');
const path = require('path');
const { rootDir } = require('./env');

const DEFAULT_PROMPT_DIR = 'prompt';
const BUNDLED_PROMPT_DIR = path.join(__dirname, 'prompts');
const NEWS_ANALYSIS_PROMPT_FILE = 'news-analysis.md';
const templateCache = new Map();

/** 프롬프트 파일 후보 경로 (우선순위 순) */
function getPromptCandidatePaths(filename) {
  const candidates = [];

  const customDir = process.env.PROMPT_DIR?.trim();
  if (customDir) {
    candidates.push(path.resolve(rootDir, customDir, filename));
  }

  candidates.push(path.join(rootDir, DEFAULT_PROMPT_DIR, filename));
  candidates.push(path.join(BUNDLED_PROMPT_DIR, filename));
  candidates.push(path.join(process.cwd(), DEFAULT_PROMPT_DIR, filename));

  return candidates;
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

  const candidates = getPromptCandidatePaths(filename);
  const filePath = candidates.find((p) => fs.existsSync(p));

  if (!filePath) {
    throw new Error(
      `프롬프트 파일을 찾을 수 없습니다: ${DEFAULT_PROMPT_DIR}/${filename}\n` +
        `시도한 경로:\n${candidates.map((p) => `  - ${p}`).join('\n')}`
    );
  }

  const content = fs.readFileSync(filePath, 'utf8').trim();
  templateCache.set(cacheKey, content);
  return content;
}

/**
 * {{변수명}} 플레이스홀더 치환
 */
function renderPromptTemplate(template, variables = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = variables[key];
    if (value === undefined || value === null) return '';
    return String(value);
  });
}

function buildPromptFromFile(filename, variables) {
  const template = loadPromptTemplate(filename);
  return renderPromptTemplate(template, variables);
}

function clearPromptCache() {
  templateCache.clear();
}

function getPromptDir() {
  const candidates = getPromptCandidatePaths(NEWS_ANALYSIS_PROMPT_FILE);
  const found = candidates.find((p) => fs.existsSync(p));
  return found ? path.dirname(found) : path.join(rootDir, DEFAULT_PROMPT_DIR);
}

module.exports = {
  loadPromptTemplate,
  renderPromptTemplate,
  buildPromptFromFile,
  clearPromptCache,
  getPromptDir,
  getPromptCandidatePaths,
  NEWS_ANALYSIS_PROMPT_FILE,
};
