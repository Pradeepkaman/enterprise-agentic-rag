# Machine Learning Post-OCR Evaluation Benchmark (50 Questions)

> **Audit Started:** 2026-10-18 12:55:42  
> **Scope:** ML Modules 1 to 5 (Validating OCR Chunk Ingestion Grounding)  

| # | Target PDF | Question | Status | Time | Key Terms | Top Citations |
| :-: | :--- | :--- | :---: | :---: | :--- | :--- |
| 1 | `ML module 1.pdf` | Define Machine Learning and state Mitchell's definition (E, T, P). | PASS (Grounded) 🟢 | 44.32s | `machine learning, mitchell, experience` | `ML module 1.pdf` |
| 2 | `ML module 1.pdf` | Differentiate Supervised Learning, Unsupervised Learning, and Reinforcement Learning. | PASS (Grounded) 🟢 | 68.87s | `supervised, unsupervised, reinforcement` | `ML module 1.pdf, ML module 5.pdf` |
| 3 | `ML module 1.pdf` | What is Concept Learning and how is it modeled as a search through a hypothesis space? | PASS (Adjacent) 🟡 | 78.51s | `concept learning, hypothesis space, boolean-valued` | `ML module 2.pdf` |
| 4 | `ML module 1.pdf` | Define the General-to-Specific ordering of hypotheses. | PASS (Adjacent) 🟡 | 15.82s | `general, specific, ordering` | `ML module 2.pdf` |
| 5 | `ML module 1.pdf` | Explain the Find-S algorithm and show how it derives a maximally specific hypothesis from positive training instances. | PASS (Adjacent) 🟡 | 79.76s | `find-s` | `ML module 4.pdf, ML module 2.pdf` |
| 6 | `ML module 1.pdf` | What are the major limitations of Find-S? | PASS (Adjacent) 🟡 | 73.07s | `find-s, limitations` | `ML module 2.pdf, AI module 2.pdf` |
| 7 | `ML module 1.pdf` | Explain the Version Space and how it represents all hypotheses consistent with training examples. | PASS (Adjacent) 🟡 | 48.29s | `version space, consistent` | `ML module 2.pdf` |
| 8 | `ML module 1.pdf` | Describe the Candidate Elimination algorithm and the update rules for General boundary (G) and Specific boundary (S). | PASS (Adjacent) 🟡 | 23.2s | `candidate elimination, general boundary, specific boundary` | `ML module 2.pdf` |
| 9 | `ML module 1.pdf` | What is an Inductive Bias and why is an unbiased learner unable to make useful generalizations? | PASS (Grounded) 🟢 | 50.65s | `inductive bias, unbiased learner, generalization` | `ML module 1.pdf` |
| 10 | `ML module 1.pdf` | Explain how Candidate Elimination handles negative training examples to specialize G. | PASS (Adjacent) 🟡 | 11.07s | `candidate elimination, specialize, g` | `ML module 2.pdf` |
| 11 | `ML module 2.pdf` | What is a Decision Tree and what do internal nodes, branches, and leaf nodes represent? | PASS (Adjacent) 🟡 | 70.97s | `decision tree, internal node, branch` | `ML module 3.pdf, ADA M-5.pdf` |
| 12 | `ML module 2.pdf` | What types of problems are best suited for Decision Tree learning? | PASS (Adjacent) 🟡 | 17.97s | `decision tree, discrete, classification` | `ML module 3.pdf` |
| 13 | `ML module 2.pdf` | Define Entropy in information theory and state its mathematical equation. | PASS (Adjacent) 🟡 | 59.33s | `entropy, probability, log` | `ML module 3.pdf` |
| 14 | `ML module 2.pdf` | Define Information Gain and explain how it measures expected reduction in entropy. | PASS (Adjacent) 🟡 | 15.29s | `information gain, entropy, reduction` | `ML module 3.pdf` |
| 15 | `ML module 2.pdf` | Describe the ID3 algorithm step-by-step. | PASS (Adjacent) 🟡 | 85.22s | `id3, information gain, entropy` | `AI module 2.pdf, ML module 3.pdf` |
| 16 | `ML module 2.pdf` | What is the inductive bias of decision tree algorithms? | FAIL 🔴 | 98.58s | `None` | `ML module 3.pdf, ADA M-5.pdf` |
| 17 | `ML module 2.pdf` | Explain Overfitting in decision trees and describe Pre-pruning versus Post-pruning. | PASS (Adjacent) 🟡 | 13.98s | `overfitting` | `ML module 3.pdf, ADA M-5.pdf` |
| 18 | `ML module 2.pdf` | What is Gain Ratio and why does C4.5 use it to prevent bias toward attributes with many distinct values? | PASS (Adjacent) 🟡 | 88.35s | `gain ratio, c4.5, bias` | `ML module 3.pdf` |
| 19 | `ML module 2.pdf` | How are continuous-valued attributes incorporated into decision tree split criteria? | PASS (Adjacent) 🟡 | 19.95s | `continuous, threshold, split` | `ML module 3.pdf` |
| 20 | `ML module 2.pdf` | How do decision trees handle missing attribute values in training instances? | PASS (Grounded) 🟢 | 65.5s | `decision tree` | `ML module 2.pdf, ML module 3.pdf` |
| 21 | `ML module 3.pdf` | Describe the Perceptron training rule and its convergence guarantee for linearly separable data. | PASS (Grounded) 🟢 | 25.72s | `perceptron, convergence, linearly separable` | `ML module 4.pdf, ML module 3.pdf` |
| 22 | `ML module 3.pdf` | What is Gradient Descent and how does it minimize the sum of squared errors cost function? | PASS (Grounded) 🟢 | 18.66s | `gradient descent, squared errors, learning rate` | `ML module 4.pdf, DL module 2.pdf` |
| 23 | `ML module 3.pdf` | What is Delta Rule (Adaline rule) and how does it differ from the Perceptron training rule? | PASS (Adjacent) 🟡 | 28.67s | `delta rule, adaline, linear` | `ML module 4.pdf, DL module 2.pdf` |
| 24 | `ML module 3.pdf` | Explain the difference between Batch Gradient Descent, Stochastic Gradient Descent, and Mini-batch GD. | FAIL 🔴 | 108.97s | `None` | `DL module 2.pdf` |
| 25 | `ML module 3.pdf` | Why are linear threshold units unable to learn non-linear decision boundaries like XOR? | PASS (Adjacent) 🟡 | 77.65s | `linear threshold, xor, non-linear` | `ML module 4.pdf` |
| 26 | `ML module 3.pdf` | Derive the weight update rule for a Sigmoid unit using calculus. | FAIL 🔴 | 10.55s | `None` | `ML module 4.pdf, ML module 5.pdf` |
| 27 | `ML module 3.pdf` | Explain the Multi-Layer Feedforward network architecture and the Backpropagation algorithm. | PASS (Adjacent) 🟡 | 90.88s | `multi-layer, feedforward, backpropagation` | `ML module 4.pdf, DL module 2.pdf` |
| 28 | `ML module 3.pdf` | What is the role of learning rate (eta) and how does it affect convergence? | PASS (Adjacent) 🟡 | 44.84s | `learning rate, convergence` | `DL module 2.pdf` |
| 29 | `ML module 3.pdf` | How does adding a Momentum term to backpropagation prevent oscillations in error valleys? | PASS (Adjacent) 🟡 | 12.84s | `momentum, oscillations, gradient` | `DL module 4.pdf, DL module 2.pdf` |
| 30 | `ML module 3.pdf` | Explain the generalization capabilities of neural networks and how validation sets guide early stopping. | PASS (Adjacent) 🟡 | 65.52s | `generalization, validation set, early stopping` | `DL module 2.pdf` |
| 31 | `ML module 4.pdf` | State Bayes' Theorem and define Prior Probability, Likelihood, Marginal Probability, and Posterior Probability. | PASS (Grounded) 🟢 | 25.37s | `bayes, prior, posterior` | `ML module 4.pdf` |
| 32 | `ML module 4.pdf` | What is Maximum A Posteriori (MAP) hypothesis and Maximum Likelihood (ML) hypothesis? | PASS (Grounded) 🟢 | 20.22s | `map, maximum a posteriori, maximum likelihood` | `ML module 4.pdf, ML module 2.pdf` |
| 33 | `ML module 4.pdf` | Derive the Naive Bayes Classifier equation from Bayes' theorem. | PASS (Grounded) 🟢 | 29.08s | `naive bayes, classifier` | `ML module 4.pdf` |
| 34 | `ML module 4.pdf` | Explain the conditional independence assumption in Naive Bayes. | PASS (Grounded) 🟢 | 24.79s | `conditional independence, naive, features` | `ML module 4.pdf` |
| 35 | `ML module 4.pdf` | What is the zero-frequency problem in Naive Bayes and how does Laplace Smoothing resolve it? | PASS (Grounded) 🟢 | 27.01s | `zero-frequency, laplace smoothing, probability` | `ML module 4.pdf` |
| 36 | `ML module 4.pdf` | Describe the Minimum Description Length (MDL) principle and its relation to Occam's Razor. | PASS (Grounded) 🟢 | 41.49s | `mdl, minimum description length, occam's razor` | `ML module 4.pdf` |
| 37 | `ML module 4.pdf` | What is a Bayesian Belief Network and how does it model directed acyclic dependencies? | PASS (Grounded) 🟢 | 13.66s | `bayesian belief network, dag, dependencies` | `ML module 4.pdf` |
| 38 | `ML module 4.pdf` | Explain the Concept of d-separation and conditional independence in Bayesian Networks. | FAIL 🔴 | 63.12s | `None` | `ML module 4.pdf` |
| 39 | `ML module 4.pdf` | What is the Expectation-Maximization (EM) algorithm and when is it applied to incomplete data? | PASS (Adjacent) 🟡 | 27.18s | `em algorithm, expectation, maximization` | `ML module 2.pdf, DL module 2.pdf` |
| 40 | `ML module 4.pdf` | How does Naive Bayes perform text classification using Bag-of-Words features? | PASS (Grounded) 🟢 | 70.06s | `text classification, bag-of-words, naive bayes` | `ML module 4.pdf, DL module 5.pdf` |
| 41 | `ML module 5.pdf` | What is Instance-Based Learning (Lazy Learning) and how does it differ from Eager Learning? | PASS (Grounded) 🟢 | 63.73s | `instance-based, lazy learning, eager learning` | `ML module 2.pdf, ML module 3.pdf` |
| 42 | `ML module 5.pdf` | Explain the K-Nearest Neighbors (KNN) algorithm for classification and regression. | PASS (Grounded) 🟢 | 119.08s | `knn, k-nearest neighbors, majority vote` | `ML module 1.pdf, ML module 3.pdf` |
| 43 | `ML module 5.pdf` | What distance metrics (Euclidean, Manhattan, Minkowski) are commonly used in KNN? | PASS (Grounded) 🟢 | 19.34s | `euclidean, manhattan, distance` | `ADA M-5.pdf, ML module 5.pdf` |
| 44 | `ML module 5.pdf` | What is the Curse of Dimensionality and how does it impact distance metrics in high-dimensional feature spaces? | PASS (Grounded) 🟢 | 59.05s | `curse of dimensionality, distance, high-dimensional` | `ML module 5.pdf` |
| 45 | `ML module 5.pdf` | Explain Distance-Weighted KNN and how it prevents distant neighbors from corrupting classification. | PASS (Adjacent) 🟡 | 104.82s | `distance-weighted, weight, knn` | `ML module 3.pdf` |
| 46 | `ML module 5.pdf` | What are Radial Basis Function (RBF) networks and how do localized kernel functions map inputs? | PASS (Adjacent) 🟡 | 113.99s | `rbf, radial basis, gaussian` | `ML module 4.pdf, DL module 3.pdf` |
| 47 | `ML module 5.pdf` | Explain Case-Based Reasoning (CBR) and its four-step cycle (Retrieve, Reuse, Revise, Retain). | FAIL 🔴 | 8.33s | `None` | `SE Module 2.pdf, AI module 4.pdf` |
| 48 | `ML module 5.pdf` | Define Confusion Matrix metrics: True Positive, False Positive, Precision, Recall, and F1-Score. | PASS (Adjacent) 🟡 | 66.83s | `precision, recall, f1-score` | `ML module 2.pdf, DL module 5.pdf` |
| 49 | `ML module 5.pdf` | Explain ROC (Receiver Operating Characteristic) curve and AUC (Area Under Curve). | PASS (Adjacent) 🟡 | 87.97s | `roc, auc, true positive rate` | `ML module 2.pdf, DL module 5.pdf` |
| 50 | `ML module 5.pdf` | Explain K-Fold Cross Validation and the Bias-Variance Tradeoff. | PASS (Adjacent) 🟡 | 38.53s | `k-fold, cross-validation, bias` | `ML module 2.pdf` |
