const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const Challenge = require("./models/challenge");
mongoose.connect(
  "mongodb+srv://alighouridev:wMSxuw2Dx5EPjInL@cluster0.5gfj4zc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increase the timeout (30 seconds)
  }
);

const difficulties = ["Easy", "Medium", "Hard"];
const languages = ["Python", "JavaScript", "Java", "C++"];

const generateCodeSnippet = (language) => {
  let snippet = "";
  switch (language) {
    case "Python":
      snippet = `def solution(n):
    # TODO: Implement the solution
    pass

# Test the function
print(solution(10))`;
      break;
    case "JavaScript":
      snippet = `function solution(n) {
  // TODO: Implement the solution
}

// Test the function
console.log(solution(10));`;
      break;
    // Add cases for other languages as needed
    default:
      snippet = `// TODO: Implement the solution in ${language}`;
  }
  return snippet;
};

const estimateTime = (difficulty, codeSnippetLength) => {
  const baseTime = {
    Easy: 10,
    Medium: 20,
    Hard: 30,
  }[difficulty];

  const snippetFactor = Math.ceil(codeSnippetLength / 100);
  const estimatedMinutes = baseTime + snippetFactor * 5;

  return `${estimatedMinutes} min`;
};

const generateChallenge = () => {
  const language = faker.helpers.arrayElement(languages);
  const difficulty = faker.helpers.arrayElement(difficulties);
  const codeSnippet = generateCodeSnippet(language);

  return {
    title: faker.lorem.sentence().slice(0, -1),
    language,
    difficulty,
    description: faker.lorem.paragraph(),
    codeSnippet,
    estimatedTime: estimateTime(difficulty, codeSnippet.length),
    isDaily: faker.datatype.boolean({ probability: 0.1 }), // 10% chance of being a daily challenge
  };
};

const seedChallenges = async (count = 20) => {
  try {
    await Challenge.deleteMany({}); // Clear existing challenges
    console.log("Cleared existing challenges");

    const challenges = Array.from({ length: count }, generateChallenge);
    await Challenge.insertMany(challenges);
    console.log(`${count} challenges seeded successfully`);
  } catch (error) {
    console.error("Error seeding challenges:", error);
  } finally {
    mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

// Run the seeding process
seedChallenges();
