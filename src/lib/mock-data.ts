// Mock data to simulate the NEURONEX backend for UI development

export const MOCK_USER = {
  name: "Alex Learner",
  email: "alex@neuronex.ai",
  avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  healthScore: 84,
  streak: 12,
  level: "Knowledge Explorer",
};

export const MOCK_NOTES = [
  {
    id: "note-1",
    title: "Introduction to Neural Networks",
    documentName: "Deep_Learning_Ch1.pdf",
    level: "Intermediate",
    updatedAt: "2 hours ago",
    content: `# Neural Networks Overview\n\nNeural networks are computing systems inspired by the biological neural networks that constitute animal brains.\n\n## Key Concepts\n- **Neurons**: The basic unit of computation.\n- **Weights**: Parameters that are learned during training.\n- **Activation Functions**: Introduce non-linearity (e.g., ReLU, Sigmoid).`,
  },
  {
    id: "note-2",
    title: "React Server Components",
    documentName: "NextJS_Docs.pdf",
    level: "Advanced",
    updatedAt: "Yesterday",
    content: `# React Server Components\n\nRSCs allow you to render components on the server, reducing the JavaScript bundle size sent to the client.\n\n### Benefits\n- Zero bundle size impact.\n- Direct access to backend resources.\n- Automatic code splitting.`,
  },
  {
    id: "note-3",
    title: "The Krebs Cycle",
    documentName: "Biology_101.pdf",
    level: "Exam",
    updatedAt: "3 days ago",
    content: `# The Citric Acid Cycle\n\nA series of chemical reactions used by all aerobic organisms to release stored energy.\n\n**Mnemonic**: "Our City Is Kept Safe And Sound From Malice" (Oxaloacetate, Citrate, Isocitrate, a-Ketoglutarate, Succinyl-CoA, Succinate, Fumarate, Malate).`,
  },
];

export const MOCK_SUMMARIES = {
  "30sec": "Neural networks use interconnected layers of nodes (neurons) to process data, utilizing weights and activation functions to learn complex patterns through backpropagation.",
  "2min": "A neural network is a machine learning model inspired by the human brain. It consists of an input layer, one or more hidden layers, and an output layer. During training, the network adjusts its internal weights based on the error of its predictions using an algorithm called backpropagation.",
  "5min": "Neural networks are foundational to modern deep learning... [Expanded text covering architecture, math, and historical context]",
  "executive": "Background: AI adoption is accelerating.\nFindings: Neural nets offer superior pattern recognition.\nRecommendations: Invest in GPU infrastructure.",
  "exam": "- **Neuron**: Basic unit\n- **Activation**: ReLU > Sigmoid\n- **Loss Function**: Measures error\n- **Backprop**: Updates weights using gradient descent",
};

export const MOCK_QUIZ_QUESTIONS = [
  {
    id: "q1",
    type: "mcq",
    question: "Which activation function is most commonly used in modern hidden layers to prevent the vanishing gradient problem?",
    options: ["Sigmoid", "Tanh", "ReLU", "Softmax"],
    correctAnswer: "ReLU",
    explanation: "ReLU (Rectified Linear Unit) avoids vanishing gradients because its derivative is 1 for all positive inputs.",
    difficulty: "Medium",
    conceptTag: "Activation Functions",
  },
  {
    id: "q2",
    type: "true_false",
    question: "Backpropagation is only used in recurrent neural networks (RNNs).",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "Backpropagation is the standard learning algorithm for nearly all types of neural networks, including Feedforward and Convolutional networks.",
    difficulty: "Easy",
    conceptTag: "Training Algorithms",
  },
  {
    id: "q3",
    type: "fill_blank",
    question: "The _____ rate determines the step size at each iteration while moving toward a minimum of a loss function.",
    options: null,
    correctAnswer: "learning",
    explanation: "The learning rate is a crucial hyperparameter that controls how much to change the model in response to the estimated error each time the model weights are updated.",
    difficulty: "Medium",
    conceptTag: "Hyperparameters",
  },
];

export const MOCK_FLASHCARDS = [
  {
    id: "fc-1",
    front: "What does ReLU stand for?",
    back: "Rectified Linear Unit",
    status: "due",
    conceptTag: "Activation",
  },
  {
    id: "fc-2",
    front: "Formula for the Sigmoid function?",
    back: "1 / (1 + e^-x)",
    status: "learning",
    conceptTag: "Math",
  },
  {
    id: "fc-3",
    front: "What is an epoch?",
    back: "One complete pass of the training dataset through the algorithm.",
    status: "new",
    conceptTag: "Training",
  },
];

export const MOCK_HEALTH_METRICS = [
  { subject: "Machine Learning", coverage: 85, retention: 70, depth: 60, consistency: 90 },
  { subject: "React.js", coverage: 95, retention: 85, depth: 80, consistency: 95 },
  { subject: "Biology", coverage: 40, retention: 90, depth: 30, consistency: 50 },
  { subject: "System Design", coverage: 60, retention: 50, depth: 70, consistency: 60 },
  { subject: "Databases", coverage: 75, retention: 80, depth: 65, consistency: 70 },
];

export const MOCK_RETENTION_DATA = [
  { name: "Week 1", score: 40 },
  { name: "Week 2", score: 55 },
  { name: "Week 3", score: 45 },
  { name: "Week 4", score: 70 },
  { name: "Week 5", score: 85 },
  { name: "Week 6", score: 82 },
];
