import { useState, useRef, useEffect, useCallback } from "react";

const C = {
  bg: "#0f0f14", surface: "#1a1a24", card: "#22222f", border: "#2e2e40",
  accent: "#f5a623", accentDim: "#f5a62322", text: "#e8e6f0", textDim: "#7a7890",
  green: "#4ade80", red: "#f87171", blue: "#60a5fa", purple: "#c084fc",
};

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:${C.bg};color:${C.text};font-family:'DM Sans',sans-serif}
    textarea,input,select{font-family:'DM Sans',sans-serif}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .fi{animation:fadeIn .3s ease forwards}
    .pu{animation:pulse 1.2s ease infinite}
    .spin{animation:spin 1s linear infinite}
  `}</style>
);

const TABS = [
  { id: "notes",    icon: "📝", label: "ノート" },
  { id: "tasks",    icon: "✅", label: "タスク" },
  { id: "advice",   icon: "🧠", label: "アドバイス" },
  { id: "quiz",     icon: "❓", label: "問題作成" },
];

const TabBar = ({ active, onSelect }) => (
  <div style={{ display:"flex", background:C.surface, borderTop:`1px solid ${C.border}`,
    position:"fixed", bottom:0, left:0, right:0, zIndex:100 }}>
    {TABS.map(t => (
      <button key={t.id} onClick={() => onSelect(t.id)} style={{
        flex:1, padding:"10px 4px 8px", background:"none", border:"none", cursor:"pointer",
        display:"flex", flexDirection:"column", alignItems:"center", gap:3,
        color: active===t.id ? C.accent : C.textDim, position:"relative",
      }}>
        <span style={{ fontSize:20 }}>{t.icon}</span>
        <span style={{ fontSize:10, fontWeight:500 }}>{t.label}</span>
        {active===t.id && <div style={{ position:"absolute", bottom:0, width:24, height:2, background:C.accent, borderRadius:2 }} />}
      </button>
    ))}
  </div>
);

// ========== ノートタブ ==========
const NotesTab = ({ notes, setNotes }) => {
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);

  const openNew  = () => { setTitle(""); setBody(""); setSummary(""); setEditing("new"); };
  const openEdit = (n) => { setTitle(n.title); setBody(n.body); setSummary(""); setEditing(n.id); };

  const save = () => {
    if (!title.trim() && !body.trim()) { setEditing(null); return; }
    if (editing === "new") {
      setNotes(prev => [{ id:Date.now(), title:title||"無題", body, date:new Date().toLocaleDateString("ja-JP") }, ...prev]);
    } else {
      setNotes(prev => prev.map(n => n.id===editing ? {...n, title:title||"無題", body} : n));
    }
    setEditing(null);
  };

  const summarize = async () => {
    if (!body.trim()) return;
    setSummarizing(true); setSummary("");
    try {
      const res = await fetch("/api/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"gemini-1.5-flash", max_tokens:600,
          messages:[{ role:"user", content:"以下のノートを日本語で3〜5文に要約してください。\n\n" + body }]
        })
      });
      const data = await res.json();
      setSummary(data.content?.map(b=>b.text||"").join("") || "要約できませんでした");
    } catch { setSummary("エラーが発生しました"); }
    finally { setSummarizing(false); }
  };

  if (editing !== null) return (
    <div className="fi" style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderBottom:`1px solid ${C.border}` }}>
        <button onClick={save} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:14, fontWeight:600 }}>← 保存</button>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="タイトル" style={{
          flex:1, background:"none", border:"none", outline:"none", color:C.text, fontSize:16, fontFamily:"'Syne'", fontWeight:700, minWidth:0
        }} />
      </div>
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
        <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="ここにメモを書く..." autoFocus style={{
          flex:1, minHeight:240, width:"100%", background:"none", border:"none", outline:"none",
          color:C.text, padding:"18px 20px", fontSize:15, lineHeight:1.75, resize:"none"
        }} />
        <div style={{ padding:"12px 16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
          <button onClick={summarize} disabled={summarizing || !body.trim()} style={{
            background: summarizing || !body.trim() ? C.border : C.accentDim,
            border:`1px solid ${C.accent}44`, borderRadius:12, padding:"12px",
            color: summarizing || !body.trim() ? C.textDim : C.accent,
            cursor: summarizing || !body.trim() ? "default" : "pointer",
            fontWeight:700, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8
          }}>
            {summarizing ? "🤖 要約中..." : "🤖 このノートを要約する"}
          </button>
          {summary && (
            <div className="fi" style={{ background:C.accentDim, border:`1px solid ${C.accent}44`, borderRadius:12, padding:"14px 16px" }}>
              <div style={{ color:C.accent, fontWeight:700, fontSize:11, marginBottom:8 }}>AI 要約</div>
              <div style={{ fontSize:13, lineHeight:1.8 }}>{summary}</div>
              <button onClick={()=>setSummary("")} style={{ marginTop:10, background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:12 }}>閉じる</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fi" style={{ padding:"20px", display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h2 style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:22 }}>ノート</h2>
        <button onClick={openNew} style={{ background:C.accent, color:"#000", border:"none", borderRadius:20, padding:"8px 18px", fontWeight:700, cursor:"pointer", fontSize:14 }}>+ 新規</button>
      </div>
      {!notes.length && <div style={{ textAlign:"center", color:C.textDim, paddingTop:60 }}><div style={{ fontSize:40, marginBottom:12 }}>📝</div><p>ノートがありません</p></div>}
      {notes.map(n => (
        <div key={n.id} onClick={()=>openEdit(n)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px", cursor:"pointer", position:"relative" }}>
          <button onClick={e=>{e.stopPropagation();setNotes(prev=>prev.filter(x=>x.id!==n.id));}} style={{ position:"absolute", top:12, right:14, background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:16 }}>×</button>
          <div style={{ fontFamily:"'Syne'", fontWeight:700, fontSize:16, marginBottom:6, paddingRight:24 }}>{n.title}</div>
          <div style={{ color:C.textDim, fontSize:13, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{n.body || "（本文なし）"}</div>
          <div style={{ color:C.textDim, fontSize:11, marginTop:8 }}>{n.date}</div>
        </div>
      ))}
    </div>
  );
};

// ========== タスクタブ ==========
const TasksTab = ({ tasks, setTasks }) => {
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState("normal");

  const add = () => {
    if (!input.trim()) return;
    setTasks(prev => [{ id:Date.now(), text:input.trim(), done:false, priority }, ...prev]);
    setInput("");
  };

  const PRIORITY_COLORS = { high: C.red, normal: C.accent, low: C.textDim };
  const PRIORITY_LABELS = { high: "高", normal: "中", low: "低" };

  const done    = tasks.filter(t => t.done);
  const pending = tasks.filter(t => !t.done);

  return (
    <div className="fi" style={{ padding:"20px", display:"flex", flexDirection:"column", gap:16 }}>
      <h2 style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:22 }}>タスク管理</h2>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px", display:"flex", flexDirection:"column", gap:10 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="新しいタスクを追加..." style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", color:C.text, outline:"none", fontSize:15 }} />
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:12, color:C.textDim }}>優先度：</span>
          {["high","normal","low"].map(p => (
            <button key={p} onClick={()=>setPriority(p)} style={{
              padding:"5px 14px", borderRadius:20, border:`1px solid ${PRIORITY_COLORS[p]}44`,
              background: priority===p ? `${PRIORITY_COLORS[p]}22` : "none",
              color: priority===p ? PRIORITY_COLORS[p] : C.textDim,
              cursor:"pointer", fontSize:12, fontWeight:600
            }}>{PRIORITY_LABELS[p]}</button>
          ))}
          <button onClick={add} style={{ marginLeft:"auto", background:C.accent, color:"#000", border:"none", borderRadius:10, padding:"8px 18px", fontWeight:700, cursor:"pointer", fontSize:14 }}>追加</button>
        </div>
      </div>

      {tasks.length > 0 && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13, color:C.textDim }}>
            <span>進捗</span><span>{done.length}/{tasks.length}</span>
          </div>
          <div style={{ height:6, background:C.border, borderRadius:3 }}>
            <div style={{ height:"100%", width:`${tasks.length?(done.length/tasks.length)*100:0}%`, background:C.green, borderRadius:3, transition:"width .4s" }} />
          </div>
        </div>
      )}

      {!tasks.length && <div style={{ textAlign:"center", color:C.textDim, paddingTop:40 }}><div style={{ fontSize:40, marginBottom:12 }}>✅</div><p>タスクがありません</p></div>}

      {pending.map(t => (
        <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px" }}>
          <button onClick={()=>setTasks(prev=>prev.map(x=>x.id===t.id?{...x,done:true}:x))} style={{ width:22, height:22, borderRadius:6, border:`2px solid ${PRIORITY_COLORS[t.priority||"normal"]}`, background:"none", cursor:"pointer", flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15 }}>{t.text}</div>
            <div style={{ fontSize:11, color:PRIORITY_COLORS[t.priority||"normal"], marginTop:2 }}>優先度：{PRIORITY_LABELS[t.priority||"normal"]}</div>
          </div>
          <button onClick={()=>setTasks(prev=>prev.filter(x=>x.id!==t.id))} style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:16 }}>×</button>
        </div>
      ))}

      {done.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ color:C.textDim, fontSize:12, fontWeight:600, letterSpacing:"0.1em" }}>完了済み</div>
          {done.map(t => (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", opacity:0.6 }}>
              <button onClick={()=>setTasks(prev=>prev.map(x=>x.id===t.id?{...x,done:false}:x))} style={{ width:22, height:22, borderRadius:6, border:"none", background:C.green, cursor:"pointer", flexShrink:0, color:"#000", fontWeight:900, fontSize:13 }}>✓</button>
              <span style={{ flex:1, fontSize:15, textDecoration:"line-through", color:C.textDim }}>{t.text}</span>
              <button onClick={()=>setTasks(prev=>prev.filter(x=>x.id!==t.id))} style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:16 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ========== AI学習アドバイスタブ ==========
const AdviceTab = () => {
  const [subject, setSubject]   = useState("");
  const [level, setLevel]       = useState("中学生");
  const [goal, setGoal]         = useState("");
  const [advice, setAdvice]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [history, setHistory]   = useState([]);

  const LEVELS = ["小学生", "中学生", "高校生", "大学生・社会人"];

  const getAdvice = async () => {
    if (!subject.trim()) { setError("科目・テーマを入力してください"); return; }
    setError(""); setLoading(true); setAdvice("");
    try {
      const prompt = `あなたは優秀な学習アドバイザーです。
