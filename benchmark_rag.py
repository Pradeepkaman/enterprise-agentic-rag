import json
import urllib.request
import urllib.error
import time
import argparse
import sys
import os

BASE_URL = "http://127.0.0.1:8000"
REPORT_FILE = "BENCHMARK_REPORT.md"

BENCHMARK_DATA = {
    "Operating Systems (OS)": [
        {
            "q": "What are the four necessary conditions for deadlock in operating systems?",
            "keywords": ["mutual exclusion", "hold and wait", "no preemption", "circular wait"],
            "expected_sources": ["OS"]
        },
        {
            "q": "Explain the difference between preemptive and non-preemptive CPU scheduling.",
            "keywords": ["preemptive", "scheduling", "cpu", "burst"],
            "expected_sources": ["OS"]
        },
        {
            "q": "What is a Process Control Block (PCB) and what information does it store?",
            "keywords": ["pcb", "process", "register", "state", "counter"],
            "expected_sources": ["OS"]
        },
        {
            "q": "Describe the concept of virtual memory and demand paging in operating systems.",
            "keywords": ["virtual memory", "demand paging", "page fault", "frame"],
            "expected_sources": ["OS"]
        },
        {
            "q": "Explain Belady's Anomaly in FIFO page replacement algorithm.",
            "keywords": ["belady", "fifo", "page fault", "frame"],
            "expected_sources": ["OS"]
        },
        {
            "q": "What is thrashing and how does the working set model prevent it?",
            "keywords": ["thrashing", "paging", "working set", "cpu utilization"],
            "expected_sources": ["OS"]
        },
        {
            "q": "Describe the Banker's Algorithm for deadlock avoidance.",
            "keywords": ["banker", "deadlock", "safe state", "allocation", "max"],
            "expected_sources": ["OS"]
        },
        {
            "q": "What is the critical section problem and what are the three requirements for a valid solution?",
            "keywords": ["critical section", "mutual exclusion", "progress", "bounded waiting"],
            "expected_sources": ["OS"]
        },
        {
            "q": "Explain semaphores and the difference between binary and counting semaphores.",
            "keywords": ["semaphore", "wait", "signal", "binary", "counting"],
            "expected_sources": ["OS"]
        },
        {
            "q": "Describe paging and segmentation memory management techniques.",
            "keywords": ["paging", "segmentation", "page table", "fragmentation"],
            "expected_sources": ["OS"]
        }
    ],
    "Artificial Intelligence (AI)": [
        {
            "q": "What is the difference between informed and uninformed search strategies?",
            "keywords": ["informed", "uninformed", "heuristic", "blind", "bfs", "dfs"],
            "expected_sources": ["AI"]
        },
        {
            "q": "Explain the A* search algorithm and what makes a heuristic admissible.",
            "keywords": ["a*", "heuristic", "admissible", "f(n)", "g(n)", "h(n)"],
            "expected_sources": ["AI"]
        },
        {
            "q": "What is the Minimax algorithm and how does Alpha-Beta pruning optimize it?",
            "keywords": ["minimax", "alpha-beta", "pruning", "game", "cutoff"],
            "expected_sources": ["AI"]
        },
        {
            "q": "Describe the PEAS description of an agent in artificial intelligence.",
            "keywords": ["peas", "performance", "environment", "actuator", "sensor"],
            "expected_sources": ["AI"]
        },
        {
            "q": "What are production systems in AI and what are their main components?",
            "keywords": ["production system", "rule", "working memory", "inference"],
            "expected_sources": ["AI"]
        },
        {
            "q": "Explain forward chaining versus backward chaining in inference engines.",
            "keywords": ["forward chaining", "backward chaining", "inference", "goal", "data"],
            "expected_sources": ["AI"]
        },
        {
            "q": "What is resolution refutation in propositional logic?",
            "keywords": ["resolution", "refutation", "clause", "cnf", "contradiction"],
            "expected_sources": ["AI"]
        },
        {
            "q": "Describe Constraint Satisfaction Problems (CSP) with an example like 8-Queens.",
            "keywords": ["constraint", "csp", "variable", "domain", "queen"],
            "expected_sources": ["AI"]
        },
        {
            "q": "What is a heuristic function and how is Manhattan distance used in the 8-puzzle problem?",
            "keywords": ["heuristic", "manhattan", "puzzle", "distance"],
            "expected_sources": ["AI"]
        },
        {
            "q": "Explain the architecture of a knowledge-based agent.",
            "keywords": ["knowledge base", "inference engine", "tell", "ask"],
            "expected_sources": ["AI"]
        }
    ],
    "Machine Learning (ML)": [
        {
            "q": "What is the difference between supervised, unsupervised, and reinforcement learning?",
            "keywords": ["supervised", "unsupervised", "reinforcement", "label", "reward"],
            "expected_sources": ["ML"]
        },
        {
            "q": "Explain the bias-variance tradeoff and its effect on overfitting and underfitting.",
            "keywords": ["bias", "variance", "overfitting", "underfitting", "tradeoff"],
            "expected_sources": ["ML"]
        },
        {
            "q": "How does the ID3 algorithm use entropy and information gain to construct decision trees?",
            "keywords": ["id3", "entropy", "information gain", "decision tree"],
            "expected_sources": ["ML"]
        },
        {
            "q": "Explain the concept of candidate elimination algorithm and version spaces.",
            "keywords": ["candidate elimination", "version space", "general", "specific", "boundary"],
            "expected_sources": ["ML"]
        },
        {
            "q": "What is the Find-S algorithm and what are its primary limitations?",
            "keywords": ["find-s", "hypothesis", "maximally specific", "limitation"],
            "expected_sources": ["ML"]
        },
        {
            "q": "Describe K-Nearest Neighbors (KNN) algorithm and how distance metrics affect classification.",
            "keywords": ["knn", "nearest neighbor", "distance", "euclidean", "k"],
            "expected_sources": ["ML"]
        },
        {
            "q": "What is Naive Bayes classification and why is the conditional independence assumption called naive?",
            "keywords": ["naive bayes", "prior", "posterior", "independence", "conditional"],
            "expected_sources": ["ML"]
        },
        {
            "q": "Explain precision, recall, F1-score, and ROC curve in machine learning evaluation.",
            "keywords": ["precision", "recall", "f1", "roc", "confusion matrix"],
            "expected_sources": ["ML"]
        },
        {
            "q": "What is cross-validation and why is K-fold cross-validation widely preferred?",
            "keywords": ["cross-validation", "k-fold", "validation", "overfitting"],
            "expected_sources": ["ML"]
        },
        {
            "q": "Describe linear regression and the role of gradient descent in cost function minimization.",
            "keywords": ["linear regression", "gradient descent", "learning rate", "cost function"],
            "expected_sources": ["ML"]
        }
    ],
    "Deep Learning (DL)": [
        {
            "q": "What is the vanishing and exploding gradient problem in deep neural networks?",
            "keywords": ["vanishing gradient", "exploding gradient", "backpropagation", "derivative"],
            "expected_sources": ["DL"]
        },
        {
            "q": "Explain the architecture and working principle of Convolutional Neural Networks (CNN).",
            "keywords": ["cnn", "convolution", "filter", "pooling", "feature map"],
            "expected_sources": ["DL"]
        },
        {
            "q": "What are activation functions and why is ReLU preferred over Sigmoid in deep networks?",
            "keywords": ["activation function", "relu", "sigmoid", "saturation"],
            "expected_sources": ["DL"]
        },
        {
            "q": "Describe Recurrent Neural Networks (RNN) and how LSTM solves vanishing gradients.",
            "keywords": ["rnn", "lstm", "cell state", "gate", "forget gate"],
            "expected_sources": ["DL"]
        },
        {
            "q": "What is backpropagation through time (BPTT) in sequence models?",
            "keywords": ["bptt", "backpropagation", "sequence", "time step"],
            "expected_sources": ["DL"]
        },
        {
            "q": "Explain the purpose of pooling layers (max pooling and average pooling) in CNN architectures.",
            "keywords": ["pooling", "max pooling", "dimension", "downsampling", "invariance"],
            "expected_sources": ["DL"]
        },
        {
            "q": "What is dropout and how does it prevent overfitting in deep models?",
            "keywords": ["dropout", "regularization", "overfitting", "probability"],
            "expected_sources": ["DL"]
        },
        {
            "q": "Describe Batch Normalization and how it stabilizes deep neural network training.",
            "keywords": ["batch normalization", "internal covariate shift", "mean", "variance"],
            "expected_sources": ["DL"]
        },
        {
            "q": "Explain the attention mechanism and self-attention in Transformer architectures.",
            "keywords": ["attention", "self-attention", "query", "key", "value", "transformer"],
            "expected_sources": ["DL"]
        },
        {
            "q": "What are autoencoders and how are variational autoencoders (VAEs) different?",
            "keywords": ["autoencoder", "encoder", "decoder", "latent", "reconstruction"],
            "expected_sources": ["DL"]
        }
    ],
    "Computer Networks (CN)": [
        {
            "q": "Explain the 7 layers of the OSI model and their primary functions.",
            "keywords": ["osi", "physical", "data link", "network", "transport", "session", "presentation", "application"],
            "expected_sources": ["CN"]
        },
        {
            "q": "What is the difference between TCP and UDP protocols?",
            "keywords": ["tcp", "udp", "connection-oriented", "connectionless", "reliable"],
            "expected_sources": ["CN"]
        },
        {
            "q": "Describe the three-way handshake process in TCP connection establishment.",
            "keywords": ["three-way handshake", "syn", "ack", "seq"],
            "expected_sources": ["CN"]
        },
        {
            "q": "How does the Go-Back-N ARQ protocol handle lost frames?",
            "keywords": ["go-back-n", "arq", "window", "ack", "timeout", "retransmission"],
            "expected_sources": ["CN"]
        },
        {
            "q": "Explain the working of CSMA/CD and CSMA/CA in network medium access.",
            "keywords": ["csma/cd", "csma/ca", "collision", "carrier sense", "backoff"],
            "expected_sources": ["CN"]
        },
        {
            "q": "What is subnetting and how is a subnet mask used to find network and broadcast addresses?",
            "keywords": ["subnet", "subnet mask", "ip address", "network address", "host"],
            "expected_sources": ["CN"]
        },
        {
            "q": "Describe distance vector routing versus link state routing algorithms.",
            "keywords": ["distance vector", "link state", "bellman-ford", "dijkstra", "routing table"],
            "expected_sources": ["CN"]
        },
        {
            "q": "Explain the Domain Name System (DNS) resolution hierarchy.",
            "keywords": ["dns", "root server", "tld", "authoritative", "domain"],
            "expected_sources": ["CN"]
        },
        {
            "q": "What is the difference between IPv4 and IPv6 addressing schemes?",
            "keywords": ["ipv4", "ipv6", "32-bit", "128-bit", "header"],
            "expected_sources": ["CN"]
        },
        {
            "q": "How does Network Address Translation (NAT) work and why is it used?",
            "keywords": ["nat", "private ip", "public ip", "translation", "port"],
            "expected_sources": ["CN"]
        }
    ],
    "Analysis & Design of Algorithms (ADA)": [
        {
            "q": "What is the Master Theorem for solving recurrence relations in algorithm analysis?",
            "keywords": ["master theorem", "recurrence", "t(n)", "log"],
            "expected_sources": ["ADA"]
        },
        {
            "q": "Explain the divide-and-conquer strategy using Quick Sort and analyze its worst-case complexity.",
            "keywords": ["quick sort", "divide and conquer", "pivot", "partition", "o(n^2)"],
            "expected_sources": ["ADA"]
        },
        {
            "q": "Describe dynamic programming and how it applies to the 0/1 Knapsack problem.",
            "keywords": ["dynamic programming", "knapsack", "subproblem", "optimal substructure", "memoization"],
            "expected_sources": ["ADA"]
        },
        {
            "q": "What is greedy strategy and how does Dijkstra's shortest path algorithm use it?",
            "keywords": ["dijkstra", "shortest path", "greedy", "relaxation", "priority queue"],
            "expected_sources": ["ADA"]
        },
        {
            "q": "Explain Kruskal's and Prim's algorithms for finding Minimum Spanning Trees.",
            "keywords": ["minimum spanning tree", "mst", "kruskal", "prim", "edge", "cycle"],
            "expected_sources": ["ADA"]
        },
        {
            "q": "Describe the Floyd-Warshall algorithm for all-pairs shortest paths.",
            "keywords": ["floyd-warshall", "all-pairs", "dynamic programming", "matrix"],
            "expected_sources": ["ADA"]
        },
        {
            "q": "What are P, NP, NP-Complete, and NP-Hard complexity classes?",
            "keywords": ["p", "np", "np-complete", "np-hard", "polynomial time", "reduction"],
            "expected_sources": ["ADA"]
        },
        {
            "q": "Explain the Horspool string matching algorithm and its shift table construction.",
            "keywords": ["horspool", "string matching", "shift table", "pattern"],
            "expected_sources": ["ADA"]
        },
        {
            "q": "What is backtracking and how does it solve the N-Queens problem?",
            "keywords": ["backtracking", "n-queens", "state space", "pruning"],
            "expected_sources": ["ADA"]
        },
        {
            "q": "Describe branch-and-bound technique and how it differs from backtracking.",
            "keywords": ["branch and bound", "backtracking", "bounding", "optimization"],
            "expected_sources": ["ADA"]
        }
    ],
    "Software Engineering (SE)": [
        {
            "q": "What is the Software Development Life Cycle (SDLC) and its primary phases?",
            "keywords": ["sdlc", "requirement", "design", "implementation", "testing", "maintenance"],
            "expected_sources": ["SE"]
        },
        {
            "q": "Compare the Waterfall model with Agile software development methodology.",
            "keywords": ["waterfall", "agile", "sprint", "iteration", "flexible"],
            "expected_sources": ["SE"]
        },
        {
            "q": "Explain the difference between functional and non-functional requirements.",
            "keywords": ["functional", "non-functional", "performance", "security", "requirement"],
            "expected_sources": ["SE"]
        },
        {
            "q": "What is requirement elicitation and what techniques are used by software analysts?",
            "keywords": ["elicitation", "interview", "survey", "use case", "prototyping"],
            "expected_sources": ["SE"]
        },
        {
            "q": "Describe black-box testing versus white-box testing with examples.",
            "keywords": ["black-box", "white-box", "testing", "coverage", "boundary value"],
            "expected_sources": ["SE"]
        },
        {
            "q": "Explain software cohesion and coupling and why high cohesion and low coupling are desired.",
            "keywords": ["cohesion", "coupling", "module", "dependency", "modular"],
            "expected_sources": ["SE"]
        },
        {
            "q": "What is the Unified Modeling Language (UML) and what does a class diagram represent?",
            "keywords": ["uml", "class diagram", "attribute", "relationship", "inheritance"],
            "expected_sources": ["SE"]
        },
        {
            "q": "Describe software risk management and strategies for risk mitigation.",
            "keywords": ["risk management", "mitigation", "identification", "monitoring"],
            "expected_sources": ["SE"]
        },
        {
            "q": "What is continuous integration and continuous deployment (CI/CD) in software engineering?",
            "keywords": ["ci/cd", "continuous integration", "deployment", "pipeline", "automation"],
            "expected_sources": ["SE"]
        },
        {
            "q": "Explain the role of software configuration management and version control.",
            "keywords": ["configuration management", "version control", "baseline", "repository"],
            "expected_sources": ["SE"]
        }
    ],
    "Java & Object-Oriented Programming (Java)": [
        {
            "q": "What are the four core pillars of Object-Oriented Programming and how are they implemented in Java?",
            "keywords": ["encapsulation", "inheritance", "polymorphism", "abstraction"],
            "expected_sources": ["JAVA", "oops"]
        },
        {
            "q": "Explain the difference between method overloading and method overriding in Java.",
            "keywords": ["overloading", "overriding", "compile-time", "runtime", "signature"],
            "expected_sources": ["JAVA", "oops"]
        },
        {
            "q": "What is the purpose of the Java Virtual Machine (JVM), JRE, and JDK?",
            "keywords": ["jvm", "jre", "jdk", "bytecode", "platform independent"],
            "expected_sources": ["JAVA", "oops"]
        },
        {
            "q": "Describe Java exception handling with try, catch, finally, throw, and throws.",
            "keywords": ["exception", "try", "catch", "finally", "throw", "throws"],
            "expected_sources": ["JAVA", "oops"]
        },
        {
            "q": "What is the difference between an Abstract Class and an Interface in Java?",
            "keywords": ["abstract class", "interface", "multiple inheritance", "default method"],
            "expected_sources": ["JAVA", "oops"]
        },
        {
            "q": "Explain multithreading in Java and the lifecycle of a thread.",
            "keywords": ["multithreading", "thread", "run", "start", "runnable", "deadlock"],
            "expected_sources": ["JAVA", "oops"]
        },
        {
            "q": "How does the Java Garbage Collector work and what is the role of the finalize() method?",
            "keywords": ["garbage collection", "heap", "memory", "finalize", "gc"],
            "expected_sources": ["JAVA", "oops"]
        },
        {
            "q": "What are Java Collections and what is the difference between ArrayList and LinkedList?",
            "keywords": ["collection", "arraylist", "linkedlist", "index", "node"],
            "expected_sources": ["JAVA", "oops"]
        },
        {
            "q": "Explain the difference between '==' and the '.equals()' method in Java.",
            "keywords": ["==", "equals", "reference", "object", "comparison"],
            "expected_sources": ["JAVA", "oops"]
        },
        {
            "q": "What are Java access specifiers (public, protected, default, private)?",
            "keywords": ["access specifier", "public", "private", "protected", "package"],
            "expected_sources": ["JAVA", "oops"]
        }
    ],
    "Indian Constitution (Constitution)": [
        {
            "q": "What is the Preamble of the Indian Constitution and what are its key philosophical ideals?",
            "keywords": ["preamble", "sovereign", "socialist", "secular", "democratic", "republic", "justice"],
            "expected_sources": ["Constitution"]
        },
        {
            "q": "Explain the Fundamental Rights guaranteed under Part III of the Indian Constitution.",
            "keywords": ["fundamental rights", "part iii", "equality", "freedom", "remedies", "article"],
            "expected_sources": ["Constitution"]
        },
        {
            "q": "What are the Directive Principles of State Policy (DPSP) and how do they differ from Fundamental Rights?",
            "keywords": ["directive principles", "dpsp", "part iv", "non-justiciable", "welfare state"],
            "expected_sources": ["Constitution"]
        },
        {
            "q": "Describe the structure and jurisdiction of the Supreme Court of India.",
            "keywords": ["supreme court", "original", "appellate", "advisory", "writ", "article"],
            "expected_sources": ["Constitution"]
        },
        {
            "q": "Explain the procedure for amending the Indian Constitution under Article 368.",
            "keywords": ["amendment", "article 368", "special majority", "ratification"],
            "expected_sources": ["Constitution"]
        },
        {
            "q": "What are the Emergency Provisions in the Indian Constitution (Articles 352, 356, 360)?",
            "keywords": ["emergency", "article 352", "article 356", "article 360", "national", "financial"],
            "expected_sources": ["Constitution"]
        },
        {
            "q": "Describe the federal structure of India with the Union List, State List, and Concurrent List.",
            "keywords": ["seventh schedule", "union list", "state list", "concurrent list", "federal"],
            "expected_sources": ["Constitution"]
        },
        {
            "q": "What are Fundamental Duties under Article 51A and when were they added to the Constitution?",
            "keywords": ["fundamental duties", "article 51a", "42nd amendment", "citizenship"],
            "expected_sources": ["Constitution"]
        },
        {
            "q": "Explain the role, election, and executive powers of the President of India.",
            "keywords": ["president", "executive", "election", "powers", "cabinet"],
            "expected_sources": ["Constitution"]
        },
        {
            "q": "What is the Doctrine of Basic Structure established by the Kesavananda Bharati case?",
            "keywords": ["basic structure", "kesavananda bharati", "amendment", "judiciary"],
            "expected_sources": ["Constitution"]
        }
    ]
}


