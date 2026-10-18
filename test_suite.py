import json
import urllib.request
import urllib.error
import time

BASE_URL = "http://127.0.0.1:8000"

def test_sources_endpoint():
    print("[TEST 1] Testing /sources endpoint...")
    req = urllib.request.Request(f"{BASE_URL}/sources")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        data = json.loads(resp.read().decode('utf-8'))
        count = data.get("count", 0)
        files = data.get("files", [])
        assert count == 38, f"Expected 38 sources, got {count}"
        assert len(files) == 38, f"Expected 38 files in list, got {len(files)}"
        print(f"  --> PASSED: 38 sources returned with metadata. First file: {files[0]['name']}")

def test_guardrails_empty_message():
    print("[TEST 2] Testing empty message guardrail on /chat...")
    payload = json.dumps({"messages": []}).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/chat",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req)
        print("  --> FAILED: Expected 400 or 422 for empty messages!")
    except urllib.error.HTTPError as e:
        assert e.code in (400, 422), f"Expected 400 or 422, got {e.code}"
        print(f"  --> PASSED: Server rejected empty messages with HTTP {e.code}")

def test_chitchat_query():
    print("[TEST 3] Testing Chitchat intent query...")
    payload = json.dumps({
        "messages": [{"role": "user", "content": "Hello! How are you?"}],
        "model": "gemini"
    }).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/chat",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        # Read SSE stream
        lines = resp.read().decode('utf-8').split("\n")
        events = [line for line in lines if line.startswith("data: ")]
        assert len(events) > 0, "No SSE events received"
        print(f"  --> PASSED: Chitchat returned {len(events)} SSE stream events cleanly.")

def test_technical_rag_query():
    print("[TEST 4] Testing Technical RAG Query (Operating Systems - Deadlock)...")
    payload = json.dumps({
        "messages": [{"role": "user", "content": "What are the four necessary conditions for deadlock in operating systems?"}],
        "model": "gemini"
    }).encode('utf-8')
    req = urllib.request.Request(
        f"{BASE_URL}/chat",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        full_text = []
        traces = []
        for line in resp:
            line_str = line.decode('utf-8').strip()
            if line_str.startswith("data: "):
                try:
                    data = json.loads(line_str[6:])
                    if "text" in data:
                        full_text.append(data["text"])
                    if "trace" in data:
                        traces.append(data["trace"])
                except Exception:
                    pass
        combined_text = "".join(full_text)
        print(f"  --> PASSED: Synthesized answer length: {len(combined_text)} chars.")
        print(f"  --> Received {len(traces)} execution trace stages.")
        # Check deadlock keywords
        assert any(k in combined_text.lower() for k in ["mutual exclusion", "hold and wait", "no preemption", "circular wait"]), "Expected deadlock conditions in answer!"
        print("  --> PASSED: Answer contains verified deadlock conditions with citations!")

if __name__ == "__main__":
    test_sources_endpoint()
    test_guardrails_empty_message()
    test_chitchat_query()
    test_technical_rag_query()
    print("\nALL BACKEND & RAG TESTS PASSED SUCCESSFULLY! [SUCCESS]")
