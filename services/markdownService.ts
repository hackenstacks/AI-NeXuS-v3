
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

// Configure Marked to use Highlight.js for code blocks
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (e) {
        console.error(e);
      }
    }
    return hljs.highlightAuto(code).value; // Fallback to auto-detection
  },
  langPrefix: 'hljs language-', // highlight.js css expects this
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
});

export const parseMarkdown = (text: string): string => {
  if (!text) return '';
  
  // Parse markdown to HTML
  const rawHtml = marked.parse(text) as string;
  
  // Sanitize HTML to prevent XSS, but allow code block classes
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['code', 'pre', 'span'],
      ADD_ATTR: ['class']
  });

  return cleanHtml;
};
