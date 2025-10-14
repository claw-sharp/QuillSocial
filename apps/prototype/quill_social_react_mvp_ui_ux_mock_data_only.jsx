import React, { useMemo, useState } from "react";
import { 
  LayoutDashboard, Lightbulb, PenLine, CalendarDays, MessageSquare, BarChart3, Settings, Plus, Sparkles, Search,
  CheckCircle2, Clock4, Quote, Send, Repeat2, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Users, Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

// ---------------------------------------------
// Mock Data (from the build prompt)
// ---------------------------------------------
const mockPillars = [
  { id: "p1", name: "Build in Public", color: "#4F46E5" },
  { id: "p2", name: "Founder Lessons", color: "#38BDF8" },
  { id: "p3", name: "Client Wins", color: "#10B981" },
  { id: "p4", name: "Playbooks", color: "#F59E0B" },
];

const mockIdeas = [
  { id: "i1", pillarId: "p1", source: "note", content: "Shipped MVP in 14 days — trade-offs and scope cuts", status: "raw", tags: ["shipping", "scope"] },
  { id: "i2", pillarId: "p2", source: "note", content: "Raising prices without losing clients — laddering value", status: "outlined", outlineId: "o2", tags: ["pricing", "value"] },
  { id: "i3", pillarId: "p3", source: "reply", content: "Client reduced churn 18% by fixing handoff emails", status: "raw", tags: ["churn", "onboarding"] },
];

const mockOutlines = [
  { id: "o2", ideaId: "i2", text: "Hook, 3 lessons on pricing ladder, example, CTA to pricing checklist", metadata: { tone: "authoritative" } },
];

const mockTargets = [
  { id: "t1", platform: "linkedin", handle: "@sarah_ops", list: "Prospects", notes: "Ops coach, talks pricing" },
  { id: "t2", platform: "x", handle: "@mike_founder", list: "Leaders", notes: "Build-in-public founder" },
  { id: "t3", platform: "linkedin", handle: "@acme_saas", list: "Prospects", notes: "B2B SaaS, onboarding thread often" },
];

const mockReplyQueue = [
  { id: "rq1", platform: "linkedin", author: "Sarah Ops", handle: "@sarah_ops", time: "2h", snippet: "Raising prices is easy until renewals hit…", stats: { likes: 128, comments: 42 }, prompts: ["Insight", "Question", "Case drop", "Resource"], url: "https://lnkd.in/mock1" },
  { id: "rq2", platform: "x", author: "Mike", handle: "@mike_founder", time: "1h", snippet: "MVP in 10 days isn’t speed, it’s focus.", stats: { likes: 210, comments: 19 }, prompts: ["Insight", "Question", "Contrarian"], url: "https://x.com/mock2" },
  { id: "rq3", platform: "linkedin", author: "ACME SaaS", handle: "@acme_saas", time: "30m", snippet: "We cut onboarding steps by 40% with checklists.", stats: { likes: 56, comments: 7 }, prompts: ["Insight", "Question", "Resource"], url: "#" },
];

const mockPosts = [
  { id: "post1", platform: "linkedin", status: "scheduled", scheduledAt: "2025-10-16T09:00:00", title: "Pricing Ladder Lessons", preview: "Most founders raise prices wrong…", cta: "Join the pricing checklist", utm: "?utm_source=li&utm_medium=post" },
  { id: "post2", platform: "x", status: "draft", scheduledAt: null, title: "MVP in 14 days", preview: "I shipped an MVP in 14 days. Here’s the math:" },
];

const mockAnalytics = {
  streakDays: 5,
  postsLast7: 11,
  repliesLast7: 54,
  ctaClicks: 23,
  profileVisitsProxy: 312,
  topPosts: [
    { id: "postA", platform: "linkedin", title: "Template: Onboarding Checklist", saves: 89, comments: 31 },
    { id: "postB", platform: "x", title: "Unpopular opinion: stop A/B testing your pricing", saves: 65, comments: 22 },
    { id: "postC", platform: "instagram", title: "3 plays to fix onboarding", saves: 140, comments: 18 },
  ],
  repeatSuggestions: [
    { source: "postA", idea: "Turn into IG carousel and Shorts script" },
    { source: "postB", idea: "Write a contrarian LinkedIn post with data" },
    { source: "postC", idea: "Long-form blog with case study" },
  ],
};

// ---------------------------------------------
// Utility helpers
// ---------------------------------------------
const platformIcon = (p) => {
  const base = "w-4 h-4";
  switch (p) {
    case "x":
      return <span className="text-slate-600">𝕏</span>;
    case "linkedin":
      return <span className="text-sky-600 font-bold">in</span>;
    case "instagram":
      return <span className="text-pink-500 font-bold">IG</span>;
    case "tiktok":
      return <span className="text-slate-900 font-bold">TT</span>;
    case "youtube":
      return <span className="text-red-600 font-bold">YT</span>;
    default:
      return <CalendarIcon className={base} />;
  }
};

function SectionTitle({ icon: Icon, title, desc }: { icon: any; title: string; desc?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><Icon className="w-5 h-5" /></div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          {desc && <p className="text-xs text-slate-500">{desc}</p>}
        </div>
      </div>
    </div>
  );
}

function Tile({ title, value, sub, progress }: { title: string; value: string; sub?: string; progress?: number }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardDescription className="text-slate-500">{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        {sub && <p className="text-sm text-slate-500">{sub}</p>}
        {typeof progress === "number" && <div className="mt-3"><Progress value={progress} /></div>}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------
// Screens
// ---------------------------------------------
function HomeToday({ postsDone, repliesDone, queueHealth, streakDays, onOpenReplyQueue, onNewIdea, onGeneratePost }) {
  return (
    <div className="space-y-6">
      <SectionTitle icon={LayoutDashboard} title="Today" desc="Your minimum effective actions for the day" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Tile title="Create 2 posts" value={`${postsDone}/2`} progress={(postsDone/2)*100} sub="Keep the streak rolling" />
        <Tile title="Do 6 replies" value={`${repliesDone}/6`} progress={(repliesDone/6)*100} sub="Thoughtful > volume" />
        <Tile title="Queue health" value={`${queueHealth}%`} sub="Slots filled across platforms" />
        <Tile title="Streak" value={`${streakDays} days`} sub="Consistency compounds" />
      </div>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Quick actions</CardTitle>
          <CardDescription>What do you want to do next?</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={onNewIdea} className="rounded-xl" variant="secondary"><Plus className="w-4 h-4 mr-2"/>New Idea</Button>
          <Button onClick={onGeneratePost} className="rounded-xl" variant="default"><Sparkles className="w-4 h-4 mr-2"/>Generate Post</Button>
          <Button onClick={onOpenReplyQueue} className="rounded-xl" variant="outline"><MessageSquare className="w-4 h-4 mr-2"/>Open Reply Queue</Button>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Last 7 days</CardTitle>
            <CardDescription>Activity snapshot</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <Tile title="Posts" value="11" />
            <Tile title="Replies" value="54" />
            <Tile title="CTA Clicks" value="23" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top Performers</CardTitle>
            <CardDescription>Repeat what works</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAnalytics.topPosts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  {platformIcon(p.platform)}
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.title}</p>
                    <p className="text-xs text-slate-500">Saves {p.saves} · Comments {p.comments}</p>
                  </div>
                </div>
                <Button size="sm" className="rounded-xl" variant="outline"><Repeat2 className="w-4 h-4 mr-2"/>Remix</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function IdeasPillars({ pillars, ideas, onExpandOutline, onPromoteToPost, onAddPillar }) {
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const palette = ["#4F46E5","#38BDF8","#10B981","#F59E0B","#EC4899","#8B5CF6","#06B6D4","#84CC16"];
  const [newColor, setNewColor] = useState(palette[0]);
  const filtered = useMemo(() => activePillar ? ideas.filter(i => i.pillarId === activePillar) : ideas, [activePillar, ideas]);

  return (
    <div className="space-y-4">
      <SectionTitle icon={Lightbulb} title="Ideas & Pillars" desc="Capture notes, tag by pillar, expand to outlines" />
      <div className="flex flex-wrap items-center gap-2">
        <Badge onClick={() => setActivePillar(null)} variant={activePillar?"outline":"default"} className="cursor-pointer rounded-xl">All</Badge>
        {pillars.map(p => (
          <Badge key={p.id} onClick={() => setActivePillar(p.id)} variant={activePillar===p.id?"default":"secondary"} className="cursor-pointer rounded-xl" style={{ backgroundColor: activePillar===p.id? p.color: undefined }}>{p.name}</Badge>
        ))}
        <Button size="sm" variant="outline" className="rounded-xl ml-auto" onClick={()=> setShowAdd(true)}><Plus className="w-4 h-4 mr-1"/>Add Pillar</Button>
      </div>

      {/* Add Pillar Modal (mock) */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <h3 className="text-base font-semibold text-slate-800 mb-1">New Pillar</h3>
            <p className="text-xs text-slate-500 mb-3">Name your pillar and choose a color.</p>
            <div className="space-y-3">
              <Input placeholder="e.g., Learning Marketing" value={newName} onChange={(e)=> setNewName(e.target.value)} />
              <div className="flex items-center gap-2 flex-wrap">
                {palette.map(col => (
                  <button key={col} onClick={()=> setNewColor(col)} className={`w-6 h-6 rounded-full border ${newColor===col?"ring-2 ring-indigo-500 border-transparent":"border-slate-200"}`} style={{backgroundColor: col}} />
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" className="rounded-xl" onClick={()=> setShowAdd(false)}>Cancel</Button>
                <Button className="rounded-xl" onClick={()=>{ if(!newName.trim()) return; onAddPillar?.(newName.trim(), newColor); setShowAdd(false); setNewName(""); }}>Add Pillar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {filtered.map((idea) => (
          <Card key={idea.id} className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">{idea.content}</CardTitle>
              <CardDescription className="capitalize">{idea.source} · {idea.status}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              {idea.tags?.map(t => <Badge key={t} variant="outline" className="rounded-xl">{t}</Badge>)}
              <div className="w-full" />
              <Button size="sm" className="rounded-xl" onClick={() => onExpandOutline(idea)}><Sparkles className="w-4 h-4 mr-2"/>Expand to Outline</Button>
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onPromoteToPost(idea)}><PenLine className="w-4 h-4 mr-2"/>Promote to Post</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PostFactory({ outline, onSchedule }) {
  const [tone, setTone] = useState("authoritative");
  const [activeTab, setActiveTab] = useState("linkedin");
  const [cta, setCta] = useState("Join the pricing checklist");
  const [utm, setUtm] = useState("?utm_source=li&utm_medium=post");

  const tabs = [
    { id: "linkedin", name: "LinkedIn Post" },
    { id: "x", name: "X Thread" },
    { id: "carousel", name: "IG Carousel" },
    { id: "shorts", name: "Shorts Script" },
    { id: "blog", name: "Blog/Newsletter" },
  ];

  return (
    <div className="space-y-4">
      <SectionTitle icon={PenLine} title="Post Factory" desc="Outline → multi-format outputs → schedule" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Outline</CardTitle>
            <CardDescription>Editable</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea className="min-h-[200px]" defaultValue={outline?.text || "Hook, 3 bullets, example, CTA"} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Tone</span>
                <select className="border rounded-xl px-2 py-1 text-sm">
                  <option>friendly</option>
                  <option selected>authoritative</option>
                  <option>contrarian</option>
                </select>
              </div>
              <Button variant="secondary" className="rounded-xl"><Sparkles className="w-4 h-4 mr-2"/>Generate All</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Outputs</CardTitle>
            <CardDescription>Preview & tweak each format</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="rounded-xl">
                {tabs.map(t => <TabsTrigger key={t.id} value={t.id} className="rounded-xl">{t.name}</TabsTrigger>)}
              </TabsList>
              <TabsContent value="linkedin">
                <Textarea className="min-h-[200px]" defaultValue={`Most founders raise prices wrong. Here\'s the ladder we use: \n1) Keep entry low friction\n2) Add mid-tier with transformation\n3) Anchor with premium service\nCTA: ${cta}`} />
              </TabsContent>
              <TabsContent value="x">
                <Textarea className="min-h-[200px]" defaultValue={`1/ Pricing is a product.\n2/ Ladder your value, not just your price.\n3/ Examples...`} />
              </TabsContent>
              <TabsContent value="carousel">
                <div className="grid grid-cols-5 gap-2">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="p-3 border rounded-xl bg-slate-50 min-h-[90px] text-sm">Slide {i+1}: Title + body…</div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="shorts">
                <Textarea className="min-h-[200px]" defaultValue={`Hook (5s): Most founders price backwards.\n3 bullets (30s): Ladder, Transform, Anchor.\nProof (15s): Client cut churn 18%.\nCTA (10s): Grab the free pricing checklist.`} />
              </TabsContent>
              <TabsContent value="blog">
                <Textarea className="min-h-[200px]" defaultValue={`# The Pricing Ladder Playbook\n\n**Big claim:** Pricing is a product.\n\n**Why it matters:** ...\n\n**3 Insights:** ...\n\n**Playbook:** ...\n\n**CTA:** ${cta}`} />
              </TabsContent>
            </Tabs>
            <Separator className="my-4" />
            <div className="flex flex-wrap items-center gap-3">
              <Input className="max-w-xs" value={cta} onChange={(e)=>setCta(e.target.value)} placeholder="First-comment CTA" />
              <Input className="max-w-xs" value={utm} onChange={(e)=>setUtm(e.target.value)} placeholder="UTM" />
              <Button className="rounded-xl" onClick={onSchedule}><CalendarIcon className="w-4 h-4 mr-2"/>Schedule</Button>
              <Button className="rounded-xl" variant="outline"><Quote className="w-4 h-4 mr-2"/>Copy</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CalendarQueues({ posts, onReschedule }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return (
    <div className="space-y-4">
      <SectionTitle icon={CalendarDays} title="Calendar & Queues" desc="Drag to reshuffle your week (visual only)" />
      <div className="flex items-center gap-2">
        <Button variant="outline" className="rounded-xl" onClick={()=>setWeekOffset(weekOffset-1)}><ChevronLeft className="w-4 h-4"/></Button>
        <div className="text-sm text-slate-600">Week {weekOffset>=0?`+${weekOffset}`:weekOffset}</div>
        <Button variant="outline" className="rounded-xl" onClick={()=>setWeekOffset(weekOffset+1)}><ChevronRight className="w-4 h-4"/></Button>
      </div>
      <div className="grid grid-cols-7 gap-3">
        {days.map((d, idx) => (
          <div key={d} className="border rounded-2xl p-2 min-h-[160px] bg-white">
            <div className="text-xs text-slate-500 mb-2">{d}</div>
            {posts.filter((p)=> idx<2 ? p.status!=="draft" : idx===2 ? p.status==="draft" : false).map(p => (
              <div key={p.id} className="p-2 mb-2 rounded-xl bg-slate-50 border text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">{platformIcon(p.platform)}<span className="font-medium">{p.title}</span></div>
                <Badge variant={p.status==="scheduled"?"default":"secondary"} className="rounded-xl capitalize">{p.status}</Badge>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Engagement({ targets, replyQueue, onSendReply, onQuotePost, dailyGoal, setDailyGoal }) {
  const [replyCounts, setReplyCounts] = useState(0);
  const [drafts, setDrafts] = useState<Record<string,string>>({});

  const handleSend = (id: string) => {
    if(drafts[id]?.trim()){
      onSendReply?.(id, drafts[id]);
      setReplyCounts(c => c+1);
      setDrafts(prev => ({...prev, [id]: ""}));
    }
  };

  return (
    <div className="space-y-4">
      <SectionTitle icon={MessageSquare} title="Engagement (Reply Queue)" desc="Thoughtful replies to the right people" />
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="rounded-xl">Prospects</Badge>
        <Badge variant="secondary" className="rounded-xl">Peers</Badge>
        <Badge variant="secondary" className="rounded-xl">Leaders</Badge>
        <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          <span>Daily goal</span>
          <Input type="number" value={dailyGoal} onChange={(e)=>setDailyGoal(parseInt(e.target.value||"0"))} className="w-16 h-8" />
          <Progress value={Math.min(100, (replyCounts/dailyGoal)*100)} className="w-40" />
          <span className="text-slate-700">{replyCounts}/{dailyGoal}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {replyQueue.map((q)=> (
          <Card key={q.id} className="rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {platformIcon(q.platform)}
                  <div>
                    <CardTitle className="text-base">{q.author} <span className="text-slate-400 font-normal">{q.handle}</span></CardTitle>
                    <CardDescription>{q.time} · {q.stats.likes} likes · {q.stats.comments} comments</CardDescription>
                  </div>
                </div>
                <a className="text-xs text-indigo-600" href={q.url} target="_blank" rel="noreferrer">Open</a>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-700">{q.snippet}</p>
              <div className="flex flex-wrap gap-2">
                {q.prompts.map(p => <Badge key={p} variant="outline" className="rounded-xl cursor-pointer" onClick={()=> setDrafts(prev => ({...prev, [q.id]: (prev[q.id]||"") + (prev[q.id]?" ":"") + promptSeed(p, q)}))}>{p}</Badge>)}
              </div>
              <Textarea placeholder="Write a thoughtful reply…" value={drafts[q.id]||""} onChange={(e)=> setDrafts(prev=> ({...prev, [q.id]: e.target.value}))} />
              <div className="flex gap-2">
                <Button className="rounded-xl" onClick={()=>handleSend(q.id)}><Send className="w-4 h-4 mr-2"/>Reply</Button>
                <Button className="rounded-xl" variant="outline" onClick={()=> onQuotePost?.(q)}><Quote className="w-4 h-4 mr-2"/>Quote-post</Button>
                <Button className="rounded-xl" variant="ghost"><Plus className="w-4 h-4 mr-2"/>Save as Idea</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Momentum() {
  return (
    <div className="space-y-6">
      <SectionTitle icon={BarChart3} title="Momentum" desc="Consistency + winners to repeat" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Tile title="Posts (7d)" value={`${mockAnalytics.postsLast7}`} />
        <Tile title="Replies (7d)" value={`${mockAnalytics.repliesLast7}`} />
        <Tile title="CTA Clicks" value={`${mockAnalytics.ctaClicks}`} />
        <Tile title="Streak" value={`${mockAnalytics.streakDays} days`} />
      </div>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Top Posts</CardTitle>
          <CardDescription>Repeat & remix</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockAnalytics.topPosts.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <div className="flex items-center gap-3">
                {platformIcon(p.platform)}
                <div>
                  <p className="text-sm font-medium text-slate-700">{p.title}</p>
                  <p className="text-xs text-slate-500">Saves {p.saves} · Comments {p.comments}</p>
                </div>
              </div>
              <Button size="sm" className="rounded-xl" variant="outline"><Repeat2 className="w-4 h-4 mr-2"/>Remix</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsScreen() {
  const [maxReplies, setMaxReplies] = useState(10);
  const [humanLoop, setHumanLoop] = useState(true);
  return (
    <div className="space-y-6">
      <SectionTitle icon={Settings} title="Settings" desc="Brand kit, cadence, safety (mock)" />
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Brand Kit</CardTitle>
          <CardDescription>Colors & preview</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Input className="max-w-xs" defaultValue="#4F46E5" />
          <Input className="max-w-xs" defaultValue="Inter" />
          <Button className="rounded-xl" variant="outline">Preview</Button>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Safety</CardTitle>
          <CardDescription>Rate limits & approvals</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span>Max replies/day</span>
            <Input className="w-20" type="number" value={maxReplies} onChange={(e)=> setMaxReplies(parseInt(e.target.value||"0"))} />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span>Human-in-the-loop</span>
            <Switch checked={humanLoop} onCheckedChange={setHumanLoop} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------
// Copilot Screen (Purpose → Plan → Apply)
// ---------------------------------------------
function CopilotScreen({ onApplyPlan }) {
  const [purpose, setPurpose] = useState("Indie hacker building in public + tech skills + learning marketing");
  const [plan, setPlan] = useState(null);

  const generatePlan = () => {
    const pillars = [
      { id: "p1", name: "Build in Public", color: "#4F46E5" },
      { id: "p2", name: "Tech Skills", color: "#38BDF8" },
      { id: "p3", name: "Learning Marketing", color: "#10B981" },
      { id: "p4", name: "Open Problems", color: "#F59E0B" },
    ];

    const cadence = [
      { day: "Mon", channels: ["LinkedIn", "X"], type: "Text post" },
      { day: "Tue", channels: ["LinkedIn", "Instagram"], type: "Carousel (tutorial/checklist)" },
      { day: "Wed", channels: ["LinkedIn", "X"], type: "Text post" },
      { day: "Thu", channels: ["X"], type: "Thread (build log)" },
      { day: "Sat", channels: ["Blog/Newsletter"], type: "Weekly recap" },
    ];

    const targets = {
      peers: [
        { id: "tp1", platform: "x", handle: "@levelsio", list: "Peers", notes: "Indie hacker inspo" },
        { id: "tp2", platform: "x", handle: "@rauchg", list: "Peers", notes: "Dev/indie circles" },
      ],
      prospects: [
        { id: "tg1", platform: "linkedin", handle: "@b2b_smb_owners", list: "Prospects", notes: "Potential users" },
      ],
      leaders: [
        { id: "tl1", platform: "linkedin", handle: "@justinwelsh", list: "Leaders", notes: "Distribution amplifier" },
      ],
    };

    const dailyReplies = 10;
    setPlan({ purpose, pillars, cadence, targets, dailyReplies });
  };

  return (
    <div className="space-y-6">
      <SectionTitle icon={Sparkles} title="Copilot" desc="Describe your purpose → get a plan you can apply" />
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Your purpose</CardTitle>
          <CardDescription>Tell Copilot what you want to achieve</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={purpose} onChange={(e)=>setPurpose(e.target.value)} className="min-h-[100px]" />
          <div className="flex gap-2">
            <Button className="rounded-xl" onClick={generatePlan}><Sparkles className="w-4 h-4 mr-2"/>Generate Plan</Button>
            {plan && <Button variant="outline" className="rounded-xl" onClick={()=> onApplyPlan(plan)}>Apply to Workspace</Button>}
          </div>
        </CardContent>
      </Card>

      {plan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Pillars</CardTitle>
              <CardDescription>Content themes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {plan.pillars.map((p)=> (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded" style={{background:p.color}} />
                  <span className="text-sm">{p.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Cadence</CardTitle>
              <CardDescription>Weekly schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {plan.cadence.map((c,idx)=> (
                <div key={idx} className="text-sm flex items-center justify-between p-2 rounded-xl bg-slate-50">
                  <span className="font-medium">{c.day}</span>
                  <span>{c.channels.join(" + ")}</span>
                  <span className="text-slate-500">{c.type}</span>
                </div>
              ))}
              <p className="text-xs text-slate-500 mt-2">Daily: {plan.dailyReplies} thoughtful replies (Engagement)</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Targets</CardTitle>
              <CardDescription>Peers · Prospects · Leaders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(plan.targets).map(([group, items]) => (
                <div key={group}>
                  <p className="text-xs uppercase text-slate-500 mb-1">{group}</p>
                  <div className="space-y-1">
                    {items.map((t)=> (
                      <div key={t.id} className="text-sm flex items-center gap-2">
                        {platformIcon(t.platform)} <span className="font-medium">{t.handle}</span> <span className="text-slate-500">— {t.notes}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Seed prompt helper for reply chips
function promptSeed(type: string, q: any) {
  switch(type){
    case "Insight": return `Insight: When we did this for a ${q.author.includes("SaaS")?"SaaS":"client"}, the 80/20 was …`;
    case "Question": return `Question: If you had to 80/20 this for ${q.handle}, which step would you drop and why?`;
    case "Case drop": return `Mini case: We applied this and reduced churn 18% in 6 weeks. Steps: …`;
    case "Resource": return `Resource: Here’s a 3-step checklist we used. Want it?`;
    case "Contrarian": return `Contrarian: ${q.snippet.split(" ").slice(0,4).join(" ")} isn’t always true. What worked for us: …`;
    default: return "";
  }
}

// ---------------------------------------------
// Main App Shell
// ---------------------------------------------
const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 ${active?"bg-slate-100 text-slate-900":"text-slate-600"}`}>
    <Icon className="w-4 h-4" />
    <span className="text-sm">{label}</span>
  </button>
);

export default function QuillSocialMVP() {
  const [tab, setTab] = useState("home");
  const [pillars, setPillars] = useState(mockPillars);
  const [ideas, setIdeas] = useState(mockIdeas);
  const [outlines, setOutlines] = useState(mockOutlines);
  const [posts, setPosts] = useState(mockPosts);
  const [replyQueue, setReplyQueue] = useState(mockReplyQueue);
  const [targets, setTargets] = useState(mockTargets);
  const [dailyGoal, setDailyGoal] = useState(6);
  const [postsDone, setPostsDone] = useState(0);
  const [repliesDone, setRepliesDone] = useState(0);

  const handleExpandOutline = (idea) => {
    if(!idea) return;
    const exists = outlines.find(o => o.ideaId === idea.id);
    if(!exists){
      const o = { id: `o_${Date.now()}`, ideaId: idea.id, text: `${idea.content}: Hook, 3 bullets, example, CTA`, metadata: { tone: "friendly" } };
      setOutlines([...outlines, o]);
    }
    alert("Outline generated (mock)");
  };

  const handlePromoteToPost = (idea) => {
    const newPost = { id: `post_${Date.now()}`, platform: "linkedin", status: "draft", scheduledAt: null, title: idea.content.slice(0,24)+"…", preview: idea.content };
    setPosts([newPost, ...posts]);
    setTab("post-factory");
  };

  const handleAddPillar = (name?: string, color?: string) => {
    if (!name) return;
    const palette = ["#4F46E5","#38BDF8","#10B981","#F59E0B","#EC4899","#8B5CF6","#06B6D4","#84CC16"];
    const chosen = color || palette[pillars.length % palette.length];
    const id = `p${Date.now()}`;
    const newPillar = { id, name, color: chosen };
    setPillars([...pillars, newPillar]);
    alert(`Pillar added: ${name}`);
  };
    setPillars([...pillars, newPillar]);
    alert(`Pillar added: ${name}`);
  };

  const currentOutline = outlines[0] || { text: "Hook, bullets, CTA" };

  const onSchedule = () => {
    setPostsDone(p => Math.min(2, p+1));
    alert("Scheduled (mock): Thu 09:00");
  };

  const onOpenReplyQueue = () => setTab("engagement");
  const onNewIdea = () => {
    const i = { id: `i_${Date.now()}`, pillarId: "p1", source: "note", content: "New raw note…", status: "raw", tags: ["note"] };
    setIdeas([i, ...ideas]);
    setTab("ideas");
  };

  const onGeneratePost = () => setTab("post-factory");

  const onSendReply = (id, text) => {
    setRepliesDone(c => Math.min(dailyGoal, c+1));
  };

  const onQuotePost = (q) => {
    setTab("post-factory");
  };

  const queueHealth = useMemo(() => 72, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 p-3 border-r bg-white min-h-screen sticky top-0">
          <div className="px-2 py-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600" />
            <div>
              <div className="font-semibold">Quill Social</div>
              <div className="text-xs text-slate-500">MVP (mock data)</div>
            </div>
          </div>
          <nav className="mt-2 space-y-1">
            <NavItem icon={LayoutDashboard} label="Home / Today" active={tab==="home"} onClick={()=>setTab("home")} />
            <NavItem icon={Lightbulb} label="Ideas & Pillars" active={tab==="ideas"} onClick={()=>setTab("ideas")} />
            <NavItem icon={PenLine} label="Post Factory" active={tab==="post-factory"} onClick={()=>setTab("post-factory")} />
            <NavItem icon={CalendarDays} label="Calendar" active={tab==="calendar"} onClick={()=>setTab("calendar")} />
            <NavItem icon={MessageSquare} label="Engagement" active={tab==="engagement"} onClick={()=>setTab("engagement")} />
            <NavItem icon={BarChart3} label="Momentum" active={tab==="momentum"} onClick={()=>setTab("momentum")} />
            <NavItem icon={Sparkles} label="Copilot" active={tab==="copilot"} onClick={()=>setTab("copilot")} />
            <NavItem icon={Settings} label="Settings" active={tab==="settings"} onClick={()=>setTab("settings")} />
          </nav>
          <Separator className="my-3" />
          <div className="p-2">
            <Button className="w-full rounded-xl" onClick={()=>setTab("post-factory")}><Sparkles className="w-4 h-4 mr-2"/>New Post</Button>
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 p-4 md:p-6">
          {/* Topbar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Input placeholder="Search ideas, posts, targets…" className="pl-9 rounded-xl" />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <Button variant="secondary" className="rounded-xl" onClick={()=>setTab("engagement")}><MessageSquare className="w-4 h-4 mr-2"/>Open Reply Queue</Button>
          </div>

          {tab === "home" && (
            <HomeToday 
              postsDone={postsDone}
              repliesDone={repliesDone}
              queueHealth={queueHealth}
              streakDays={mockAnalytics.streakDays}
              onOpenReplyQueue={onOpenReplyQueue}
              onNewIdea={onNewIdea}
              onGeneratePost={onGeneratePost}
            />
          )}

          {tab === "ideas" && (
            <IdeasPillars 
              pillars={pillars}
              ideas={ideas}
              onExpandOutline={handleExpandOutline}
              onPromoteToPost={handlePromoteToPost}
              onAddPillar={handleAddPillar}
            />
          )}

          {tab === "post-factory" && (
            <PostFactory outline={currentOutline} onSchedule={onSchedule} />
          )}

          {tab === "calendar" && (
            <CalendarQueues posts={posts} onReschedule={() => {}} />
          )}

          {tab === "engagement" && (
            <Engagement 
              targets={targets}
              replyQueue={replyQueue}
              onSendReply={onSendReply}
              onQuotePost={onQuotePost}
              dailyGoal={dailyGoal}
              setDailyGoal={setDailyGoal}
            />
          )}

          {tab === "momentum" && (
            <Momentum />
          )}

          {tab === "copilot" && (
            <CopilotScreen onApplyPlan={(plan)=>{
              const mapped = plan.pillars.map((p, idx)=> ({...p, id: `p${idx+1}`}));
              setPillars(mapped);
              const mergedTargets = [...plan.targets.peers, ...plan.targets.prospects, ...plan.targets.leaders].map((t, idx)=> ({...t, id: `t_${idx}`}));
              setTargets(mergedTargets);
              setDailyGoal(plan.dailyReplies || 10);
              alert("Plan applied (mock). Pillars, targets and daily reply goal updated.");
              setTab("engagement");
            }} />
          )}

          {tab === "settings" && (
            <SettingsScreen />
          )}
        </main>
      </div>
    </div>
  );
}
