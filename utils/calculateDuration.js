function calculateDuration(content) {
  // Average words per minute
  const wordsPerMinute = 200;

  // Function to count words in a string
  function countWords(text) {
    return text.split(/\s+/).filter(Boolean).length;
  }

  // Calculate total words
  const totalWords = content.reduce((acc, item) => {
    if (item.text) {
      return acc + countWords(item.text);
    }
    return acc;
  }, 0);

  // Calculate duration in minutes
  const durationInMinutes = Math.ceil(totalWords / wordsPerMinute);

  return durationInMinutes;
}
function estimateReadingTime(markdown, wordsPerMinute = 225) {
  // Function to clean markdown and remove unnecessary entities
  const cleanMarkdown = markdown
    .replace(/&[#\w]+;/g, " ") // Remove HTML entities like &#x20;
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove image syntax
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove link URLs but keep link text
    .replace(/`([^`]+)`/g, "$1") // Remove inline code syntax
    .replace(/#{1,6}\s*/g, "") // Remove headings syntax
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold syntax
    .replace(/\*([^*]+)\*/g, "$1") // Remove italic syntax
    .replace(/^\s*[-*]\s/gm, "") // Remove list markers
    .replace(/^>\s*/gm, "") // Remove blockquote markers
    .replace(/-{3,}/g, "") // Remove thematic breaks
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .replace(/&\w+;/g, " ") // Remove other HTML entities
    .trim();

  // For debugging, print the clean markdown text
  console.log(cleanMarkdown);

  // Count words in the cleaned markdown
  const wordCount = cleanMarkdown.split(/\s+/).filter((word) => word).length;

  // Calculate reading time in minutes, rounding up to the nearest whole number
  const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute);

  return readingTimeMinutes;
}

function optimizedEstimateReadingTime(markdown, wordsPerMinute = 225) {
  const cleanMarkdown = markdown
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/&[#\w]+;/g, " ") // Remove HTML entities
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove image syntax
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove link URLs but keep link text
    .replace(/(`|#{1,6}\s*|^\s*[-*]\s|^>\s*)/gm, "") // Remove inline code, headings, list markers, blockquotes
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // Remove bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // Remove italic
    .replace(/-{3,}/g, "") // Remove thematic breaks
    .replace(/\s+/g, " ") // Replace multiple spaces and newlines with a single space
    .trim();

  const wordCount = cleanMarkdown.match(/\b[\w']+\b/g)?.length || 0;
  return Math.ceil(wordCount / wordsPerMinute);
}
module.exports = {
  calculateDuration,
  estimateReadingTime,
  optimizedEstimateReadingTime,
};