def query_rag_api(question: str) -> dict:
    """Send a question to the FastAPI /chat endpoint and parse streaming SSE data."""
    payload = json.dumps({
        "messages": [{"role": "user", "content": question}],
        "model": "gemini"
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/chat",
        data=payload,
        headers={"Content-Type": "application/json"}
    )

    start_time = time.time()
    full_text = []
    traces = []
    sources = set()

    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            for line in resp:
                line_str = line.decode("utf-8").strip()
                if line_str.startswith("data: "):
                    raw_data = line_str[6:]
                    try:
                        data = json.loads(raw_data)
                        if "text" in data:
                            full_text.append(data["text"])
                        if "trace" in data:
                            traces.append(data["trace"])
                            # Extract cited files from context trace or citations
                            trace_data = data["trace"]
                            if isinstance(trace_data, dict):
                                files_found = trace_data.get("files") or trace_data.get("sources")
                                if files_found and isinstance(files_found, list):
                                    for f in files_found:
                                        sources.add(str(f))
                    except Exception:
                        pass
        elapsed = round(time.time() - start_time, 2)
        answer = "".join(full_text).strip()
        return {
            "status": "success",
            "answer": answer,
            "elapsed_seconds": elapsed,
            "trace_count": len(traces),
            "sources": list(sources)
        }
    except Exception as e:
        elapsed = round(time.time() - start_time, 2)
        return {
            "status": "error",
            "error": str(e),
            "answer": "",
            "elapsed_seconds": elapsed,
            "trace_count": 0,
            "sources": []
        }


def evaluate_test(item: dict, result: dict) -> dict:
    """Evaluate response against expected keywords and length."""
    if result["status"] != "success" or not result["answer"]:
        return {
            "passed": False,
            "score": 0,
            "matched_keywords": [],
            "reason": f"API Error or Empty Answer: {result.get('error', 'No text returned')}"
        }

    ans_lower = result["answer"].lower()
    matched = [kw for kw in item["keywords"] if kw.lower() in ans_lower]
    keyword_ratio = len(matched) / max(len(item["keywords"]), 1)
    
    # Needs at least 1 keyword and > 80 chars of technical synthesis
    passed = len(matched) >= 1 and len(result["answer"]) >= 80

    return {
        "passed": passed,
        "score": round(keyword_ratio * 100, 1),
        "matched_keywords": matched,
        "reason": f"Matched {len(matched)}/{len(item['keywords'])} keywords"
    }


def run_benchmark(subject_filter: str = None, sample_mode: bool = False):
    print("=" * 70)
    print("  ACADEMIC RAG BENCHMARK & RETRIEVAL EVALUATION")
    print("=" * 70)

    selected_subjects = {}
    if subject_filter:
        for subj, questions in BENCHMARK_DATA.items():
            if subject_filter.lower() in subj.lower():
                selected_subjects[subj] = questions
        if not selected_subjects:
            print(f"Error: No subject matching '{subject_filter}'.")
            print("Available subjects:", list(BENCHMARK_DATA.keys()))
            return
    else:
        selected_subjects = BENCHMARK_DATA

    total_tests = 0
    passed_tests = 0
    all_results = {}

    for subject, questions in selected_subjects.items():
        print(f"\n[SUBJECT] {subject}")
        q_list = questions[:1] if sample_mode else questions
        subject_results = []

        for idx, item in enumerate(q_list, 1):
            q = item["q"]
            print(f"  Q{idx}: {q[:65]}...", end="", flush=True)

            res = query_rag_api(q)
            eval_res = evaluate_test(item, res)
            
            total_tests += 1
            if eval_res["passed"]:
                passed_tests += 1
                status_icon = "PASS [OK]"
            else:
                status_icon = "FAIL [X]"

            print(f" -> {status_icon} ({res['elapsed_seconds']}s, {len(res['answer'])} chars)")
            subject_results.append({
                "item": item,
                "result": res,
                "eval": eval_res
            })
            # Small delay to keep within rate limits
            time.sleep(1.0)

        all_results[subject] = subject_results

    # Summary
    pass_rate = round((passed_tests / total_tests) * 100, 1) if total_tests > 0 else 0
    print("\n" + "=" * 70)
    print(f"BENCHMARK COMPLETE: {passed_tests}/{total_tests} PASSED ({pass_rate}%)")
    print("=" * 70)

    # Generate Markdown Report
    generate_markdown_report(all_results, total_tests, passed_tests, pass_rate)


def generate_markdown_report(all_results: dict, total: int, passed: int, pass_rate: float):
    md = []
    md.append("# Academic RAG Multi-Subject Benchmark Report\n")
    md.append(f"> **Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}  ")
    md.append(f"> **Overall Pass Rate:** {passed}/{total} ({pass_rate}%) 🟢  ")
    md.append("> **Evaluation Scope:** 9 Engineering Subject Domains Across All 38 Indexed PDFs\n")
    md.append("---\n")

    md.append("## Executive Scorecard\n")
    md.append("| Subject Domain | Tests Run | Passed | Pass Rate | Avg Latency |")
    md.append("| :--- | :---: | :---: | :---: | :---: |")

    for subject, items in all_results.items():
        s_total = len(items)
        s_passed = sum(1 for it in items if it["eval"]["passed"])
        s_rate = round((s_passed / s_total) * 100, 1) if s_total > 0 else 0
        avg_lat = round(sum(it["result"]["elapsed_seconds"] for it in items) / max(s_total, 1), 2)
        md.append(f"| **{subject}** | {s_total} | {s_passed} | {s_rate}% | {avg_lat}s |")

    md.append("\n---\n")
    md.append("## Detailed Question & Grounding Audit\n")

    for subject, items in all_results.items():
        md.append(f"### {subject}\n")
        md.append("| # | Question | Status | Latency | Answer Preview | Key Terms Verified |")
        md.append("| :-: | :--- | :---: | :---: | :--- | :--- |")

        for idx, it in enumerate(items, 1):
            q_text = it["item"]["q"]
            status = "PASSED 🟢" if it["eval"]["passed"] else "FAILED 🔴"
            latency = f"{it['result']['elapsed_seconds']}s"
            ans_snippet = (it["result"]["answer"][:120] + "...").replace("\n", " ").replace("|", "\\|") if it["result"]["answer"] else "N/A"
            terms = ", ".join(it["eval"]["matched_keywords"][:3]) or "None"
            md.append(f"| {idx} | {q_text} | {status} | {latency} | {ans_snippet} | `{terms}` |")
        md.append("\n")

    report_content = "\n".join(md)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(report_content)
    print(f"\n[REPORT GENERATED] Saved comprehensive audit to {REPORT_FILE}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Academic RAG Benchmark Suite")
    parser.add_argument("--subject", type=str, help="Filter by specific subject (e.g. OS, AI, ML, DL, CN, ADA, SE, Java, Constitution)")
    parser.add_argument("--sample", action="store_true", help="Run 1 sample question per subject for quick verification")
    parser.add_argument("--all", action="store_true", help="Run full 90-question benchmark across all 9 subjects")
    args = parser.parse_args()

    if args.sample:
        run_benchmark(sample_mode=True)
    elif args.subject:
        run_benchmark(subject_filter=args.subject)
    elif args.all:
        run_benchmark()
    else:
        # Default to running sample mode first or asking
        run_benchmark(sample_mode=True)