以下の条件で、具体的で実践的な学習アドバイスを日本語で提供してください。

科目・テーマ：${subject}
レベル：${level}
目標・悩み：${goal || "効率よく学習したい"}

以下の形式で答えてください：

【学習のポイント】
（2〜3つの重要なポイント）

【おすすめの勉強法】
（具体的な手順や方法）

【1週間の学習プラン】
（曜日ごとの簡単なプラン）

【モチベーションを保つコツ】
（1〜2つのアドバイス）`;

      const res = await fetch("/api/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"gemini-1.5-flash", max_tokens:1200, messages:[{ role:"user", content:prompt }] })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.map(b=>b.text||"").join("") || "";
      setAdvice(text);
      setHistory(prev => [{ id:Date.now(), subject, level, advice:text, date:new Date().toLocaleDateString("ja-JP") }, ...prev].slice(0,5));
    } catch(e) { setError("エラーが発生しました: " + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fi" style={{ padding:"20px", display:"flex", flexDirection:"column", gap:16 }}>
      <h2 style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:22 }}>🧠 AI学習アドバイス</h2>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px", display:"flex", flexDirection:"column", gap:12 }}>
        <div>
          <div style={{ fontSize:12, color:C.textDim, marginBottom:6 }}>科目・テーマ</div>
          <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="例：英語、数学、プログラミング" style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", color:C.text, outline:"none", fontSize:14 }} />
        </div>

        <div>
          <div style={{ fontSize:12, color:C.textDim, marginBottom:6 }}>レベル</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {LEVELS.map(l => (
              <button key={l} onClick={()=>setLevel(l)} style={{
                padding:"6px 14px", borderRadius:20, border:`1px solid ${C.border}`,
                background: level===l ? C.accent : "none",
                color: level===l ? "#000" : C.textDim,
                cursor:"pointer", fontSize:12, fontWeight:600
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:12, color:C.textDim, marginBottom:6 }}>目標・悩み（任意）</div>
          <textarea value={goal} onChange={e=>setGoal(e.target.value)} placeholder="例：テスト前に効率よく復習したい、苦手な単元を克服したい" style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", color:C.text, outline:"none", fontSize:13, lineHeight:1.6, resize:"none", height:80 }} />
        </div>

        {error && <div style={{ background:`${C.red}22`, border:`1px solid ${C.red}44`, borderRadius:8, padding:"8px 12px", fontSize:13, color:C.red }}>{error}</div>}

        <button onClick={getAdvice} disabled={loading} style={{
          background: loading ? C.border : C.accent, color: loading ? C.textDim : "#000",
          border:"none", borderRadius:12, padding:"14px", fontWeight:700, cursor:loading?"default":"pointer", fontSize:15,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8
        }}>
          {loading ? "🧠 考え中..." : "アドバイスをもらう"}
        </button>
      </div>

      {advice && (
        <div className="fi" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <div style={{ background:`${C.blue}22`, border:`1px solid ${C.blue}44`, borderRadius:8, padding:"4px 12px", fontSize:11, color:C.blue, fontWeight:700 }}>{subject}</div>
            <div style={{ background:`${C.green}22`, border:`1px solid ${C.green}44`, borderRadius:8, padding:"4px 12px", fontSize:11, color:C.green, fontWeight:700 }}>{level}</div>
          </div>
          <div style={{ fontSize:13, lineHeight:1.9, whiteSpace:"pre-wrap", color:C.text }}>{advice}</div>
        </div>
      )}

      {history.length > 0 && !advice && (
        <div>
          <div style={{ color:C.textDim, fontSize:12, fontWeight:600, marginBottom:10 }}>過去のアドバイス</div>
          {history.map(h => (
            <div key={h.id} onClick={()=>setAdvice(h.advice)} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", marginBottom:8, cursor:"pointer" }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{h.subject}</div>
              <div style={{ color:C.textDim, fontSize:12, marginTop:4 }}>{h.level} · {h.date}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ========== AI問題作成タブ ==========
const QuizTab = () => {
  const [subject, setSubject]   = useState("");
  const [topic, setTopic]       = useState("");
  const [type, setType]         = useState("4択");
  const [count, setCount]       = useState("3");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [answers, setAnswers]   = useState({});
  const [checked, setChecked]   = useState({});

  const TYPES  = ["4択", "○×問題", "穴埋め", "記述"];
  const COUNTS = ["3", "5", "10"];

  const generate = async () => {
    if (!subject.trim()) { setError("科目を入力してください"); return; }
    setError(""); setLoading(true); setQuestions([]); setAnswers({}); setChecked({});
    try {
      const prompt = `あなたは優秀な教師です。以下の条件で問題を${count}問作成してください。

