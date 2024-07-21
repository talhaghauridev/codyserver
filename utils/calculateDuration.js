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

module.exports = {
  calculateDuration,
};
