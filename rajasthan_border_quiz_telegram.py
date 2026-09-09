import requests
import time
import re
import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")
SUBJECT = os.getenv("SUBJECT", "Geography - भौतिक विशेषताएं")  # .env se padho ya default use karo
URL = f"https://api.telegram.org/bot{BOT_TOKEN}/sendPoll"
QUESTIONS_FILE = "questions.txt"  # Questions yahan se read honge

# File se questions load karo
try:
    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        questions_text = f.read()
except FileNotFoundError:
    print(f"❌ {QUESTIONS_FILE} file nahi mili!")
    print(f"Pehle {QUESTIONS_FILE} file create karo")
    exit(1)

# Agar file empty hai
if not questions_text.strip():
    print(f"❌ {QUESTIONS_FILE} file khali hai!")
    print(f"Pehle questions add karo")
    exit(1)

# Hardcoded questions ko hata diya
# Ab questions.txt se padho ge


def parse_questions(text):
    pattern = re.compile(
        r"Q\d+\.\s*(.*?)\n"
        r"\s*A\)\s*(.*?)\n"
        r"\s*B\)\s*(.*?)\n"
        r"\s*C\)\s*(.*?)\n"
        r"\s*D\)\s*(.*?)\n"
        r"\s*ANSWER:\s*([ABCD])",
        re.DOTALL
    )
    matches = pattern.findall(text)
    questions = []
    for match in matches:
        question, a, b, c, d, answer = match
        options = [a.strip(), b.strip(), c.strip(), d.strip()]
        correct_option = ord(answer.upper()) - ord("A")
        questions.append({
            "question": question.strip(),
            "options": options,
            "correct_option": correct_option
        })
    return questions


questions = parse_questions(questions_text)
print(f"Found {len(questions)} questions")

for i, q in enumerate(questions, start=1):
    data = {
        "chat_id": CHAT_ID,
        "question": f"[{SUBJECT}] {q['question']}",  # Subject ke sath question
        "options": q["options"],
        "type": "quiz",
        "correct_option_id": q["correct_option"],
        "is_anonymous": False,
        "allows_multiple_answers": False
    }
    response = requests.post(URL, json=data)
    result = response.json()
    if result.get("ok"):
        print(f"✅ Q{i} sent successfully")
    else:
        print(f"❌ Q{i} failed:")
        print(result)
    time.sleep(2)