科目：${subject}
単元・トピック：${topic || "基礎全般"}
問題形式：${type}
問題数：${count}問

必ず以下のJSON形式のみで答えてください。前後に説明文は不要です：
[
  {
    "q": "問題文",
    "choices": ["選択肢A","選択肢B","選択肢C","選択肢D"],
    "answer": "正解の選択肢（4択の場合）または正解",
    "explanation": "解説文"
  }
]

※4択以外の場合もchoicesは空配列[]にしてください。`;

      const res = await fetch("/api/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"gemini-1.5-flash", max_tokens:1500, messages:[{ role:"user", content:prompt }] })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.map(b=>b.text||"").join("") || "";

      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setQuestions(parsed);
    } catch(e) {
      setError("問題の生成に失敗しました。もう一度試してください。");
    } finally { setLoading(false); }
  };

  const checkAnswer = (idx) => {
    setChecked(prev => ({ ...prev, [idx]: true }));
  };

  return (
    <div className="fi" style={{ padding:"20px", display:"flex", flexDirection:"column", gap:16 }}>
      <h2 style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:22 }}>❓ AI問題作成</h2>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px", display:"flex", flexDirection:"column", gap:12 }}>
        <div>
          <div style={{ fontSize:12, color:C.textDim, marginBottom:6 }}>科目</div>
          <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="例：英語、数学、歴史" style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", color:C.text, outline:"none", fontSize:14 }} />
        </div>

        <div>
          <div style={{ fontSize:12, color:C.textDim, marginBottom:6 }}>単元・トピック（任意）</div>
          <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="例：二次方程式、明治維新、不規則動詞" style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", color:C.text, outline:"none", fontSize:14 }} />
        </div>

        <div>
          <div style={{ fontSize:12, color:C.textDim, marginBottom:6 }}>問題形式</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {TYPES.map(t => (
              <button key={t} onClick={()=>setType(t)} style={{
                padding:"6px 14px", borderRadius:20, border:`1px solid ${C.border}`,
                background: type===t ? C.purple+"33" : "none",
                color: type===t ? C.purple : C.textDim,
                borderColor: type===t ? C.purple+"66" : C.border,
                cursor:"pointer", fontSize:12, fontWeight:600
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:12, color:C.textDim, marginBottom:6 }}>問題数</div>
          <div style={{ display:"flex", gap:6 }}>
            {COUNTS.map(c => (
              <button key={c} onClick={()=>setCount(c)} style={{
                padding:"6px 18px", borderRadius:20, border:`1px solid ${C.border}`,
                background: count===c ? C.accent : "none",
                color: count===c ? "#000" : C.textDim,
                cursor:"pointer", fontSize:13, fontWeight:700
              }}>{c}問</button>
            ))}
          </div>
        </div>

        {error && <div style={{ background:`${C.red}22`, border:`1px solid ${C.red}44`, borderRadius:8, padding:"8px 12px", fontSize:13, color:C.red }}>{error}</div>}

        <button onClick={generate} disabled={loading} style={{
          background: loading ? C.border : C.purple+"cc",
          color: loading ? C.textDim : "#fff",
          border:"none", borderRadius:12, padding:"14px", fontWeight:700, cursor:loading?"default":"pointer", fontSize:15,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8
        }}>
          {loading ? "✨ 問題を作成中..." : "✨ 問題を作成する"}
        </button>
      </div>

      {questions.map((q, idx) => (
        <div key={idx} className="fi" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px", display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <div style={{ background:`${C.purple}33`, border:`1px solid ${C.purple}44`, borderRadius:8, padding:"3px 10px", fontSize:12, color:C.purple, fontWeight:700, flexShrink:0 }}>Q{idx+1}</div>
            <div style={{ fontSize:15, lineHeight:1.6, fontWeight:500 }}>{q.q}</div>
          </div>

          {q.choices?.length > 0 ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {q.choices.map((choice, ci) => {
                const isSelected = answers[idx] === choice;
                const isCorrect  = checked[idx] && choice === q.answer;
                const isWrong    = checked[idx] && isSelected && choice !== q.answer;
                return (
                  <button key={ci} onClick={() => !checked[idx] && setAnswers(prev=>({...prev,[idx]:choice}))} style={{
                    background: isCorrect ? `${C.green}22` : isWrong ? `${C.red}22` : isSelected ? `${C.blue}22` : C.surface,
                    border: `1px solid ${isCorrect ? C.green+"66" : isWrong ? C.red+"66" : isSelected ? C.blue+"66" : C.border}`,
                    borderRadius:10, padding:"12px 14px", color: isCorrect ? C.green : isWrong ? C.red : isSelected ? C.blue : C.text,
                    cursor: checked[idx] ? "default" : "pointer", textAlign:"left", fontSize:14, fontWeight: isSelected||isCorrect ? 600 : 400
                  }}>{choice}</button>
                );
              })}
              {answers[idx] && !checked[idx] && (
                <button onClick={()=>checkAnswer(idx)} style={{ background:C.accent, color:"#000", border:"none", borderRadius:10, padding:"10px", fontWeight:700, cursor:"pointer", fontSize:13 }}>答え合わせ</button>
              )}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <textarea value={answers[idx]||""} onChange={e=>!checked[idx]&&setAnswers(prev=>({...prev,[idx]:e.target.value}))} placeholder="答えを入力..." style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", color:C.text, outline:"none", fontSize:14, resize:"none", height:80 }} />
              {!checked[idx] && (
                <button onClick={()=>checkAnswer(idx)} style={{ background:C.accent, color:"#000", border:"none", borderRadius:10, padding:"10px", fontWeight:700, cursor:"pointer", fontSize:13 }}>解答を見る</button>
              )}
            </div>
          )}

          {checked[idx] && (
            <div className="fi" style={{ background:`${C.green}15`, border:`1px solid ${C.green}33`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ color:C.green, fontWeight:700, fontSize:11, marginBottom:6 }}>正解 & 解説</div>
              <div style={{ fontSize:13, color:C.green, fontWeight:600, marginBottom:6 }}>✓ {q.answer}</div>
              <div style={{ fontSize:13, lineHeight:1.7, color:C.text }}>{q.explanation}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ========== メインアプリ ==========
export default function App() {
  const [tab, setTab] = useState("notes");
  const [notes, setNotes] = useState([
    { id:1, title:"はじめてのノート", body:"It'sへようこそ！\n自由にメモを書いてください。", date:"2026/5/13" }
  ]);
  const [tasks, setTasks] = useState([
    { id:1, text:"アプリの使い方を確認する", done:false, priority:"high" },
    { id:2, text:"最初のノートを書く", done:true, priority:"normal" },
  ]);

  const renderTab = () => {
    if (tab==="notes")  return <NotesTab notes={notes} setNotes={setNotes} />;
    if (tab==="tasks")  return <TasksTab tasks={tasks} setTasks={setTasks} />;
    if (tab==="advice") return <AdviceTab />;
    if (tab==="quiz")   return <QuizTab />;
    return null;
  };

  return (
    <>
      <GS />
      <div style={{ maxWidth:430, margin:"0 auto", height:"100dvh", display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden" }}>
        <div style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${C.border}`, background:C.surface }}>
          <div style={{ fontFamily:"'Syne'", fontWeight:800, fontSize:20, letterSpacing:"-0.5px" }}>
            <span style={{ color:C.accent }}>●</span> It's
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", paddingBottom:70 }}>
          {renderTab()}
        </div>
        <TabBar active={tab} onSelect={setTab} />
      </div>
    </>
  );
}
